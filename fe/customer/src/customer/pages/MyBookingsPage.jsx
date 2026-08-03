import {
  useCallback,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

import { bookingApi } from '@/api/customer/bookingApi'
import { apiMessage } from '@/api/http'
import ReviewModal from '@/customer/components/ReviewModal'
import TripChecklist from '@/customer/components/TripChecklist'
import {
  isBookingReviewed,
  markBookingReviewed,
} from '@/customer/utils/customerStorage'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'
import {
  dateTimeVN,
  dateVN,
  money,
} from '@/shared/utils/format'
import { useEffect } from 'react'

const statusLabels = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang lưu trú',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Không đến',
}

const paymentLabels = {
  PENDING: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  REFUNDED: 'Đã hoàn tiền',
  PARTIALLY_REFUNDED: 'Hoàn tiền một phần',
}

const tabs = [
  ['ALL', 'Tất cả'],
  ['UPCOMING', 'Sắp tới'],
  ['CHECKED_IN', 'Đang lưu trú'],
  ['COMPLETED', 'Đã hoàn thành'],
  ['CANCELLED', 'Đã hủy'],
]

function matchTab(booking, tab) {
  if (tab === 'ALL') return true
  if (tab === 'UPCOMING') {
    return ['PENDING', 'CONFIRMED'].includes(booking.status)
  }
  if (tab === 'CANCELLED') {
    return ['CANCELLED', 'NO_SHOW'].includes(booking.status)
  }
  return booking.status === tab
}

function canCancel(booking) {
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) return false
  if (!booking.cancellationDeadline) return true
  return new Date(booking.cancellationDeadline) > new Date()
}

