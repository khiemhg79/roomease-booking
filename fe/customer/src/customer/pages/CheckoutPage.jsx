import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { propertyApi } from '@/api/customer/propertyApi'
import { bookingApi } from '@/api/customer/bookingApi'
import { apiMessage } from '@/api/http'
import { useAuth } from '@/auth/AuthContext'
import { money, nightsBetween } from '@/shared/utils/format'
import Loading from '@/shared/components/Loading'
import ErrorAlert from '@/shared/components/ErrorAlert'

export default function CheckoutPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const query = useMemo(() => Object.fromEntries(params.entries()), [params])
  const [property, setProperty] = useState(null)
  const [offer, setOffer] = useState(null)
  const [form, setForm] = useState({
    guestFullName: user?.fullName || '', guestEmail: user?.email || '', guestPhone: user?.phone || '',
    specialRequest: '', paymentMethod: 'PAY_AT_PROPERTY',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    propertyApi.detail(query.property, query).then((data) => {
      setProperty(data)
      const selectedOffer = data.offers.find((o) => o.ratePlanId === query.ratePlanId) || null
      setOffer(selectedOffer)
      if (selectedOffer && !selectedOffer.payAtProperty) {
        setForm((current) => ({ ...current, paymentMethod: 'CARD' }))
      }
    }).catch((e) => setError(apiMessage(e))).finally(() => setLoading(false))
  }, [query])

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const submit = async (e) => {
    e.preventDefault()
    if (!offer || !property) return
    setSubmitting(true); setError('')
    try {
      const booking = await bookingApi.create({
        propertyId: property.id,
        checkIn: query.checkIn,
        checkOut: query.checkOut,
        rooms: [{ ratePlanId: offer.ratePlanId, quantity: Number(query.rooms || 1), adults: Number(query.adults || 2), children: Number(query.children || 0) }],
        ...form,
      })
      navigate(`/booking-success/${booking.bookingCode}`, { replace: true, state: { booking } })
    } catch (e2) { setError(apiMessage(e2)) } finally { setSubmitting(false) }
  }

  if (loading) return <main className="container page-section"><Loading /></main>
  if (!property || !offer) return <main className="container page-section"><ErrorAlert message={error || 'Gói phòng không còn khả dụng'} /></main>
  const tax = Number(offer.totalPrice) * 0.08
  const total = Number(offer.totalPrice) + tax

  return (
    <main className="container checkout-layout page-section">
      <section>
        <div className="checkout-step"><span>1</span><div><h1>Thông tin người đặt</h1><p>Điền chính xác để chỗ nghỉ có thể liên hệ với bạn.</p></div></div>
        <ErrorAlert message={error} />
        <form className="checkout-form" onSubmit={submit}>
          <div className="form-grid"><label>Họ và tên<input name="guestFullName" value={form.guestFullName} onChange={change} required /></label>
            <label>Email<input type="email" name="guestEmail" value={form.guestEmail} onChange={change} required /></label>
            <label>Số điện thoại<input name="guestPhone" value={form.guestPhone} onChange={change} required /></label>
            <label>Phương thức thanh toán<select name="paymentMethod" value={form.paymentMethod} onChange={change}>
              {offer.payAtProperty && <option value="PAY_AT_PROPERTY">Thanh toán tại chỗ nghỉ</option>}<option value="CARD">Thẻ - mô phỏng</option><option value="BANK_TRANSFER">Chuyển khoản - mô phỏng</option>
            </select></label></div>
          <label>Yêu cầu đặc biệt<textarea name="specialRequest" rows="4" value={form.specialRequest} onChange={change} placeholder="Ví dụ: phòng tầng cao, đến muộn..." /></label>
          <div className="checkout-step second"><span>2</span><div><h2>Kiểm tra và xác nhận</h2><p>Bạn vẫn có thể xem lại giá và chính sách bên phải.</p></div></div>
          <button className="btn btn-primary btn-large" disabled={submitting}>{submitting ? 'Đang giữ phòng...' : `Xác nhận đặt phòng · ${money(total, offer.currency)}`}</button>
        </form>
      </section>
      <aside className="booking-summary">
        <img src={property.images[0]?.url} alt={property.name} /><div className="summary-body"><div className="stars">{'★'.repeat(property.starRating)}</div><h2>{property.name}</h2>
          <p>{property.addressLine}, {property.city}</p><hr /><div className="date-summary"><div><span>Nhận phòng</span><strong>{query.checkIn}</strong></div><div><span>Trả phòng</span><strong>{query.checkOut}</strong></div></div>
          <p>{nightsBetween(query.checkIn, query.checkOut)} đêm · {query.rooms} phòng · {query.adults} người lớn</p><hr /><h3>{offer.roomName}</h3><p>{offer.ratePlanName}</p>
          <p className={offer.refundable ? 'success-text' : 'danger-text'}>{offer.refundable ? `Hủy miễn phí trước ${offer.cancellationDays} ngày` : 'Không hoàn tiền'}</p><hr />
          <div className="price-line"><span>Giá phòng</span><b>{money(offer.totalPrice, offer.currency)}</b></div><div className="price-line"><span>Thuế 8%</span><b>{money(tax, offer.currency)}</b></div>
          <div className="price-line total"><span>Tổng cộng</span><b>{money(total, offer.currency)}</b></div></div>
      </aside>
    </main>
  )
}
