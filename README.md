# RoomEase Full Roles

RoomEase là dự án đặt phòng khách sạn dùng **React 19 + Vite**, **Spring Boot 4 + Java 21** và **Supabase PostgreSQL**. Bộ mã nguồn này đã tách rõ ba cổng sử dụng nhưng vẫn dùng chung một backend, JWT và database.

## Ba cổng riêng biệt

| Cổng | URL đăng nhập | Role bắt buộc | Khu vực sau đăng nhập |
|---|---|---|---|
| Customer | `http://localhost:5173/login` | `CUSTOMER` | `/`, `/bookings`, `/favourites` |
| Manager | `http://localhost:5173/manager/login` | `HOTEL_MANAGER` | `/manager/**` |
| Admin | `http://localhost:5173/admin/login` | `ADMIN` | `/admin/**` |

Backend cũng tách endpoint đăng nhập:

```text
POST /api/v1/auth/customer/login
POST /api/v1/auth/customer/register
POST /api/v1/auth/customer/google
POST /api/v1/auth/manager/login
POST /api/v1/auth/admin/login
```

Tài khoản sai role sẽ không thể đăng nhập nhầm cổng.

## Cấu trúc frontend

```text
fe/src/
├── auth/                    Context, route guard, ba trang login
├── customer/                Layout, components và pages Customer
├── manager/                 Layout và pages HOTEL_MANAGER
├── admin/                   Layout và pages ADMIN
├── api/
│   ├── customer/
│   ├── manager/
│   └── admin/
└── shared/                  Components và utils dùng chung
```

## Chức năng Customer

- Tìm kiếm và lọc chỗ nghỉ.
- Xem chi tiết khách sạn, loại phòng và gói giá.
- Đặt phòng, xem booking và tự hủy theo điều kiện.
- Danh sách yêu thích.
- Đánh giá sau khi hoàn thành booking.
- Đăng nhập email/mật khẩu hoặc Google.

## Chức năng Manager

- Dashboard doanh thu, booking và hoạt động hôm nay.
- CRUD chỗ nghỉ, ảnh, tiện nghi và chính sách.
- CRUD loại phòng, ảnh phòng và sức chứa.
- CRUD gói giá.
- Quản lý giá, allotment và tồn phòng theo từng ngày.
- Stop-sell, CTA/CTD, min/max stay.
- Lọc, xem chi tiết và chuyển trạng thái booking.
- Chỉ thấy dữ liệu thuộc những chỗ nghỉ do chính manager sở hữu.

## Chức năng Admin

- Dashboard toàn hệ thống.
- Quản lý tất cả tài khoản và phân quyền.
- Khóa/mở tài khoản.
- Chuyển role `CUSTOMER`, `HOTEL_MANAGER`, `ADMIN`.
- Kiểm duyệt trạng thái chỗ nghỉ.
- Gắn/bỏ nổi bật và phân công manager sở hữu chỗ nghỉ.
- Xem và xử lý toàn bộ booking.

## Tài khoản demo

| Cổng | Email | Mật khẩu |
|---|---|---|
| Customer | `user@roomease.vn` | `User@123` |
| Manager | `manager@roomease.vn` | `Manager@123` |
| Admin | `admin@roomease.vn` | `Admin@123` |

## 1. Chuẩn bị database

### Database mới

Trong Supabase SQL Editor, chạy lần lượt:

```text
database/01_schema.sql
database/02_seed.sql
```

Sau đó đặt `FLYWAY_ENABLED=false` trong `be/.env`.

### Database RoomEase cũ

Chạy thêm:

```text
database/04_role_portal_upgrade.sql
database/05_repair_column_types.sql
```

`04_role_portal_upgrade.sql` thêm dữ liệu Google. `05_repair_column_types.sql` đồng bộ kiểu PostgreSQL với entity Java để tránh lỗi Hibernate schema validation.

## 2. Cấu hình backend

```powershell
cd be
Copy-Item .env.example .env
```

Sửa `be/.env`:

```env
DB_URL=jdbc:postgresql://YOUR_HOST:5432/postgres?sslmode=require
DB_USERNAME=YOUR_USERNAME
DB_PASSWORD=YOUR_PASSWORD
JWT_SECRET=YOUR_BASE64_SECRET_AT_LEAST_64_BYTES
CORS_ALLOWED_ORIGINS=http://localhost:5173
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
SPRING_PROFILES_ACTIVE=dev
FLYWAY_ENABLED=false
```

Chạy:

```powershell
Get-Content .env | ForEach-Object {
  if ($_ -match '^(?<key>[^#=]+)=(?<value>.*)$') {
    [Environment]::SetEnvironmentVariable($matches.key.Trim(), $matches.value.Trim(), 'Process')
  }
}
.\mvnw.cmd clean spring-boot:run
```

Backend thành công khi thấy:

```text
Tomcat started on port 8080
Started RoomEaseApplication
```

## 3. Cấu hình frontend

```powershell
cd fe
Copy-Item .env.example .env
npm install
npm run dev
```

`fe/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

## Google Cloud

Authorized JavaScript origins:

```text
http://localhost:5173
```

Google login được dành cho Customer. Manager và Admin dùng email/mật khẩu để tránh đăng nhập nhầm cổng.

## Kiểm tra nhanh

```text
Customer: http://localhost:5173/login
Manager:  http://localhost:5173/manager/login
Admin:    http://localhost:5173/admin/login
```

## Lưu ý

- Không commit `be/.env` hoặc `fe/.env`.
- Thanh toán hiện là luồng mô phỏng, không lưu số thẻ thật.
- Manager không thể xem hoặc sửa chỗ nghỉ của manager khác.
- Admin có toàn quyền nền tảng nhưng frontend Admin và Manager được tách thành hai layout riêng.
