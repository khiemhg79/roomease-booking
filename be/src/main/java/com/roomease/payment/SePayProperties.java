package com.roomease.payment;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.sepay")
public class SePayProperties {
    private String webhookSecret;
    private String bankCode = "TPBank";
    private String accountNumber;
    private String accountName;
    private String qrTemplate = "compact";
    private String storeName = "RoomEase";
    private String memoPrefix = "";
    private long maxTimestampDriftSeconds = 300;

    public String getWebhookSecret() {
        return webhookSecret;
    }

    public void setWebhookSecret(String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(String bankCode) {
        this.bankCode = bankCode;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public String getQrTemplate() {
        return qrTemplate;
    }

    public void setQrTemplate(String qrTemplate) {
        this.qrTemplate = qrTemplate;
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public String getMemoPrefix() {
        return memoPrefix;
    }

    public void setMemoPrefix(String memoPrefix) {
        this.memoPrefix = memoPrefix;
    }

    public long getMaxTimestampDriftSeconds() {
        return maxTimestampDriftSeconds;
    }

    public void setMaxTimestampDriftSeconds(long maxTimestampDriftSeconds) {
        this.maxTimestampDriftSeconds = maxTimestampDriftSeconds;
    }
}