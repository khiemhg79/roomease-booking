package com.roomease.manager.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record ManagerDashboardResponse(
    long propertyCount,
    long activePropertyCount,
    long roomTypeCount,
    long totalBookings,
    long pendingBookings,
    long arrivalsToday,
    long departuresToday,
    BigDecimal revenueThisMonth,
    String currency,
    List<RevenuePoint> revenueLast14Days,
    List<StatusCount> bookingStatus,
    List<RecentBooking> recentBookings
) {
    public record RevenuePoint(LocalDate date, BigDecimal revenue, long bookings) {}

    public record StatusCount(String status, long count) {}

    public record RecentBooking(
        String bookingCode,
        String propertyName,
        String guestFullName,
        LocalDate checkIn,
        LocalDate checkOut,
        String status,
        BigDecimal totalAmount,
        String currency,
        OffsetDateTime createdAt
    ) {}
}
