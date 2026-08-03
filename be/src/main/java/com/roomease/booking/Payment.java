package com.roomease.booking;

import com.roomease.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payments")
public class Payment extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Column(nullable = false, length = 50)
    private String provider;

    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "transaction_ref", length = 160)
    private String transactionRef;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "raw_response", columnDefinition = "jsonb")
    private String rawResponse;
}
