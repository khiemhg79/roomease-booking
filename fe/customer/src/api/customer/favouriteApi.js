import http from '../http'

export const favouriteApi = {
  list: () => http.get('/favourites').then((r) => r.data.data),
  toggle: (propertyId) => http.post(`/favourites/${propertyId}/toggle`).then((r) => r.data.data),
}
