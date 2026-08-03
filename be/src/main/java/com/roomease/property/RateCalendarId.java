package com.roomease.property;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class RateCalendarId implements Serializable {
    @Column(name = "rate_plan_id")
    private UUID ratePlanId;

    @Column(name = "stay_date")
    private LocalDate stayDate;
}
