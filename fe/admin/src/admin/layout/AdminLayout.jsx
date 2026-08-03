import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

const CUSTOMER_URL = import.meta.env.VITE_CUSTOMER_URL || 'http://localhost:5173'

const links = [
  { to: '/admin', end: true, icon: '◫', label: 'Tổng quan' },
  { to: '/admin/users', icon: '◎', label: 'Người dùng' },
  { to: '/admin/properties', icon: '⌂', label: 'Chỗ nghỉ' },
  { to: '/admin/bookings', icon: '✓', label: 'Booking' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const signOut = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <strong>Room<span>Ease</span></strong>
          <small>ADMIN CONTROL CENTER · 5175</small>
        </div>

        <nav className="admin-nav" aria-label="Điều hướng quản trị">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              <span>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-side-footer">
          <a href={CUSTOMER_URL}>Xem website khách hàng</a>
          <button onClick={signOut} type="button">Đăng xuất</button>
          <small>{user?.email}</small>
        </div>
      </aside>

      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  )
}
