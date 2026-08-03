package com.roomease.manager;

import com.roomease.common.exception.BadRequestException;
import com.roomease.common.exception.ConflictException;
import com.roomease.common.exception.ForbiddenException;
import com.roomease.common.exception.NotFoundException;
import com.roomease.manager.dto.*;
import com.roomease.property.*;
import com.roomease.property.repo.*;
import com.roomease.user.Role;
import com.roomease.user.User;
import com.roomease.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerService {
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final PropertyImageRepository propertyImageRepository;
    private final PropertyPolicyRepository propertyPolicyRepository;
    private final AmenityRepository amenityRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomTypeImageRepository roomTypeImageRepository;
    private final RatePlanRepository ratePlanRepository;
    private final NamedParameterJdbcTemplate jdbc;

    @Transactional(readOnly = true)
    public ManagerDashboardResponse dashboard(String email) {
        User actor = requireManager(email);
        UUID ownerId = actor.getRole() == Role.ADMIN ? null : actor.getId();
        MapSqlParameterSource params = new MapSqlParameterSource().addValue("ownerId", ownerId);
        String ownerFilter = ownerId == null ? "" : " AND p.owner_id = :ownerId ";

        long propertyCount = longValue("""
            SELECT COUNT(*) FROM properties p
            WHERE p.status <> 'ARCHIVED'
            """ + ownerFilter, params);

        long activePropertyCount = longValue("""
            SELECT COUNT(*) FROM properties p
            WHERE p.status = 'ACTIVE'
            """ + ownerFilter, params);

        long roomTypeCount = longValue("""
            SELECT COUNT(*)
            FROM room_types rt
            JOIN properties p ON p.id = rt.property_id
            WHERE rt.active = TRUE AND p.status <> 'ARCHIVED'
            """ + ownerFilter, params);

        long totalBookings = longValue("""
            SELECT COUNT(*)
            FROM bookings b
            JOIN properties p ON p.id = b.property_id
            WHERE 1 = 1
            """ + ownerFilter, params);

        long pendingBookings = longValue("""
            SELECT COUNT(*)
            FROM bookings b
            JOIN properties p ON p.id = b.property_id
            WHERE b.status = 'PENDING'
            """ + ownerFilter, params);

        long arrivalsToday = longValue("""
            SELECT COUNT(*)
            FROM bookings b
            JOIN properties p ON p.id = b.property_id
            WHERE b.check_in = CURRENT_DATE
              AND b.status IN ('CONFIRMED', 'CHECKED_IN')
            """ + ownerFilter, params);

        long departuresToday = longValue("""
            SELECT COUNT(*)
            FROM bookings b
            JOIN properties p ON p.id = b.property_id
            WHERE b.check_out = CURRENT_DATE
              AND b.status IN ('CHECKED_IN', 'COMPLETED')
            """ + ownerFilter, params);

        BigDecimal revenueThisMonth = decimalValue("""
            SELECT COALESCE(SUM(b.total_amount), 0)
            FROM bookings b
            JOIN properties p ON p.id = b.property_id
            WHERE b.created_at >= date_trunc('month', CURRENT_DATE)
              AND b.status <> 'CANCELLED'
              AND b.payment_status IN ('PAID', 'NOT_REQUIRED')
            """ + ownerFilter, params);

        Map<LocalDate, ManagerDashboardResponse.RevenuePoint> pointsByDate = new LinkedHashMap<>();
        LocalDate start = LocalDate.now().minusDays(13);
        for (int i = 0; i < 14; i++) {
            LocalDate date = start.plusDays(i);
            pointsByDate.put(date, new ManagerDashboardResponse.RevenuePoint(date, BigDecimal.ZERO, 0));
        }

        MapSqlParameterSource chartParams = new MapSqlParameterSource()
            .addValue("ownerId", ownerId)
            .addValue("startDate", start);

        jdbc.query("""
            SELECT CAST(b.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh' AS date) AS booking_date,
                   COALESCE(SUM(CASE
                     WHEN b.status <> 'CANCELLED' AND b.payment_status IN ('PAID', 'NOT_REQUIRED')
                     THEN b.total_amount ELSE 0 END), 0) AS revenue,
                   COUNT(*) AS booking_count
            FROM bookings b
            JOIN properties p ON p.id = b.property_id
            WHERE CAST(b.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh' AS date) >= :startDate
            """ + ownerFilter + """
            GROUP BY booking_date
            ORDER BY booking_date
            """, chartParams, rs -> {
                LocalDate date = rs.getObject("booking_date", LocalDate.class);
                pointsByDate.put(date, new ManagerDashboardResponse.RevenuePoint(
                    date,
                    rs.getBigDecimal("revenue"),
                    rs.getLong("booking_count")
                ));
            });

        List<ManagerDashboardResponse.StatusCount> statusCounts = jdbc.query("""
            SELECT b.status, COUNT(*) AS total
            FROM bookings b
            JOIN properties p ON p.id = b.property_id
            WHERE 1 = 1
            """ + ownerFilter + """
            GROUP BY b.status
            ORDER BY b.status
            """, params, (rs, rowNum) -> new ManagerDashboardResponse.StatusCount(
                rs.getString("status"), rs.getLong("total")
            ));

        List<ManagerDashboardResponse.RecentBooking> recentBookings = jdbc.query("""
            SELECT b.booking_code, p.name AS property_name, b.guest_full_name,
                   b.check_in, b.check_out, b.status, b.total_amount, b.currency, b.created_at
            FROM bookings b
            JOIN properties p ON p.id = b.property_id
            WHERE 1 = 1
            """ + ownerFilter + """
            ORDER BY b.created_at DESC
            LIMIT 8
            """, params, (rs, rowNum) -> new ManagerDashboardResponse.RecentBooking(
                rs.getString("booking_code"),
                rs.getString("property_name"),
                rs.getString("guest_full_name"),
                rs.getObject("check_in", LocalDate.class),
                rs.getObject("check_out", LocalDate.class),
                rs.getString("status"),
                rs.getBigDecimal("total_amount"),
                rs.getString("currency"),
                rs.getObject("created_at", OffsetDateTime.class)
            ));

        return new ManagerDashboardResponse(
            propertyCount,
            activePropertyCount,
            roomTypeCount,
            totalBookings,
            pendingBookings,
            arrivalsToday,
            departuresToday,
            revenueThisMonth,
            "VND",
            new ArrayList<>(pointsByDate.values()),
            statusCounts,
            recentBookings
        );
    }

    @Transactional(readOnly = true)
    public List<ManagerPropertyResponse> listProperties(String email) {
        User actor = requireManager(email);
        List<Property> properties = actor.getRole() == Role.ADMIN
            ? propertyRepository.findAll()
            : propertyRepository.findByOwner_IdOrderByNameAsc(actor.getId());
        return properties.stream()
            .sorted(Comparator.comparing(Property::getName, String.CASE_INSENSITIVE_ORDER))
            .map(this::toPropertyResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public ManagerPropertyResponse property(String email, UUID propertyId) {
        return toPropertyResponse(requirePropertyAccess(email, propertyId));
    }

    @Transactional
    public ManagerPropertyResponse createProperty(String email, SavePropertyRequest request) {
        User actor = requireManager(email);
        Property property = Property.builder()
            .owner(actor)
            .name(request.name().trim())
            .slug(uniqueSlug(request.name()))
            .propertyType(PropertyType.valueOf(request.propertyType()))
            .status(PropertyStatus.DRAFT)
            .reviewScore(BigDecimal.ZERO)
            .reviewCount(0)
            .build();
        applyProperty(property, request);
        Property saved = propertyRepository.save(property);
        replacePropertyAssets(saved, request);
        return toPropertyResponse(saved);
    }

    @Transactional
    public ManagerPropertyResponse updateProperty(String email, UUID propertyId, SavePropertyRequest request) {
        Property property = requirePropertyAccess(email, propertyId);
        applyProperty(property, request);
        Property saved = propertyRepository.save(property);
        replacePropertyAssets(saved, request);
        return toPropertyResponse(saved);
    }

    @Transactional
    public ManagerPropertyResponse updatePropertyStatus(String email, UUID propertyId, PropertyStatusRequest request) {
        Property property = requirePropertyAccess(email, propertyId);
        PropertyStatus target = PropertyStatus.valueOf(request.status());
        if (target == PropertyStatus.ACTIVE) {
            long activeRooms = roomTypeRepository.countByPropertyIdAndActiveTrue(propertyId);
            if (activeRooms == 0) {
                throw new ConflictException("Cần tạo ít nhất một loại phòng đang hoạt động trước khi mở bán");
            }
        }
        property.setStatus(target);
        return toPropertyResponse(propertyRepository.save(property));
    }

    @Transactional
    public void archiveProperty(String email, UUID propertyId) {
        Property property = requirePropertyAccess(email, propertyId);
        property.setStatus(PropertyStatus.ARCHIVED);
        propertyRepository.save(property);
    }

    @Transactional(readOnly = true)
    public List<AmenityOptionResponse> amenities(String email) {
        requireManager(email);
        return amenityRepository.findAllByOrderByCategoryAscNameAsc().stream()
            .map(a -> new AmenityOptionResponse(a.getId(), a.getCode(), a.getName(), a.getCategory(), a.getIcon()))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ManagerRoomTypeResponse> rooms(String email, UUID propertyId) {
        requirePropertyAccess(email, propertyId);
        return roomTypeRepository.findByPropertyIdOrderByNameAsc(propertyId).stream()
            .map(this::toRoomResponse)
            .toList();
    }

    @Transactional
    public ManagerRoomTypeResponse createRoom(String email, UUID propertyId, SaveRoomTypeRequest request) {
        requirePropertyAccess(email, propertyId);
        String code = normalizeCode(request.code());
        if (roomTypeRepository.existsByPropertyIdAndCodeIgnoreCase(propertyId, code)) {
            throw new ConflictException("Mã loại phòng đã tồn tại trong chỗ nghỉ này");
        }
        validateRoomCapacity(request);
        RoomType room = RoomType.builder().propertyId(propertyId).build();
        applyRoom(room, request, code);
        RoomType saved = roomTypeRepository.save(room);
        replaceRoomAssets(saved, request);
        return toRoomResponse(saved);
    }

    @Transactional
    public ManagerRoomTypeResponse updateRoom(String email, UUID roomTypeId, SaveRoomTypeRequest request) {
        RoomType room = requireRoomAccess(email, roomTypeId);
        String code = normalizeCode(request.code());
        if (roomTypeRepository.existsByPropertyIdAndCodeIgnoreCaseAndIdNot(room.getPropertyId(), code, roomTypeId)) {
            throw new ConflictException("Mã loại phòng đã tồn tại trong chỗ nghỉ này");
        }
        validateRoomCapacity(request);
        Integer maxReserved = jdbc.queryForObject("""
            SELECT COALESCE(MAX(reserved_rooms), 0)
            FROM inventory_calendar
            WHERE room_type_id = :roomTypeId AND stay_date >= CURRENT_DATE
            """, new MapSqlParameterSource("roomTypeId", roomTypeId), Integer.class);
        if (maxReserved != null && request.totalRooms() < maxReserved) {
            throw new ConflictException("Tổng số phòng không thể nhỏ hơn số phòng đã được đặt: " + maxReserved);
        }
        applyRoom(room, request, code);
        RoomType saved = roomTypeRepository.save(room);
        replaceRoomAssets(saved, request);
        jdbc.update("""
            UPDATE inventory_calendar
               SET allotment = GREATEST(reserved_rooms, LEAST(allotment, :totalRooms)),
                   updated_at = NOW()
             WHERE room_type_id = :roomTypeId AND stay_date >= CURRENT_DATE
            """, new MapSqlParameterSource()
            .addValue("roomTypeId", roomTypeId)
            .addValue("totalRooms", request.totalRooms()));
        return toRoomResponse(saved);
    }

    @Transactional
    public ManagerRoomTypeResponse setRoomActive(String email, UUID roomTypeId, ActiveRequest request) {
        RoomType room = requireRoomAccess(email, roomTypeId);
        room.setActive(request.active());
        return toRoomResponse(roomTypeRepository.save(room));
    }

    @Transactional(readOnly = true)
    public List<ManagerRatePlanResponse> ratePlans(String email, UUID roomTypeId) {
        requireRoomAccess(email, roomTypeId);
        return ratePlanRepository.findByRoomTypeIdOrderByNameAsc(roomTypeId).stream()
            .map(this::toRatePlanResponse)
            .toList();
    }

    @Transactional
    public ManagerRatePlanResponse createRatePlan(String email, UUID roomTypeId, SaveRatePlanRequest request) {
        requireRoomAccess(email, roomTypeId);
        String code = normalizeCode(request.code());
        if (ratePlanRepository.existsByRoomTypeIdAndCodeIgnoreCase(roomTypeId, code)) {
            throw new ConflictException("Mã gói giá đã tồn tại trong loại phòng này");
        }
        validateRatePlan(request);
        RatePlan plan = RatePlan.builder().roomTypeId(roomTypeId).build();
        applyRatePlan(plan, request, code);
        return toRatePlanResponse(ratePlanRepository.save(plan));
    }

    @Transactional
    public ManagerRatePlanResponse updateRatePlan(String email, UUID ratePlanId, SaveRatePlanRequest request) {
        RatePlan plan = requireRatePlanAccess(email, ratePlanId);
        String code = normalizeCode(request.code());
        if (ratePlanRepository.existsByRoomTypeIdAndCodeIgnoreCaseAndIdNot(plan.getRoomTypeId(), code, ratePlanId)) {
            throw new ConflictException("Mã gói giá đã tồn tại trong loại phòng này");
        }
        validateRatePlan(request);
        applyRatePlan(plan, request, code);
        return toRatePlanResponse(ratePlanRepository.save(plan));
    }

    @Transactional
    public ManagerRatePlanResponse setRatePlanActive(String email, UUID ratePlanId, ActiveRequest request) {
        RatePlan plan = requireRatePlanAccess(email, ratePlanId);
        plan.setActive(request.active());
        return toRatePlanResponse(ratePlanRepository.save(plan));
    }

    @Transactional(readOnly = true)
    public ManagerCalendarResponse calendar(String email, UUID propertyId, LocalDate fromDate, LocalDate toDate) {
        requirePropertyAccess(email, propertyId);
        validateCalendarRange(fromDate, toDate, 62);

        List<RoomType> rooms = roomTypeRepository.findByPropertyIdOrderByNameAsc(propertyId);
        List<UUID> roomIds = rooms.stream().map(RoomType::getId).toList();
        if (roomIds.isEmpty()) {
            return new ManagerCalendarResponse(propertyId, fromDate, toDate, List.of());
        }

        Map<String, InventorySnapshot> inventory = jdbc.query("""
            SELECT room_type_id, stay_date, allotment, reserved_rooms, stop_sell,
                   closed_to_arrival, closed_to_departure, min_stay, max_stay
            FROM inventory_calendar
            WHERE room_type_id IN (:roomIds)
              AND stay_date BETWEEN :fromDate AND :toDate
            """, new MapSqlParameterSource()
            .addValue("roomIds", roomIds)
            .addValue("fromDate", fromDate)
            .addValue("toDate", toDate), rs -> {
                Map<String, InventorySnapshot> result = new HashMap<>();
                while (rs.next()) {
                    UUID roomId = rs.getObject("room_type_id", UUID.class);
                    LocalDate date = rs.getObject("stay_date", LocalDate.class);
                    Number maxStayValue = (Number) rs.getObject("max_stay");
                    Integer maxStay = maxStayValue == null ? null : maxStayValue.intValue();
                    result.put(key(roomId, date), new InventorySnapshot(
                        rs.getInt("allotment"),
                        rs.getInt("reserved_rooms"),
                        rs.getBoolean("stop_sell"),
                        rs.getBoolean("closed_to_arrival"),
                        rs.getBoolean("closed_to_departure"),
                        rs.getInt("min_stay"),
                        maxStay
                    ));
                }
                return result;
            });

        List<RatePlan> plans = roomIds.stream()
            .flatMap(id -> ratePlanRepository.findByRoomTypeIdOrderByNameAsc(id).stream())
            .toList();
        Map<UUID, List<RatePlan>> plansByRoom = plans.stream()
            .collect(Collectors.groupingBy(RatePlan::getRoomTypeId));
        List<UUID> planIds = plans.stream().map(RatePlan::getId).toList();

        Map<String, RateSnapshot> rates = planIds.isEmpty() ? Map.of() : jdbc.query("""
            SELECT rate_plan_id, stay_date, price, original_price, currency, available
            FROM rate_calendar
            WHERE rate_plan_id IN (:planIds)
              AND stay_date BETWEEN :fromDate AND :toDate
            """, new MapSqlParameterSource()
            .addValue("planIds", planIds)
            .addValue("fromDate", fromDate)
            .addValue("toDate", toDate), rs -> {
                Map<String, RateSnapshot> result = new HashMap<>();
                while (rs.next()) {
                    UUID planId = rs.getObject("rate_plan_id", UUID.class);
                    LocalDate date = rs.getObject("stay_date", LocalDate.class);
                    result.put(key(planId, date), new RateSnapshot(
                        rs.getBigDecimal("price"),
                        rs.getBigDecimal("original_price"),
                        rs.getString("currency"),
                        rs.getBoolean("available")
                    ));
                }
                return result;
            });

        List<ManagerCalendarResponse.RoomCalendar> roomCalendars = rooms.stream().map(room -> {
            List<ManagerCalendarResponse.RatePlanCalendar> planCalendars = plansByRoom
                .getOrDefault(room.getId(), List.of()).stream().map(plan -> {
                    List<ManagerCalendarResponse.CalendarDay> days = fromDate.datesUntil(toDate.plusDays(1))
                        .map(date -> {
                            InventorySnapshot inv = inventory.getOrDefault(
                                key(room.getId(), date), InventorySnapshot.empty());
                            RateSnapshot rate = rates.get(key(plan.getId(), date));
                            return new ManagerCalendarResponse.CalendarDay(
                                date,
                                inv.allotment(),
                                inv.reservedRooms(),
                                Math.max(0, inv.allotment() - inv.reservedRooms()),
                                inv.stopSell(),
                                inv.closedToArrival(),
                                inv.closedToDeparture(),
                                inv.minStay(),
                                inv.maxStay(),
                                rate == null ? null : rate.price(),
                                rate == null ? null : rate.originalPrice(),
                                rate != null && rate.available()
                            );
                        }).toList();
                    String currency = days.stream()
                        .map(day -> rates.get(key(plan.getId(), day.date())))
                        .filter(Objects::nonNull)
                        .map(RateSnapshot::currency)
                        .filter(Objects::nonNull)
                        .findFirst().orElse("VND");
                    return new ManagerCalendarResponse.RatePlanCalendar(
                        plan.getId(), plan.getName(), currency, days);
                }).toList();
            return new ManagerCalendarResponse.RoomCalendar(
                room.getId(), room.getName(), room.getTotalRooms(), planCalendars);
        }).toList();

        return new ManagerCalendarResponse(propertyId, fromDate, toDate, roomCalendars);
    }

    @Transactional
    public void updateCalendar(String email, CalendarBulkUpdateRequest request) {
        RoomType room = requireRoomAccess(email, request.roomTypeId());
        RatePlan plan = requireRatePlanAccess(email, request.ratePlanId());
        if (!plan.getRoomTypeId().equals(room.getId())) {
            throw new BadRequestException("Gói giá không thuộc loại phòng đã chọn");
        }
        validateCalendarRange(request.fromDate(), request.toDate(), 366);
        if (request.fromDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Không thể cập nhật giá và tồn phòng trong quá khứ");
        }
        if (request.allotment() > room.getTotalRooms()) {
            throw new BadRequestException("Số phòng mở bán không được lớn hơn tổng số phòng");
        }
        if (request.maxStay() != null && request.maxStay() < request.minStay()) {
            throw new BadRequestException("Số đêm tối đa không được nhỏ hơn số đêm tối thiểu");
        }
        if (request.originalPrice() != null && request.originalPrice().compareTo(request.price()) < 0) {
            throw new BadRequestException("Giá gốc không được nhỏ hơn giá bán");
        }

        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("roomTypeId", request.roomTypeId())
            .addValue("ratePlanId", request.ratePlanId())
            .addValue("fromDate", request.fromDate())
            .addValue("toDate", request.toDate())
            .addValue("allotment", request.allotment())
            .addValue("minStay", request.minStay())
            .addValue("maxStay", request.maxStay())
            .addValue("stopSell", request.stopSell())
            .addValue("closedToArrival", request.closedToArrival())
            .addValue("closedToDeparture", request.closedToDeparture())
            .addValue("price", request.price())
            .addValue("originalPrice", request.originalPrice())
            .addValue("currency", request.currency().toUpperCase(Locale.ROOT))
            .addValue("rateAvailable", request.rateAvailable());

        jdbc.update("""
            INSERT INTO inventory_calendar (
                room_type_id, stay_date, allotment, reserved_rooms, stop_sell,
                closed_to_arrival, closed_to_departure, min_stay, max_stay
            )
            SELECT :roomTypeId, d::date, :allotment, 0, :stopSell,
                   :closedToArrival, :closedToDeparture, :minStay, :maxStay
            FROM generate_series(CAST(:fromDate AS date), CAST(:toDate AS date), INTERVAL '1 day') d
            ON CONFLICT (room_type_id, stay_date) DO UPDATE SET
                allotment = GREATEST(EXCLUDED.allotment, inventory_calendar.reserved_rooms),
                stop_sell = EXCLUDED.stop_sell,
                closed_to_arrival = EXCLUDED.closed_to_arrival,
                closed_to_departure = EXCLUDED.closed_to_departure,
                min_stay = EXCLUDED.min_stay,
                max_stay = EXCLUDED.max_stay,
                updated_at = NOW()
            """, params);

        jdbc.update("""
            INSERT INTO rate_calendar (
                rate_plan_id, stay_date, price, original_price, currency, available
            )
            SELECT :ratePlanId, d::date, :price, :originalPrice, :currency, :rateAvailable
            FROM generate_series(CAST(:fromDate AS date), CAST(:toDate AS date), INTERVAL '1 day') d
            ON CONFLICT (rate_plan_id, stay_date) DO UPDATE SET
                price = EXCLUDED.price,
                original_price = EXCLUDED.original_price,
                currency = EXCLUDED.currency,
                available = EXCLUDED.available,
                updated_at = NOW()
            """, params);
    }

    private void applyProperty(Property property, SavePropertyRequest request) {
        property.setName(request.name().trim());
        property.setPropertyType(PropertyType.valueOf(request.propertyType()));
        property.setDescription(blankToNull(request.description()));
        property.setAddressLine(request.addressLine().trim());
        property.setWard(blankToNull(request.ward()));
        property.setDistrict(blankToNull(request.district()));
        property.setCity(request.city().trim());
        property.setProvince(blankToNull(request.province()));
        property.setCountry(request.country().trim());
        property.setPostalCode(blankToNull(request.postalCode()));
        property.setLatitude(request.latitude());
        property.setLongitude(request.longitude());
        property.setStarRating(request.starRating());
        property.setCheckInFrom(request.checkInFrom() == null ? LocalTime.of(14, 0) : request.checkInFrom());
        property.setCheckInUntil(request.checkInUntil());
        property.setCheckOutFrom(request.checkOutFrom());
        property.setCheckOutUntil(request.checkOutUntil() == null ? LocalTime.NOON : request.checkOutUntil());
        property.setFeatured(request.featured());
    }

    private void replacePropertyAssets(Property property, SavePropertyRequest request) {
        List<PropertyImage> existingImages = propertyImageRepository.findByPropertyIdOrderByCoverDescSortOrderAsc(property.getId());
        propertyImageRepository.deleteAll(existingImages);
        List<SavePropertyRequest.ImageInput> inputs = request.images() == null ? List.of() : request.images();
        boolean coverAssigned = false;
        for (int i = 0; i < inputs.size(); i++) {
            SavePropertyRequest.ImageInput input = inputs.get(i);
            boolean cover = !coverAssigned && (input.cover() || i == 0);
            coverAssigned = coverAssigned || cover;
            propertyImageRepository.save(PropertyImage.builder()
                .propertyId(property.getId())
                .imageUrl(input.imageUrl().trim())
                .altText(blankToNull(input.altText()) == null ? property.getName() : input.altText().trim())
                .sortOrder(input.sortOrder())
                .cover(cover)
                .createdAt(OffsetDateTime.now())
                .build());
        }
        replaceAmenities("property_amenities", "property_id", property.getId(), request.amenityCodes());

        SavePropertyRequest.PolicyInput policyInput = request.policy();
        PropertyPolicy policy = propertyPolicyRepository.findById(property.getId())
            .orElseGet(() -> PropertyPolicy.builder().propertyId(property.getId()).build());
        if (policyInput == null) {
            policy.setChildrenAllowed(true);
            policy.setPetsPolicy("NOT_ALLOWED");
            policy.setSmokingPolicy("NON_SMOKING");
            policy.setPartiesAllowed(false);
            policy.setQuietHoursFrom(null);
            policy.setQuietHoursUntil(null);
            policy.setAgeRestriction(null);
            policy.setExtraBedPolicy(null);
            policy.setImportantInformation(null);
        } else {
            policy.setChildrenAllowed(policyInput.childrenAllowed());
            policy.setPetsPolicy(policyInput.petsPolicy());
            policy.setSmokingPolicy(policyInput.smokingPolicy());
            policy.setPartiesAllowed(policyInput.partiesAllowed());
            policy.setQuietHoursFrom(policyInput.quietHoursFrom());
            policy.setQuietHoursUntil(policyInput.quietHoursUntil());
            policy.setAgeRestriction(policyInput.ageRestriction());
            policy.setExtraBedPolicy(blankToNull(policyInput.extraBedPolicy()));
            policy.setImportantInformation(blankToNull(policyInput.importantInformation()));
        }
        policy.setUpdatedAt(OffsetDateTime.now());
        propertyPolicyRepository.save(policy);
    }

    private void validateRoomCapacity(SaveRoomTypeRequest request) {
        if (request.maxGuests() < request.maxAdults()) {
            throw new BadRequestException("Sức chứa tối đa không được nhỏ hơn số người lớn tối đa");
        }
        if (request.maxGuests() > request.maxAdults() + request.maxChildren()) {
            throw new BadRequestException("Sức chứa tối đa vượt quá tổng người lớn và trẻ em cho phép");
        }
    }

    private void applyRoom(RoomType room, SaveRoomTypeRequest request, String code) {
        room.setCode(code);
        room.setName(request.name().trim());
        room.setDescription(blankToNull(request.description()));
        room.setRoomSizeSqm(request.roomSizeSqm());
        room.setMaxAdults(request.maxAdults());
        room.setMaxChildren(request.maxChildren());
        room.setMaxGuests(request.maxGuests());
        room.setTotalRooms(request.totalRooms());
        room.setBedSummary(request.bedSummary().trim());
        room.setBathroomCount(request.bathroomCount());
        room.setViewName(blankToNull(request.viewName()));
        room.setSmokingAllowed(request.smokingAllowed());
        room.setActive(request.active());
    }

    private void replaceRoomAssets(RoomType room, SaveRoomTypeRequest request) {
        roomTypeImageRepository.deleteAll(roomTypeImageRepository.findByRoomTypeIdOrderBySortOrderAsc(room.getId()));
        List<SaveRoomTypeRequest.ImageInput> inputs = request.images() == null ? List.of() : request.images();
        for (SaveRoomTypeRequest.ImageInput input : inputs) {
            roomTypeImageRepository.save(RoomTypeImage.builder()
                .roomTypeId(room.getId())
                .imageUrl(input.imageUrl().trim())
                .altText(blankToNull(input.altText()) == null ? room.getName() : input.altText().trim())
                .sortOrder(input.sortOrder())
                .createdAt(OffsetDateTime.now())
                .build());
        }
        replaceAmenities("room_amenities", "room_type_id", room.getId(), request.amenityCodes());
    }

    private void validateRatePlan(SaveRatePlanRequest request) {
        if ("NON_REFUNDABLE".equals(request.cancellationType()) && request.refundable()) {
            throw new BadRequestException("Gói không hoàn tiền không thể đặt là có hoàn tiền");
        }
        if (!"NON_REFUNDABLE".equals(request.cancellationType()) && !request.refundable()) {
            throw new BadRequestException("Gói không có hoàn tiền phải dùng loại hủy NON_REFUNDABLE");
        }
        if (request.payAtProperty() && !"NONE".equals(request.prepaymentType())) {
            throw new BadRequestException("Thanh toán tại chỗ nghỉ không được đồng thời yêu cầu trả trước");
        }
    }

    private void applyRatePlan(RatePlan plan, SaveRatePlanRequest request, String code) {
        plan.setCode(code);
        plan.setName(request.name().trim());
        plan.setMealPlan(request.mealPlan());
        plan.setCancellationType(request.cancellationType());
        plan.setCancellationDays(request.cancellationDays());
        plan.setPrepaymentType(request.prepaymentType());
        plan.setRefundable(request.refundable());
        plan.setPayAtProperty(request.payAtProperty());
        plan.setDescription(blankToNull(request.description()));
        plan.setActive(request.active());
    }

    private ManagerPropertyResponse toPropertyResponse(Property property) {
        List<ManagerPropertyResponse.ImageItem> images = propertyImageRepository
            .findByPropertyIdOrderByCoverDescSortOrderAsc(property.getId()).stream()
            .map(image -> new ManagerPropertyResponse.ImageItem(
                image.getId(), image.getImageUrl(), image.getAltText(), image.getSortOrder(), image.isCover()))
            .toList();
        List<String> amenityCodes = amenityRepository.findPropertyAmenities(property.getId()).stream()
            .map(Amenity::getCode).toList();
        PropertyPolicy policy = propertyPolicyRepository.findById(property.getId()).orElse(null);
        ManagerPropertyResponse.Policy policyResponse = policy == null ? null : new ManagerPropertyResponse.Policy(
            policy.isChildrenAllowed(), policy.getPetsPolicy(), policy.getSmokingPolicy(), policy.isPartiesAllowed(),
            policy.getQuietHoursFrom(), policy.getQuietHoursUntil(), policy.getAgeRestriction(),
            policy.getExtraBedPolicy(), policy.getImportantInformation());
        return new ManagerPropertyResponse(
            property.getId(),
            property.getOwner() == null ? null : property.getOwner().getId(),
            property.getName(), property.getSlug(), property.getPropertyType().name(), property.getDescription(),
            property.getAddressLine(), property.getWard(), property.getDistrict(), property.getCity(),
            property.getProvince(), property.getCountry(), property.getPostalCode(), property.getLatitude(),
            property.getLongitude(), property.getStarRating(), property.getReviewScore(), property.getReviewCount(),
            property.getCheckInFrom(), property.getCheckInUntil(), property.getCheckOutFrom(), property.getCheckOutUntil(),
            property.getStatus().name(), property.isFeatured(), images, amenityCodes, policyResponse,
            property.getCreatedAt(), property.getUpdatedAt());
    }

    private ManagerRoomTypeResponse toRoomResponse(RoomType room) {
        List<ManagerRoomTypeResponse.ImageItem> images = roomTypeImageRepository
            .findByRoomTypeIdOrderBySortOrderAsc(room.getId()).stream()
            .map(image -> new ManagerRoomTypeResponse.ImageItem(
                image.getId(), image.getImageUrl(), image.getAltText(), image.getSortOrder()))
            .toList();
        List<String> amenityCodes = amenityRepository.findRoomAmenities(room.getId()).stream()
            .map(Amenity::getCode).toList();
        List<ManagerRatePlanResponse> ratePlans = ratePlanRepository.findByRoomTypeIdOrderByNameAsc(room.getId()).stream()
            .map(this::toRatePlanResponse).toList();
        return new ManagerRoomTypeResponse(
            room.getId(), room.getPropertyId(), room.getCode(), room.getName(), room.getDescription(),
            room.getRoomSizeSqm(), room.getMaxAdults(), room.getMaxChildren(), room.getMaxGuests(),
            room.getTotalRooms(), room.getBedSummary(), room.getBathroomCount(), room.getViewName(),
            room.isSmokingAllowed(), room.isActive(), images, amenityCodes, ratePlans,
            room.getCreatedAt(), room.getUpdatedAt());
    }

    private ManagerRatePlanResponse toRatePlanResponse(RatePlan plan) {
        return new ManagerRatePlanResponse(
            plan.getId(), plan.getRoomTypeId(), plan.getCode(), plan.getName(), plan.getMealPlan(),
            plan.getCancellationType(), plan.getCancellationDays(), plan.getPrepaymentType(),
            plan.isRefundable(), plan.isPayAtProperty(), plan.getDescription(), plan.isActive(),
            plan.getCreatedAt(), plan.getUpdatedAt());
    }

    private void replaceAmenities(String table, String keyColumn, UUID ownerId, List<String> codes) {
        MapSqlParameterSource params = new MapSqlParameterSource().addValue("ownerId", ownerId);
        jdbc.update("DELETE FROM " + table + " WHERE " + keyColumn + " = :ownerId", params);
        if (codes == null || codes.isEmpty()) return;
        List<String> normalized = codes.stream()
            .filter(Objects::nonNull)
            .map(this::normalizeCode)
            .distinct()
            .toList();
        if (normalized.isEmpty()) return;
        params.addValue("codes", normalized);
        jdbc.update("INSERT INTO " + table + " (" + keyColumn + ", amenity_id) " +
            "SELECT :ownerId, id FROM amenities WHERE code IN (:codes) ON CONFLICT DO NOTHING", params);
    }

    private User requireManager(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));
        if (user.getRole() != Role.ADMIN && user.getRole() != Role.HOTEL_MANAGER) {
            throw new ForbiddenException("Tài khoản không có quyền quản lý chỗ nghỉ");
        }
        return user;
    }

    private Property requirePropertyAccess(String email, UUID propertyId) {
        User actor = requireManager(email);
        Property property = propertyRepository.findById(propertyId)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy chỗ nghỉ"));
        if (actor.getRole() != Role.ADMIN &&
            (property.getOwner() == null || !property.getOwner().getId().equals(actor.getId()))) {
            throw new ForbiddenException("Bạn không có quyền quản lý chỗ nghỉ này");
        }
        return property;
    }

    private RoomType requireRoomAccess(String email, UUID roomTypeId) {
        RoomType room = roomTypeRepository.findById(roomTypeId)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy loại phòng"));
        requirePropertyAccess(email, room.getPropertyId());
        return room;
    }

    private RatePlan requireRatePlanAccess(String email, UUID ratePlanId) {
        RatePlan plan = ratePlanRepository.findById(ratePlanId)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy gói giá"));
        requireRoomAccess(email, plan.getRoomTypeId());
        return plan;
    }

    private void validateCalendarRange(LocalDate fromDate, LocalDate toDate, int maxDays) {
        if (fromDate == null || toDate == null || toDate.isBefore(fromDate)) {
            throw new BadRequestException("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu");
        }
        long days = ChronoUnit.DAYS.between(fromDate, toDate);
        if (days > maxDays) {
            throw new BadRequestException("Khoảng thời gian tối đa là " + maxDays + " ngày");
        }
    }

    private long longValue(String sql, MapSqlParameterSource params) {
        Long result = jdbc.queryForObject(sql, params, Long.class);
        return result == null ? 0 : result;
    }

    private BigDecimal decimalValue(String sql, MapSqlParameterSource params) {
        BigDecimal result = jdbc.queryForObject(sql, params, BigDecimal.class);
        return result == null ? BigDecimal.ZERO : result;
    }

    private String uniqueSlug(String name) {
        String base = Normalizer.normalize(name, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("(^-|-$)", "");
        if (base.isBlank()) base = "property";
        String slug = base;
        int index = 2;
        while (propertyRepository.existsBySlug(slug)) slug = base + "-" + index++;
        return slug;
    }

    private String normalizeCode(String value) {
        return value.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", "_");
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String key(UUID id, LocalDate date) {
        return id + "|" + date;
    }

    private record InventorySnapshot(
        int allotment,
        int reservedRooms,
        boolean stopSell,
        boolean closedToArrival,
        boolean closedToDeparture,
        int minStay,
        Integer maxStay
    ) {
        static InventorySnapshot empty() {
            return new InventorySnapshot(0, 0, false, false, false, 1, null);
        }
    }

    private record RateSnapshot(
        BigDecimal price,
        BigDecimal originalPrice,
        String currency,
        boolean available
    ) {}
}
