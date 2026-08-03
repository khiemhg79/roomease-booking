package com.roomease.manager.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CalendarBulkUpdateRequest(
    @NotNull UUID roomTypeId,
    @NotNull UUID ratePlanId,
    @NotNull LocalDate fromDate,
    @NotNull LocalDate toDate,
    @Min(0) int allotment,
    @Min(1) int minStay,
    Integer maxStay,
    boolean stopSell,
    boolean closedToArrival,
    boolean closedToDeparture,
    @NotNull @DecimalMin("1.0") BigDecimal price,
    @DecimalMin("1.0") BigDecimal originalPrice,
    @NotBlank @Pattern(regexp = "[A-Z]{3}") String currency,
    boolean rateAvailable
) {}
