import http from '../http'
const unwrap = (response) => response.data.data
export const adminApi = {
  dashboard: () => http.get('/admin/dashboard').then(unwrap),
  users: (params) => http.get('/admin/users', { params }).then(unwrap),
  updateUserStatus: (id, status) => http.patch(`/admin/users/${id}/status`, { status }).then(unwrap),
  updateUserRole: (id, role) => http.patch(`/admin/users/${id}/role`, { role }).then(unwrap),
  properties: (params) => http.get('/admin/properties', { params }).then(unwrap),
  moderateProperty: (id, payload) => http.patch(`/admin/properties/${id}`, payload).then(unwrap),
  bookings: (params) => http.get('/admin/bookings', { params }).then(unwrap),
  booking: (code) => http.get(`/admin/bookings/${code}`).then(unwrap),
  updateBookingStatus: (code, payload) => http.patch(`/admin/bookings/${code}/status`, payload).then(unwrap),
}
