package com.roomease.search.repo;

import com.roomease.search.dto.RoomOfferResponse;
import com.roomease.search.dto.SearchPageResponse;
import com.roomease.search.dto.SearchPropertyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Repository
@RequiredArgsConstructor
public class PropertySearchRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public SearchPageResponse search(
        String destination,
        LocalDate checkIn,
        LocalDate checkOut,
        int adults,
        int children,
        int rooms,
        List<String> propertyTypes,
        List<Integer> stars,
        BigDecimal minReviewScore,
        BigDecimal minNightlyPrice,
        BigDecimal maxNightlyPrice,
        List<String> amenityCodes,
        String sort,
        int page,
        int size
    ) {
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        MapSqlParameterSource params = baseParams(checkIn, checkOut, adults, children, rooms, nights)
            .addValue("destination", destination == null ? "" : destination.trim())
            .addValue("limit", size)
            .addValue("offset", page * size);

        StringBuilder filters = new StringBuilder(" WHERE 1=1 ");
        if (destination != null && !destination.isBlank()) {
            filters.append(" AND (LOWER(p.name) LIKE LOWER('%' || :destination || '%') " +
                "OR LOWER(p.city) LIKE LOWER('%' || :destination || '%') " +
                "OR LOWER(COALESCE(p.district,'')) LIKE LOWER('%' || :destination || '%') " +
                "OR LOWER(COALESCE(p.province,'')) LIKE LOWER('%' || :destination || '%') " +
                "OR LOWER(p.country) LIKE LOWER('%' || :destination || '%')) ");
        }
        if (propertyTypes != null && !propertyTypes.isEmpty()) {
            filters.append(" AND p.property_type IN (:propertyTypes) ");
            params.addValue("propertyTypes", propertyTypes);
        }
        if (stars != null && !stars.isEmpty()) {
            filters.append(" AND p.star_rating IN (:stars) ");
            params.addValue("stars", stars);
        }
        if (minReviewScore != null) {
            filters.append(" AND p.review_score >= :minReviewScore ");
            params.addValue("minReviewScore", minReviewScore);
        }
        if (minNightlyPrice != null) {
            filters.append(" AND (pp.min_total_price / :nights) >= :minNightlyPrice ");
            params.addValue("minNightlyPrice", minNightlyPrice);
        }
        if (maxNightlyPrice != null) {
            filters.append(" AND (pp.min_total_price / :nights) <= :maxNightlyPrice ");
            params.addValue("maxNightlyPrice", maxNightlyPrice);
        }
        if (amenityCodes != null && !amenityCodes.isEmpty()) {
            filters.append("""
                AND (SELECT COUNT(DISTINCT a.code)
                       FROM property_amenities pa
                       JOIN amenities a ON a.id = pa.amenity_id
                      WHERE pa.property_id = p.id AND a.code IN (:amenityCodes)) = :amenityCount
                """);
            params.addValue("amenityCodes", amenityCodes);
            params.addValue("amenityCount", amenityCodes.size());
        }

        String orderBy = switch (sort == null ? "recommended" : sort) {
            case "price_asc" -> "pp.min_total_price ASC, p.review_score DESC";
            case "price_desc" -> "pp.min_total_price DESC, p.review_score DESC";
            case "rating_desc" -> "p.review_score DESC, p.review_count DESC";
            case "stars_desc" -> "p.star_rating DESC, p.review_score DESC";
            default -> "p.featured DESC, p.review_score DESC, p.review_count DESC";
        };

        String sql = availabilityCte() + """
            , property_prices AS (
                SELECT property_id,
                       MIN(total_price) AS min_total_price,
                       BOOL_OR(refundable) AS free_cancellation,
                       BOOL_OR(meal_plan <> 'ROOM_ONLY') AS breakfast_included,
                       MAX(available_rooms) AS available_rooms,
                       MIN(currency) AS currency
                  FROM eligible_offers
                 GROUP BY property_id
            )
            SELECT p.id, p.slug, p.name, p.property_type, p.address_line, p.city, p.country,
                   p.star_rating, p.review_score, p.review_count,
                   COALESCE((SELECT pi.image_url FROM property_images pi
                              WHERE pi.property_id = p.id
                              ORDER BY pi.is_cover DESC, pi.sort_order ASC LIMIT 1), '') AS thumbnail_url,
                   COALESCE((SELECT STRING_AGG(x.name, '||' ORDER BY x.name)
                               FROM (SELECT a.name FROM property_amenities pa
                                     JOIN amenities a ON a.id = pa.amenity_id
                                    WHERE pa.property_id = p.id LIMIT 5) x), '') AS amenities,
                   ROUND(pp.min_total_price / :nights, 0) AS min_nightly_price,
                   pp.min_total_price, pp.currency, pp.free_cancellation, pp.breakfast_included,
                   pp.available_rooms, COUNT(*) OVER() AS total_count
              FROM properties p
              JOIN property_prices pp ON pp.property_id = p.id
            """ + filters + " ORDER BY " + orderBy + " LIMIT :limit OFFSET :offset";

        List<SearchRow> rows = jdbc.query(sql, params, this::mapSearchRow);
        long total = rows.isEmpty() ? 0 : rows.getFirst().totalCount();
        List<SearchPropertyResponse> content = rows.stream().map(SearchRow::response).toList();
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) total / size);
        return new SearchPageResponse(content, page, size, total, totalPages);
    }

    public List<RoomOfferResponse> findOffers(
        UUID propertyId,
        LocalDate checkIn,
        LocalDate checkOut,
        int adults,
        int children,
        int rooms
    ) {
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        MapSqlParameterSource params = baseParams(checkIn, checkOut, adults, children, rooms, nights)
            .addValue("propertyId", propertyId);

        String sql = availabilityCte() + """
            SELECT eo.room_type_id, eo.rate_plan_id, eo.room_name, rt.description AS room_description,
                   rt.room_size_sqm, rt.bed_summary, rt.view_name, rt.max_adults, rt.max_children, rt.max_guests,
                   COALESCE((SELECT rti.image_url FROM room_type_images rti
                              WHERE rti.room_type_id = rt.id ORDER BY rti.sort_order LIMIT 1), '') AS image_url,
                   COALESCE((SELECT STRING_AGG(a.name, '||' ORDER BY a.name)
                               FROM room_amenities ra JOIN amenities a ON a.id = ra.amenity_id
                              WHERE ra.room_type_id = rt.id), '') AS room_amenities,
                   eo.rate_plan_name, eo.meal_plan, eo.cancellation_type, eo.cancellation_days,
                   eo.refundable, eo.pay_at_property, rp.description AS rate_description,
                   ROUND(eo.total_price / :nights, 0) AS average_nightly_price,
                   eo.total_price, eo.original_total_price, eo.currency, eo.available_rooms
              FROM eligible_offers eo
              JOIN room_types rt ON rt.id = eo.room_type_id
              JOIN rate_plans rp ON rp.id = eo.rate_plan_id
             WHERE eo.property_id = :propertyId
             ORDER BY rt.name, eo.total_price
            """;

        return jdbc.query(sql, params, (rs, rowNum) -> new RoomOfferResponse(
            rs.getObject("room_type_id", UUID.class),
            rs.getObject("rate_plan_id", UUID.class),
            rs.getString("room_name"),
            rs.getString("room_description"),
            rs.getBigDecimal("room_size_sqm"),
            rs.getString("bed_summary"),
            rs.getString("view_name"),
            rs.getInt("max_adults"),
            rs.getInt("max_children"),
            rs.getInt("max_guests"),
            rs.getString("image_url"),
            split(rs.getString("room_amenities")),
            rs.getString("rate_plan_name"),
            rs.getString("meal_plan"),
            rs.getString("cancellation_type"),
            rs.getInt("cancellation_days"),
            rs.getBoolean("refundable"),
            rs.getBoolean("pay_at_property"),
            rs.getString("rate_description"),
            rs.getBigDecimal("average_nightly_price"),
            rs.getBigDecimal("total_price"),
            rs.getBigDecimal("original_total_price"),
            rs.getString("currency"),
            rs.getInt("available_rooms")
        ));
    }

    private String availabilityCte() {
        return """
            WITH eligible_offers AS (
                SELECT p.id AS property_id, rt.id AS room_type_id, rp.id AS rate_plan_id,
                       rt.name AS room_name, rp.name AS rate_plan_name, rp.meal_plan,
                       rp.cancellation_type, rp.cancellation_days, rp.refundable, rp.pay_at_property,
                       SUM(rc.price) AS total_price,
                       SUM(COALESCE(rc.original_price, rc.price)) AS original_total_price,
                       MIN(rc.currency) AS currency,
                       MIN(ic.allotment - ic.reserved_rooms) AS available_rooms
                  FROM properties p
                  JOIN room_types rt ON rt.property_id = p.id AND rt.active = TRUE
                  JOIN rate_plans rp ON rp.room_type_id = rt.id AND rp.active = TRUE
                  JOIN inventory_calendar ic ON ic.room_type_id = rt.id
                  JOIN rate_calendar rc ON rc.rate_plan_id = rp.id AND rc.stay_date = ic.stay_date
                 WHERE p.status = 'ACTIVE'
                   AND ic.stay_date >= :checkIn AND ic.stay_date < :checkOut
                   AND rc.available = TRUE AND ic.stop_sell = FALSE
                   AND rt.max_adults * :rooms >= :adults
                   AND rt.max_children * :rooms >= :children
                 GROUP BY p.id, rt.id, rp.id, rt.name, rp.name, rp.meal_plan,
                          rp.cancellation_type, rp.cancellation_days, rp.refundable, rp.pay_at_property
                HAVING COUNT(*) = :nights
                   AND MIN(ic.allotment - ic.reserved_rooms) >= :rooms
                   AND MAX(ic.min_stay) <= :nights
                   AND (MIN(ic.max_stay) IS NULL OR :nights <= MIN(ic.max_stay))
                   AND BOOL_AND(CASE WHEN ic.stay_date = :checkIn THEN NOT ic.closed_to_arrival ELSE TRUE END)
                   AND BOOL_AND(CASE WHEN ic.stay_date = (CAST(:checkOut AS date) - 1) THEN NOT ic.closed_to_departure ELSE TRUE END)
            )
            """;
    }

    private MapSqlParameterSource baseParams(LocalDate checkIn, LocalDate checkOut, int adults, int children, int rooms, long nights) {
        return new MapSqlParameterSource()
            .addValue("checkIn", checkIn)
            .addValue("checkOut", checkOut)
            .addValue("adults", adults)
            .addValue("children", children)
            .addValue("rooms", rooms)
            .addValue("nights", nights);
    }

    private SearchRow mapSearchRow(ResultSet rs, int rowNum) throws SQLException {
        SearchPropertyResponse response = new SearchPropertyResponse(
            rs.getObject("id", UUID.class), rs.getString("slug"), rs.getString("name"),
            rs.getString("property_type"), rs.getString("address_line"), rs.getString("city"),
            rs.getString("country"), rs.getInt("star_rating"), rs.getBigDecimal("review_score"),
            rs.getInt("review_count"), rs.getString("thumbnail_url"), split(rs.getString("amenities")),
            rs.getBigDecimal("min_nightly_price"), rs.getBigDecimal("min_total_price"), rs.getString("currency"),
            rs.getBoolean("free_cancellation"), rs.getBoolean("breakfast_included"), rs.getInt("available_rooms")
        );
        return new SearchRow(response, rs.getLong("total_count"));
    }

    private List<String> split(String value) {
        if (value == null || value.isBlank()) return List.of();
        return Arrays.stream(value.split("\\|\\|")).filter(s -> !s.isBlank()).toList();
    }

    private record SearchRow(SearchPropertyResponse response, long totalCount) {}
}
