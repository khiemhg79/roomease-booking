package com.roomease.auth;

public record GoogleIdentity(
    String subject,
    String email,
    boolean emailVerified,
    String fullName,
    String avatarUrl
) {
}
