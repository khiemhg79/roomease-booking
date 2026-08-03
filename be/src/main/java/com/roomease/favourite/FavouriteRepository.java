package com.roomease.favourite;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FavouriteRepository extends JpaRepository<Favourite, FavouriteId> {
    List<Favourite> findById_UserIdOrderByCreatedAtDesc(UUID userId);
}
