package com.roomease.common.dto;

import java.time.OffsetDateTime;
import java.util.Map;

public record ApiError(
    boolean success,
    String code,
    String message,
    Map<String, String> fieldErrors,
    OffsetDateTime timestamp
) {
}
