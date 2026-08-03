package com.roomease.property.dto;

import com.roomease.search.dto.RoomOfferResponse;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record PropertyDetailResponse(
    UUID id,
    String slug,
    String name,
    String propertyType,
    String description,
    String addressLine,
    String ward,
    String district,
    String city,
    String province,
    String country,
    BigDecimal latitude,
    BigDecimal longitude,
    int starRating,
    BigDecimal reviewScore,
    int reviewCount,
    LocalTime checkInFrom,
    LocalTime checkInUntil,
    LocalTime checkOutFrom,
    LocalTime checkOutUntil,
    List<ImageResponse> images,
    List<AmenityResponse> amenities,
    PolicyResponse policies,
    List<RoomOfferResponse> offers
) {
}
