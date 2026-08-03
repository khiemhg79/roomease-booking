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
public class InventoryCalendarId implements Serializable {
    @Column(name = "room_type_id")
    private UUID roomTypeId;

    @Column(name = "stay_date")
    private LocalDate stayDate;
}
