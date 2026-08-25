package com.roomease.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Page<Review> findByPropertyIdAndStatusOrderByCreatedAtDesc(
        UUID propertyId,
        String status,
        Pageable pageable
    );

    boolean existsByBookingId(UUID bookingId);

    Optional<Review> findByBookingId(UUID bookingId);

    long countByStatus(String status);

    @Query("""
        select r
        from Review r
        where (:status = '' or r.status = :status)
          and (:propertyId is null or r.propertyId = :propertyId)
          and (
            :keyword = ''
            or lower(coalesce(r.title, '')) like concat('%', :keyword, '%')
            or lower(coalesce(r.content, '')) like concat('%', :keyword, '%')
          )
        order by r.createdAt desc
        """)
    Page<Review> searchForAdmin(
        @Param("status") String status,
        @Param("propertyId") UUID propertyId,
        @Param("keyword") String keyword,
        Pageable pageable
    );
}