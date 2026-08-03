package com.roomease.manager.dto;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ManagerPropertyResponse(
    UUID id,
    UUID ownerId,
    String name,
    String slug,
    String propertyType,
    String description,
    String addressLine,
    String ward,
    String district,
    String city,
    String province,
    String country,
    String postalCode,
    BigDecimal latitude,
    BigDecimal longitude,
    int starRating,
    BigDecimal reviewScore,
    int reviewCount,
    LocalTime checkInFrom,
    LocalTime checkInUntil,
    LocalTime checkOutFrom,
    LocalTime checkOutUntil,
    String status,
    boolean featured,
    List<ImageItem> images,
    List<String> amenityCodes,
    Policy policy,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public record ImageItem(UUID id, String imageUrl, String altText, int sortOrder, boolean cover) {}

    public record Policy(
        boolean childrenAllowed,
        String petsPolicy,
        String smokingPolicy,
        boolean partiesAllowed,
        LocalTime quietHoursFrom,
        LocalTime quietHoursUntil,
        Integer ageRestriction,
        String extraBedPolicy,
        String importantInformation
    ) {}
}
