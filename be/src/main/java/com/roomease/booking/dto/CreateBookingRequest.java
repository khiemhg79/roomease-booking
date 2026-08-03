package com.roomease.booking.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateBookingRequest(
    @NotNull UUID propertyId,
    @NotNull @FutureOrPresent LocalDate checkIn,
    @NotNull LocalDate checkOut,
    @NotEmpty List<@Valid BookingRoomRequest> rooms,
    @NotBlank @Size(max = 160) String guestFullName,
    @NotBlank @Email @Size(max = 180) String guestEmail,
    @NotBlank @Size(max = 30) String guestPhone,
    @Size(max = 1500) String specialRequest,
    @NotBlank @Pattern(regexp = "PAY_AT_PROPERTY|CARD|BANK_TRANSFER") String paymentMethod
) {
}
