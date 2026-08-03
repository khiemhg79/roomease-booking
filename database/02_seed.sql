-- Demo data for RoomEase. Run after 01_schema.sql.
-- Accounts:
-- admin@roomease.vn / Admin@123
-- manager@roomease.vn / Manager@123
-- user@roomease.vn    / User@123

INSERT INTO app_users (id, full_name, email, password_hash, phone, role, status)
VALUES
('00000000-0000-0000-0000-000000000001', 'RoomEase Admin', 'admin@roomease.vn', '$2y$10$I/TgbRMU10xEuOVl5sinBOnrjChWzOkLe8eo2.NKfXnI3EpJSKwye', '0900000001', 'ADMIN', 'ACTIVE'),
('00000000-0000-0000-0000-000000000003', 'Quản lý khách sạn', 'manager@roomease.vn', '$2y$10$25eoB7AscXwQc7Mn0kVQYeXSK/ART84kloaqQZC1NKHeYECLrueOm', '0900000003', 'HOTEL_MANAGER', 'ACTIVE'),
('00000000-0000-0000-0000-000000000002', 'Nguyễn Minh Anh' , 'user@roomease.vn', '$2y$10$iOxnaPOJ2hkMTk0bgl04VOTp.wLTOw.jmcPdZ6X3RoCpRbi5CzHlS', '0900000002', 'CUSTOMER', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO amenities (code, name, category, icon) VALUES
('FREE_WIFI', 'Wi-Fi miễn phí', 'POPULAR', 'wifi'),
('SWIMMING_POOL', 'Hồ bơi', 'POPULAR', 'pool'),
('BREAKFAST', 'Bữa sáng', 'FOOD', 'breakfast'),
('PARKING', 'Chỗ đỗ xe', 'POPULAR', 'parking'),
('AIR_CONDITIONING', 'Điều hòa', 'ROOM', 'snowflake'),
('PRIVATE_BATHROOM', 'Phòng tắm riêng', 'BATHROOM', 'bath'),
('FITNESS_CENTER', 'Trung tâm thể dục', 'ACTIVITY', 'fitness'),
('AIRPORT_SHUTTLE', 'Đưa đón sân bay', 'SERVICE', 'shuttle'),
('RESTAURANT', 'Nhà hàng', 'FOOD', 'restaurant'),
('FAMILY_ROOMS', 'Phòng gia đình', 'POPULAR', 'family'),
('BEACHFRONT', 'Giáp biển', 'POPULAR', 'beach'),
('24_HOUR_FRONT_DESK', 'Lễ tân 24 giờ', 'SERVICE', 'front-desk'),
('SPA', 'Spa', 'ACTIVITY', 'spa'),
('ELEVATOR', 'Thang máy', 'ACCESSIBILITY', 'elevator'),
('SAFE', 'Két an toàn', 'SAFETY', 'safe'),
('BALCONY', 'Ban công', 'ROOM', 'balcony'),
('CITY_VIEW', 'Nhìn ra thành phố', 'ROOM', 'city-view'),
('SEA_VIEW', 'Nhìn ra biển', 'ROOM', 'sea-view')
ON CONFLICT (code) DO NOTHING;

INSERT INTO properties (
    id, owner_id, name, slug, property_type, description, address_line, district, city, province,
    country, latitude, longitude, star_rating, review_score, review_count,
    check_in_from, check_out_until, status, featured
) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003',
 'RoomEase Riverside Đà Nẵng', 'roomease-riverside-da-nang', 'HOTEL',
 'Khách sạn hiện đại bên sông Hàn, gần cầu Rồng và bãi biển Mỹ Khê. Phù hợp cho kỳ nghỉ gia đình và chuyến công tác.',
 '88 Bạch Đằng', 'Hải Châu', 'Đà Nẵng', 'Đà Nẵng', 'Việt Nam', 16.0678000, 108.2208000, 4, 8.9, 1284, '14:00', '12:00', 'ACTIVE', TRUE),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
 'Sài Gòn Central Boutique', 'sai-gon-central-boutique', 'HOTEL',
 'Khách sạn boutique ở trung tâm Quận 1, thuận tiện đi bộ tới chợ Bến Thành và phố đi bộ Nguyễn Huệ.',
 '125 Lê Thánh Tôn', 'Quận 1', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Việt Nam', 10.7756000, 106.7009000, 4, 8.6, 932, '14:00', '12:00', 'ACTIVE', TRUE),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
 'Hà Nội Old Quarter Suites', 'ha-noi-old-quarter-suites', 'APARTMENT',
 'Căn hộ dịch vụ đầy đủ tiện nghi trong khu phố cổ, có bếp nhỏ và không gian sinh hoạt riêng.',
 '36 Hàng Bạc', 'Hoàn Kiếm', 'Hà Nội', 'Hà Nội', 'Việt Nam', 21.0339000, 105.8520000, 4, 9.1, 647, '14:00', '11:30', 'ACTIVE', TRUE),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003',
 'Nha Trang Azure Beach Resort', 'nha-trang-azure-beach-resort', 'RESORT',
 'Khu nghỉ dưỡng sát biển với hồ bơi vô cực, spa và nhiều lựa chọn phòng hướng biển.',
 '12 Trần Phú', 'Lộc Thọ', 'Nha Trang', 'Khánh Hòa', 'Việt Nam', 12.2388000, 109.1967000, 5, 9.3, 2156, '15:00', '12:00', 'ACTIVE', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, sort_order, is_cover) VALUES
