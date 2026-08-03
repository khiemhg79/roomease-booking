# Role and portal architecture

RoomEase uses one Spring Boot API and one PostgreSQL/Supabase database, but deploys three independent React/Vite frontends.

## Frontend applications

```text
CUSTOMER       fe/customer  http://localhost:5173
HOTEL_MANAGER  fe/manager   http://localhost:5174
ADMIN          fe/admin     http://localhost:5175
```

Each application has its own:

- Vite server and port.
- login page and route tree.
- layout and feature pages.
- role guard.
- localStorage token namespace.

The three applications still share the same API contract and backend.

## Login endpoints

```text
POST /api/v1/auth/customer/login
POST /api/v1/auth/customer/register
POST /api/v1/auth/customer/google
POST /api/v1/auth/manager/login
POST /api/v1/auth/admin/login
```

The backend authenticates credentials and verifies the required database role before issuing a JWT.

## Backend authorization

```text
/api/v1/bookings/**   ROLE_CUSTOMER
/api/v1/favourites/** ROLE_CUSTOMER
/api/v1/manager/**    ROLE_HOTEL_MANAGER or ROLE_ADMIN
/api/v1/admin/**      ROLE_ADMIN
```

Manager services additionally verify ownership of the requested property.
