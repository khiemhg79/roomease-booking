package com.roomease.review.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ReviewResponse(
    UUID id,
    UUID propertyId,
    UUID userId,
    String userName,
    BigDecimal score,
    String title,
    String content,
    BigDecimal staffScore,
    BigDecimal cleanlinessScore,
    BigDecimal locationScore,
    BigDecimal comfortScore,
    BigDecimal valueScore,
    OffsetDateTime createdAt
) {}
