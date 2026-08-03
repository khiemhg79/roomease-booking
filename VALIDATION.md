# Validation notes

- Đã gom frontend vào một thư mục `fe`, gồm `fe/customer`, `fe/manager`, `fe/admin`.
- Đã đặt `strictPort: true` lần lượt cho 5173, 5174 và 5175.
- Đã kiểm tra toàn bộ import nội bộ trong ba frontend đều trỏ tới file tồn tại.
- Đã cập nhật CORS backend cho cả ba origin.
- Đã sửa query `countByCheckIn` và `countByCheckOut` trong `BookingRepository` bằng JPQL.
- Không chạy được `npm install` trong môi trường đóng gói vì registry nội bộ không có gói Vite yêu cầu; cần chạy `npm install` trên máy người dùng.
- Không có Maven trong môi trường đóng gói; cần chạy `mvn clean spring-boot:run` trên máy người dùng.
