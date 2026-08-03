import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { managerApi } from '@/api/manager/managerApi'
import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'
import { dateVN, money } from '@/shared/utils/format'

const STATUS_LABELS = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang lưu trú',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Không đến',
}

export default function ManagerDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    managerApi.dashboard()
      .then(setData)
      .catch((requestError) => setError(apiMessage(requestError)))
      .finally(() => setLoading(false))
  }, [])

  const maxRevenue = useMemo(() => {
    if (!data?.revenueLast14Days?.length) return 1
    return Math.max(1, ...data.revenueLast14Days.map((item) => Number(item.revenue || 0)))
  }, [data])

  if (loading) return <Loading />

  return (
    <main className="manager-page">
      <header className="manager-page-header">
        <div>
          <p className="manager-kicker">Kênh quản lý RoomEase</p>
          <h1>Tổng quan hoạt động</h1>
          <p>Theo dõi booking, doanh thu và tình trạng vận hành của chỗ nghỉ.</p>
        </div>
        <div className="manager-header-actions">
          <Link className="btn btn-ghost dark" to="/manager/calendar">Cập nhật giá</Link>
          <Link className="btn btn-primary" to="/manager/properties/new">Thêm chỗ nghỉ</Link>
        </div>
      </header>

      <ErrorAlert message={error} />

      {data && (
        <>
          <section className="manager-stat-grid">
            <article className="manager-stat-card">
              <span>Chỗ nghỉ hoạt động</span>
              <strong>{data.activePropertyCount}</strong>
              <small>{data.propertyCount} chỗ nghỉ trong hệ thống</small>
            </article>
            <article className="manager-stat-card">
              <span>Booking chờ xác nhận</span>
              <strong>{data.pendingBookings}</strong>
              <small>{data.totalBookings} booking tổng cộng</small>
            </article>
            <article className="manager-stat-card">
              <span>Khách đến hôm nay</span>
              <strong>{data.arrivalsToday}</strong>
              <small>{data.departuresToday} lượt trả phòng</small>
            </article>
            <article className="manager-stat-card highlight">
              <span>Doanh thu tháng này</span>
              <strong>{money(data.revenueThisMonth, data.currency)}</strong>
              <small>Từ booking đã thanh toán hoặc trả tại chỗ nghỉ</small>
            </article>
          </section>

          <section className="manager-dashboard-grid">
            <article className="manager-panel manager-revenue-panel">
              <div className="manager-panel-heading">
                <div>
                  <h2>Doanh thu 14 ngày</h2>
                  <p>Giá trị booking theo ngày tạo đơn</p>
                </div>
              </div>
              <div className="manager-bar-chart">
                {data.revenueLast14Days.map((item) => {
                  const height = Math.max(5, (Number(item.revenue || 0) / maxRevenue) * 100)
                  return (
                    <div className="manager-bar-item" key={item.date} title={`${dateVN(item.date)}: ${money(item.revenue, data.currency)}`}>
                      <div className="manager-bar-track">
                        <div className="manager-bar" style={{ height: `${height}%` }} />
                      </div>
                      <small>{new Date(`${item.date}T00:00:00`).getDate()}</small>
                    </div>
                  )
                })}
              </div>
            </article>

            <article className="manager-panel">
              <div className="manager-panel-heading">
                <div>
                  <h2>Trạng thái booking</h2>
                  <p>Phân bổ booking hiện tại</p>
                </div>
              </div>
              <div className="manager-status-list">
                {data.bookingStatus.length ? data.bookingStatus.map((item) => (
                  <div key={item.status}>
                    <span className={`status status-${item.status.toLowerCase()}`}>
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                    <strong>{item.count}</strong>
                  </div>
                )) : <p>Chưa có booking.</p>}
              </div>
            </article>
          </section>

          <section className="manager-panel">
            <div className="manager-panel-heading">
              <div>
                <h2>Booking mới nhất</h2>
                <p>Các đơn vừa được tạo trên hệ thống</p>
              </div>
              <Link to="/manager/bookings">Xem tất cả →</Link>
            </div>

            <div className="manager-table-wrap">
              <table className="manager-table">
                <thead>
                  <tr>
                    <th>Mã booking</th>
                    <th>Chỗ nghỉ</th>
                    <th>Khách</th>
                    <th>Lưu trú</th>
                    <th>Trạng thái</th>
                    <th>Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentBookings.map((booking) => (
                    <tr key={booking.bookingCode}>
                      <td><strong>{booking.bookingCode}</strong></td>
                      <td>{booking.propertyName}</td>
                      <td>{booking.guestFullName}</td>
                      <td>{dateVN(booking.checkIn)} → {dateVN(booking.checkOut)}</td>
                      <td><span className={`status status-${booking.status.toLowerCase()}`}>{STATUS_LABELS[booking.status] || booking.status}</span></td>
                      <td>{money(booking.totalAmount, booking.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
