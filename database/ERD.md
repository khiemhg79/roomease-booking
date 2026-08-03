# ERD RoomEase

```mermaid
erDiagram
    APP_USERS ||--o{ PROPERTIES : owns
    APP_USERS ||--o{ BOOKINGS : places
    APP_USERS ||--o{ REVIEWS : writes
    APP_USERS ||--o{ FAVOURITES : saves

    PROPERTIES ||--o{ PROPERTY_IMAGES : has
    PROPERTIES ||--o{ PROPERTY_AMENITIES : offers
    AMENITIES ||--o{ PROPERTY_AMENITIES : links
    PROPERTIES ||--|| PROPERTY_POLICIES : defines
    PROPERTIES ||--o{ ROOM_TYPES : contains
    PROPERTIES ||--o{ BOOKINGS : receives
    PROPERTIES ||--o{ REVIEWS : receives
    PROPERTIES ||--o{ FAVOURITES : saved_by

    ROOM_TYPES ||--o{ ROOM_TYPE_IMAGES : has
    ROOM_TYPES ||--o{ ROOM_AMENITIES : offers
    AMENITIES ||--o{ ROOM_AMENITIES : links
    ROOM_TYPES ||--o{ RATE_PLANS : sells_with
    ROOM_TYPES ||--o{ INVENTORY_CALENDAR : inventory_by_date
    ROOM_TYPES ||--o{ BOOKING_ROOMS : booked_as

    RATE_PLANS ||--o{ RATE_CALENDAR : price_by_date
    RATE_PLANS ||--o{ BOOKING_ROOMS : selected_as

    BOOKINGS ||--o{ BOOKING_ROOMS : contains
    BOOKINGS ||--o{ BOOKING_STATUS_HISTORY : changes
    BOOKINGS ||--o{ PAYMENTS : paid_by
    BOOKINGS ||--o| REVIEWS : reviewed_once
```

## Ý nghĩa hai bảng lịch

- `inventory_calendar`: tồn phòng của **một loại phòng trong một ngày**. Phòng còn lại = `allotment - reserved_rooms`.
- `rate_calendar`: giá bán của **một gói giá trong một ngày**. Một loại phòng có thể có gói linh hoạt, không hoàn tiền, kèm bữa sáng…

Không nên chỉ lưu một cột `total_rooms` và `price_per_night`, vì cuối tuần, mùa cao điểm, đóng bán và số phòng còn lại đều thay đổi theo ngày.
