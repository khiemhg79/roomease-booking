package com.roomease.admin.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record AdminUserDetailResponse(
    UUID id,
    String fullName,
    String email,
    String phone,
    String avatarUrl,
    boolean emailVerified,
    String role,
    String status,
    long propertyCount,
    long bookingCount,
    BigDecimal recentBookingValue,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    List<RecentBooking> recentBookings
) {
    public record RecentBooking(
        String bookingCode,
        String propertyName,
        LocalDate checkIn,
        LocalDate checkOut,
        String status,
        String paymentStatus,
        BigDecimal totalAmount,
        String currency,
        OffsetDateTime createdAt
    ) {
    }
}