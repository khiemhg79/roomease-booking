import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'

import { bookingApi } from '@/api/customer/bookingApi'
import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'
import { money } from '@/shared/utils/format'

const POLL_INTERVAL_MS = 3000

export default function BookingSuccessPage() {
  const { code } = useParams()
  const location = useLocation()

  const [booking, setBooking] = useState(
    location.state?.booking || null,
  )

  const [payment, setPayment] = useState(
    location.state?.payment || null,
  )

  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(
    !location.state?.booking,
  )
  const [error, setError] = useState('')
  const stoppedRef = useRef(false)

  const isPaid =
    status?.paymentStatus === 'PAID' ||
    booking?.paymentStatus === 'PAID' ||
    payment?.paymentStatus === 'PAID'

  const isPayAtProperty =
    booking?.paymentStatus === 'NOT_REQUIRED'

  useEffect(() => {
    stoppedRef.current = false
    let timerId

    const load = async () => {
      try {
        let currentBooking = booking

        if (!currentBooking) {
          currentBooking = await bookingApi.detail(code)

          if (stoppedRef.current) {
            return
          }

          setBooking(currentBooking)
        }

        if (
          currentBooking.paymentStatus === 'NOT_REQUIRED' ||
          currentBooking.paymentStatus === 'PAID'
        ) {
          setStatus({
            bookingCode: currentBooking.bookingCode,
            bookingStatus: currentBooking.status,
            paymentStatus: currentBooking.paymentStatus,
            amount: currentBooking.totalAmount,
            currency: currentBooking.currency,
          })
          return
        }

        let currentPayment = payment

        if (!currentPayment) {
          currentPayment = await bookingApi.prepareSePay(code)

          if (stoppedRef.current) {
            return
          }

          setPayment(currentPayment)
        }

        const checkStatus = async () => {
          try {
            const latestStatus =
              await bookingApi.sePayStatus(code)

            if (stoppedRef.current) {
              return
            }

            setStatus(latestStatus)
            setError('')

            if (latestStatus.paymentStatus === 'PAID') {
              setBooking((current) => current
                ? {
                  ...current,
                  status: latestStatus.bookingStatus,
                  paymentStatus: latestStatus.paymentStatus,
                }
                : current)
              return
            }
          } catch (requestError) {
            if (!stoppedRef.current) {
              setError(apiMessage(requestError))
            }
          }

          if (!stoppedRef.current) {
            timerId = window.setTimeout(
              checkStatus,
              POLL_INTERVAL_MS,
            )
          }
        }

        await checkStatus()
      } catch (requestError) {
        if (!stoppedRef.current) {
          setError(apiMessage(requestError))
        }
      } finally {
        if (!stoppedRef.current) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      stoppedRef.current = true

      if (timerId) {
        window.clearTimeout(timerId)
      }
    }
  }, [code])

  if (loading) {
    return (
      <main className="container page-section">
        <Loading />
      </main>
    )
  }

  if (isPaid || isPayAtProperty) {
    return (
      <main className="container success-page page-section">
        <div className="success-icon">✓</div>

        <h1>
          {isPayAtProperty
            ? 'Đặt phòng thành công'
            : 'Thanh toán thành công'}
        </h1>

        <p>
          Mã xác nhận của bạn là <strong>{code}</strong>.
          Hãy lưu mã này để tra cứu khi cần.
        </p>

        {booking && (
          <div className="success-summary">
            <h2>{booking.propertyName}</h2>

            <p>
              {booking.checkIn} → {booking.checkOut}
              {' · '}
              {booking.nights} đêm
            </p>

            <strong>
              {money(
                booking.totalAmount,
                booking.currency,
              )}
            </strong>
          </div>
        )}

        <div>
          <Link
            className="btn btn-primary"
            to="/bookings"
          >
            Xem booking của tôi
          </Link>

          {' '}

          <Link
            className="btn btn-ghost dark"
            to="/"
          >
            Về trang chủ
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="container page-section">
      <div
        style={{
          maxWidth: 980,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 420px)',
          gap: 28,
          alignItems: 'start',
        }}
      >
        <section
          style={{
            background: '#fff',
            borderRadius: 18,
            padding: 28,
            border: '1px solid #e3e8f2',
          }}
        >
          <p className="eyebrow dark">
            Thanh toán SePay
          </p>

          <h1>Quét QR để hoàn tất booking</h1>

          <p>
            Mở ứng dụng ngân hàng, quét mã QR và xác nhận
            chuyển khoản. Trang này sẽ tự cập nhật khi SePay
            gửi webhook thành công.
          </p>

          <ErrorAlert message={error} />

          {payment?.qrUrl ? (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <img
                src={payment.qrUrl}
                alt={`QR thanh toán booking ${code}`}
                style={{
                  width: '100%',
                  maxWidth: 390,
                  borderRadius: 14,
                  border: '1px solid #e3e8f2',
                }}
              />
            </div>
          ) : (
            <Loading />
          )}

          <div
            style={{
              marginTop: 22,
              padding: 18,
              borderRadius: 14,
              background: '#f6f8fc',
            }}
          >
            <p>
              Trạng thái:
              {' '}
              <strong>Đang chờ thanh toán</strong>
            </p>

            <p>
              Hệ thống kiểm tra tự động mỗi 3 giây.
              Không đóng cửa sổ Cloudflare Tunnel và backend
              Spring Boot trong lúc thử local.
            </p>
          </div>
        </section>

        <aside
          style={{
            background: '#fff',
            borderRadius: 18,
            padding: 24,
            border: '1px solid #e3e8f2',
          }}
        >
          <h2>Thông tin chuyển khoản</h2>

          <p>
            Mã booking
            <br />
            <strong>{code}</strong>
          </p>

          <p>
            Ngân hàng
            <br />
            <strong>{payment?.bankCode || 'TPBank'}</strong>
          </p>

          <p>
            Số tài khoản
            <br />
            <strong>{payment?.accountNumber || '—'}</strong>
          </p>

          <p>
            Chủ tài khoản
            <br />
            <strong>{payment?.accountName || '—'}</strong>
          </p>

          <p>
            Số tiền
            <br />
            <strong>
              {money(
                payment?.amount || booking?.totalAmount || 0,
                payment?.currency || booking?.currency || 'VND',
              )}
            </strong>
          </p>

          <p>
            Nội dung chuyển khoản
            <br />
            <strong>{payment?.transferContent || code}</strong>
          </p>

          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: '#fff7e6',
              color: '#7a4b00',
            }}
          >
            Chuyển đúng số tiền và giữ nguyên nội dung để
            hệ thống khớp booking tự động.
          </div>
        </aside>
      </div>
    </main>
  )
}