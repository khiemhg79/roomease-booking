package com.roomease.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record BookingRoomRequest(
    @NotNull UUID ratePlanId,
    @Min(1) int quantity,
    @Min(1) int adults,
    @Min(0) int children
) {
}
