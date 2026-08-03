package com.roomease.search.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record SearchPropertyResponse(
    UUID id,
    String slug,
    String name,
    String propertyType,
    String address,
    String city,
    String country,
    Integer starRating,
    BigDecimal reviewScore,
    Integer reviewCount,
    String thumbnailUrl,
    List<String> amenities,
    BigDecimal minNightlyPrice,
    BigDecimal minTotalPrice,
    String currency,
    boolean freeCancellation,
    boolean breakfastIncluded,
    int availableRooms
) {
}
