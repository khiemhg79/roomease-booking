# RoomEase REST API

Base URL: `http://localhost:8080/api/v1`

## Authentication portals

| Method | Endpoint | Role returned |
|---|---|---|
| POST | `/auth/customer/register` | `CUSTOMER` |
| POST | `/auth/customer/login` | Only `CUSTOMER` accounts |
| POST | `/auth/customer/google` | Only `CUSTOMER` accounts |
| POST | `/auth/manager/login` | Only `HOTEL_MANAGER` accounts |
| POST | `/auth/admin/login` | Only `ADMIN` accounts |
| GET | `/auth/me` | Current authenticated profile |

Legacy `/auth/register`, `/auth/login`, `/auth/google` remain aliases of the Customer portal.

## Public property APIs

| Method | Endpoint | Function |
|---|---|---|
| GET | `/properties/featured` | Featured properties |
| GET | `/properties/search` | Search, filter and availability |
| GET | `/properties/{slug}` | Property details and room offers |
| GET | `/reviews/property/{propertyId}` | Public reviews |

## Customer — `ROLE_CUSTOMER`

| Method | Endpoint | Function |
|---|---|---|
| POST | `/bookings` | Create booking transactionally |
| GET | `/bookings/me` | Customer booking history |
| GET | `/bookings/{bookingCode}` | Own booking details |
| PATCH | `/bookings/{bookingCode}/cancel` | Cancel within allowed deadline |
| GET | `/favourites` | Saved properties |
| POST | `/favourites/{propertyId}/toggle` | Add/remove favourite |
| POST | `/reviews` | Review a completed booking |

## Manager — `ROLE_HOTEL_MANAGER`

| Method | Endpoint | Function |
|---|---|---|
| GET | `/manager/dashboard` | Property and booking dashboard |
| GET/POST | `/manager/properties` | List/create owned properties |
| GET/PUT/DELETE | `/manager/properties/{propertyId}` | View/update/archive property |
| PATCH | `/manager/properties/{propertyId}/status` | Change sale status |
| GET/POST | `/manager/properties/{propertyId}/rooms` | List/create room types |
| PUT | `/manager/rooms/{roomTypeId}` | Update room type |
| PATCH | `/manager/rooms/{roomTypeId}/active` | Enable/disable room type |
| GET/POST | `/manager/rooms/{roomTypeId}/rate-plans` | Rate plans |
| PUT | `/manager/rate-plans/{ratePlanId}` | Update rate plan |
| PATCH | `/manager/rate-plans/{ratePlanId}/active` | Enable/disable rate plan |
| GET/PUT | `/manager/calendar` | Price and inventory calendar |
| GET | `/manager/bookings` | Bookings of owned properties |
| GET | `/manager/bookings/{bookingCode}` | Booking details |
| PATCH | `/manager/bookings/{bookingCode}/status` | Booking workflow |

Manager service checks property ownership in addition to URL security.

## Admin — `ROLE_ADMIN`

| Method | Endpoint | Function |
|---|---|---|
| GET | `/admin/dashboard` | System-wide metrics |
| GET | `/admin/users` | Search/filter accounts |
| PATCH | `/admin/users/{userId}/status` | Activate/block/pending |
| PATCH | `/admin/users/{userId}/role` | Change platform role |
| GET | `/admin/properties` | Search all properties |
| PATCH | `/admin/properties/{propertyId}` | Moderate, feature, assign manager |
| GET | `/admin/bookings` | Search all bookings |
| GET | `/admin/bookings/{bookingCode}` | Booking details |
| PATCH | `/admin/bookings/{bookingCode}/status` | Update booking state |

## Booking state flow

```text
PENDING -> CONFIRMED -> CHECKED_IN -> COMPLETED
    |          |
    +----------+----> CANCELLED
               +----> NO_SHOW
```

Cancellation releases reserved inventory inside the same transaction.
