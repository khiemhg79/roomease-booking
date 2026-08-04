package com.roomease.payment;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.sepay")
public class SePayProperties {

    private String webhookSecret = "";
    private String bankCode = "TPBank";
    private String accountNumber = "00004005537";
    private String accountName = "HOANG GIA KHIEM";
    private String qrTemplate = "compact";
    private String storeName = "RoomEase";
    private String memoPrefix = "";
    private long maxTimestampDriftSeconds = 300;

    public String getWebhookSecret() {
        return webhookSecret;
    }

    public void setWebhookSecret(String webhookSecret) {
        this.webhookSecret = normalize(webhookSecret);
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(String bankCode) {
        String value = normalize(bankCode);
        this.bankCode = value.isBlank() ? "TPBank" : value;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        String value = normalize(accountNumber)
            .replaceAll("\\s+", "");

        this.accountNumber = value.isBlank()
            ? "00004005537"
            : value;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        String value = normalize(accountName);

        this.accountName = value.isBlank()
            ? "HOANG GIA KHIEM"
            : value;
    }

    public String getQrTemplate() {
        return qrTemplate;
    }

    public void setQrTemplate(String qrTemplate) {
        String value = normalize(qrTemplate);
        this.qrTemplate = value.isBlank() ? "compact" : value;
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        String value = normalize(storeName);
        this.storeName = value.isBlank() ? "RoomEase" : value;
    }

    public String getMemoPrefix() {
        return memoPrefix;
    }

    public void setMemoPrefix(String memoPrefix) {
        this.memoPrefix = normalize(memoPrefix);
    }

    public long getMaxTimestampDriftSeconds() {
        return maxTimestampDriftSeconds;
    }

    public void setMaxTimestampDriftSeconds(
        long maxTimestampDriftSeconds
    ) {
        this.maxTimestampDriftSeconds =
            maxTimestampDriftSeconds > 0
                ? maxTimestampDriftSeconds
                : 300;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}