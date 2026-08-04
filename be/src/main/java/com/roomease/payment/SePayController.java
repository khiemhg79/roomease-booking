package com.roomease.payment;

import com.roomease.common.dto.ApiResponse;
import com.roomease.payment.dto.SePayPaymentResponse;
import com.roomease.payment.dto.SePayStatusResponse;
import com.roomease.payment.dto.SePayWebhookRequest;
import com.roomease.payment.dto.SePayWebhookResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/v1/payments/sepay")
@RequiredArgsConstructor
public class SePayController {
    private final SePayService sePayService;

    @PostMapping("/{bookingCode}/prepare")
    public ApiResponse<SePayPaymentResponse> prepare(
        Authentication authentication,
        @PathVariable String bookingCode
    ) {
        return ApiResponse.ok(
            sePayService.preparePayment(authentication.getName(), bookingCode)
        );
    }

    @GetMapping("/{bookingCode}/status")
    public ApiResponse<SePayStatusResponse> status(
        Authentication authentication,
        @PathVariable String bookingCode
    ) {
        return ApiResponse.ok(
            sePayService.paymentStatus(authentication.getName(), bookingCode)
        );
    }

    @PostMapping(
        value = "/webhook",
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ApiResponse<SePayWebhookResult> webhook(
        @RequestHeader(value = "X-SePay-Signature", required = false)
        String signature,

        @RequestHeader(value = "X-SePay-Timestamp", required = false)
        String timestamp,

        @RequestBody byte[] rawBody
    ) {
        SePayWebhookRequest request =
            sePayService.verifyAndParseWebhook(signature, timestamp, rawBody);

        SePayWebhookResult result = sePayService.processWebhook(
            request,
            new String(rawBody, StandardCharsets.UTF_8)
        );

        return ApiResponse.ok(result);
    }
}