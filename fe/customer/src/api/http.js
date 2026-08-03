import axios from 'axios'

const portalKey = import.meta.env.VITE_PORTAL_KEY || 'customer'
const tokenStorageKey = `roomease_${portalKey}_token`
const userStorageKey = `roomease_${portalKey}_user`
const portalStorageKey = `roomease_${portalKey}_portal`

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: { indexes: null },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(tokenStorageKey)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(tokenStorageKey)
      localStorage.removeItem(userStorageKey)
      localStorage.removeItem(portalStorageKey)
      window.dispatchEvent(new CustomEvent('roomease:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export function apiMessage(error) {
  return error?.response?.data?.message
    || error?.message
    || 'Có lỗi xảy ra. Vui lòng thử lại.'
}

export const authStorage = {
  tokenStorageKey,
  userStorageKey,
  portalStorageKey,
}

export default http
