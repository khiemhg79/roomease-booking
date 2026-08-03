package com.roomease.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    Page<Review> findByPropertyIdAndStatusOrderByCreatedAtDesc(UUID propertyId, String status, Pageable pageable);
    boolean existsByBookingId(UUID bookingId);
    Optional<Review> findByBookingId(UUID bookingId);
}
