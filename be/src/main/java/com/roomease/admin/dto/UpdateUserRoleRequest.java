package com.roomease.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateUserRoleRequest(
    @NotBlank @Pattern(regexp = "CUSTOMER|HOTEL_MANAGER|ADMIN") String role
) {
}
