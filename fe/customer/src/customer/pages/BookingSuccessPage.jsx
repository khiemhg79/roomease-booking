import { Link, useLocation, useParams } from 'react-router-dom'
import { money } from '@/shared/utils/format'

export default function BookingSuccessPage() {
  const { code } = useParams()
  const booking = useLocation().state?.booking
  return <main className="container success-page page-section"><div className="success-icon">✓</div><h1>Đặt phòng thành công</h1>
    <p>Mã xác nhận của bạn là <strong>{code}</strong>. Hãy lưu mã này để tra cứu khi cần.</p>
    {booking && <div className="success-summary"><h2>{booking.propertyName}</h2><p>{booking.checkIn} → {booking.checkOut} · {booking.nights} đêm</p><strong>{money(booking.totalAmount, booking.currency)}</strong></div>}
    <div><Link className="btn btn-primary" to="/bookings">Xem booking của tôi</Link> <Link className="btn btn-ghost dark" to="/">Về trang chủ</Link></div></main>
}
