package com.roomease.manager.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ManagerBookingResponse(
    UUID id,
    String bookingCode,
    String status,
    String paymentStatus,
    UUID propertyId,
    String propertyName,
    String propertySlug,
    String propertyCity,
    LocalDate checkIn,
    LocalDate checkOut,
    int nights,
    int adults,
    int children,
    int roomsCount,
    BigDecimal subtotal,
    BigDecimal discountAmount,
    BigDecimal taxAmount,
    BigDecimal totalAmount,
    String currency,
    String guestFullName,
    String guestEmail,
    String guestPhone,
    String specialRequest,
    OffsetDateTime cancellationDeadline,
    OffsetDateTime createdAt,
    List<RoomItem> rooms
) {
    public record RoomItem(
        UUID id,
        UUID roomTypeId,
        UUID ratePlanId,
        String roomName,
        String ratePlanName,
        String mealPlan,
        String cancellationPolicy,
        int quantity,
        int adults,
        int children,
        BigDecimal unitPrice,
        int nights,
        BigDecimal subtotal
    ) {}
}
