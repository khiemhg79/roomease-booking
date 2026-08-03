# Cơ sở dữ liệu Supabase PostgreSQL

## File cần chạy

1. `01_schema.sql`: tạo extension, hàm, 18 bảng, khóa ngoại, ràng buộc, index, trigger và RLS.
2. `02_seed.sql`: thêm tiện nghi, 4 chỗ nghỉ mẫu, loại phòng, gói giá và lịch tồn kho/giá trong 365 ngày.
3. `03_useful_queries.sql`: các câu SQL kiểm tra và báo cáo thường dùng.

## Import thủ công vào Supabase

1. Mở Supabase Dashboard → **SQL Editor** → **New query**.
2. Dán toàn bộ `01_schema.sql`, nhấn **Run**.
3. Tạo query mới, dán toàn bộ `02_seed.sql`, nhấn **Run**.
4. Trong backend đặt `FLYWAY_ENABLED=false`, vì schema đã được tạo thủ công.

## Để Spring Boot tự import

Không chạy SQL thủ công. Đặt `FLYWAY_ENABLED=true`; khi backend khởi động, Flyway chạy:

- `V1__schema.sql`
- `V2__seed_demo.sql`

## Các nhóm bảng

| Nhóm | Bảng |
|---|---|
| Tài khoản | `app_users` |
| Chỗ nghỉ | `properties`, `property_images`, `property_policies` |
| Tiện nghi | `amenities`, `property_amenities`, `room_amenities` |
| Phòng và giá | `room_types`, `room_type_images`, `rate_plans` |
| Tồn kho theo ngày | `inventory_calendar`, `rate_calendar` |
| Đặt phòng | `bookings`, `booking_rooms`, `booking_status_history` |
| Thanh toán | `payments` |
| Tương tác | `reviews`, `favourites` |

## Tài khoản mẫu

- Admin: `admin@roomease.vn` / `Admin@123`
- Hotel manager: `manager@roomease.vn` / `Manager@123`
- Khách hàng: `user@roomease.vn` / `User@123`

Mật khẩu trong `app_users.password_hash` đã được BCrypt hóa. Không lưu mật khẩu dạng văn bản.

## Bảo mật Supabase

React không dùng database password, anon key hay service role để đọc các bảng nghiệp vụ. React gọi Spring Boot; Spring Boot dùng JDBC kết nối Supabase PostgreSQL. Các bảng trong `public` đã bật RLS và thu hồi quyền trực tiếp của `anon`, `authenticated`.
