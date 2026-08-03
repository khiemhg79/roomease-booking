package com.roomease.favourite;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class FavouriteId implements Serializable {
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "property_id")
    private UUID propertyId;
}
