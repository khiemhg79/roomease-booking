import { useState } from 'react'
import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'

export default function PortalLoginCard({
  title,
  description,
  defaultEmail = '',
  defaultPassword = '',
  login,
  home,
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({
    email: defaultEmail,
    password: defaultPassword,
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setLoading(true)
    setError('')

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      })

      const destination =
        location.state?.from || home

      navigate(destination, {
        replace: true,
      })
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="portal-login-page portal-admin">
      <section className="portal-login-aside">
        <div className="brand">
          Room<span>Ease</span>
        </div>

        <div>
          <span className="portal-badge">
            SYSTEM ADMIN
          </span>

          <h1>{title}</h1>

          <p>{description}</p>
        </div>
      </section>

      <section className="portal-login-form-side">
        <form
          className="portal-login-card"
          onSubmit={handleSubmit}
        >
          <div className="portal-login-heading">
            <p className="portal-kicker">
              ROOMEASE ADMIN
            </p>

            <h2>Đăng nhập Admin</h2>

            <p>
              Quản lý người dùng, chỗ nghỉ,
              manager và toàn bộ hệ thống.
            </p>
          </div>

          <ErrorAlert message={error} />

          <label>
            Email Admin

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              disabled={loading}
            />
          </label>

          <label>
            Mật khẩu

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </label>

          <button
            className="btn btn-primary btn-large"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Đang đăng nhập...'
              : 'Đăng nhập Admin'}
          </button>

          <small className="portal-role-note">
            Tài khoản không có role ADMIN sẽ
            bị từ chối.
          </small>
        </form>
      </section>
    </main>
  )
}