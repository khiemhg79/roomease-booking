package com.roomease.admin.dto;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record AdminPropertyDetailResponse(
    UUID id,
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
    int starRating,
    BigDecimal reviewScore,
    int reviewCount,
    LocalTime checkInFrom,
    LocalTime checkInUntil,
    LocalTime checkOutFrom,
    LocalTime checkOutUntil,
    String status,
    boolean featured,
    UUID ownerId,
    String ownerName,
    String ownerEmail,
    long bookingCount,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    List<RoomItem> rooms
) {
    public record RoomItem(
        UUID id,
        String code,
        String name,
        String description,
        BigDecimal roomSizeSqm,
        int maxAdults,
        int maxChildren,
        int maxGuests,
        int totalRooms,
        String bedSummary,
        int bathroomCount,
        String viewName,
        boolean smokingAllowed,
        boolean active
    ) {
    }
}