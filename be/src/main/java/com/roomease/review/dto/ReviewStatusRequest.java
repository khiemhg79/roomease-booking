package com.roomease.review.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record ReviewStatusRequest(
    @NotEmpty
    @Size(max = 100)
    List<UUID> bookingIds
) {
}