import http from '../http'

const unwrapData = (response) => response?.data?.data ?? null

export const bookingApi = {
  create: async (payload) => {
    const response = await http.post('/bookings', payload)
    return unwrapData(response)
  },

  mine: async (page = 0, size = 10) => {
    const response = await http.get('/bookings/me', {
      params: { page, size },
    })
    return unwrapData(response)
  },

  detail: async (code) => {
    const response = await http.get(
      `/bookings/${encodeURIComponent(code)}`,
    )
    return unwrapData(response)
  },

  cancel: async (code) => {
    const response = await http.patch(
      `/bookings/${encodeURIComponent(code)}/cancel`,
    )
    return unwrapData(response)
  },

  prepareSePay: async (bookingCode) => {
    const response = await http.post(
      `/payments/sepay/${encodeURIComponent(bookingCode)}/prepare`,
    )
    return unwrapData(response)
  },

  sePayStatus: async (bookingCode) => {
    const response = await http.get(
      `/payments/sepay/${encodeURIComponent(bookingCode)}/status`,
    )
    return unwrapData(response)
  },
}