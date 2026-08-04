package com.roomease.payment.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record SePayStatusResponse(
    String bookingCode,
    String bookingStatus,
    String paymentStatus,
    BigDecimal amount,
    String currency,
    String transactionRef,
    OffsetDateTime paidAt
) {
}