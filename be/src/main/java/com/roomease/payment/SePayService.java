package com.roomease.payment;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.roomease.booking.Booking;
import com.roomease.booking.BookingStatus;
import com.roomease.booking.BookingStatusHistory;
import com.roomease.booking.Payment;
import com.roomease.booking.PaymentStatus;
import com.roomease.booking.repo.BookingRepository;
import com.roomease.booking.repo.BookingStatusHistoryRepository;
import com.roomease.booking.repo.PaymentRepository;
import com.roomease.common.exception.BadRequestException;
import com.roomease.common.exception.ConflictException;
import com.roomease.common.exception.ForbiddenException;
import com.roomease.common.exception.NotFoundException;
import com.roomease.common.exception.UnauthorizedException;
import com.roomease.payment.dto.SePayPaymentResponse;
import com.roomease.payment.dto.SePayStatusResponse;
import com.roomease.payment.dto.SePayWebhookRequest;
import com.roomease.payment.dto.SePayWebhookResult;
import com.roomease.user.User;
import com.roomease.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class SePayService {
    private static final ZoneId VIETNAM_ZONE =
        ZoneId.of("Asia/Ho_Chi_Minh");

    private static final DateTimeFormatter SEPAY_DATE_TIME =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final Pattern BOOKING_CODE_PATTERN =
        Pattern.compile(
            "RE[0-9]{8}[A-Z0-9]{8}",
            Pattern.CASE_INSENSITIVE
        );

    private final SePayProperties properties;
    private final ObjectMapper objectMapper;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final BookingStatusHistoryRepository historyRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public SePayPaymentResponse preparePayment(
        String email,
        String bookingCode
    ) {
        validatePaymentConfiguration();

        Booking booking = requireOwnedBooking(
            email,
            bookingCode
        );

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ConflictException(
                "Booking đã bị hủy"
            );
        }

        if (
            booking.getPaymentStatus()
                == PaymentStatus.NOT_REQUIRED
        ) {
            throw new ConflictException(
                "Booking này thanh toán tại chỗ nghỉ"
            );
        }

        Payment payment = findLatestPayment(
            booking.getId()
        ).orElseThrow(
            () -> new NotFoundException(
                "Không tìm thấy giao dịch thanh toán của booking"
            )
        );

        if (
            !"SEPAY".equalsIgnoreCase(
                payment.getProvider()
            )
        ) {
            throw new ConflictException(
                "Booking không sử dụng phương thức thanh toán SePay"
            );
        }

        String transferContent =
            buildTransferContent(
                booking.getBookingCode()
            );

        String qrUrl = buildQrUrl(
            booking.getTotalAmount(),
            transferContent
        );

        return new SePayPaymentResponse(
            booking.getBookingCode(),
            booking.getTotalAmount(),
            booking.getCurrency(),
            properties.getBankCode(),
            properties.getAccountNumber(),
            properties.getAccountName(),
            transferContent,
            qrUrl,
            booking.getStatus().name(),
            booking.getPaymentStatus().name()
        );
    }

    @Transactional(readOnly = true)
    public SePayStatusResponse paymentStatus(
        String email,
        String bookingCode
    ) {
        Booking booking = requireOwnedBooking(
            email,
            bookingCode
        );

        Optional<Payment> payment =
            findLatestPayment(booking.getId());

        return new SePayStatusResponse(
            booking.getBookingCode(),
            booking.getStatus().name(),
            booking.getPaymentStatus().name(),
            booking.getTotalAmount(),
            booking.getCurrency(),
            payment
                .map(Payment::getTransactionRef)
                .orElse(null),
            payment
                .map(Payment::getPaidAt)
                .orElse(null)
        );
    }

    public SePayWebhookRequest verifyAndParseWebhook(
        String signature,
        String timestampHeader,
        byte[] rawBody
    ) {
        validateWebhookConfiguration();

        if (
            rawBody == null ||
            rawBody.length == 0
        ) {
            throw new BadRequestException(
                "Webhook không có dữ liệu"
            );
        }

        long timestamp;

        try {
            timestamp =
                Long.parseLong(timestampHeader);
        } catch (NumberFormatException exception) {
            throw new UnauthorizedException(
                "Thiếu hoặc sai X-SePay-Timestamp"
            );
        }

        long currentTimestamp =
            Instant.now().getEpochSecond();

        if (
            Math.abs(
                currentTimestamp - timestamp
            ) > properties.getMaxTimestampDriftSeconds()
        ) {
            throw new UnauthorizedException(
                "Webhook đã hết hạn"
            );
        }

        String rawJson =
            new String(
                rawBody,
                StandardCharsets.UTF_8
            );

        String expected =
            "sha256=" +
            calculateHmac(
                timestamp + "." + rawJson
            );

        if (
            !constantTimeEquals(
                expected,
                signature
            )
        ) {
            throw new UnauthorizedException(
                "Chữ ký webhook SePay không hợp lệ"
            );
        }

        try {
            return objectMapper.readValue(
                rawBody,
                SePayWebhookRequest.class
            );
        } catch (JacksonException exception) {
            throw new BadRequestException(
                "Dữ liệu webhook SePay không hợp lệ"
            );
        }
    }

    @Transactional
    public SePayWebhookResult processWebhook(
        SePayWebhookRequest request,
        String rawJson
    ) {
        if (
            request == null ||
            request.id() == null
        ) {
            return SePayWebhookResult.ignored(
                "Thiếu ID giao dịch SePay"
            );
        }

        if (
            !"in".equalsIgnoreCase(
                request.transferType()
            )
        ) {
            return SePayWebhookResult.ignored(
                "Không phải giao dịch tiền vào"
            );
        }

        if (
            request.transferAmount() == null ||
            request.transferAmount().signum() <= 0
        ) {
            return SePayWebhookResult.ignored(
                "Số tiền giao dịch không hợp lệ"
            );
        }

        if (
            StringUtils.hasText(
                properties.getAccountNumber()
            ) &&
            StringUtils.hasText(
                request.accountNumber()
            ) &&
            !normalizeAccount(
                properties.getAccountNumber()
            ).equals(
                normalizeAccount(
                    request.accountNumber()
                )
            )
        ) {
            return SePayWebhookResult.ignored(
                "Giao dịch không thuộc tài khoản nhận tiền đã cấu hình"
            );
        }

        String transactionRef =
            resolveTransactionRef(request);

        if (
            paymentRepository
                .existsByTransactionRef(
                    transactionRef
                )
        ) {
            return SePayWebhookResult.ignored(
                "Giao dịch đã được xử lý"
            );
        }

        String bookingCode =
            extractBookingCode(request);

        if (
            !StringUtils.hasText(
                bookingCode
            )
        ) {
            return SePayWebhookResult.ignored(
                "Không tìm thấy mã booking trong giao dịch"
            );
        }

        Booking booking =
            bookingRepository
                .findByBookingCodeForUpdate(
                    bookingCode
                )
                .orElse(null);

        if (booking == null) {
            return SePayWebhookResult.ignored(
                "Mã booking không tồn tại"
            );
        }

        Payment payment =
            paymentRepository
                .findFirstByBookingIdAndProviderOrderByCreatedAtDesc(
                    booking.getId(),
                    "SEPAY"
                )
                .orElseGet(
                    () -> Payment.builder()
                        .bookingId(
                            booking.getId()
                        )
                        .provider("SEPAY")
                        .paymentMethod("SEPAY")
                        .status("PENDING")
                        .amount(
                            booking.getTotalAmount()
                        )
                        .currency(
                            booking.getCurrency()
                        )
                        .build()
                );

        payment.setRawResponse(rawJson);
        payment.setTransactionRef(
            transactionRef
        );

        if (
            booking.getStatus()
                == BookingStatus.CANCELLED
        ) {
            payment.setStatus("FAILED");
            payment.setFailureReason(
                "Booking đã bị hủy trước khi nhận tiền"
            );

            paymentRepository.save(payment);

            return SePayWebhookResult.ignored(
                "Booking đã bị hủy"
            );
        }

        if (
            booking.getPaymentStatus()
                == PaymentStatus.PAID
        ) {
            payment.setStatus("SUCCEEDED");
            payment.setPaidAt(
                parseTransactionDate(
                    request.transactionDate()
                )
            );
            payment.setFailureReason(null);

            paymentRepository.save(payment);

            return SePayWebhookResult.ignored(
                "Booking đã được thanh toán trước đó"
            );
        }

        if (
            request.transferAmount()
                .compareTo(
                    booking.getTotalAmount()
                ) != 0
        ) {
            payment.setStatus("FAILED");
            payment.setFailureReason(
                "Số tiền nhận được " +
                request.transferAmount() +
                " không khớp số tiền booking " +
                booking.getTotalAmount()
            );

            paymentRepository.save(payment);

            return SePayWebhookResult.ignored(
                "Số tiền chuyển khoản không khớp booking"
            );
        }

        BookingStatus previousStatus =
            booking.getStatus();

        payment.setStatus("SUCCEEDED");
        payment.setPaidAt(
            parseTransactionDate(
                request.transactionDate()
            )
        );
        payment.setFailureReason(null);

        paymentRepository.save(payment);

        booking.setPaymentStatus(
            PaymentStatus.PAID
        );

        if (
            booking.getStatus()
                == BookingStatus.PENDING
        ) {
            booking.setStatus(
                BookingStatus.CONFIRMED
            );
        }

        bookingRepository.save(booking);

        if (
            previousStatus
                != booking.getStatus()
        ) {
            historyRepository.save(
                BookingStatusHistory.builder()
                    .bookingId(
                        booking.getId()
                    )
                    .fromStatus(
                        previousStatus.name()
                    )
                    .toStatus(
                        booking.getStatus().name()
                    )
                    .note(
                        "SePay xác nhận thanh toán: " +
                        transactionRef
                    )
                    .changedBy(null)
                    .createdAt(
                        OffsetDateTime.now()
                    )
                    .build()
            );
        }

        return SePayWebhookResult.processed(
            booking.getBookingCode()
        );
    }

    private Booking requireOwnedBooking(
        String email,
        String bookingCode
    ) {
        User user =
            userRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(
                    () -> new NotFoundException(
                        "Không tìm thấy tài khoản"
                    )
                );

        Booking booking =
            bookingRepository
                .findByBookingCode(
                    bookingCode
                )
                .orElseThrow(
                    () -> new NotFoundException(
                        "Không tìm thấy booking"
                    )
                );

        if (
            !booking.getUser()
                .getId()
                .equals(user.getId())
        ) {
            throw new ForbiddenException(
                "Bạn không có quyền truy cập thanh toán này"
            );
        }

        return booking;
    }

    private Optional<Payment> findLatestPayment(
        UUID bookingId
    ) {
        return paymentRepository
            .findFirstByBookingIdOrderByCreatedAtDesc(
                bookingId
            );
    }

    private String buildTransferContent(
        String bookingCode
    ) {
        String prefix =
            properties.getMemoPrefix() == null
                ? ""
                : properties
                    .getMemoPrefix()
                    .trim();

        return prefix.isBlank()
            ? bookingCode
            : prefix + " " + bookingCode;
    }

    private String buildQrUrl(
        BigDecimal amount,
        String transferContent
    ) {
        long amountInVnd;

        try {
            amountInVnd =
                amount.longValueExact();
        } catch (ArithmeticException exception) {
            throw new BadRequestException(
                "Số tiền thanh toán phải là số nguyên VND"
            );
        }

        return UriComponentsBuilder
            .fromUriString(
                "https://vietqr.app/img"
            )
            .queryParam(
                "acc",
                properties.getAccountNumber()
            )
            .queryParam(
                "bank",
                properties.getBankCode()
            )
            .queryParam(
                "amount",
                amountInVnd
            )
            .queryParam(
                "des",
                transferContent
            )
            .queryParam(
                "template",
                properties.getQrTemplate()
            )
            .queryParam(
                "showinfo",
                true
            )
            .queryParam(
                "fullacc",
                true
            )
            .queryParam(
                "holder",
                properties.getAccountName()
            )
            .queryParam(
                "store",
                properties.getStoreName()
            )
            .build()
            .encode(
                StandardCharsets.UTF_8
            )
            .toUriString();
    }

    private String extractBookingCode(
        SePayWebhookRequest request
    ) {
        String fromCode =
            normalizeBookingCode(
                request.code()
            );

        if (
            StringUtils.hasText(
                fromCode
            )
        ) {
            return fromCode;
        }

        String searchable =
            String.join(
                " ",
                request.content() == null
                    ? ""
                    : request.content(),
                request.description() == null
                    ? ""
                    : request.description()
            );

        Matcher matcher =
            BOOKING_CODE_PATTERN.matcher(
                searchable.toUpperCase(
                    Locale.ROOT
                )
            );

        return matcher.find()
            ? matcher
                .group()
                .toUpperCase(
                    Locale.ROOT
                )
            : null;
    }

    private String normalizeBookingCode(
        String value
    ) {
        if (
            !StringUtils.hasText(value)
        ) {
            return null;
        }

        Matcher matcher =
            BOOKING_CODE_PATTERN.matcher(
                value.toUpperCase(
                    Locale.ROOT
                )
            );

        return matcher.find()
            ? matcher
                .group()
                .toUpperCase(
                    Locale.ROOT
                )
            : null;
    }

    private String resolveTransactionRef(
        SePayWebhookRequest request
    ) {
        if (
            StringUtils.hasText(
                request.referenceCode()
            )
        ) {
            return request
                .referenceCode()
                .trim();
        }

        return "SEPAY-" + request.id();
    }

    private OffsetDateTime parseTransactionDate(
        String value
    ) {
        if (
            !StringUtils.hasText(value)
        ) {
            return OffsetDateTime.now();
        }

        try {
            LocalDateTime dateTime =
                LocalDateTime.parse(
                    value.trim(),
                    SEPAY_DATE_TIME
                );

            return dateTime
                .atZone(VIETNAM_ZONE)
                .toOffsetDateTime();
        } catch (
            DateTimeParseException exception
        ) {
            return OffsetDateTime.now();
        }
    }

    private String calculateHmac(
        String signedPayload
    ) {
        try {
            Mac mac =
                Mac.getInstance(
                    "HmacSHA256"
                );

            mac.init(
                new SecretKeySpec(
                    properties
                        .getWebhookSecret()
                        .getBytes(
                            StandardCharsets.UTF_8
                        ),
                    "HmacSHA256"
                )
            );

            return HexFormat
                .of()
                .formatHex(
                    mac.doFinal(
                        signedPayload.getBytes(
                            StandardCharsets.UTF_8
                        )
                    )
                );
        } catch (Exception exception) {
            throw new IllegalStateException(
                "Không thể xác minh chữ ký SePay",
                exception
            );
        }
    }

    private boolean constantTimeEquals(
        String expected,
        String actual
    ) {
        if (
            expected == null ||
            actual == null
        ) {
            return false;
        }

        return MessageDigest.isEqual(
            expected.getBytes(
                StandardCharsets.UTF_8
            ),
            actual.getBytes(
                StandardCharsets.UTF_8
            )
        );
    }

    private String normalizeAccount(
        String value
    ) {
        return value == null
            ? ""
            : value.replaceAll(
                "\\s+",
                ""
            );
    }

    private void validateWebhookConfiguration() {
        if (
            !StringUtils.hasText(
                properties.getWebhookSecret()
            )
        ) {
            throw new IllegalStateException(
                "Chưa cấu hình SEPAY_WEBHOOK_SECRET"
            );
        }
    }

    private void validatePaymentConfiguration() {
        if (
            !StringUtils.hasText(
                properties.getBankCode()
            )
        ) {
            throw new IllegalStateException(
                "Chưa cấu hình SEPAY_BANK_CODE"
            );
        }

        if (
            !StringUtils.hasText(
                properties.getAccountNumber()
            )
        ) {
            throw new IllegalStateException(
                "Chưa cấu hình SEPAY_ACCOUNT_NUMBER"
            );
        }

        if (
            !StringUtils.hasText(
                properties.getAccountName()
            )
        ) {
            throw new IllegalStateException(
                "Chưa cấu hình SEPAY_ACCOUNT_NAME"
            );
        }
    }
}