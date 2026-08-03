import { Link, NavLink } from 'react-router-dom'

import { useAuth } from '@/auth/AuthContext'
import { useCompare } from '@/customer/context/CompareContext'

export default function CustomerHeader() {
  const { user, logout } = useAuth()
  const { count } = useCompare()
  const customer = user?.role === 'CUSTOMER'

  return (
    <header className="site-header">
      <div className="container header-row">
        <Link className="brand" to="/">
          Room<span>Ease</span>
        </Link>

        <nav className="main-nav" aria-label="Điều hướng khách hàng">
          <NavLink to="/" end>Trang chủ</NavLink>
          <NavLink to="/compare" className="nav-with-badge">
            So sánh
            {count > 0 && <span>{count}</span>}
          </NavLink>
          {customer && <NavLink to="/bookings">Đặt phòng của tôi</NavLink>}
          {customer && <NavLink to="/favourites">Yêu thích</NavLink>}
          {customer && <NavLink to="/account">Tài khoản</NavLink>}
        </nav>

        <div className="header-actions">
          {customer ? (
            <>
              <Link className="user-chip" to="/account">
                {user.fullName}
              </Link>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={logout}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/register">Đăng ký</Link>
              <Link className="btn btn-light" to="/login">Đăng nhập</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}