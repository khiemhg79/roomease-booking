package com.roomease.booking;

import com.roomease.booking.dto.*;
import com.roomease.booking.repo.*;
import com.roomease.common.dto.PageResponse;
import com.roomease.common.exception.*;
import com.roomease.property.*;
import com.roomease.property.repo.*;
import com.roomease.user.Role;
import com.roomease.user.User;
import com.roomease.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BookingService {
    private static final BigDecimal TAX_RATE = new BigDecimal("0.08");

    private final BookingRepository bookingRepository;
    private final BookingRoomRepository bookingRoomRepository;
    private final BookingStatusHistoryRepository historyRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final RatePlanRepository ratePlanRepository;
    private final InventoryCalendarRepository inventoryRepository;
    private final RateCalendarRepository rateRepository;

    @Transactional
    public BookingResponse create(String email, CreateBookingRequest request) {
        User user = requireUser(email);
        Property property = propertyRepository.findByIdAndStatus(request.propertyId(), PropertyStatus.ACTIVE)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy chỗ nghỉ"));
        int nights = validateDates(request.checkIn(), request.checkOut());

        Booking booking = Booking.builder()
            .bookingCode(generateBookingCode())
            .user(user)
            .property(property)
            .status("PAY_AT_PROPERTY".equals(request.paymentMethod()) ? BookingStatus.CONFIRMED : BookingStatus.PENDING)
            .paymentStatus("PAY_AT_PROPERTY".equals(request.paymentMethod()) ? PaymentStatus.NOT_REQUIRED : PaymentStatus.PENDING)
            .checkIn(request.checkIn())
            .checkOut(request.checkOut())
            .nights(nights)
            .guestFullName(request.guestFullName().trim())
            .guestEmail(request.guestEmail().trim().toLowerCase(Locale.ROOT))
            .guestPhone(request.guestPhone().trim())
            .specialRequest(blankToNull(request.specialRequest()))
            .source("WEB")
            .discountAmount(BigDecimal.ZERO)
            .currency("VND")
            .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        int totalAdults = 0;
        int totalChildren = 0;
        int totalRooms = 0;
        OffsetDateTime earliestCancellation = null;
        boolean allRefundable = true;
        Set<UUID> selectedRatePlans = new HashSet<>();
        List<BookingRoomRequest> orderedRooms = request.rooms().stream()
            .sorted(Comparator.comparing(BookingRoomRequest::ratePlanId))
            .toList();

        for (BookingRoomRequest item : orderedRooms) {
            if (!selectedRatePlans.add(item.ratePlanId())) {
                throw new BadRequestException("Không được gửi trùng một gói giá trong cùng đơn");
            }
            RatePlan ratePlan = ratePlanRepository.findByIdAndActiveTrue(item.ratePlanId())
                .orElseThrow(() -> new NotFoundException("Gói giá không tồn tại"));
            RoomType roomType = roomTypeRepository.findByIdAndActiveTrue(ratePlan.getRoomTypeId())
                .orElseThrow(() -> new NotFoundException("Loại phòng không tồn tại"));
            if (!roomType.getPropertyId().equals(property.getId())) {
                throw new BadRequestException("Loại phòng không thuộc chỗ nghỉ đã chọn");
            }
            if ("PAY_AT_PROPERTY".equals(request.paymentMethod()) && !ratePlan.isPayAtProperty()) {
                throw new BadRequestException("Gói giá " + ratePlan.getName() + " yêu cầu thanh toán trước");
            }
            if (item.adults() > roomType.getMaxAdults() * item.quantity()
                || item.children() > roomType.getMaxChildren() * item.quantity()) {
                throw new BadRequestException("Số khách vượt quá sức chứa của " + roomType.getName());
            }

            List<InventoryCalendar> inventory = inventoryRepository.lockStayDates(
                roomType.getId(), request.checkIn(), request.checkOut());
            if (inventory.size() != nights) {
                throw new ConflictException("Chưa thiết lập tồn phòng cho toàn bộ ngày đã chọn");
            }
            for (InventoryCalendar day : inventory) {
                if (day.isStopSell() || day.availableRooms() < item.quantity()) {
                    throw new ConflictException(roomType.getName() + " không còn đủ phòng trong ngày " + day.getId().getStayDate());
                }
                if (nights < day.getMinStay() || (day.getMaxStay() != null && nights > day.getMaxStay())) {
                    throw new ConflictException("Số đêm không đáp ứng quy định lưu trú của " + roomType.getName());
                }
            }

            List<RateCalendar> rates = rateRepository.findStayRates(ratePlan.getId(), request.checkIn(), request.checkOut());
            if (rates.size() != nights) {
                throw new ConflictException("Gói giá không mở bán cho toàn bộ ngày đã chọn");
            }
            BigDecimal oneRoomStay = rates.stream().map(RateCalendar::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal lineSubtotal = oneRoomStay.multiply(BigDecimal.valueOf(item.quantity()));
            BigDecimal averageNightly = oneRoomStay.divide(BigDecimal.valueOf(nights), 2, RoundingMode.HALF_UP);

            inventory.forEach(day -> day.setReservedRooms(day.getReservedRooms() + item.quantity()));
            inventoryRepository.saveAll(inventory);

            String cancellationText = cancellationText(ratePlan);
            booking.addRoom(BookingRoom.builder()
                .roomTypeId(roomType.getId())
                .ratePlanId(ratePlan.getId())
                .roomNameSnapshot(roomType.getName())
                .ratePlanNameSnapshot(ratePlan.getName())
                .mealPlanSnapshot(ratePlan.getMealPlan())
                .cancellationPolicySnapshot(cancellationText)
                .quantity(item.quantity())
                .adults(item.adults())
                .children(item.children())
                .unitPrice(averageNightly)
                .nights(nights)
                .subtotal(lineSubtotal)
                .createdAt(OffsetDateTime.now())
                .build());

            subtotal = subtotal.add(lineSubtotal);
            totalAdults += item.adults();
            totalChildren += item.children();
            totalRooms += item.quantity();
            if (!ratePlan.isRefundable()) {
                allRefundable = false;
            } else {
                OffsetDateTime deadline = request.checkIn().atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh"))
                    .minusDays(ratePlan.getCancellationDays()).toOffsetDateTime();
                if (earliestCancellation == null || deadline.isBefore(earliestCancellation)) earliestCancellation = deadline;
            }
        }

        if (totalAdults < 1) throw new BadRequestException("Đơn đặt phòng phải có ít nhất một người lớn");
        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(0, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(tax);
        booking.setAdults(totalAdults);
        booking.setChildren(totalChildren);
        booking.setRoomsCount(totalRooms);
        booking.setSubtotal(subtotal);
        booking.setTaxAmount(tax);
        booking.setTotalAmount(total);
        booking.setCancellationDeadline(allRefundable ? earliestCancellation : null);

        Booking saved = bookingRepository.save(booking);
        historyRepository.save(BookingStatusHistory.builder()
            .bookingId(saved.getId()).fromStatus(null).toStatus(saved.getStatus().name())
            .note("Booking created").changedBy(user.getId()).createdAt(OffsetDateTime.now()).build());
        String paymentProvider = switch (request.paymentMethod()) {
            case "SEPAY" -> "SEPAY";
            case "CARD" -> "CARD";
            case "BANK_TRANSFER" -> "BANK_TRANSFER";
            default -> "INTERNAL";
        };

        String paymentRecordStatus = "PAY_AT_PROPERTY".equals(request.paymentMethod())
            ? "SUCCEEDED"
            : "PENDING";

        paymentRepository.save(Payment.builder()
            .bookingId(saved.getId())
            .provider(paymentProvider)
            .paymentMethod(request.paymentMethod())
            .status(paymentRecordStatus)
            .amount(total)
            .currency("VND")
            .build());

        return toResponse(saved, saved.getRooms());
    }

    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> myBookings(String email, int page, int size) {
        User user = requireUser(email);
        Page<BookingResponse> result = bookingRepository.findByUser_IdOrderByCreatedAtDesc(user.getId(), PageRequest.of(page, size))
            .map(b -> toResponse(b, bookingRoomRepository.findByBooking_IdOrderByCreatedAtAsc(b.getId())));
        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public BookingResponse detail(String email, String bookingCode, boolean admin) {
        User user = requireUser(email);
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy booking"));
        if (!admin && !booking.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Bạn không có quyền xem booking này");
        }
        return toResponse(booking, bookingRoomRepository.findByBooking_IdOrderByCreatedAtAsc(booking.getId()));
    }

    @Transactional
    public BookingResponse cancel(String email, String bookingCode) {
        User user = requireUser(email);
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy booking"));
        if (!booking.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Bạn không có quyền hủy booking này");
        }
        if (booking.getCancellationDeadline() == null
            || OffsetDateTime.now().isAfter(booking.getCancellationDeadline())) {
            throw new ConflictException("Booking không còn trong thời gian tự hủy miễn phí. Hãy liên hệ chỗ nghỉ.");
        }
        cancelInternal(booking, user.getId(), "Khách hàng hủy booking");
        return toResponse(booking, bookingRoomRepository.findByBooking_IdOrderByCreatedAtAsc(booking.getId()));
    }

    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> adminBookings(String email, int page, int size) {
        User actor = requireUser(email);
        Page<Booking> bookings = actor.getRole() == Role.ADMIN
            ? bookingRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size))
            : bookingRepository.findByProperty_Owner_IdOrderByCreatedAtDesc(actor.getId(), PageRequest.of(page, size));
        Page<BookingResponse> result = bookings
            .map(b -> toResponse(b, bookingRoomRepository.findByBooking_IdOrderByCreatedAtAsc(b.getId())));
        return PageResponse.from(result);
    }

    @Transactional
    public BookingResponse adminUpdateStatus(String email, String bookingCode, UpdateBookingStatusRequest request) {
        User actor = requireUser(email);
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy booking"));
        if (actor.getRole() != Role.ADMIN
            && (booking.getProperty().getOwner() == null
                || !booking.getProperty().getOwner().getId().equals(actor.getId()))) {
            throw new ForbiddenException("Bạn không có quyền cập nhật booking của chỗ nghỉ này");
        }
        BookingStatus target = BookingStatus.valueOf(request.status());
        if (target == BookingStatus.CANCELLED) {
            cancelInternal(booking, actor.getId(), blankToNull(request.note()));
        } else {
            BookingStatus from = booking.getStatus();
            validateTransition(from, target);
            booking.setStatus(target);
            bookingRepository.save(booking);
            historyRepository.save(BookingStatusHistory.builder()
                .bookingId(booking.getId()).fromStatus(from.name()).toStatus(target.name())
                .note(blankToNull(request.note())).changedBy(actor.getId()).createdAt(OffsetDateTime.now()).build());
        }
        return toResponse(booking, bookingRoomRepository.findByBooking_IdOrderByCreatedAtAsc(booking.getId()));
    }

    private void cancelInternal(Booking booking, UUID actorId, String note) {
        if (booking.getStatus() == BookingStatus.CANCELLED) throw new ConflictException("Booking đã được hủy");
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CHECKED_IN
            || booking.getStatus() == BookingStatus.NO_SHOW) {
            throw new ConflictException("Booking ở trạng thái hiện tại không thể hủy");
        }
        List<BookingRoom> rooms = bookingRoomRepository.findByBooking_IdOrderByCreatedAtAsc(booking.getId());
        for (BookingRoom item : rooms) {
            List<InventoryCalendar> inventory = inventoryRepository.lockStayDates(item.getRoomTypeId(), booking.getCheckIn(), booking.getCheckOut());
            for (InventoryCalendar day : inventory) {
                day.setReservedRooms(Math.max(0, day.getReservedRooms() - item.getQuantity()));
            }
            inventoryRepository.saveAll(inventory);
        }
        BookingStatus from = booking.getStatus();
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(OffsetDateTime.now());
        if (booking.getPaymentStatus() == PaymentStatus.PAID) booking.setPaymentStatus(PaymentStatus.REFUNDED);
        bookingRepository.save(booking);
        historyRepository.save(BookingStatusHistory.builder()
            .bookingId(booking.getId()).fromStatus(from.name()).toStatus(BookingStatus.CANCELLED.name())
            .note(note).changedBy(actorId).createdAt(OffsetDateTime.now()).build());
    }

    private void validateTransition(BookingStatus from, BookingStatus to) {
        Map<BookingStatus, Set<BookingStatus>> transitions = Map.of(
            BookingStatus.PENDING, Set.of(BookingStatus.CONFIRMED, BookingStatus.CANCELLED),
            BookingStatus.CONFIRMED, Set.of(BookingStatus.CHECKED_IN, BookingStatus.CANCELLED, BookingStatus.NO_SHOW),
            BookingStatus.CHECKED_IN, Set.of(BookingStatus.COMPLETED),
            BookingStatus.COMPLETED, Set.of(),
            BookingStatus.CANCELLED, Set.of(),
            BookingStatus.NO_SHOW, Set.of()
        );
        if (!transitions.getOrDefault(from, Set.of()).contains(to)) {
            throw new ConflictException("Không thể chuyển trạng thái từ " + from + " sang " + to);
        }
    }

    private BookingResponse toResponse(Booking b, List<BookingRoom> rooms) {
        List<BookingRoomResponse> roomResponses = rooms.stream().map(r -> new BookingRoomResponse(
            r.getId(), r.getRoomTypeId(), r.getRatePlanId(), r.getRoomNameSnapshot(), r.getRatePlanNameSnapshot(),
            r.getMealPlanSnapshot(), r.getCancellationPolicySnapshot(), r.getQuantity(), r.getAdults(), r.getChildren(),
            r.getUnitPrice(), r.getNights(), r.getSubtotal())).toList();
        Property p = b.getProperty();
        return new BookingResponse(b.getId(), b.getBookingCode(), b.getStatus().name(), b.getPaymentStatus().name(),
            p.getId(), p.getName(), p.getSlug(), p.getAddressLine(), p.getCity(), b.getCheckIn(), b.getCheckOut(),
            b.getNights(), b.getAdults(), b.getChildren(), b.getRoomsCount(), b.getSubtotal(), b.getDiscountAmount(),
            b.getTaxAmount(), b.getTotalAmount(), b.getCurrency(), b.getGuestFullName(), b.getGuestEmail(),
            b.getGuestPhone(), b.getSpecialRequest(), b.getCancellationDeadline(), b.getCreatedAt(), roomResponses);
    }

    private int validateDates(LocalDate checkIn, LocalDate checkOut) {
        if (checkOut == null || !checkOut.isAfter(checkIn)) throw new BadRequestException("Ngày trả phòng phải sau ngày nhận phòng");
        if (checkIn.isBefore(LocalDate.now())) throw new BadRequestException("Ngày nhận phòng không được ở quá khứ");
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nights > 30) throw new BadRequestException("Không thể đặt quá 30 đêm trong một booking");
        return Math.toIntExact(nights);
    }

    private User requireUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));
    }

    private String cancellationText(RatePlan plan) {
        if (!plan.isRefundable()) return "Không hoàn tiền";
        if ("FLEXIBLE".equals(plan.getCancellationType())) return "Có thể hủy linh hoạt";
        return "Hủy miễn phí trước " + plan.getCancellationDays() + " ngày";
    }

    private String generateBookingCode() {
        return "RE" + LocalDate.now().format(java.time.format.DateTimeFormatter.BASIC_ISO_DATE)
            + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}