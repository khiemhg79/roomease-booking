import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingApi } from '@/api/customer/bookingApi'
import { apiMessage } from '@/api/http'
import { dateVN, money } from '@/shared/utils/format'
import Loading from '@/shared/components/Loading'
import ErrorAlert from '@/shared/components/ErrorAlert'

export default function MyBookingsPage() {
  const [data, setData] = useState({ content: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = () => bookingApi.mine().then(setData).catch((e) => setError(apiMessage(e))).finally(() => setLoading(false))
  useEffect(load, [])
  const cancel = async (code) => {
    if (!window.confirm('Bạn chắc chắn muốn hủy booking này?')) return
    try { await bookingApi.cancel(code); load() } catch (e) { setError(apiMessage(e)) }
  }
  return <main className="container page-section"><div className="section-heading"><div><p className="eyebrow dark">Tài khoản</p><h1>Đặt phòng của tôi</h1></div></div>
    <ErrorAlert message={error} />{loading ? <Loading /> : data.content.length ? <div className="booking-list">{data.content.map((b) => <article className="booking-card" key={b.id}>
      <div className="booking-code"><span>Mã booking</span><strong>{b.bookingCode}</strong><em className={`status status-${b.status.toLowerCase()}`}>{b.status}</em></div>
      <div><Link to={`/property/${b.propertySlug}`}><h2>{b.propertyName}</h2></Link><p>{b.propertyAddress}, {b.propertyCity}</p><p>{dateVN(b.checkIn)} → {dateVN(b.checkOut)} · {b.nights} đêm · {b.roomsCount} phòng</p></div>
      <div className="booking-card-price"><strong>{money(b.totalAmount, b.currency)}</strong><span>{b.paymentStatus}</span>
        {['PENDING','CONFIRMED'].includes(b.status) && <button className="btn btn-danger" onClick={() => cancel(b.bookingCode)}>Hủy booking</button>}</div>
    </article>)}</div> : <div className="empty-state"><h2>Bạn chưa có booking nào</h2><Link className="btn btn-primary" to="/">Tìm chỗ nghỉ</Link></div>}</main>
}
