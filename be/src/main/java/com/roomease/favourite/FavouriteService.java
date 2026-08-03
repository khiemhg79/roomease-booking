package com.roomease.favourite;

import com.roomease.common.exception.NotFoundException;
import com.roomease.property.Property;
import com.roomease.property.PropertyImage;
import com.roomease.property.PropertyStatus;
import com.roomease.property.repo.PropertyImageRepository;
import com.roomease.property.repo.PropertyRepository;
import com.roomease.user.User;
import com.roomease.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FavouriteService {
    private final FavouriteRepository favouriteRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final PropertyImageRepository imageRepository;

    @Transactional
    public boolean toggle(String email, UUID propertyId) {
        User user = requireUser(email);
        propertyRepository.findByIdAndStatus(propertyId, PropertyStatus.ACTIVE)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy chỗ nghỉ"));
        FavouriteId id = new FavouriteId(user.getId(), propertyId);
        if (favouriteRepository.existsById(id)) {
            favouriteRepository.deleteById(id);
            return false;
        }
        favouriteRepository.save(Favourite.builder().id(id).createdAt(OffsetDateTime.now()).build());
        return true;
    }

    @Transactional(readOnly = true)
    public List<FavouriteResponse> list(String email) {
        User user = requireUser(email);
        return favouriteRepository.findById_UserIdOrderByCreatedAtDesc(user.getId()).stream().map(f -> {
            Property p = propertyRepository.findById(f.getId().getPropertyId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy chỗ nghỉ"));
            String image = imageRepository.findByPropertyIdOrderByCoverDescSortOrderAsc(p.getId()).stream()
                .findFirst().map(PropertyImage::getImageUrl).orElse("");
            return new FavouriteResponse(p.getId(), p.getSlug(), p.getName(), p.getCity(), p.getCountry(),
                p.getReviewScore(), p.getReviewCount(), image, f.getCreatedAt());
        }).toList();
    }

    private User requireUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));
    }
}
