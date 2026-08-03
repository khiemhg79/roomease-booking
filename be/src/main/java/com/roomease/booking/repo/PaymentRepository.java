package com.roomease.booking.repo;

import com.roomease.booking.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByBookingIdOrderByCreatedAtDesc(UUID bookingId);
}
