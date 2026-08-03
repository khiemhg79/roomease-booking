package com.roomease.property.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record FeaturedPropertyResponse(
    UUID id,
    String slug,
    String name,
    String propertyType,
    String city,
    String country,
    int starRating,
    BigDecimal reviewScore,
    int reviewCount,
    String thumbnailUrl
) {
}
