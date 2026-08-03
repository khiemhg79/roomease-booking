package com.roomease.manager.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

public record SavePropertyRequest(
    @NotBlank @Size(max = 200) String name,
    @NotBlank @Pattern(regexp = "HOTEL|APARTMENT|RESORT|VILLA|HOSTEL|HOMESTAY") String propertyType,
    @Size(max = 10000) String description,
    @NotBlank @Size(max = 255) String addressLine,
    @Size(max = 120) String ward,
    @Size(max = 120) String district,
    @NotBlank @Size(max = 120) String city,
    @Size(max = 120) String province,
    @NotBlank @Size(max = 100) String country,
    @Size(max = 30) String postalCode,
    BigDecimal latitude,
    BigDecimal longitude,
    @Min(0) @Max(5) int starRating,
    LocalTime checkInFrom,
    LocalTime checkInUntil,
    LocalTime checkOutFrom,
    LocalTime checkOutUntil,
    boolean featured,
    List<@Valid ImageInput> images,
    List<@NotBlank String> amenityCodes,
    @Valid PolicyInput policy
) {
    public record ImageInput(
        @NotBlank @Size(max = 1000) String imageUrl,
        @Size(max = 255) String altText,
        @Min(0) int sortOrder,
        boolean cover
    ) {}

    public record PolicyInput(
        boolean childrenAllowed,
        @NotBlank @Pattern(regexp = "ALLOWED|ON_REQUEST|NOT_ALLOWED") String petsPolicy,
        @NotBlank @Pattern(regexp = "NON_SMOKING|DESIGNATED_AREAS|ALLOWED") String smokingPolicy,
        boolean partiesAllowed,
        LocalTime quietHoursFrom,
        LocalTime quietHoursUntil,
        @Min(0) @Max(99) Integer ageRestriction,
        @Size(max = 3000) String extraBedPolicy,
        @Size(max = 5000) String importantInformation
    ) {}
}
