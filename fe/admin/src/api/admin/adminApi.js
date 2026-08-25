import http from '../http'

const unwrap = (response) => response.data.data

export const adminApi = {
  dashboard: () =>
    http
      .get('/admin/dashboard')
      .then(unwrap),

  users: (params = {}) =>
    http
      .get('/admin/users', { params })
      .then(unwrap),

  user: (userId) =>
    http
      .get(
        `/admin/users/${encodeURIComponent(userId)}`,
      )
      .then(unwrap),

  updateUserStatus: (userId, status) =>
    http
      .patch(
        `/admin/users/${encodeURIComponent(userId)}/status`,
        {
          status,
        },
      )
      .then(unwrap),

  updateUserRole: (userId, role) =>
    http
      .patch(
        `/admin/users/${encodeURIComponent(userId)}/role`,
        {
          role,
        },
      )
      .then(unwrap),

  properties: (params = {}) =>
    http
      .get('/admin/properties', { params })
      .then(unwrap),

  property: (propertyId) =>
    http
      .get(
        `/admin/properties/${encodeURIComponent(propertyId)}`,
      )
      .then(unwrap),

  moderateProperty: (
    propertyId,
    payload,
  ) =>
    http
      .patch(
        `/admin/properties/${encodeURIComponent(propertyId)}`,
        payload,
      )
      .then(unwrap),

  bookings: (params = {}) =>
    http
      .get('/admin/bookings', { params })
      .then(unwrap),

  booking: (bookingCode) =>
    http
      .get(
        `/admin/bookings/${encodeURIComponent(bookingCode)}`,
      )
      .then(unwrap),

  updateBookingStatus: (
    bookingCode,
    payload,
  ) =>
    http
      .patch(
        `/admin/bookings/${encodeURIComponent(bookingCode)}/status`,
        payload,
      )
      .then(unwrap),

  reviews: (params = {}) =>
    http
      .get('/admin/reviews', { params })
      .then(unwrap),

  updateReviewStatus: (
    reviewId,
    status,
  ) =>
    http
      .patch(
        `/admin/reviews/${encodeURIComponent(reviewId)}/status`,
        {
          status,
        },
      )
      .then(unwrap),
}

export default adminApi