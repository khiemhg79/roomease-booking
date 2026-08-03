package com.roomease.property.repo;

import com.roomease.property.RoomTypeImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RoomTypeImageRepository extends JpaRepository<RoomTypeImage, UUID> {
    List<RoomTypeImage> findByRoomTypeIdOrderBySortOrderAsc(UUID roomTypeId);
}
