package com.roomease.favourite;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "favourites")
public class Favourite {
    @EmbeddedId
    private FavouriteId id;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}
