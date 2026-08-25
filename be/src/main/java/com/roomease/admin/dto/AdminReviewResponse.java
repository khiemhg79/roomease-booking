package com.roomease.admin.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminReviewResponse(
    UUID id,
    UUID bookingId,
    String bookingCode,
    UUID propertyId,
    String propertyName,
    UUID userId,
    String userName,
    String userEmail,
    BigDecimal score,
    String title,
    String content,
    BigDecimal staffScore,
    BigDecimal cleanlinessScore,
    BigDecimal locationScore,
    BigDecimal comfortScore,
    BigDecimal valueScore,
    String status,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}