package com.roomease.property;

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
@Table(name = "room_types")
public class RoomType extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(nullable = false, length = 60)
    private String code;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "room_size_sqm", precision = 7, scale = 2)
    private BigDecimal roomSizeSqm;

    @Column(name = "max_adults", nullable = false)
    private Integer maxAdults;

    @Column(name = "max_children", nullable = false)
    private Integer maxChildren;

    @Column(name = "max_guests", nullable = false)
    private Integer maxGuests;

    @Column(name = "total_rooms", nullable = false)
    private Integer totalRooms;

    @Column(name = "bed_summary", nullable = false)
    private String bedSummary;

    @Column(name = "bathroom_count", nullable = false)
    private Integer bathroomCount;

    @Column(name = "view_name")
    private String viewName;

    @Column(name = "smoking_allowed", nullable = false)
    private boolean smokingAllowed;

    @Column(nullable = false)
    private boolean active;
}
