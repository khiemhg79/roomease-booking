package com.roomease.booking.repo;

import com.roomease.booking.BookingRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BookingRoomRepository extends JpaRepository<BookingRoom, UUID> {
    List<BookingRoom> findByBooking_IdOrderByCreatedAtAsc(UUID bookingId);
}
