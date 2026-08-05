package com.roomease.payment;

import com.roomease.payment.dto.SePayWebhookRequest;
import com.roomease.payment.dto.SePayWebhookResult;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class SePayWebhookProcessor {

    private static final ZoneId VIETNAM_ZONE =
        ZoneId.of("Asia/Ho_Chi_Minh");

    private static final DateTimeFormatter SEPAY_DATE_TIME =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final Pattern BOOKING_CODE_PATTERN =
        Pattern.compile(
            "\\bRE[0-9]{8}[A-Z0-9]{8}\\b",
            Pattern.CASE_INSENSITIVE
        );

    private final JdbcTemplate jdbcTemplate;
    private final SePayProperties properties;

    @Transactional
    public SePayWebhookResult process(
        SePayWebhookRequest request,
        String rawJson
    ) {
        if (request == null || request.id() == null) {
            return SePayWebhookResult.ignored(
                "Thiếu ID giao dịch SePay"
            );
        }

        if (!"in".equalsIgnoreCase(request.transferType())) {
            return SePayWebhookResult.ignored(
                "Không phải giao dịch tiền vào"
            );
        }

        if (
            request.transferAmount() == null
                || request.transferAmount().signum() <= 0
        ) {
            return SePayWebhookResult.ignored(
                "Số tiền giao dịch không hợp lệ"
            );
        }

        if (
            StringUtils.hasText(properties.getAccountNumber())
                && StringUtils.hasText(request.accountNumber())
                && !normalizeAccount(
                    properties.getAccountNumber()
                ).equals(
                    normalizeAccount(request.accountNumber())
                )
        ) {
            return SePayWebhookResult.ignored(
                "Giao dịch không thuộc tài khoản đã cấu hình"
            );
        }

        String bookingCode = extractBookingCode(request);

        if (!StringUtils.hasText(bookingCode)) {
            return SePayWebhookResult.ignored(
                "Không tìm thấy mã booking trong giao dịch"
            );
        }

        BookingRow booking = findAndLockBooking(bookingCode);

        if (booking == null) {
            return SePayWebhookResult.ignored(
                "Mã booking không tồn tại"
            );
        }

        String transactionRef =
            resolveTransactionRef(request);

        UUID transactionBookingId =
            findBookingIdByTransactionRef(transactionRef);

        if (
            transactionBookingId != null
                && !transactionBookingId.equals(booking.id())
        ) {
            return SePayWebhookResult.ignored(
                "Mã tham chiếu đã thuộc giao dịch khác"
            );
        }

        if (
            "PAID".equalsIgnoreCase(booking.paymentStatus())
                && transactionBookingId != null
        ) {
            return SePayWebhookResult.processed(bookingCode);
        }

        if ("CANCELLED".equalsIgnoreCase(booking.status())) {
            updateFailedPayment(
                booking.id(),
                transactionRef,
                rawJson,
                "Booking đã bị hủy trước khi nhận tiền"
            );

            return SePayWebhookResult.ignored(
                "Booking đã bị hủy"
            );
        }

        if (
            booking.totalAmount() == null
                || request.transferAmount().compareTo(
                    booking.totalAmount()
                ) != 0
        ) {
            updateFailedPayment(
                booking.id(),
                transactionRef,
                rawJson,
                "Số tiền nhận được "
                    + request.transferAmount()
                    + " không khớp số tiền booking "
                    + booking.totalAmount()
            );

            return SePayWebhookResult.ignored(
                "Số tiền chuyển khoản không khớp booking"
            );
        }

        UUID paymentId = findSePayPaymentId(booking.id());

        if (paymentId == null) {
            return SePayWebhookResult.ignored(
                "Booking chưa có bản ghi payment SEPAY"
            );
        }

        OffsetDateTime paidAt =
            parseTransactionDate(request.transactionDate());

        int paymentUpdated = jdbcTemplate.update(
            """
            update public.payments
            set status = 'SUCCEEDED',
                transaction_ref = ?,
                paid_at = ?,
                failure_reason = null,
                raw_response = cast(? as jsonb)
            where id = ?
            """,
            transactionRef,
            Timestamp.from(paidAt.toInstant()),
            rawJson,
            paymentId
        );

        if (paymentUpdated != 1) {
            throw new IllegalStateException(
                "Không thể cập nhật giao dịch thanh toán"
            );
        }

        int bookingUpdated = jdbcTemplate.update(
            """
            update public.bookings
            set payment_status = 'PAID',
                status = case
                    when status = 'PENDING' then 'CONFIRMED'
                    else status
                end
            where id = ?
            """,
            booking.id()
        );

        if (bookingUpdated != 1) {
            throw new IllegalStateException(
                "Không thể cập nhật trạng thái booking"
            );
        }

        return SePayWebhookResult.processed(bookingCode);
    }

    private BookingRow findAndLockBooking(String bookingCode) {
        List<BookingRow> rows = jdbcTemplate.query(
            """
            select
                id,
                booking_code,
                total_amount,
                status::text as status,
                payment_status::text as payment_status
            from public.bookings
            where upper(booking_code) = upper(?)
            for update
            """,
            (resultSet, rowNumber) ->
                mapBooking(resultSet),
            bookingCode
        );

        return rows.isEmpty() ? null : rows.get(0);
    }

    private BookingRow mapBooking(
        ResultSet resultSet
    ) throws SQLException {
        return new BookingRow(
            resultSet.getObject("id", UUID.class),
            resultSet.getString("booking_code"),
            resultSet.getBigDecimal("total_amount"),
            resultSet.getString("status"),
            resultSet.getString("payment_status")
        );
    }

    private UUID findSePayPaymentId(UUID bookingId) {
        List<UUID> rows = jdbcTemplate.query(
            """
            select id
            from public.payments
            where booking_id = ?
              and upper(provider) = 'SEPAY'
            order by created_at desc
            limit 1
            """,
            (resultSet, rowNumber) ->
                resultSet.getObject("id", UUID.class),
            bookingId
        );

        return rows.isEmpty() ? null : rows.get(0);
    }

    private UUID findBookingIdByTransactionRef(
        String transactionRef
    ) {
        List<UUID> rows = jdbcTemplate.query(
            """
            select booking_id
            from public.payments
            where transaction_ref = ?
            limit 1
            """,
            (resultSet, rowNumber) ->
                resultSet.getObject(
                    "booking_id",
                    UUID.class
                ),
            transactionRef
        );

        return rows.isEmpty() ? null : rows.get(0);
    }

    private void updateFailedPayment(
        UUID bookingId,
        String transactionRef,
        String rawJson,
        String reason
    ) {
        UUID paymentId = findSePayPaymentId(bookingId);

        if (paymentId == null) {
            return;
        }

        jdbcTemplate.update(
            """
            update public.payments
            set status = 'FAILED',
                transaction_ref = ?,
                failure_reason = ?,
                raw_response = cast(? as jsonb)
            where id = ?
            """,
            transactionRef,
            reason,
            rawJson,
            paymentId
        );
    }

    private String extractBookingCode(
        SePayWebhookRequest request
    ) {
        String directCode =
            matchBookingCode(request.code());

        if (StringUtils.hasText(directCode)) {
            return directCode;
        }

        String searchable = String.join(
            " ",
            safe(request.content()),
            safe(request.description())
        );

        return matchBookingCode(searchable);
    }

    private String matchBookingCode(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        Matcher matcher = BOOKING_CODE_PATTERN.matcher(
            value.toUpperCase(Locale.ROOT)
        );

        return matcher.find()
            ? matcher.group().toUpperCase(Locale.ROOT)
            : null;
    }

    private String resolveTransactionRef(
        SePayWebhookRequest request
    ) {
        if (StringUtils.hasText(request.referenceCode())) {
            return request.referenceCode().trim();
        }

        return "SEPAY-" + request.id();
    }

    private OffsetDateTime parseTransactionDate(
        String value
    ) {
        if (!StringUtils.hasText(value)) {
            return OffsetDateTime.now(VIETNAM_ZONE);
        }

        try {
            return LocalDateTime
                .parse(value.trim(), SEPAY_DATE_TIME)
                .atZone(VIETNAM_ZONE)
                .toOffsetDateTime();
        } catch (DateTimeParseException exception) {
            return OffsetDateTime.now(VIETNAM_ZONE);
        }
    }

    private String normalizeAccount(String value) {
        return value == null
            ? ""
            : value.replaceAll("\\s+", "");
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private record BookingRow(
        UUID id,
        String bookingCode,
        BigDecimal totalAmount,
        String status,
        String paymentStatus
    ) {
    }
}