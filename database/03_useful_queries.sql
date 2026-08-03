-- 1. Kiểm tra các bảng đã tạo.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Kiểm tra số phòng còn lại của một loại phòng theo ngày.
SELECT stay_date, allotment, reserved_rooms,
       allotment - reserved_rooms AS available_rooms,
       stop_sell, min_stay, max_stay
FROM inventory_calendar
WHERE room_type_id = '20000000-0000-0000-0000-000000000001'
ORDER BY stay_date
LIMIT 30;

-- 3. Xem giá theo ngày của các gói giá.
SELECT p.name AS property_name, rt.name AS room_name, rp.name AS rate_plan,
       rc.stay_date, rc.price, rc.original_price, rc.currency
FROM rate_calendar rc
JOIN rate_plans rp ON rp.id = rc.rate_plan_id
JOIN room_types rt ON rt.id = rp.room_type_id
JOIN properties p ON p.id = rt.property_id
ORDER BY rc.stay_date, p.name, rt.name
LIMIT 100;

-- 4. Kiểm tra booking và các dòng phòng.
SELECT b.booking_code, b.status, b.payment_status, p.name AS property_name,
       b.check_in, b.check_out, b.rooms_count, b.total_amount,
       br.room_name_snapshot, br.rate_plan_name_snapshot, br.quantity
FROM bookings b
JOIN properties p ON p.id = b.property_id
JOIN booking_rooms br ON br.booking_id = b.id
ORDER BY b.created_at DESC;

-- 5. Doanh thu theo tháng, chỉ tính booking hoàn tất/đã xác nhận/đã nhận phòng.
SELECT date_trunc('month', created_at) AS month,
       COUNT(*) AS bookings,
       SUM(total_amount) AS gross_booking_value
FROM bookings
WHERE status IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED')
GROUP BY 1
ORDER BY 1 DESC;

-- 6. Chỗ nghỉ sắp hết phòng trong 14 ngày tới.
SELECT p.name, rt.name AS room_type, ic.stay_date,
       ic.allotment - ic.reserved_rooms AS remaining
FROM inventory_calendar ic
JOIN room_types rt ON rt.id = ic.room_type_id
JOIN properties p ON p.id = rt.property_id
WHERE ic.stay_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 14
  AND ic.stop_sell = FALSE
  AND ic.allotment - ic.reserved_rooms <= 2
ORDER BY ic.stay_date, remaining;
