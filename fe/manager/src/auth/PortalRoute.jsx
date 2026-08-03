import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

export default function PortalRoute({ children, roles, loginPath }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={loginPath} replace state={{ roleMismatch: true }} />
  }

  return children
}
