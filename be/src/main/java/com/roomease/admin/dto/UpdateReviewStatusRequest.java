package com.roomease.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateReviewStatusRequest(
    @NotBlank
    @Pattern(regexp = "PENDING|PUBLISHED|HIDDEN")
    String status
) {
}