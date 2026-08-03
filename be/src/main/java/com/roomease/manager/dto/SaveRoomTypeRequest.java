package com.roomease.manager.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public record SaveRoomTypeRequest(
    @NotBlank @Size(max = 60) String code,
    @NotBlank @Size(max = 160) String name,
    @Size(max = 5000) String description,
    @DecimalMin("1.0") BigDecimal roomSizeSqm,
    @Min(1) int maxAdults,
    @Min(0) int maxChildren,
    @Min(1) int maxGuests,
    @Min(1) int totalRooms,
    @NotBlank @Size(max = 255) String bedSummary,
    @Min(1) int bathroomCount,
    @Size(max = 120) String viewName,
    boolean smokingAllowed,
    boolean active,
    List<@Valid ImageInput> images,
    List<@NotBlank String> amenityCodes
) {
    public record ImageInput(
        @NotBlank @Size(max = 1000) String imageUrl,
        @Size(max = 255) String altText,
        @Min(0) int sortOrder
    ) {}
}
