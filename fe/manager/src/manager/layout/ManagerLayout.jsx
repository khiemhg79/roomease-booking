import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '@/auth/AuthContext'

const links = [
  {
    to: '/manager',
    end: true,
    icon: '▦',
    label: 'Tổng quan',
  },
  {
    to: '/manager/properties',
    icon: '⌂',
    label: 'Chỗ nghỉ',
  },
  {
    to: '/manager/calendar',
    icon: '▤',
    label: 'Giá và tồn phòng',
  },
  {
    to: '/manager/bookings',
    icon: '✓',
    label: 'Booking',
  },
]

export default function ManagerLayout() {
  const {
    user,
    logout,
  } = useAuth()

  const navigate = useNavigate()

  const signOut = () => {
    logout()

    navigate(
      '/manager/login',
      {
        replace: true,
      },
    )
  }

  return (
    <div className="manager-shell">
      <aside className="manager-sidebar">
        <div className="manager-sidebar-brand">
          <strong>
            Room<span>Ease</span>
          </strong>

          <small>
            Kênh HOTEL_MANAGER · 5174
          </small>
        </div>

        <nav
          className="manager-nav"
          aria-label="Điều hướng quản lý"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
            >
              <span>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="portal-side-links">
          <button
            type="button"
            onClick={signOut}
          >
            Đăng xuất
          </button>
        </div>

        <div className="manager-sidebar-user">
          <div className="manager-avatar">
            {(user?.fullName || 'M')
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {user?.fullName}
            </strong>

            <small>
              Quản lý khách sạn
            </small>
          </div>
        </div>
      </aside>

      <section className="manager-content">
        <Outlet />
      </section>
    </div>
  )
}