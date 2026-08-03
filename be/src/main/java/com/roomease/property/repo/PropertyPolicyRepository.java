package com.roomease.property.repo;

import com.roomease.property.PropertyPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PropertyPolicyRepository extends JpaRepository<PropertyPolicy, UUID> {
}
