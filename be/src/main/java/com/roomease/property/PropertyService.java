package com.roomease.property;

import com.roomease.common.exception.NotFoundException;
import com.roomease.property.dto.*;
import com.roomease.property.repo.*;
import com.roomease.search.SearchService;
import com.roomease.search.dto.RoomOfferResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PropertyService {
    private final PropertyRepository propertyRepository;
    private final PropertyImageRepository imageRepository;
    private final AmenityRepository amenityRepository;
    private final PropertyPolicyRepository policyRepository;
    private final SearchService searchService;

    public List<FeaturedPropertyResponse> featured() {
        return propertyRepository.findTop8ByStatusAndFeaturedTrueOrderByReviewScoreDesc(PropertyStatus.ACTIVE)
            .stream().map(p -> {
                String thumbnail = imageRepository.findByPropertyIdOrderByCoverDescSortOrderAsc(p.getId())
                    .stream().findFirst().map(PropertyImage::getImageUrl).orElse("");
                return new FeaturedPropertyResponse(p.getId(), p.getSlug(), p.getName(), p.getPropertyType().name(),
                    p.getCity(), p.getCountry(), p.getStarRating(), p.getReviewScore(), p.getReviewCount(), thumbnail);
            }).toList();
    }

    public PropertyDetailResponse detail(String slug, LocalDate checkIn, LocalDate checkOut,
                                         int adults, int children, int rooms) {
        Property p = propertyRepository.findBySlugAndStatus(slug, PropertyStatus.ACTIVE)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy chỗ nghỉ"));

        List<ImageResponse> images = imageRepository.findByPropertyIdOrderByCoverDescSortOrderAsc(p.getId()).stream()
            .map(i -> new ImageResponse(i.getId(), i.getImageUrl(), i.getAltText(), i.getSortOrder(), i.isCover()))
            .toList();
        List<AmenityResponse> amenities = amenityRepository.findPropertyAmenities(p.getId()).stream()
            .map(a -> new AmenityResponse(a.getId(), a.getCode(), a.getName(), a.getCategory(), a.getIcon()))
            .toList();
        PolicyResponse policy = policyRepository.findById(p.getId()).map(x -> new PolicyResponse(
            x.isChildrenAllowed(), x.getPetsPolicy(), x.getSmokingPolicy(), x.isPartiesAllowed(),
            x.getQuietHoursFrom(), x.getQuietHoursUntil(), x.getAgeRestriction(), x.getExtraBedPolicy(),
            x.getImportantInformation())).orElse(null);
        List<RoomOfferResponse> offers = checkIn == null || checkOut == null
            ? List.of() : searchService.offers(p.getId(), checkIn, checkOut, adults, children, rooms);

        return new PropertyDetailResponse(p.getId(), p.getSlug(), p.getName(), p.getPropertyType().name(),
            p.getDescription(), p.getAddressLine(), p.getWard(), p.getDistrict(), p.getCity(), p.getProvince(),
            p.getCountry(), p.getLatitude(), p.getLongitude(), p.getStarRating(), p.getReviewScore(),
            p.getReviewCount(), p.getCheckInFrom(), p.getCheckInUntil(), p.getCheckOutFrom(), p.getCheckOutUntil(),
            images, amenities, policy, offers);
    }

    public Property requireActive(UUID id) {
        return propertyRepository.findByIdAndStatus(id, PropertyStatus.ACTIVE)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy chỗ nghỉ"));
    }
}
