import { useCallback, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'
import GoogleLoginButton from '@/auth/GoogleLoginButton'

const CUSTOMER_URL = import.meta.env.VITE_CUSTOMER_URL || 'http://localhost:5173'
const MANAGER_URL = import.meta.env.VITE_MANAGER_URL || 'http://localhost:5174'
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5175'

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
  const [form, setForm] = useState({ email: defaultEmail, password: defaultPassword })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const finish = () => navigate(location.state?.from || home, { replace: true })

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form)
      finish()
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  const google = useCallback(async (credential) => {
    setLoading(true)
    setError('')
    try {
      await googleLogin(credential)
      finish()
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [googleLogin])

  return (
    <main className={`portal-login-page portal-${portal.toLowerCase()}`}>
      <section className="portal-login-aside">
        <Link className="brand" to={home}>Room<span>Ease</span></Link>
        <div>
          <span className="portal-badge">{portal}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="portal-switcher">
          <span>Chuyển cổng đăng nhập</span>
          <a href={`${CUSTOMER_URL}/login`}>Khách hàng · 5173</a>
          <a href={`${MANAGER_URL}/manager/login`}>Manager · 5174</a>
          <a href={`${ADMIN_URL}/admin/login`}>Admin · 5175</a>
        </div>
      </section>

      <form className="portal-login-card" onSubmit={submit}>
        <div>
          <p className="portal-kicker">{portal}</p>
          <h2>Đăng nhập</h2>
          <p>Dùng đúng tài khoản thuộc vai trò của cổng này.</p>
        </div>
        <ErrorAlert message={error} />
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
            autoComplete="current-password"
          />
        </label>
        <button className="btn btn-primary btn-large" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : `Đăng nhập ${portal}`}
        </button>
        {googleLogin && (
          <>
            <div className="auth-divider"><span>hoặc</span></div>
            <GoogleLoginButton onCredential={google} disabled={loading} />
          </>
        )}
        <small>Tài khoản không đúng role sẽ bị backend từ chối.</small>
        {portal === 'CUSTOMER' && (
          <p>Chưa có tài khoản? <Link to="/register">Đăng ký khách hàng</Link></p>
        )}
      </form>
    </main>
  )
}
