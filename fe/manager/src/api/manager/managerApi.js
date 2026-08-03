import http from '../http'

const unwrap = (response) => response.data.data

export const managerApi = {
  dashboard: () => http.get('/manager/dashboard').then(unwrap),
  amenities: () => http.get('/manager/amenities').then(unwrap),

  properties: () => http.get('/manager/properties').then(unwrap),
  property: (propertyId) => http.get(`/manager/properties/${propertyId}`).then(unwrap),
  createProperty: (payload) => http.post('/manager/properties', payload).then(unwrap),
  updateProperty: (propertyId, payload) =>
    http.put(`/manager/properties/${propertyId}`, payload).then(unwrap),
  updatePropertyStatus: (propertyId, status) =>
    http.patch(`/manager/properties/${propertyId}/status`, { status }).then(unwrap),
  archiveProperty: (propertyId) => http.delete(`/manager/properties/${propertyId}`).then(unwrap),

  rooms: (propertyId) => http.get(`/manager/properties/${propertyId}/rooms`).then(unwrap),
  createRoom: (propertyId, payload) =>
    http.post(`/manager/properties/${propertyId}/rooms`, payload).then(unwrap),
  updateRoom: (roomTypeId, payload) =>
    http.put(`/manager/rooms/${roomTypeId}`, payload).then(unwrap),
  setRoomActive: (roomTypeId, active) =>
    http.patch(`/manager/rooms/${roomTypeId}/active`, { active }).then(unwrap),

  ratePlans: (roomTypeId) => http.get(`/manager/rooms/${roomTypeId}/rate-plans`).then(unwrap),
  createRatePlan: (roomTypeId, payload) =>
    http.post(`/manager/rooms/${roomTypeId}/rate-plans`, payload).then(unwrap),
  updateRatePlan: (ratePlanId, payload) =>
    http.put(`/manager/rate-plans/${ratePlanId}`, payload).then(unwrap),
  setRatePlanActive: (ratePlanId, active) =>
    http.patch(`/manager/rate-plans/${ratePlanId}/active`, { active }).then(unwrap),

  calendar: (params) => http.get('/manager/calendar', { params }).then(unwrap),
  updateCalendar: (payload) => http.put('/manager/calendar', payload).then(unwrap),

  bookings: (params) => http.get('/manager/bookings', { params }).then(unwrap),
  booking: (bookingCode) => http.get(`/manager/bookings/${bookingCode}`).then(unwrap),
  updateBookingStatus: (bookingCode, payload) =>
    http.patch(`/manager/bookings/${bookingCode}/status`, payload).then(unwrap),
}