('10000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85', 'RoomEase Riverside exterior', 0, TRUE),
('10000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=85', 'Riverside room', 1, FALSE),
('10000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85', 'Riverside pool', 2, FALSE),
('10000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1600&q=85', 'Saigon boutique exterior', 0, TRUE),
('10000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85', 'Saigon room', 1, FALSE),
('10000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=85', 'Saigon restaurant', 2, FALSE),
('10000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=85', 'Hanoi apartment', 0, TRUE),
('10000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85', 'Hanoi suite bedroom', 1, FALSE),
('10000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1600&q=85', 'Azure beach resort', 0, TRUE),
('10000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=85', 'Azure pool', 1, FALSE),
('10000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=85', 'Azure sea view room', 2, FALSE)
ON CONFLICT DO NOTHING;

INSERT INTO property_amenities (property_id, amenity_id)
SELECT p.id, a.id
FROM properties p
JOIN amenities a ON a.code = ANY (
    CASE p.id
        WHEN '10000000-0000-0000-0000-000000000001'::uuid THEN ARRAY['FREE_WIFI','SWIMMING_POOL','BREAKFAST','PARKING','FITNESS_CENTER','RESTAURANT','24_HOUR_FRONT_DESK']
        WHEN '10000000-0000-0000-0000-000000000002'::uuid THEN ARRAY['FREE_WIFI','BREAKFAST','AIRPORT_SHUTTLE','RESTAURANT','24_HOUR_FRONT_DESK','ELEVATOR']
        WHEN '10000000-0000-0000-0000-000000000003'::uuid THEN ARRAY['FREE_WIFI','FAMILY_ROOMS','AIR_CONDITIONING','PRIVATE_BATHROOM','CITY_VIEW']
        ELSE ARRAY['FREE_WIFI','SWIMMING_POOL','BREAKFAST','PARKING','FITNESS_CENTER','RESTAURANT','BEACHFRONT','SPA','SEA_VIEW']
    END
)
WHERE p.id IN (
 '10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

INSERT INTO property_policies (property_id, children_allowed, pets_policy, smoking_policy, parties_allowed, important_information)
SELECT id, TRUE, 'NOT_ALLOWED', 'NON_SMOKING', FALSE,
       'Khách cần xuất trình giấy tờ tùy thân có ảnh khi nhận phòng. Yêu cầu đặc biệt tùy thuộc tình trạng sẵn có.'
FROM properties
ON CONFLICT (property_id) DO NOTHING;

INSERT INTO room_types (
 id, property_id, code, name, description, room_size_sqm, max_adults, max_children, max_guests,
 total_rooms, bed_summary, bathroom_count, view_name, smoking_allowed, active
) VALUES
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','DELUXE_RIVER','Phòng Deluxe nhìn ra sông','Phòng rộng rãi với cửa sổ lớn nhìn ra sông Hàn.',32,2,1,3,12,'1 giường đôi lớn',1,'Sông',FALSE,TRUE),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','FAMILY_SUITE','Suite Gia đình','Suite có khu vực sinh hoạt và hai giường.',48,3,2,5,6,'1 giường đôi lớn và 1 giường đơn',1,'Thành phố',FALSE,TRUE),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','SUPERIOR','Phòng Superior','Phòng boutique yên tĩnh tại trung tâm Quận 1.',26,2,1,3,15,'1 giường đôi',1,'Thành phố',FALSE,TRUE),
('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000002','EXECUTIVE','Phòng Executive','Có bàn làm việc và quyền sử dụng lounge.',35,2,1,3,8,'1 giường king',1,'Thành phố',FALSE,TRUE),
('20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000003','STUDIO','Studio Phố cổ','Studio có bếp nhỏ, máy giặt và khu vực ăn uống.',38,2,1,3,10,'1 giường queen',1,'Phố cổ',FALSE,TRUE),
('20000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000003','TWO_BEDROOM','Căn hộ 2 phòng ngủ','Căn hộ phù hợp cho gia đình hoặc nhóm bạn.',68,4,2,6,5,'2 giường queen',2,'Phố cổ',FALSE,TRUE),
('20000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000004','OCEAN_DELUXE','Deluxe hướng biển','Ban công riêng nhìn thẳng ra biển Nha Trang.',40,2,2,4,20,'1 giường king',1,'Biển',FALSE,TRUE),
('20000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000004','OCEAN_VILLA','Biệt thự hồ bơi','Biệt thự riêng có hồ bơi nhỏ và hai phòng ngủ.',120,4,2,6,4,'2 giường king',2,'Biển',FALSE,TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO room_type_images (room_type_id, image_url, alt_text, sort_order)
SELECT id,
       CASE
         WHEN code IN ('DELUXE_RIVER','SUPERIOR','STUDIO','OCEAN_DELUXE') THEN 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=85'
         ELSE 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=85'
       END,
       name, 0
FROM room_types
ON CONFLICT DO NOTHING;

INSERT INTO room_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id
FROM room_types rt
JOIN amenities a ON a.code = ANY(ARRAY['FREE_WIFI','AIR_CONDITIONING','PRIVATE_BATHROOM','SAFE'])
ON CONFLICT DO NOTHING;

INSERT INTO room_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id
FROM room_types rt
JOIN amenities a ON a.code = 'BALCONY'
WHERE rt.code IN ('DELUXE_RIVER','OCEAN_DELUXE','OCEAN_VILLA')
ON CONFLICT DO NOTHING;

INSERT INTO rate_plans (
 id, room_type_id, code, name, meal_plan, cancellation_type, cancellation_days,
 prepayment_type, refundable, pay_at_property, description, active
)
SELECT
 CASE rt.id
   WHEN '20000000-0000-0000-0000-000000000001'::uuid THEN '30000000-0000-0000-0000-000000000001'::uuid
   WHEN '20000000-0000-0000-0000-000000000002'::uuid THEN '30000000-0000-0000-0000-000000000003'::uuid
   WHEN '20000000-0000-0000-0000-000000000003'::uuid THEN '30000000-0000-0000-0000-000000000005'::uuid
   WHEN '20000000-0000-0000-0000-000000000004'::uuid THEN '30000000-0000-0000-0000-000000000007'::uuid
   WHEN '20000000-0000-0000-0000-000000000005'::uuid THEN '30000000-0000-0000-0000-000000000009'::uuid
   WHEN '20000000-0000-0000-0000-000000000006'::uuid THEN '30000000-0000-0000-0000-000000000011'::uuid
   WHEN '20000000-0000-0000-0000-000000000007'::uuid THEN '30000000-0000-0000-0000-000000000013'::uuid
   ELSE '30000000-0000-0000-0000-000000000015'::uuid END,
 rt.id, 'FLEX', 'Linh hoạt - có bữa sáng', 'BREAKFAST_INCLUDED', 'FREE_UNTIL_DAYS', 3,
 'NONE', TRUE, TRUE, 'Hủy miễn phí trước 3 ngày. Thanh toán tại chỗ nghỉ.', TRUE
FROM room_types rt
ON CONFLICT DO NOTHING;

INSERT INTO rate_plans (
 id, room_type_id, code, name, meal_plan, cancellation_type, cancellation_days,
 prepayment_type, refundable, pay_at_property, description, active
)
SELECT
 CASE rt.id
   WHEN '20000000-0000-0000-0000-000000000001'::uuid THEN '30000000-0000-0000-0000-000000000002'::uuid
   WHEN '20000000-0000-0000-0000-000000000002'::uuid THEN '30000000-0000-0000-0000-000000000004'::uuid
   WHEN '20000000-0000-0000-0000-000000000003'::uuid THEN '30000000-0000-0000-0000-000000000006'::uuid
   WHEN '20000000-0000-0000-0000-000000000004'::uuid THEN '30000000-0000-0000-0000-000000000008'::uuid
   WHEN '20000000-0000-0000-0000-000000000005'::uuid THEN '30000000-0000-0000-0000-000000000010'::uuid
   WHEN '20000000-0000-0000-0000-000000000006'::uuid THEN '30000000-0000-0000-0000-000000000012'::uuid
   WHEN '20000000-0000-0000-0000-000000000007'::uuid THEN '30000000-0000-0000-0000-000000000014'::uuid
   ELSE '30000000-0000-0000-0000-000000000016'::uuid END,
 rt.id, 'SAVE10', 'Không hoàn tiền - tiết kiệm 10%', 'ROOM_ONLY', 'NON_REFUNDABLE', 0,
 'FULL', FALSE, FALSE, 'Thanh toán trước toàn bộ. Không hoàn tiền khi hủy.', TRUE
FROM room_types rt
ON CONFLICT DO NOTHING;

-- Generate 365 days of inventory for every room type.
INSERT INTO inventory_calendar (room_type_id, stay_date, allotment, reserved_rooms, stop_sell, min_stay)
SELECT rt.id, d::date, rt.total_rooms, 0, FALSE,
       CASE WHEN EXTRACT(MONTH FROM d) IN (6,7,8) AND rt.property_id = '10000000-0000-0000-0000-000000000004'::uuid THEN 2 ELSE 1 END
FROM room_types rt
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '364 days', INTERVAL '1 day') d
ON CONFLICT DO NOTHING;

