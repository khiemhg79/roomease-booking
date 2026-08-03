package com.roomease.property.repo;

import com.roomease.property.InventoryCalendar;
import com.roomease.property.InventoryCalendarId;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface InventoryCalendarRepository extends JpaRepository<InventoryCalendar, InventoryCalendarId> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select i from InventoryCalendar i
        where i.id.roomTypeId = :roomTypeId
          and i.id.stayDate >= :checkIn
          and i.id.stayDate < :checkOut
        order by i.id.stayDate
        """)
    List<InventoryCalendar> lockStayDates(
        @Param("roomTypeId") UUID roomTypeId,
        @Param("checkIn") LocalDate checkIn,
        @Param("checkOut") LocalDate checkOut
    );
}
