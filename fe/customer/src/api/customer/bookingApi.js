import http from '../http'

export const bookingApi = {
  create: (payload) => http.post('/bookings', payload).then((r) => r.data.data),
  mine: (page = 0) => http.get('/bookings/me', { params: { page, size: 10 } }).then((r) => r.data.data),
  detail: (code) => http.get(`/bookings/${code}`).then((r) => r.data.data),
  cancel: (code) => http.patch(`/bookings/${code}/cancel`).then((r) => r.data.data),
}