export default function MyBookingsPage() {
  const [data, setData] = useState({ content: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [activeTab, setActiveTab] = useState('ALL')
  const [expandedCode, setExpandedCode] = useState(null)
  const [tripCode, setTripCode] = useState(null)
  const [reviewBooking, setReviewBooking] = useState(null)
  const [cancellingCode, setCancellingCode] = useState(null)
  const [, setReviewVersion] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await bookingApi.mine(0, 50)
      setData(result || { content: [] })
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const bookings = data.content || []

  const filteredBookings = useMemo(
    () => bookings.filter((booking) => matchTab(booking, activeTab)),
    [bookings, activeTab],
  )

  const tabCount = (tab) => bookings.filter((booking) => matchTab(booking, tab)).length

  const cancel = async (booking) => {
    if (!window.confirm(`Bạn chắc chắn muốn hủy booking ${booking.bookingCode}?`)) {
      return
    }

    setCancellingCode(booking.bookingCode)
    setError('')
    setNotice('')

    try {
      await bookingApi.cancel(booking.bookingCode)
      setNotice(`Đã hủy booking ${booking.bookingCode}.`)
      await load()
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setCancellingCode(null)
    }
  }

  const reviewSuccess = () => {
    markBookingReviewed(reviewBooking.id)
    setReviewBooking(null)
    setReviewVersion((current) => current + 1)
    setNotice('Cảm ơn bạn! Đánh giá đã được đăng thành công.')
  }

  if (loading) {
    return <main className="container page-section"><Loading /></main>
  }

  return (
    <main className="container page-section customer-bookings-page">
      <section className="booking-page-hero">
        <div>
          <p className="eyebrow dark">Hành trình của bạn</p>
          <h1>Đặt phòng của tôi</h1>
          <p>
            Theo dõi trạng thái, chuẩn bị chuyến đi và đánh giá sau khi lưu trú.
          </p>
        </div>

        <div className="booking-page-total">
          <strong>{bookings.length}</strong>
          <span>booking</span>
        </div>
      </section>

      <ErrorAlert message={error} />

      {notice && (
        <div className="alert alert-success booking-notice">
          {notice}
          <button type="button" onClick={() => setNotice('')}>×</button>
        </div>
      )}

      {bookings.length > 0 && (
        <nav className="booking-tabs" aria-label="Lọc booking">
          {tabs.map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={activeTab === value ? 'active' : ''}
              onClick={() => setActiveTab(value)}
            >
              {label}
              <span>{tabCount(value)}</span>
            </button>
          ))}
        </nav>
      )}

      {!bookings.length ? (
        <section className="empty-state booking-empty-state">
          <div className="empty-state-icon">🧳</div>
          <h2>Bạn chưa có booking nào</h2>
          <p>Tìm chỗ nghỉ phù hợp và bắt đầu chuyến đi đầu tiên.</p>
          <Link className="btn btn-primary" to="/">
            Tìm chỗ nghỉ
          </Link>
        </section>
      ) : !filteredBookings.length ? (
        <section className="empty-state">
          <h2>Không có booking trong nhóm này</h2>
          <button
            type="button"
            className="btn btn-ghost dark"
            onClick={() => setActiveTab('ALL')}
          >
            Xem tất cả
          </button>
        </section>
      ) : (
        <section className="booking-list booking-list-enhanced">
          {filteredBookings.map((booking) => {
            const expanded = expandedCode === booking.bookingCode
            const showTrip = tripCode === booking.bookingCode
            const cancelAllowed = canCancel(booking)
            const reviewed = isBookingReviewed(booking.id)

            return (
              <article className="booking-card-enhanced" key={booking.id}>
                <header className="booking-card-header">
                  <div>
                    <span>Mã booking</span>
                    <strong>{booking.bookingCode}</strong>
                  </div>

                  <em className={`status status-${booking.status.toLowerCase()}`}>
                    {statusLabels[booking.status] || booking.status}
                  </em>

                  <div className="booking-created-at">
                    Đặt ngày {dateTimeVN(booking.createdAt)}
                  </div>
                </header>

                <div className="booking-card-body">
                  <div className="booking-property-copy">
                    <Link to={`/property/${booking.propertySlug}`}>
                      <h2>{booking.propertyName}</h2>
                    </Link>
                    <p>{booking.propertyAddress}, {booking.propertyCity}</p>

                    <div className="booking-date-flow">
                      <div>
                        <span>Nhận phòng</span>
                        <strong>{dateVN(booking.checkIn)}</strong>
                      </div>
                      <span className="booking-night-pill">{booking.nights} đêm</span>
                      <div>
                        <span>Trả phòng</span>
                        <strong>{dateVN(booking.checkOut)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="booking-summary-facts">
                    <div>
                      <span>Khách</span>
                      <strong>
                        {booking.adults} người lớn
                        {booking.children > 0 ? `, ${booking.children} trẻ em` : ''}
                      </strong>
                    </div>
                    <div>
                      <span>Số phòng</span>
                      <strong>{booking.roomsCount} phòng</strong>
                    </div>
                    <div>
                      <span>Thanh toán</span>
                      <strong>{paymentLabels[booking.paymentStatus] || booking.paymentStatus}</strong>
                    </div>
                  </div>

                  <div className="booking-total-box">
                    <span>Tổng cộng</span>
                    <strong>{money(booking.totalAmount, booking.currency)}</strong>
                  </div>
                </div>

                {booking.cancellationDeadline
                  && ['PENDING', 'CONFIRMED'].includes(booking.status) && (
                    <div className={`booking-cancel-note ${cancelAllowed ? '' : 'expired'}`}>
                      {cancelAllowed
                        ? `Có thể tự hủy trước ${dateTimeVN(booking.cancellationDeadline)}`
                        : 'Đã hết thời hạn tự hủy'}
                    </div>
                  )}

                <footer className="booking-card-actions">
                  <button
                    type="button"
                    className="btn btn-ghost dark"
                    onClick={() => setExpandedCode(expanded ? null : booking.bookingCode)}
                  >
                    {expanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                  </button>

                  {['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(booking.status) && (
                    <button
                      type="button"
                      className="btn btn-trip"
                      onClick={() => setTripCode(showTrip ? null : booking.bookingCode)}
                    >
                      {showTrip ? 'Đóng checklist' : 'Chuẩn bị chuyến đi'}
                    </button>
                  )}

                  {booking.status === 'COMPLETED' && !reviewed && (
                    <button
                      type="button"
                      className="btn btn-review"
                      onClick={() => setReviewBooking(booking)}
                    >
                      ★ Viết đánh giá
                    </button>
                  )}

                  {booking.status === 'COMPLETED' && reviewed && (
                    <span className="reviewed-chip">✓ Đã đánh giá</span>
                  )}

                  {cancelAllowed && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={cancellingCode === booking.bookingCode}
                      onClick={() => cancel(booking)}
                    >
                      {cancellingCode === booking.bookingCode
                        ? 'Đang hủy...'
                        : 'Hủy booking'}
                    </button>
                  )}
                </footer>

                {expanded && (
                  <section className="booking-detail-panel">
                    <div>
                      <h3>Thông tin khách</h3>
                      <dl>
                        <div><dt>Họ tên</dt><dd>{booking.guestFullName}</dd></div>
                        <div><dt>Email</dt><dd>{booking.guestEmail}</dd></div>
                        <div><dt>Điện thoại</dt><dd>{booking.guestPhone}</dd></div>
                        <div><dt>Yêu cầu</dt><dd>{booking.specialRequest || 'Không có'}</dd></div>
                      </dl>
                    </div>

                    <div>
                      <h3>Chi tiết thanh toán</h3>
                      <dl>
                        <div><dt>Tiền phòng</dt><dd>{money(booking.subtotal, booking.currency)}</dd></div>
                        <div><dt>Giảm giá</dt><dd>-{money(booking.discountAmount, booking.currency)}</dd></div>
                        <div><dt>Thuế và phí</dt><dd>{money(booking.taxAmount, booking.currency)}</dd></div>
                        <div className="detail-total"><dt>Tổng cộng</dt><dd>{money(booking.totalAmount, booking.currency)}</dd></div>
                      </dl>
                    </div>

                    <div className="booking-room-details">
                      <h3>Phòng đã đặt</h3>
                      <div>
                        {(booking.rooms || []).map((room) => (
                          <article key={room.id}>
                            <div>
                              <strong>{room.roomName}</strong>
                              <span>{room.ratePlanName}</span>
                            </div>
                            <div>
                              <span>{room.quantity} phòng</span>
                              <span>{room.mealPlan}</span>
                            </div>
                            <strong>{money(room.subtotal, booking.currency)}</strong>
                          </article>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {showTrip && <TripChecklist booking={booking} />}
              </article>
            )
          })}
        </section>
      )}

      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={reviewSuccess}
        />
      )}
    </main>
  )
}