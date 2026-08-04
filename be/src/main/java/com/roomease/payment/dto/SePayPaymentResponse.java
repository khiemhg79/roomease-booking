package com.roomease.payment.dto;

import java.math.BigDecimal;

public record SePayPaymentResponse(
    String bookingCode,
    BigDecimal amount,
    String currency,
    String bankCode,
    String accountNumber,
    String accountName,
    String transferContent,
    String qrUrl,
    String bookingStatus,
    String paymentStatus
) {
}