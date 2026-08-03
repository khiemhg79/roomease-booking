package com.roomease.admin.dto;

import jakarta.validation.constraints.Pattern;

import java.util.UUID;

public record ModeratePropertyRequest(
    @Pattern(regexp = "DRAFT|ACTIVE|SUSPENDED|ARCHIVED") String status,
    Boolean featured,
    UUID ownerId,
    boolean clearOwner
) {
}
