package com.roomease.admin;

import com.roomease.admin.dto.*;
import com.roomease.booking.dto.BookingResponse;
import com.roomease.booking.dto.UpdateBookingStatusRequest;
import com.roomease.common.dto.ApiResponse;
import com.roomease.common.dto.PageResponse;
import com.roomease.manager.ManagerBookingService;
import com.roomease.manager.dto.ManagerBookingResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;
    private final ManagerBookingService managerBookingService;

    @GetMapping("/dashboard")
    public ApiResponse<AdminDashboardResponse> dashboard(Authentication authentication) {
        return ApiResponse.ok(adminService.dashboard(authentication.getName()));
    }

    @GetMapping("/users")
    public ApiResponse<PageResponse<AdminUserResponse>> users(
        Authentication authentication,
        @RequestParam(required = false) String role,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return ApiResponse.ok(adminService.users(authentication.getName(), role, status, keyword, page, size));
    }

    @PatchMapping("/users/{userId}/status")
    public ApiResponse<AdminUserResponse> updateUserStatus(
        Authentication authentication,
        @PathVariable UUID userId,
        @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        return ApiResponse.ok("Đã cập nhật trạng thái tài khoản",
            adminService.updateUserStatus(authentication.getName(), userId, request));
    }

    @PatchMapping("/users/{userId}/role")
    public ApiResponse<AdminUserResponse> updateUserRole(
        Authentication authentication,
        @PathVariable UUID userId,
        @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        return ApiResponse.ok("Đã cập nhật quyền tài khoản",
            adminService.updateUserRole(authentication.getName(), userId, request));
    }

    @GetMapping("/properties")
    public ApiResponse<PageResponse<AdminPropertyResponse>> properties(
        Authentication authentication,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return ApiResponse.ok(adminService.properties(authentication.getName(), status, keyword, page, size));
    }

    @PatchMapping("/properties/{propertyId}")
    public ApiResponse<AdminPropertyResponse> moderateProperty(
        Authentication authentication,
        @PathVariable UUID propertyId,
        @Valid @RequestBody ModeratePropertyRequest request
    ) {
        return ApiResponse.ok("Đã cập nhật chỗ nghỉ",
            adminService.moderateProperty(authentication.getName(), propertyId, request));
    }

    @GetMapping("/bookings")
    public ApiResponse<PageResponse<ManagerBookingResponse>> bookings(
        Authentication authentication,
        @RequestParam(required = false) UUID propertyId,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return ApiResponse.ok(managerBookingService.list(
            authentication.getName(), propertyId, status, fromDate, toDate, keyword, page, size
        ));
    }

    @GetMapping("/bookings/{bookingCode}")
    public ApiResponse<ManagerBookingResponse> booking(
        Authentication authentication,
        @PathVariable String bookingCode
    ) {
        return ApiResponse.ok(managerBookingService.detail(authentication.getName(), bookingCode));
    }

    @PatchMapping("/bookings/{bookingCode}/status")
    public ApiResponse<BookingResponse> updateBookingStatus(
        Authentication authentication,
        @PathVariable String bookingCode,
        @Valid @RequestBody UpdateBookingStatusRequest request
    ) {
        return ApiResponse.ok("Đã cập nhật trạng thái booking",
            managerBookingService.updateStatus(authentication.getName(), bookingCode, request));
    }
}
