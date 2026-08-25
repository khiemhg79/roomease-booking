package com.roomease.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface ReviewRepository
    extends JpaRepository<Review, UUID> {


    /*
     * =========================================================
     * REVIEW PUBLIC CỦA PROPERTY
     * =========================================================
     */

    Page<Review> findByPropertyIdAndStatusOrderByCreatedAtDesc(
        UUID propertyId,
        String status,
        Pageable pageable
    );


    /*
     * =========================================================
     * KIỂM TRA BOOKING ĐÃ REVIEW CHƯA
     * =========================================================
     */

    boolean existsByBookingId(
        UUID bookingId
    );


    Optional<Review> findByBookingId(
        UUID bookingId
    );


    /*
     * =========================================================
     * ĐẾM REVIEW THEO PROPERTY + STATUS
     *
     * Dùng để cập nhật:
     *
     * properties.review_count
     * =========================================================
     */

    long countByPropertyIdAndStatus(
        UUID propertyId,
        String status
    );


    /*
     * =========================================================
     * ĐẾM REVIEW THEO STATUS
     *
     * Giữ lại cho Admin nếu cần thống kê.
     * =========================================================
     */

    long countByStatus(
        String status
    );


    /*
     * =========================================================
     * TÍNH ĐIỂM TRUNG BÌNH PROPERTY
     *
     * Chỉ tính review có status PUBLISHED.
     * =========================================================
     */

    @Query("""
        select avg(r.score)
        from Review r
        where r.propertyId = :propertyId
          and r.status = :status
        """)
    Double averageScoreByPropertyIdAndStatus(
        @Param("propertyId")
        UUID propertyId,

        @Param("status")
        String status
    );


    /*
     * =========================================================
     * LẤY DANH SÁCH BOOKING ĐÃ REVIEW
     *
     * Customer /bookings dùng để hiển thị:
     *
     * ✓ Đã đánh giá
     *
     * thay vì lưu localStorage.
     * =========================================================
     */

    @Query("""
        select r.bookingId
        from Review r
        where r.userId = :userId
          and r.bookingId in :bookingIds
        """)
    List<UUID> findReviewedBookingIds(
        @Param("userId")
        UUID userId,

        @Param("bookingIds")
        List<UUID> bookingIds
    );


    /*
     * =========================================================
     * ADMIN SEARCH REVIEW
     *
     * QUAN TRỌNG:
     *
     * Method này bị thiếu nên AdminService compile lỗi:
     *
     * cannot find symbol searchForAdmin(...)
     *
     * keyword luôn được AdminService normalize thành ""
     * nếu không có tìm kiếm.
     *
     * Không dùng:
     *
     * :keyword is null
     *
     * để tránh lỗi PostgreSQL/Hibernate lower(bytea).
     * =========================================================
     */

    @Query("""
        select r
        from Review r

        where (
            :status = ''
            or r.status = :status
        )

        and (
            :propertyId is null
            or r.propertyId = :propertyId
        )

        and (
            :keyword = ''

            or lower(
                coalesce(
                    r.title,
                    ''
                )
            )
            like concat(
                '%',
                :keyword,
                '%'
            )

            or lower(
                coalesce(
                    r.content,
                    ''
                )
            )
            like concat(
                '%',
                :keyword,
                '%'
            )
        )

        order by r.createdAt desc
        """)
    Page<Review> searchForAdmin(
        @Param("status")
        String status,

        @Param("propertyId")
        UUID propertyId,

        @Param("keyword")
        String keyword,

        Pageable pageable
    );
}