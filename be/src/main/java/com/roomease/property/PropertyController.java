package com.roomease.property;

import com.roomease.common.dto.ApiResponse;
import com.roomease.property.dto.FeaturedPropertyResponse;
import com.roomease.property.dto.PropertyDetailResponse;
import com.roomease.search.SearchService;
import com.roomease.search.dto.RoomOfferResponse;
import com.roomease.search.dto.SearchPageResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
public class PropertyController {
    private final PropertyService propertyService;
    private final SearchService searchService;

    @GetMapping("/amenities")
    public ApiResponse<List<com.roomease.property.dto.AmenityResponse>> amenities() {
        return ApiResponse.ok(propertyService.amenities());
    }

    @GetMapping("/featured")
    public ApiResponse<List<FeaturedPropertyResponse>> featured() {
        return ApiResponse.ok(propertyService.featured());
    }

    @GetMapping("/search")
    public ApiResponse<SearchPageResponse> search(
        @RequestParam(required = false) String destination,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
        @RequestParam(defaultValue = "2") @Min(1) int adults,
        @RequestParam(defaultValue = "0") @Min(0) int children,
        @RequestParam(defaultValue = "1") @Min(1) int rooms,
        @RequestParam(required = false) List<String> propertyTypes,
        @RequestParam(required = false) List<Integer> stars,
        @RequestParam(required = false) BigDecimal minReviewScore,
        @RequestParam(required = false) BigDecimal minPrice,
        @RequestParam(required = false) BigDecimal maxPrice,
        @RequestParam(required = false) List<String> amenities,
        @RequestParam(required = false) Boolean freeCancellation,
        @RequestParam(required = false) Boolean breakfastIncluded,
        @RequestParam(required = false) Boolean payAtProperty,
        @RequestParam(required = false) Boolean petsAllowed,
        @RequestParam(defaultValue = "recommended") String sort,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size
    ) {
        return ApiResponse.ok(searchService.search(
            destination,
            checkIn,
            checkOut,
            adults,
            children,
            rooms,
            propertyTypes,
            stars,
            minReviewScore,
            minPrice,
            maxPrice,
            amenities,
            freeCancellation,
            breakfastIncluded,
            payAtProperty,
            petsAllowed,
            sort,
            page,
            size
        ));
    }

    @GetMapping("/{slug}")
    public ApiResponse<PropertyDetailResponse> detail(
        @PathVariable String slug,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
        @RequestParam(defaultValue = "2") int adults,
        @RequestParam(defaultValue = "0") int children,
        @RequestParam(defaultValue = "1") int rooms
    ) {
        return ApiResponse.ok(
            propertyService.detail(slug, checkIn, checkOut, adults, children, rooms)
        );
    }

    @GetMapping("/{propertyId}/offers")
    public ApiResponse<List<RoomOfferResponse>> offers(
        @PathVariable UUID propertyId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
        @RequestParam(defaultValue = "2") int adults,
        @RequestParam(defaultValue = "0") int children,
        @RequestParam(defaultValue = "1") int rooms
    ) {
        propertyService.requireActive(propertyId);
        return ApiResponse.ok(
            searchService.offers(propertyId, checkIn, checkOut, adults, children, rooms)
        );
    }
}