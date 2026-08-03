package com.roomease.property;

import com.roomease.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "rate_plans")
public class RatePlan extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_type_id", nullable = false)
    private UUID roomTypeId;

    @Column(nullable = false, length = 60)
    private String code;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(name = "meal_plan", nullable = false, length = 40)
    private String mealPlan;

    @Column(name = "cancellation_type", nullable = false, length = 40)
    private String cancellationType;

    @Column(name = "cancellation_days", nullable = false)
    private Integer cancellationDays;

    @Column(name = "prepayment_type", nullable = false, length = 40)
    private String prepaymentType;

    @Column(nullable = false)
    private boolean refundable;

    @Column(name = "pay_at_property", nullable = false)
    private boolean payAtProperty;

    @Column(columnDefinition = "text")
    private String description;

    @Column(nullable = false)
    private boolean active;
}
