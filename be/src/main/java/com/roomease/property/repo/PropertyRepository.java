package com.roomease.property.repo;

import com.roomease.property.Property;
import com.roomease.property.PropertyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PropertyRepository extends JpaRepository<Property, UUID> {
    Optional<Property> findBySlugAndStatus(String slug, PropertyStatus status);
    Optional<Property> findByIdAndStatus(UUID id, PropertyStatus status);
    boolean existsBySlug(String slug);
    List<Property> findTop8ByStatusAndFeaturedTrueOrderByReviewScoreDesc(PropertyStatus status);
    List<Property> findByOwner_IdOrderByNameAsc(UUID ownerId);
    List<Property> findTop5ByOrderByCreatedAtDesc();
    long countByStatus(PropertyStatus status);
    long countByOwner_Id(UUID ownerId);

    @Query("""
        select p from Property p
        left join p.owner owner
        where (:status is null or p.status = :status)
          and (
            :keyword is null
            or lower(p.name) like lower(concat('%', :keyword, '%'))
            or lower(p.city) like lower(concat('%', :keyword, '%'))
            or lower(p.slug) like lower(concat('%', :keyword, '%'))
            or lower(coalesce(owner.email, '')) like lower(concat('%', :keyword, '%'))
          )
        order by p.createdAt desc
        """)
    Page<Property> searchForAdmin(
        @Param("status") PropertyStatus status,
        @Param("keyword") String keyword,
        Pageable pageable
    );
}
