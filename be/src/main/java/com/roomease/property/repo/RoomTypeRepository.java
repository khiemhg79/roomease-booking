package com.roomease.property.repo;

import com.roomease.property.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomTypeRepository extends JpaRepository<RoomType, UUID> {
    List<RoomType> findByPropertyIdAndActiveTrueOrderByName(UUID propertyId);
    List<RoomType> findByPropertyIdOrderByNameAsc(UUID propertyId);
    Optional<RoomType> findByIdAndActiveTrue(UUID id);
    boolean existsByPropertyIdAndCodeIgnoreCase(UUID propertyId, String code);
    boolean existsByPropertyIdAndCodeIgnoreCaseAndIdNot(UUID propertyId, String code, UUID id);
    long countByPropertyIdAndActiveTrue(UUID propertyId);
    long countByPropertyId(UUID propertyId);
}
