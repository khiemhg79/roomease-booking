package com.roomease.search;

import com.roomease.common.exception.BadRequestException;
import com.roomease.search.dto.RoomOfferResponse;
import com.roomease.search.dto.SearchPageResponse;
import com.roomease.search.repo.PropertySearchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SearchService {
    private final PropertySearchRepository repository;

    public SearchPageResponse search(
        String destination,
        LocalDate checkIn,
        LocalDate checkOut,
        int adults,
        int children,
        int rooms,
        List<String> propertyTypes,
        List<Integer> stars,
        BigDecimal minReviewScore,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        List<String> amenities,
        Boolean freeCancellation,
        Boolean breakfastIncluded,
        Boolean payAtProperty,
        Boolean petsAllowed,
        String sort,
        int page,
        int size
    ) {
        validateStay(checkIn, checkOut, adults, children, rooms);

        if (page < 0) {
            throw new BadRequestException("Trang phải lớn hơn hoặc bằng 0");
        }
        if (size < 1 || size > 50) {
            throw new BadRequestException("Kích thước trang phải từ 1 đến 50");
        }
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new BadRequestException("Giá tối thiểu không được lớn hơn giá tối đa");
        }

        return repository.search(
            destination,
            checkIn,
            checkOut,
            adults,
            children,
            rooms,
            normalize(propertyTypes),
            stars,
            minReviewScore,
            minPrice,
            maxPrice,
            normalize(amenities),
            freeCancellation,
            breakfastIncluded,
            payAtProperty,
            petsAllowed,
            sort,
            page,
            size
        );
    }

    public List<RoomOfferResponse> offers(
        UUID propertyId,
        LocalDate checkIn,
        LocalDate checkOut,
        int adults,
        int children,
        int rooms
    ) {
        validateStay(checkIn, checkOut, adults, children, rooms);
        return repository.findOffers(propertyId, checkIn, checkOut, adults, children, rooms);
    }

    public void validateStay(
        LocalDate checkIn,
        LocalDate checkOut,
        int adults,
        int children,
        int rooms
    ) {
        if (checkIn == null || checkOut == null) {
            throw new BadRequestException("Cần chọn ngày nhận và trả phòng");
        }
        if (checkIn.isBefore(LocalDate.now())) {
            throw new BadRequestException("Ngày nhận phòng không được ở quá khứ");
        }

        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nights < 1 || nights > 30) {
            throw new BadRequestException("Thời gian lưu trú phải từ 1 đến 30 đêm");
        }
        if (adults < 1 || adults > 30) {
            throw new BadRequestException("Số người lớn không hợp lệ");
        }
        if (children < 0 || children > 20) {
            throw new BadRequestException("Số trẻ em không hợp lệ");
        }
        if (rooms < 1 || rooms > 10) {
            throw new BadRequestException("Số phòng phải từ 1 đến 10");
        }
    }

    private List<String> normalize(List<String> values) {
        if (values == null) {
            return List.of();
        }

        return values.stream()
            .filter(value -> value != null && !value.isBlank())
            .map(String::trim)
            .map(String::toUpperCase)
            .distinct()
            .toList();
    }
}