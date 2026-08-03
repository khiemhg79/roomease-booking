package com.roomease.booking.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record BookingRoomResponse(
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
) {
}
