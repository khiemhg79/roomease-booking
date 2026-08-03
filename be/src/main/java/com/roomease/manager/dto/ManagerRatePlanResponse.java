package com.roomease.manager.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ManagerRatePlanResponse(
    UUID id,
    UUID roomTypeId,
    String code,
    String name,
    String mealPlan,
    String cancellationType,
    int cancellationDays,
    String prepaymentType,
    boolean refundable,
    boolean payAtProperty,
    String description,
    boolean active,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
