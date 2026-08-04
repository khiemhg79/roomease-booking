package com.roomease.booking.repo;

import com.roomease.booking.Booking;
import com.roomease.booking.BookingStatus;
import com.roomease.booking.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    @EntityGraph(attributePaths = {"property", "property.owner", "user"})
    Optional<Booking> findByBookingCode(String bookingCode);

    @EntityGraph(attributePaths = {"property", "property.owner", "user"})
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where upper(b.bookingCode) = upper(:bookingCode)")
    Optional<Booking> findByBookingCodeForUpdate(@Param("bookingCode") String bookingCode);

    @EntityGraph(attributePaths = {"property"})
    Page<Booking> findByUser_IdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = {"property"})
    Page<Booking> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"property"})
    Page<Booking> findByProperty_Owner_IdOrderByCreatedAtDesc(UUID ownerId, Pageable pageable);

    long countByStatus(BookingStatus status);
    long countByPropertyId(UUID propertyId);
    @Query("select count(b) from Booking b where b.checkIn = :checkIn")
    long countByCheckIn(@Param("checkIn") LocalDate checkIn);

    @Query("select count(b) from Booking b where b.checkOut = :checkOut")
    long countByCheckOut(@Param("checkOut") LocalDate checkOut);
    List<Booking> findTop5ByOrderByCreatedAtDesc();

    @Query("select coalesce(sum(b.totalAmount), 0) from Booking b where b.paymentStatus = :status")
    BigDecimal sumRevenueByPaymentStatus(@Param("status") PaymentStatus status);

    @EntityGraph(attributePaths = {"property", "property.owner", "user"})
    @Query("""
        select b from Booking b
        where (:ownerId is null or b.property.owner.id = :ownerId)
          and (:propertyId is null or b.property.id = :propertyId)
          and (:status is null or b.status = :status)
          and (:fromDate is null or b.checkIn >= :fromDate)
          and (:toDate is null or b.checkIn <= :toDate)
          and (
            :keyword is null
            or lower(b.bookingCode) like lower(concat('%', :keyword, '%'))
            or lower(b.guestFullName) like lower(concat('%', :keyword, '%'))
            or lower(b.guestEmail) like lower(concat('%', :keyword, '%'))
            or lower(b.guestPhone) like lower(concat('%', :keyword, '%'))
            or lower(b.property.name) like lower(concat('%', :keyword, '%'))
          )
        order by b.createdAt desc
        """)
    Page<Booking> searchManagerBookings(
        @Param("ownerId") UUID ownerId,
        @Param("propertyId") UUID propertyId,
        @Param("status") BookingStatus status,
        @Param("fromDate") LocalDate fromDate,
        @Param("toDate") LocalDate toDate,
        @Param("keyword") String keyword,
        Pageable pageable
    );
}