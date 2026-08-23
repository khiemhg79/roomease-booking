package com.roomease.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByGoogleSubject(String googleSubject);

    boolean existsByEmailIgnoreCase(String email);

    long countByRole(Role role);

    long countByStatus(UserStatus status);

    List<User> findTop5ByOrderByCreatedAtDesc();

    @Query("""
        select u
        from User u
        where (:role is null or u.role = :role)
          and (:status is null or u.status = :status)
          and (
            :keyword = ''
            or lower(u.fullName) like concat('%', :keyword, '%')
            or lower(u.email) like concat('%', :keyword, '%')
            or lower(coalesce(u.phone, '')) like concat('%', :keyword, '%')
          )
        order by u.createdAt desc
        """)
    Page<User> searchForAdmin(
        @Param("role") Role role,
        @Param("status") UserStatus status,
        @Param("keyword") String keyword,
        Pageable pageable
    );
}