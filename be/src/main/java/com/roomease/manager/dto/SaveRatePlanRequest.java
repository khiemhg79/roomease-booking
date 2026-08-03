package com.roomease.manager.dto;

import jakarta.validation.constraints.*;

public record SaveRatePlanRequest(
    @NotBlank @Size(max = 60) String code,
    @NotBlank @Size(max = 160) String name,
    @NotBlank @Pattern(regexp = "ROOM_ONLY|BREAKFAST_INCLUDED|HALF_BOARD|FULL_BOARD|ALL_INCLUSIVE") String mealPlan,
    @NotBlank @Pattern(regexp = "FREE_UNTIL_DAYS|NON_REFUNDABLE|FLEXIBLE") String cancellationType,
    @Min(0) int cancellationDays,
    @NotBlank @Pattern(regexp = "NONE|FULL|FIRST_NIGHT|PERCENTAGE") String prepaymentType,
    boolean refundable,
    boolean payAtProperty,
    @Size(max = 3000) String description,
    boolean active
) {}
