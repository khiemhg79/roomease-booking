package com.roomease.review.dto;

import java.util.List;
import java.util.UUID;

public record ReviewStatusResponse(
    List<UUID> reviewedBookingIds
) {
}