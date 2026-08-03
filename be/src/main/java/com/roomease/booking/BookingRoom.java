package com.roomease.booking;

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
@Table(name = "booking_rooms")
public class BookingRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "room_type_id", nullable = false)
    private UUID roomTypeId;

    @Column(name = "rate_plan_id", nullable = false)
    private UUID ratePlanId;

    @Column(name = "room_name_snapshot", nullable = false)
    private String roomNameSnapshot;

    @Column(name = "rate_plan_name_snapshot", nullable = false)
    private String ratePlanNameSnapshot;

    @Column(name = "meal_plan_snapshot", nullable = false)
    private String mealPlanSnapshot;

    @Column(name = "cancellation_policy_snapshot", columnDefinition = "text")
    private String cancellationPolicySnapshot;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Integer adults;

    @Column(nullable = false)
    private Integer children;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private Integer nights;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}
