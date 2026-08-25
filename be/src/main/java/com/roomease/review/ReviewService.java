package com.roomease.review;

import com.roomease.booking.Booking;
import com.roomease.booking.BookingStatus;
import com.roomease.booking.repo.BookingRepository;
import com.roomease.common.dto.PageResponse;
import com.roomease.common.exception.ConflictException;
import com.roomease.common.exception.ForbiddenException;
import com.roomease.common.exception.NotFoundException;
import com.roomease.property.Property;
import com.roomease.property.repo.PropertyRepository;
import com.roomease.review.dto.CreateReviewRequest;
import com.roomease.review.dto.ReviewResponse;
import com.roomease.review.dto.ReviewStatusRequest;
import com.roomease.review.dto.ReviewStatusResponse;
import com.roomease.user.User;
import com.roomease.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final String PUBLISHED = "PUBLISHED";

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewResponse create(
        String email,
        CreateReviewRequest request
    ) {
        User user = requireUser(email);

        Booking booking =
            bookingRepository.findById(request.bookingId())
                .orElseThrow(
                    () -> new NotFoundException(
                        "Không tìm thấy booking"
                    )
                );

        if (
            booking.getUser() == null
            || !booking.getUser().getId().equals(user.getId())
        ) {
            throw new ForbiddenException(
                "Bạn không thể đánh giá booking này"
            );
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new ConflictException(
                "Chỉ có thể đánh giá sau khi hoàn tất kỳ nghỉ"
            );
        }

        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new ConflictException(
                "Booking này đã được đánh giá"
            );
        }

        Review review = Review.builder()
            .bookingId(booking.getId())
            .propertyId(booking.getProperty().getId())
            .userId(user.getId())
            .score(request.score())
            .title(blankToNull(request.title()))
            .content(blankToNull(request.content()))
            .staffScore(request.staffScore())
            .cleanlinessScore(request.cleanlinessScore())
            .locationScore(request.locationScore())
            .comfortScore(request.comfortScore())
            .valueScore(request.valueScore())
            .status(PUBLISHED)
            .build();

        Review saved =
            reviewRepository.save(review);

        /*
         * Đồng bộ điểm hiển thị trên Property ngay khi review được đăng.
         * Không thay đổi booking/payment/inventory.
         */
        refreshPropertyRating(
            booking.getProperty().getId()
        );

        return map(
            saved,
            user.getFullName()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> list(
        UUID propertyId,
        int page,
        int size
    ) {
        Page<ReviewResponse> reviews =
            reviewRepository
                .findByPropertyIdAndStatusOrderByCreatedAtDesc(
                    propertyId,
                    PUBLISHED,
                    PageRequest.of(page, size)
                )
                .map(review ->
                    map(
                        review,
                        userRepository
                            .findById(review.getUserId())
                            .map(User::getFullName)
                            .orElse("Khách đã lưu trú")
                    )
                );

        return PageResponse.from(reviews);
    }

    /*
     * FE dùng endpoint này để biết chính xác booking nào đã review.
     * Không còn phụ thuộc localStorage của một trình duyệt.
     */
    @Transactional(readOnly = true)
    public ReviewStatusResponse status(
        String email,
        ReviewStatusRequest request
    ) {
        User user = requireUser(email);

        List<UUID> bookingIds =
            request.bookingIds()
                .stream()
                .distinct()
                .toList();

        if (bookingIds.isEmpty()) {
            return new ReviewStatusResponse(
                List.of()
            );
        }

        return new ReviewStatusResponse(
            reviewRepository.findReviewedBookingIds(
                user.getId(),
                bookingIds
            )
        );
    }

    /*
     * Có thể gọi lại method này khi Admin ẩn/xuất bản review
     * để điểm Property luôn khớp với các review PUBLISHED.
     */
    @Transactional
    public void refreshPropertyRating(
        UUID propertyId
    ) {
        Property property =
            propertyRepository.findById(propertyId)
                .orElseThrow(
                    () -> new NotFoundException(
                        "Không tìm thấy chỗ nghỉ"
                    )
                );

        long count =
            reviewRepository.countByPropertyIdAndStatus(
                propertyId,
                PUBLISHED
            );

        Double average =
            reviewRepository.averageScoreByPropertyIdAndStatus(
                propertyId,
                PUBLISHED
            );

        property.setReviewCount(
            Math.toIntExact(count)
        );

        property.setReviewScore(
            average == null
                ? BigDecimal.ZERO.setScale(
                    1,
                    RoundingMode.HALF_UP
                )
                : BigDecimal.valueOf(average)
                    .setScale(
                        1,
                        RoundingMode.HALF_UP
                    )
        );

        propertyRepository.save(property);
    }

    private ReviewResponse map(
        Review review,
        String userName
    ) {
        return new ReviewResponse(
            review.getId(),
            review.getPropertyId(),
            review.getUserId(),
            userName,
            review.getScore(),
            review.getTitle(),
            review.getContent(),
            review.getStaffScore(),
            review.getCleanlinessScore(),
            review.getLocationScore(),
            review.getComfortScore(),
            review.getValueScore(),
            review.getCreatedAt()
        );
    }

    private User requireUser(
        String email
    ) {
        return userRepository
            .findByEmailIgnoreCase(email)
            .orElseThrow(
                () -> new NotFoundException(
                    "Không tìm thấy tài khoản"
                )
            );
    }

    private String blankToNull(
        String value
    ) {
        return value == null || value.isBlank()
            ? null
            : value.trim();
    }
}