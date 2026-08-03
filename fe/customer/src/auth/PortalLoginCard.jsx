import {
  useState,
} from 'react'

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { apiMessage } from '@/api/http'
import GoogleLoginButton from '@/auth/GoogleLoginButton'
import ErrorAlert from '@/shared/components/ErrorAlert'

export default function PortalLoginCard({
  portal,
  title,
  description,
  defaultEmail,
  defaultPassword,
  login,
  home,
  googleLogin = null,
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({
    email: defaultEmail,
    password: defaultPassword,
  })

  const [error, setError] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const finishLogin = () => {
    const destination =
      location.state?.from || home

    navigate(destination, {
      replace: true,
    })
  }

  const submit = async (event) => {
    event.preventDefault()

    setLoading(true)
    setError('')

    try {
      await login(form)
      finishLogin()
    } catch (requestError) {
      setError(
        apiMessage(requestError),
      )
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle =
    async (credential) => {
      if (!googleLogin) {
        return
      }

      setLoading(true)
      setError('')

      try {
        await googleLogin(credential)
        finishLogin()
      } catch (requestError) {
        setError(
          apiMessage(requestError),
        )
      } finally {
        setLoading(false)
      }
    }

  return (
    <main
      className={
        `portal-login-page portal-${portal.toLowerCase()
        }`
      }
    >
      <section className="portal-login-aside">
        <Link
          className="brand"
          to={home}
        >
          Room<span>Ease</span>
        </Link>

        <div>
          <span className="portal-badge">
            Khách hàng
          </span>

          <h1>{title}</h1>

          <p>{description}</p>
        </div>
      </section>

      <form
        className="portal-login-card"
        onSubmit={submit}
      >
        <div>
          <p className="portal-kicker">
            RoomEase Customer
          </p>

          <h2>Đăng nhập</h2>

          <p>
            Đăng nhập để đặt phòng và quản lý
            chuyến đi của bạn.
          </p>
        </div>

        <ErrorAlert message={error} />

        <label>
          Email

          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm({
                ...form,
                email: event.target.value,
              })
            }
            required
            autoComplete="email"
          />
        </label>

        <label>
          Mật khẩu

          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm({
                ...form,
                password: event.target.value,
              })
            }
            required
            autoComplete="current-password"
          />
        </label>

        <button
          className="btn btn-primary btn-large"
          type="submit"
          disabled={loading}
        >
          {loading
            ? 'Đang đăng nhập...'
            : 'Đăng nhập'}
        </button>

        {googleLogin && (
          <>
            <div className="auth-divider">
              <span>hoặc</span>
            </div>

            <GoogleLoginButton
              onCredential={loginWithGoogle}
              disabled={loading}
            />
          </>
        )}

        <p>
          Chưa có tài khoản?{' '}
          <Link to="/register">
            Đăng ký khách hàng
          </Link>
        </p>
      </form>
    </main>
  )
}