package com.roomease.manager.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ManagerRoomTypeResponse(
    UUID id,
    UUID propertyId,
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
    boolean active,
    List<ImageItem> images,
    List<String> amenityCodes,
    List<ManagerRatePlanResponse> ratePlans,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public record ImageItem(UUID id, String imageUrl, String altText, int sortOrder) {}
}
