package com.roomease.property;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "inventory_calendar")
public class InventoryCalendar {
    @EmbeddedId
    private InventoryCalendarId id;

    @Column(nullable = false)
    private Integer allotment;

    @Column(name = "reserved_rooms", nullable = false)
    private Integer reservedRooms;

    @Column(name = "stop_sell", nullable = false)
    private boolean stopSell;

    @Column(name = "closed_to_arrival", nullable = false)
    private boolean closedToArrival;

    @Column(name = "closed_to_departure", nullable = false)
    private boolean closedToDeparture;

    @Column(name = "min_stay", nullable = false)
    private Integer minStay;

    @Column(name = "max_stay")
    private Integer maxStay;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public int availableRooms() {
        return allotment - reservedRooms;
    }
}
