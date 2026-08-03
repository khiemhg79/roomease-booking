package com.roomease.booking;

import com.roomease.common.entity.BaseEntity;
import com.roomease.property.Property;
import com.roomease.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bookings")
public class Booking extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "booking_code", nullable = false, unique = true, length = 30)
    private String bookingCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BookingStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 30)
    private PaymentStatus paymentStatus;

    @Column(name = "check_in", nullable = false)
    private LocalDate checkIn;

    @Column(name = "check_out", nullable = false)
    private LocalDate checkOut;

    @Column(nullable = false)
    private Integer nights;

    @Column(nullable = false)
    private Integer adults;

    @Column(nullable = false)
    private Integer children;

    @Column(name = "rooms_count", nullable = false)
    private Integer roomsCount;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "discount_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "tax_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "guest_full_name", nullable = false, length = 160)
    private String guestFullName;

    @Column(name = "guest_email", nullable = false, length = 180)
    private String guestEmail;

    @Column(name = "guest_phone", nullable = false, length = 30)
    private String guestPhone;

    @Column(name = "special_request", length = 1500)
    private String specialRequest;

    @Column(name = "cancellation_deadline")
    private OffsetDateTime cancellationDeadline;

    @Column(nullable = false, length = 30)
    private String source;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    @Builder.Default
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookingRoom> rooms = new ArrayList<>();

    public void addRoom(BookingRoom room) {
        rooms.add(room);
        room.setBooking(this);
    }
}
