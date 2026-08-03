package com.roomease.manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PropertyStatusRequest(
    @NotBlank @Pattern(regexp = "DRAFT|ACTIVE|SUSPENDED|ARCHIVED") String status
) {}
