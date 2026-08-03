package com.roomease.review;

import com.roomease.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reviews")
public class Review extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "booking_id", nullable = false, unique = true)
    private UUID bookingId;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, precision = 3, scale = 1)
    private BigDecimal score;

    @Column(length = 180)
    private String title;

    @Column(columnDefinition = "text")
    private String content;

    @Column(name = "staff_score", precision = 3, scale = 1)
    private BigDecimal staffScore;

    @Column(name = "cleanliness_score", precision = 3, scale = 1)
    private BigDecimal cleanlinessScore;

    @Column(name = "location_score", precision = 3, scale = 1)
    private BigDecimal locationScore;

    @Column(name = "comfort_score", precision = 3, scale = 1)
    private BigDecimal comfortScore;

    @Column(name = "value_score", precision = 3, scale = 1)
    private BigDecimal valueScore;

    @Column(nullable = false, length = 30)
    private String status;
}
