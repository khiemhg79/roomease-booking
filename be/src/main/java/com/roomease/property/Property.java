package com.roomease.property;

import com.roomease.common.entity.BaseEntity;
import com.roomease.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "properties")
public class Property extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, unique = true, length = 220)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(name = "property_type", nullable = false, length = 40)
    private PropertyType propertyType;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "address_line", nullable = false)
    private String addressLine;

    private String ward;
    private String district;

    @Column(nullable = false)
    private String city;

    private String province;

    @Column(nullable = false)
    private String country;

    @Column(name = "postal_code", length = 30)
    private String postalCode;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "star_rating", nullable = false)
    private Integer starRating;

    @Column(name = "review_score", nullable = false, precision = 3, scale = 1)
    private BigDecimal reviewScore;

    @Column(name = "review_count", nullable = false)
    private Integer reviewCount;

    @Column(name = "check_in_from", nullable = false)
    private LocalTime checkInFrom;

    @Column(name = "check_in_until")
    private LocalTime checkInUntil;

    @Column(name = "check_out_from")
    private LocalTime checkOutFrom;

    @Column(name = "check_out_until", nullable = false)
    private LocalTime checkOutUntil;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PropertyStatus status;

    @Column(nullable = false)
    private boolean featured;
}
