import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '@/api/authApi'
import { authStorage } from '@/api/http'

const AuthContext = createContext(null)
const expectedRole = import.meta.env.VITE_EXPECTED_ROLE || 'HOTEL_MANAGER'

function clearStoredAuth() {
  localStorage.removeItem(authStorage.tokenStorageKey)
  localStorage.removeItem(authStorage.userStorageKey)
  localStorage.removeItem(authStorage.portalStorageKey)
}

function readStoredUser() {
  try {
    const user = JSON.parse(localStorage.getItem(authStorage.userStorageKey))
    if (!user) return null
    if (expectedRole && user.role !== expectedRole) {
      clearStoredAuth()
      return null
    }
    return user
  } catch {
    clearStoredAuth()
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  useEffect(() => {
    const clear = () => setUser(null)
    window.addEventListener('roomease:unauthorized', clear)
    return () => window.removeEventListener('roomease:unauthorized', clear)
  }, [])

  const persist = (auth, portal) => {
    if (expectedRole && auth.user?.role !== expectedRole) {
      clearStoredAuth()
      throw new Error(`Tài khoản không thuộc role ${expectedRole}`)
    }
    localStorage.setItem(authStorage.tokenStorageKey, auth.accessToken)
    localStorage.setItem(authStorage.userStorageKey, JSON.stringify(auth.user))
    localStorage.setItem(authStorage.portalStorageKey, portal)
    setUser(auth.user)
    return auth.user
  }

  const customerLogin = async (payload) => persist(
    await authApi.customerLogin(payload),
    'CUSTOMER',
  )
  const customerRegister = async (payload) => persist(
    await authApi.customerRegister(payload),
    'CUSTOMER',
  )
  const customerGoogleLogin = async (credential) => persist(
    await authApi.customerGoogle(credential),
    'CUSTOMER',
  )
  const managerLogin = async (payload) => persist(
    await authApi.managerLogin(payload),
    'HOTEL_MANAGER',
  )
  const adminLogin = async (payload) => persist(
    await authApi.adminLogin(payload),
    'ADMIN',
  )

  const logout = () => {
    clearStoredAuth()
    setUser(null)
  }

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    customerLogin,
    customerRegister,
    customerGoogleLogin,
    managerLogin,
    adminLogin,
    logout,
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
