package com.roomease.manager;

import com.roomease.booking.dto.BookingResponse;
import com.roomease.booking.dto.UpdateBookingStatusRequest;
import com.roomease.common.dto.ApiResponse;
import com.roomease.common.dto.PageResponse;
import com.roomease.manager.dto.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/manager")
@RequiredArgsConstructor
public class ManagerController {
    private final ManagerService managerService;
    private final ManagerBookingService managerBookingService;

    @GetMapping("/dashboard")
    public ApiResponse<ManagerDashboardResponse> dashboard(Authentication authentication) {
        return ApiResponse.ok(managerService.dashboard(authentication.getName()));
    }

    @GetMapping("/amenities")
    public ApiResponse<List<AmenityOptionResponse>> amenities(Authentication authentication) {
        return ApiResponse.ok(managerService.amenities(authentication.getName()));
    }

    @GetMapping("/properties")
    public ApiResponse<List<ManagerPropertyResponse>> properties(Authentication authentication) {
        return ApiResponse.ok(managerService.listProperties(authentication.getName()));
    }

    @GetMapping("/properties/{propertyId}")
    public ApiResponse<ManagerPropertyResponse> property(
        Authentication authentication,
        @PathVariable UUID propertyId
    ) {
        return ApiResponse.ok(managerService.property(authentication.getName(), propertyId));
    }

    @PostMapping("/properties")
    public ApiResponse<ManagerPropertyResponse> createProperty(
        Authentication authentication,
        @Valid @RequestBody SavePropertyRequest request
    ) {
        return ApiResponse.ok(
            "Đã tạo chỗ nghỉ ở trạng thái bản nháp",
            managerService.createProperty(authentication.getName(), request)
        );
    }

    @PutMapping("/properties/{propertyId}")
    public ApiResponse<ManagerPropertyResponse> updateProperty(
        Authentication authentication,
        @PathVariable UUID propertyId,
        @Valid @RequestBody SavePropertyRequest request
    ) {
        return ApiResponse.ok(
            "Đã cập nhật chỗ nghỉ",
            managerService.updateProperty(authentication.getName(), propertyId, request)
        );
    }

    @PatchMapping("/properties/{propertyId}/status")
    public ApiResponse<ManagerPropertyResponse> updatePropertyStatus(
        Authentication authentication,
        @PathVariable UUID propertyId,
        @Valid @RequestBody PropertyStatusRequest request
    ) {
        return ApiResponse.ok(
            "Đã cập nhật trạng thái chỗ nghỉ",
            managerService.updatePropertyStatus(authentication.getName(), propertyId, request)
        );
    }

    @DeleteMapping("/properties/{propertyId}")
    public ApiResponse<Void> archiveProperty(
        Authentication authentication,
        @PathVariable UUID propertyId
    ) {
        managerService.archiveProperty(authentication.getName(), propertyId);
        return ApiResponse.ok("Đã lưu trữ chỗ nghỉ", null);
    }

    @GetMapping("/properties/{propertyId}/rooms")
    public ApiResponse<List<ManagerRoomTypeResponse>> rooms(
        Authentication authentication,
        @PathVariable UUID propertyId
    ) {
        return ApiResponse.ok(managerService.rooms(authentication.getName(), propertyId));
    }

    @PostMapping("/properties/{propertyId}/rooms")
    public ApiResponse<ManagerRoomTypeResponse> createRoom(
        Authentication authentication,
        @PathVariable UUID propertyId,
        @Valid @RequestBody SaveRoomTypeRequest request
    ) {
        return ApiResponse.ok(
            "Đã tạo loại phòng",
            managerService.createRoom(authentication.getName(), propertyId, request)
        );
    }

    @PutMapping("/rooms/{roomTypeId}")
    public ApiResponse<ManagerRoomTypeResponse> updateRoom(
        Authentication authentication,
        @PathVariable UUID roomTypeId,
        @Valid @RequestBody SaveRoomTypeRequest request
    ) {
        return ApiResponse.ok(
            "Đã cập nhật loại phòng",
            managerService.updateRoom(authentication.getName(), roomTypeId, request)
        );
    }

    @PatchMapping("/rooms/{roomTypeId}/active")
    public ApiResponse<ManagerRoomTypeResponse> setRoomActive(
        Authentication authentication,
        @PathVariable UUID roomTypeId,
        @RequestBody ActiveRequest request
    ) {
        return ApiResponse.ok(managerService.setRoomActive(authentication.getName(), roomTypeId, request));
    }

    @GetMapping("/rooms/{roomTypeId}/rate-plans")
    public ApiResponse<List<ManagerRatePlanResponse>> ratePlans(
        Authentication authentication,
        @PathVariable UUID roomTypeId
    ) {
        return ApiResponse.ok(managerService.ratePlans(authentication.getName(), roomTypeId));
    }

    @PostMapping("/rooms/{roomTypeId}/rate-plans")
    public ApiResponse<ManagerRatePlanResponse> createRatePlan(
        Authentication authentication,
        @PathVariable UUID roomTypeId,
        @Valid @RequestBody SaveRatePlanRequest request
    ) {
        return ApiResponse.ok(
            "Đã tạo gói giá",
            managerService.createRatePlan(authentication.getName(), roomTypeId, request)
        );
    }

    @PutMapping("/rate-plans/{ratePlanId}")
    public ApiResponse<ManagerRatePlanResponse> updateRatePlan(
        Authentication authentication,
        @PathVariable UUID ratePlanId,
        @Valid @RequestBody SaveRatePlanRequest request
    ) {
        return ApiResponse.ok(
            "Đã cập nhật gói giá",
            managerService.updateRatePlan(authentication.getName(), ratePlanId, request)
        );
    }

    @PatchMapping("/rate-plans/{ratePlanId}/active")
    public ApiResponse<ManagerRatePlanResponse> setRatePlanActive(
        Authentication authentication,
        @PathVariable UUID ratePlanId,
        @RequestBody ActiveRequest request
    ) {
        return ApiResponse.ok(managerService.setRatePlanActive(authentication.getName(), ratePlanId, request));
    }

    @GetMapping("/calendar")
    public ApiResponse<ManagerCalendarResponse> calendar(
        Authentication authentication,
        @RequestParam UUID propertyId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return ApiResponse.ok(managerService.calendar(authentication.getName(), propertyId, fromDate, toDate));
    }

    @PutMapping("/calendar")
    public ApiResponse<Void> updateCalendar(
        Authentication authentication,
        @Valid @RequestBody CalendarBulkUpdateRequest request
    ) {
        managerService.updateCalendar(authentication.getName(), request);
        return ApiResponse.ok("Đã cập nhật giá và tồn phòng", null);
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
            authentication.getName(), propertyId, status, fromDate, toDate, keyword, page, size));
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
        return ApiResponse.ok(
            "Đã cập nhật trạng thái booking",
            managerBookingService.updateStatus(authentication.getName(), bookingCode, request)
        );
    }
}
