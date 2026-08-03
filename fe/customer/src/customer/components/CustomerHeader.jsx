import {
  Link,
  NavLink,
} from 'react-router-dom'

import { useAuth } from '@/auth/AuthContext'

export default function CustomerHeader() {
  const {
    user,
    logout,
  } = useAuth()

  const customer =
    user?.role === 'CUSTOMER'

  return (
    <header className="site-header">
      <div className="container header-row">
        <Link
          className="brand"
          to="/"
        >
          Room<span>Ease</span>
        </Link>

        <nav
          className="main-nav"
          aria-label="Điều hướng khách hàng"
        >
          <NavLink
            to="/"
            end
          >
            Trang chủ
          </NavLink>

          {customer && (
            <NavLink to="/bookings">
              Đặt phòng của tôi
            </NavLink>
          )}

          {customer && (
            <NavLink to="/favourites">
              Yêu thích
            </NavLink>
          )}
        </nav>

        <div className="header-actions">
          {customer ? (
            <>
              <span className="user-chip">
                {user.fullName}
              </span>

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
              <Link
                className="btn btn-ghost"
                to="/register"
              >
                Đăng ký
              </Link>

              <Link
                className="btn btn-light"
                to="/login"
              >
                Đăng nhập
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}