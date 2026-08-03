package com.roomease.booking;

import com.roomease.booking.dto.*;
import com.roomease.common.dto.ApiResponse;
import com.roomease.common.dto.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;

    @PostMapping
    public ApiResponse<BookingResponse> create(Authentication auth, @Valid @RequestBody CreateBookingRequest request) {
        return ApiResponse.ok("Đặt phòng thành công", bookingService.create(auth.getName(), request));
    }

    @GetMapping("/me")
    public ApiResponse<PageResponse<BookingResponse>> mine(
        Authentication auth,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size
    ) {
        return ApiResponse.ok(bookingService.myBookings(auth.getName(), page, size));
    }

    @GetMapping("/{bookingCode}")
    public ApiResponse<BookingResponse> detail(Authentication auth, @PathVariable String bookingCode) {
        return ApiResponse.ok(bookingService.detail(auth.getName(), bookingCode, false));
    }

    @PatchMapping("/{bookingCode}/cancel")
    public ApiResponse<BookingResponse> cancel(Authentication auth, @PathVariable String bookingCode) {
        return ApiResponse.ok("Đã hủy booking", bookingService.cancel(auth.getName(), bookingCode));
    }
}
