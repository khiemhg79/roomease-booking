package com.roomease.favourite;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record FavouriteResponse(
    UUID propertyId,
    String slug,
    String name,
    String city,
    String country,
    BigDecimal reviewScore,
    int reviewCount,
    String thumbnailUrl,
    OffsetDateTime addedAt
) {}
