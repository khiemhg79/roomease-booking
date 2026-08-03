package com.roomease.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateBookingStatusRequest(
    @NotBlank @Pattern(regexp = "CONFIRMED|CHECKED_IN|COMPLETED|CANCELLED|NO_SHOW") String status,
    @Size(max = 500) String note
) {
}
