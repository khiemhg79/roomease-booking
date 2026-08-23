package com.roomease.manager;

import com.roomease.booking.Booking;
import com.roomease.booking.BookingRoom;
import com.roomease.booking.BookingService;
import com.roomease.booking.BookingStatus;

import com.roomease.booking.dto.BookingResponse;
import com.roomease.booking.dto.UpdateBookingStatusRequest;

import com.roomease.booking.repo.BookingRepository;
import com.roomease.booking.repo.BookingRoomRepository;

import com.roomease.common.dto.PageResponse;

import com.roomease.common.exception.BadRequestException;
import com.roomease.common.exception.ForbiddenException;
import com.roomease.common.exception.NotFoundException;

import com.roomease.manager.dto.ManagerBookingResponse;

import com.roomease.property.Property;
import com.roomease.property.repo.PropertyRepository;

import com.roomease.user.Role;
import com.roomease.user.User;
import com.roomease.user.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import java.util.List;
import java.util.Locale;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class ManagerBookingService {

    private final UserRepository userRepository;

    private final PropertyRepository propertyRepository;

    private final BookingRepository bookingRepository;

    private final BookingRoomRepository bookingRoomRepository;

    private final BookingService bookingService;


    /*
     * =========================================================
     * DANH SÁCH BOOKING
     * =========================================================
     */

    @Transactional(readOnly = true)
    public PageResponse<ManagerBookingResponse> list(
        String email,
        UUID propertyId,
        String status,
        LocalDate fromDate,
        LocalDate toDate,
        String keyword,
        int page,
        int size
    ) {

        User actor = requireManager(email);


        /*
         * Nếu manager lọc theo một property cụ thể
         * thì kiểm tra property đó có thuộc quyền quản lý không.
         */
        if (propertyId != null) {
            requirePropertyAccess(
                actor,
                propertyId
            );
        }


        /*
         * Convert status String -> BookingStatus.
         */
        BookingStatus bookingStatus =
            status == null || status.isBlank()
                ? null
                : parseStatus(status);


        /*
         * =====================================================
         * FIX LỖI PostgreSQL:
         *
         * function lower(bytea) does not exist
         *
         * Không truyền NULL vào keyword nữa.
         *
         * Nếu textbox tìm kiếm trống:
         *
         *     keyword = ""
         *
         * Nếu có keyword:
         *
         *     trim + lowercase
         *
         * Vì BookingRepository đã lower(column),
         * nên parameter chỉ cần lowercase một lần ở đây.
         * =====================================================
         */
        String normalizedKeyword =
            keyword == null
                ? ""
                : keyword
                    .trim()
                    .toLowerCase(Locale.ROOT);


        /*
         * ADMIN:
         *
         * ownerId = null
         * -> xem tất cả booking.
         *
         * HOTEL_MANAGER:
         *
         * ownerId = ID manager
         * -> chỉ booking thuộc property của manager.
         */
        UUID ownerId =
            actor.getRole() == Role.ADMIN
                ? null
                : actor.getId();


        Page<ManagerBookingResponse> result =
            bookingRepository
                .searchManagerBookings(
                    ownerId,
                    propertyId,
                    bookingStatus,
                    fromDate,
                    toDate,
                    normalizedKeyword,
                    PageRequest.of(
                        page,
                        size
                    )
                )
                .map(this::toResponse);


        return PageResponse.from(result);
    }


    /*
     * =========================================================
     * CHI TIẾT BOOKING
     * =========================================================
     */

    @Transactional(readOnly = true)
    public ManagerBookingResponse detail(
        String email,
        String bookingCode
    ) {

        User actor =
            requireManager(email);


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


        requirePropertyAccess(
            actor,
            booking
                .getProperty()
                .getId()
        );


        return toResponse(booking);
    }


    /*
     * =========================================================
     * UPDATE STATUS CŨ
     *
     * GIỮ NGUYÊN CHỨC NĂNG CŨ
     * =========================================================
     */

    @Transactional
    public BookingResponse updateStatus(
        String email,
        String bookingCode,
        UpdateBookingStatusRequest request
    ) {

        requireManager(email);


        return bookingService
            .adminUpdateStatus(
                email,
                bookingCode,
                request
            );
    }


    /*
     * =========================================================
     * CHECK-IN
     *
     * Chức năng mới đã làm trước đó.
     * GIỮ NGUYÊN.
     * =========================================================
     */

    @Transactional
    public BookingResponse checkIn(
        String email,
        String bookingCode
    ) {

        requireManager(email);


        return bookingService
            .managerCheckIn(
                email,
                bookingCode
            );
    }


    /*
     * =========================================================
     * CHECK-OUT
     *
     * Chức năng mới đã làm trước đó.
     * GIỮ NGUYÊN.
     * =========================================================
     */

    @Transactional
    public BookingResponse checkOut(
        String email,
        String bookingCode
    ) {

        requireManager(email);


        return bookingService
            .managerCheckOut(
                email,
                bookingCode
            );
    }


    /*
     * =========================================================
     * CONVERT BOOKING -> MANAGER RESPONSE
     * =========================================================
     */

    private ManagerBookingResponse toResponse(
        Booking booking
    ) {

        List<BookingRoom> rooms =
            bookingRoomRepository
                .findByBooking_IdOrderByCreatedAtAsc(
                    booking.getId()
                );


        List<ManagerBookingResponse.RoomItem>
            roomItems =
                rooms
                    .stream()
                    .map(
                        room ->
                            new ManagerBookingResponse.RoomItem(

                                room.getId(),

                                room.getRoomTypeId(),

                                room.getRatePlanId(),

                                room.getRoomNameSnapshot(),

                                room.getRatePlanNameSnapshot(),

                                room.getMealPlanSnapshot(),

                                room.getCancellationPolicySnapshot(),

                                room.getQuantity(),

                                room.getAdults(),

                                room.getChildren(),

                                room.getUnitPrice(),

                                room.getNights(),

                                room.getSubtotal()
                            )
                    )
                    .toList();


        Property property =
            booking.getProperty();


        return new ManagerBookingResponse(

            booking.getId(),

            booking.getBookingCode(),

            booking
                .getStatus()
                .name(),

            booking
                .getPaymentStatus()
                .name(),

            property.getId(),

            property.getName(),

            property.getSlug(),

            property.getCity(),

            booking.getCheckIn(),

            booking.getCheckOut(),

            booking.getNights(),

            booking.getAdults(),

            booking.getChildren(),

            booking.getRoomsCount(),

            booking.getSubtotal(),

            booking.getDiscountAmount(),

            booking.getTaxAmount(),

            booking.getTotalAmount(),

            booking.getCurrency(),

            booking.getGuestFullName(),

            booking.getGuestEmail(),

            booking.getGuestPhone(),

            booking.getSpecialRequest(),

            booking.getCancellationDeadline(),

            booking.getCreatedAt(),

            roomItems
        );
    }


    /*
     * =========================================================
     * KIỂM TRA USER CÓ QUYỀN MANAGER KHÔNG
     * =========================================================
     */

    private User requireManager(
        String email
    ) {

        User user =
            userRepository
                .findByEmailIgnoreCase(
                    email
                )
                .orElseThrow(
                    () -> new NotFoundException(
                        "Không tìm thấy tài khoản"
                    )
                );


        if (
            user.getRole() != Role.ADMIN
                &&
            user.getRole() != Role.HOTEL_MANAGER
        ) {

            throw new ForbiddenException(
                "Tài khoản không có quyền quản lý booking"
            );
        }


        return user;
    }


    /*
     * =========================================================
     * KIỂM TRA QUYỀN TRÊN PROPERTY
     * =========================================================
     */

    private void requirePropertyAccess(
        User actor,
        UUID propertyId
    ) {

        Property property =
            propertyRepository
                .findById(
                    propertyId
                )
                .orElseThrow(
                    () -> new NotFoundException(
                        "Không tìm thấy chỗ nghỉ"
                    )
                );


        /*
         * ADMIN có quyền tất cả property.
         */
        if (
            actor.getRole() == Role.ADMIN
        ) {

            return;
        }


        /*
         * HOTEL_MANAGER chỉ được quản lý
         * property do chính mình sở hữu.
         */
        if (
            property.getOwner() == null
                ||
            !property
                .getOwner()
                .getId()
                .equals(
                    actor.getId()
                )
        ) {

            throw new ForbiddenException(
                "Bạn không có quyền quản lý booking của chỗ nghỉ này"
            );
        }
    }


    /*
     * =========================================================
     * PARSE STATUS
     * =========================================================
     */

    private BookingStatus parseStatus(
        String status
    ) {

        try {

            return BookingStatus
                .valueOf(
                    status
                        .trim()
                        .toUpperCase(
                            Locale.ROOT
                        )
                );

        } catch (
            IllegalArgumentException exception
        ) {

            throw new BadRequestException(
                "Trạng thái booking không hợp lệ"
            );
        }
    }
}