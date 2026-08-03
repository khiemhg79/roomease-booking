package com.roomease.property.repo;

import com.roomease.property.RatePlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RatePlanRepository extends JpaRepository<RatePlan, UUID> {
    List<RatePlan> findByRoomTypeIdAndActiveTrueOrderByName(UUID roomTypeId);
    List<RatePlan> findByRoomTypeIdOrderByNameAsc(UUID roomTypeId);
    Optional<RatePlan> findByIdAndActiveTrue(UUID id);
    boolean existsByRoomTypeIdAndCodeIgnoreCase(UUID roomTypeId, String code);
    boolean existsByRoomTypeIdAndCodeIgnoreCaseAndIdNot(UUID roomTypeId, String code, UUID id);
}
