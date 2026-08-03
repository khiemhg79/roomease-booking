package com.roomease.property.repo;

import com.roomease.property.Amenity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AmenityRepository extends JpaRepository<Amenity, Long> {
    List<Amenity> findAllByOrderByCategoryAscNameAsc();

    @Query(value = """
        SELECT a.* FROM amenities a
        JOIN property_amenities pa ON pa.amenity_id = a.id
        WHERE pa.property_id = :propertyId
        ORDER BY a.category, a.name
        """, nativeQuery = true)
    List<Amenity> findPropertyAmenities(@Param("propertyId") UUID propertyId);

    @Query(value = """
        SELECT a.* FROM amenities a
        JOIN room_amenities ra ON ra.amenity_id = a.id
        WHERE ra.room_type_id = :roomTypeId
        ORDER BY a.category, a.name
        """, nativeQuery = true)
    List<Amenity> findRoomAmenities(@Param("roomTypeId") UUID roomTypeId);
}
