package com.roomease.admin.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminPropertyResponse(
    UUID id,
    String name,
    String slug,
    String propertyType,
    String city,
    String country,
    int starRating,
    BigDecimal reviewScore,
    int reviewCount,
    String status,
    boolean featured,
    UUID ownerId,
    String ownerName,
    String ownerEmail,
    long roomTypeCount,
    long bookingCount,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
