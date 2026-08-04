package com.roomease.booking.repo;

import com.roomease.booking.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByBookingIdOrderByCreatedAtDesc(UUID bookingId);

    Optional<Payment> findFirstByBookingIdOrderByCreatedAtDesc(UUID bookingId);

    Optional<Payment> findFirstByBookingIdAndProviderOrderByCreatedAtDesc(
        UUID bookingId,
        String provider
    );

    boolean existsByTransactionRef(String transactionRef);
}