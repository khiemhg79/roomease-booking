package com.roomease.property;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "rate_calendar")
public class RateCalendar {
    @EmbeddedId
    private RateCalendarId id;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "original_price", precision = 15, scale = 2)
    private BigDecimal originalPrice;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false)
    private boolean available;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
