package com.roomease.property.repo;

import com.roomease.property.RateCalendar;
import com.roomease.property.RateCalendarId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface RateCalendarRepository extends JpaRepository<RateCalendar, RateCalendarId> {
    @Query("""
        select r from RateCalendar r
        where r.id.ratePlanId = :ratePlanId
          and r.id.stayDate >= :checkIn
          and r.id.stayDate < :checkOut
          and r.available = true
        order by r.id.stayDate
        """)
    List<RateCalendar> findStayRates(
        @Param("ratePlanId") UUID ratePlanId,
        @Param("checkIn") LocalDate checkIn,
        @Param("checkOut") LocalDate checkOut
    );
}
