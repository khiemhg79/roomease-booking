export const PORTALS = {
  CUSTOMER: { role: 'CUSTOMER', home: '/', login: '/login', label: 'Khách hàng' },
  HOTEL_MANAGER: { role: 'HOTEL_MANAGER', home: '/manager', login: '/manager/login', label: 'Quản lý khách sạn' },
  ADMIN: { role: 'ADMIN', home: '/admin', login: '/admin/login', label: 'Quản trị viên' },
}

export function portalForRole(role) {
  return PORTALS[role] || PORTALS.CUSTOMER
}
