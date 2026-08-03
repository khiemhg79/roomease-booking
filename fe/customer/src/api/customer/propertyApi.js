import http from '../http'

export const propertyApi = {
  featured: () => http.get('/properties/featured').then((r) => r.data.data),
  search: (params) => http.get('/properties/search', { params }).then((r) => r.data.data),
  detail: (slug, params = {}) => http.get(`/properties/${slug}`, { params }).then((r) => r.data.data),
  reviews: (propertyId, page = 0) =>
    http.get(`/reviews/property/${propertyId}`, { params: { page, size: 10 } }).then((r) => r.data.data),
}
