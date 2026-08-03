package com.roomease.review;

import com.roomease.common.dto.ApiResponse;
import com.roomease.common.dto.PageResponse;
import com.roomease.review.dto.CreateReviewRequest;
import com.roomease.review.dto.ReviewResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    @GetMapping("/property/{propertyId}")
    public ApiResponse<PageResponse<ReviewResponse>> list(
        @PathVariable UUID propertyId,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size
    ) {
        return ApiResponse.ok(reviewService.list(propertyId, page, size));
    }

    @PostMapping
    public ApiResponse<ReviewResponse> create(Authentication auth, @Valid @RequestBody CreateReviewRequest request) {
        return ApiResponse.ok("Cảm ơn bạn đã đánh giá", reviewService.create(auth.getName(), request));
    }
}
