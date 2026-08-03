package com.roomease.admin.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminUserResponse(
    UUID id,
    String fullName,
    String email,
    String phone,
    String avatarUrl,
    boolean emailVerified,
    String role,
    String status,
    long propertyCount,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
