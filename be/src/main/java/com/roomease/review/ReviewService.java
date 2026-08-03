package com.roomease.review;

import com.roomease.booking.Booking;
import com.roomease.booking.BookingStatus;
import com.roomease.booking.repo.BookingRepository;
import com.roomease.common.dto.PageResponse;
import com.roomease.common.exception.*;
import com.roomease.review.dto.CreateReviewRequest;
import com.roomease.review.dto.ReviewResponse;
import com.roomease.user.User;
import com.roomease.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewResponse create(String email, CreateReviewRequest request) {
        User user = requireUser(email);
        Booking booking = bookingRepository.findById(request.bookingId())
            .orElseThrow(() -> new NotFoundException("Không tìm thấy booking"));
        if (!booking.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Bạn không thể đánh giá booking này");
        }
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new ConflictException("Chỉ có thể đánh giá sau khi hoàn tất kỳ nghỉ");
        }
        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new ConflictException("Booking này đã được đánh giá");
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
            .status("PUBLISHED")
            .build();
        return map(reviewRepository.save(review), user.getFullName());
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> list(UUID propertyId, int page, int size) {
        Page<ReviewResponse> reviews = reviewRepository
            .findByPropertyIdAndStatusOrderByCreatedAtDesc(propertyId, "PUBLISHED", PageRequest.of(page, size))
            .map(r -> map(r, userRepository.findById(r.getUserId()).map(User::getFullName).orElse("Khách đã lưu trú")));
        return PageResponse.from(reviews);
    }

    private ReviewResponse map(Review r, String userName) {
        return new ReviewResponse(r.getId(), r.getPropertyId(), r.getUserId(), userName, r.getScore(), r.getTitle(),
            r.getContent(), r.getStaffScore(), r.getCleanlinessScore(), r.getLocationScore(), r.getComfortScore(),
            r.getValueScore(), r.getCreatedAt());
    }

    private User requireUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
