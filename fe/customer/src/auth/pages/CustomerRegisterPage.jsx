import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'

export default function RegisterPage() {
  const { customerRegister } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const submit = async (e) => { e.preventDefault(); setLoading(true); setError('')
    try { await customerRegister(form); navigate('/') } catch (e2) { setError(apiMessage(e2)) } finally { setLoading(false) } }
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><Link className="brand dark-brand" to="/">Room<span>Ease</span></Link><h1>Tạo tài khoản</h1>
    <p>Đăng ký để đặt phòng và theo dõi chuyến đi.</p><ErrorAlert message={error} />
    <label>Họ và tên<input name="fullName" value={form.fullName} onChange={change} required /></label>
    <label>Email<input type="email" name="email" value={form.email} onChange={change} required /></label>
    <label>Số điện thoại<input name="phone" value={form.phone} onChange={change} /></label>
    <label>Mật khẩu<input type="password" name="password" minLength="8" value={form.password} onChange={change} required /></label>
    <button className="btn btn-primary btn-large" disabled={loading}>{loading ? 'Đang tạo...' : 'Đăng ký'}</button><p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p></form></main>
}
