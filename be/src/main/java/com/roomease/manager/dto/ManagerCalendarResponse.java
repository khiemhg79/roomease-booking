package com.roomease.manager.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ManagerCalendarResponse(
    UUID propertyId,
    LocalDate fromDate,
    LocalDate toDate,
    List<RoomCalendar> rooms
) {
    public record RoomCalendar(
        UUID roomTypeId,
        String roomName,
        int totalRooms,
        List<RatePlanCalendar> ratePlans
    ) {}

    public record RatePlanCalendar(
        UUID ratePlanId,
        String ratePlanName,
        String currency,
        List<CalendarDay> days
    ) {}

    public record CalendarDay(
        LocalDate date,
        int allotment,
        int reservedRooms,
        int availableRooms,
        boolean stopSell,
        boolean closedToArrival,
        boolean closedToDeparture,
        int minStay,
        Integer maxStay,
        BigDecimal price,
        BigDecimal originalPrice,
        boolean rateAvailable
    ) {}
}