-- Base daily prices by room type, with weekend and high-season adjustments.
INSERT INTO rate_calendar (rate_plan_id, stay_date, price, original_price, currency, available)
SELECT rp.id,
       d::date,
       ROUND((base.base_price
          * CASE WHEN EXTRACT(ISODOW FROM d) IN (6,7) THEN 1.15 ELSE 1 END
          * CASE WHEN EXTRACT(MONTH FROM d) IN (6,7,8) THEN 1.10 ELSE 1 END
          * CASE WHEN rp.code = 'SAVE10' THEN 0.90 ELSE 1 END)::numeric, 0),
       CASE WHEN rp.code = 'SAVE10' THEN
          ROUND((base.base_price
            * CASE WHEN EXTRACT(ISODOW FROM d) IN (6,7) THEN 1.15 ELSE 1 END
            * CASE WHEN EXTRACT(MONTH FROM d) IN (6,7,8) THEN 1.10 ELSE 1 END)::numeric, 0)
       ELSE NULL END,
       'VND', TRUE
FROM rate_plans rp
JOIN room_types rt ON rt.id = rp.room_type_id
JOIN LATERAL (
  SELECT CASE rt.code
    WHEN 'DELUXE_RIVER' THEN 1350000
    WHEN 'FAMILY_SUITE' THEN 2100000
    WHEN 'SUPERIOR' THEN 1450000
    WHEN 'EXECUTIVE' THEN 2200000
    WHEN 'STUDIO' THEN 1250000
    WHEN 'TWO_BEDROOM' THEN 2450000
    WHEN 'OCEAN_DELUXE' THEN 2850000
    ELSE 7800000 END::numeric AS base_price
) base ON TRUE
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '364 days', INTERVAL '1 day') d
ON CONFLICT DO NOTHING;

UPDATE app_users
SET email_verified = TRUE
WHERE email IN ('admin@roomease.vn', 'manager@roomease.vn', 'user@roomease.vn');
