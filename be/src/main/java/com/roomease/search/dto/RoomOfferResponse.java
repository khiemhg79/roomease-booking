package com.roomease.search.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record RoomOfferResponse(
    UUID roomTypeId,
    UUID ratePlanId,
    String roomName,
    String roomDescription,
    BigDecimal roomSizeSqm,
    String bedSummary,
    String viewName,
    int maxAdults,
    int maxChildren,
    int maxGuests,
    String imageUrl,
    List<String> roomAmenities,
    String ratePlanName,
    String mealPlan,
    String cancellationType,
    int cancellationDays,
    boolean refundable,
    boolean payAtProperty,
    String rateDescription,
    BigDecimal averageNightlyPrice,
    BigDecimal totalPrice,
    BigDecimal originalTotalPrice,
    String currency,
    int availableRooms
) {
}
