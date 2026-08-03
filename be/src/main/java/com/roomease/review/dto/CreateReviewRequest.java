package com.roomease.review.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateReviewRequest(
    @NotNull UUID bookingId,
    @NotNull @DecimalMin("1.0") @DecimalMax("10.0") BigDecimal score,
    @Size(max = 180) String title,
    @Size(max = 5000) String content,
    @DecimalMin("1.0") @DecimalMax("10.0") BigDecimal staffScore,
    @DecimalMin("1.0") @DecimalMax("10.0") BigDecimal cleanlinessScore,
    @DecimalMin("1.0") @DecimalMax("10.0") BigDecimal locationScore,
    @DecimalMin("1.0") @DecimalMax("10.0") BigDecimal comfortScore,
    @DecimalMin("1.0") @DecimalMax("10.0") BigDecimal valueScore
) {}
