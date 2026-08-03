package com.roomease.auth.dto;

import java.util.UUID;

public record AuthResponse(
    String accessToken,
    String tokenType,
    long expiresInMs,
    UserProfile user
) {
    public record UserProfile(UUID id, String fullName, String email, String phone, String avatarUrl, String role) {}
}
