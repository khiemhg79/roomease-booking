package com.roomease.search.dto;

import java.util.List;

public record SearchPageResponse(
    List<SearchPropertyResponse> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {
}
