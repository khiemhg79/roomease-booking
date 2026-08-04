package com.roomease.payment.dto;

public record SePayWebhookResult(
    boolean processed,
    String message,
    String bookingCode
) {
    public static SePayWebhookResult processed(String bookingCode) {
        return new SePayWebhookResult(true, "Đã xác nhận thanh toán", bookingCode);
    }

    public static SePayWebhookResult ignored(String message) {
        return new SePayWebhookResult(false, message, null);
    }
}