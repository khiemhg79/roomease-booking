import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

const MANAGER_URL = import.meta.env.VITE_MANAGER_URL || 'http://localhost:5174'
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5175'

export default function CustomerHeader() {
  const { user, logout } = useAuth()
  const customer = user?.role === 'CUSTOMER'

  return (
    <header className="site-header">
      <div className="container header-row">
        <Link className="brand" to="/">Room<span>Ease</span></Link>

        <nav className="main-nav" aria-label="Điều hướng khách hàng">
          <NavLink to="/" end>Trang chủ</NavLink>
          {customer && <NavLink to="/bookings">Đặt phòng của tôi</NavLink>}
          {customer && <NavLink to="/favourites">Yêu thích</NavLink>}
        </nav>

        <div className="header-actions">
          {customer ? (
            <>
              <span className="user-chip">{user.fullName}</span>
              <button className="btn btn-ghost" type="button" onClick={logout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <a className="btn btn-ghost" href={`${MANAGER_URL}/manager/login`}>
                Manager
              </a>
              <a className="btn btn-ghost" href={`${ADMIN_URL}/admin/login`}>
                Admin
              </a>
              <Link className="btn btn-ghost" to="/register">Đăng ký</Link>
              <Link className="btn btn-light" to="/login">Đăng nhập</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
