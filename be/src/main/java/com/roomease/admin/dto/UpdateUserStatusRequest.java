package com.roomease.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateUserStatusRequest(
    @NotBlank @Pattern(regexp = "ACTIVE|BLOCKED|PENDING") String status
) {
}
