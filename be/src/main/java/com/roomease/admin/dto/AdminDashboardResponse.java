package com.roomease.admin.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record AdminDashboardResponse(
    long totalUsers,
    long customers,
    long managers,
    long blockedUsers,
    long totalProperties,
    long activeProperties,
    long pendingProperties,
    long totalBookings,
    long pendingBookings,
    long arrivalsToday,
    BigDecimal paidRevenue,
    String currency,
    List<RecentUser> recentUsers,
    List<RecentProperty> recentProperties,
    List<RecentBooking> recentBookings
) {
    public record RecentUser(UUID id, String fullName, String email, String role, String status, OffsetDateTime createdAt) {}
    public record RecentProperty(UUID id, String name, String city, String status, String ownerEmail, OffsetDateTime createdAt) {}
    public record RecentBooking(String bookingCode, String propertyName, String guestFullName, LocalDate checkIn, String status, BigDecimal totalAmount, OffsetDateTime createdAt) {}
}
