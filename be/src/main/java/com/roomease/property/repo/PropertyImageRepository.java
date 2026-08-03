package com.roomease.property.repo;

import com.roomease.property.PropertyImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PropertyImageRepository extends JpaRepository<PropertyImage, UUID> {
    List<PropertyImage> findByPropertyIdOrderByCoverDescSortOrderAsc(UUID propertyId);
}
