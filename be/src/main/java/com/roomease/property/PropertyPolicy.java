package com.roomease.property;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "property_policies")
public class PropertyPolicy {
    @Id
    @Column(name = "property_id")
    private UUID propertyId;

    @Column(name = "children_allowed", nullable = false)
    private boolean childrenAllowed;

    @Column(name = "pets_policy", nullable = false)
    private String petsPolicy;

    @Column(name = "smoking_policy", nullable = false)
    private String smokingPolicy;

    @Column(name = "parties_allowed", nullable = false)
    private boolean partiesAllowed;

    @Column(name = "quiet_hours_from")
    private LocalTime quietHoursFrom;

    @Column(name = "quiet_hours_until")
    private LocalTime quietHoursUntil;

    @Column(name = "age_restriction")
    private Integer ageRestriction;

    @Column(name = "extra_bed_policy", columnDefinition = "text")
    private String extraBedPolicy;

    @Column(name = "important_information", columnDefinition = "text")
    private String importantInformation;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
