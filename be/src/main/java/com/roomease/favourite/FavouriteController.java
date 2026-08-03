package com.roomease.favourite;

import com.roomease.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/favourites")
@RequiredArgsConstructor
public class FavouriteController {
    private final FavouriteService favouriteService;

    @GetMapping
    public ApiResponse<List<FavouriteResponse>> list(Authentication auth) {
        return ApiResponse.ok(favouriteService.list(auth.getName()));
    }

    @PostMapping("/{propertyId}/toggle")
    public ApiResponse<Map<String, Boolean>> toggle(Authentication auth, @PathVariable UUID propertyId) {
        return ApiResponse.ok(Map.of("favourite", favouriteService.toggle(auth.getName(), propertyId)));
    }
}
