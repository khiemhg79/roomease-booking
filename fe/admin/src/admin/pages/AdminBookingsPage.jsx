import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminApi } from '@/api/admin/adminApi'
import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'
import { dateTimeVN, dateVN, money } from '@/shared/utils/format'

const STATUS_LABELS = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang lưu trú',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Không đến',
}

const PAYMENT_LABELS = {
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Đang chờ thanh toán',
  PAID: 'Đã thanh toán',
  NOT_REQUIRED: 'Thanh toán tại chỗ nghỉ',
  PARTIALLY_REFUNDED: 'Hoàn tiền một phần',
  REFUNDED: 'Đã hoàn tiền',
  FAILED: 'Thanh toán thất bại',
}

const TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'NO_SHOW', 'CANCELLED'],
  CHECKED_IN: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
}

const EMPTY_PAGE = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
}

export default function AdminBookingsPage() {
  const [data, setData] = useState(EMPTY_PAGE)
  const [filters, setFilters] = useState({ propertyId: '', status: '', fromDate: '', toDate: '', keyword: '' })
  const [appliedFilters, setAppliedFilters] = useState({})
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [workingCode, setWorkingCode] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page,
        size: 20,
        ...Object.fromEntries(Object.entries(appliedFilters).filter(([, value]) => value !== '' && value != null)),
      }
      setData({ ...EMPTY_PAGE, ...(await adminApi.bookings(params)) })
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [page, appliedFilters])

  useEffect(() => { load() }, [load])

  const summary = useMemo(() => data.content.reduce((result, booking) => {
    result.total += Number(booking.totalAmount || 0)
    result[booking.status] = (result[booking.status] || 0) + 1
    return result
  }, { total: 0 }), [data.content])

  const applyFilters = (event) => {
    event.preventDefault()
    setPage(0)
    setAppliedFilters(filters)
  }

  const clearFilters = () => {
    const empty = { propertyId: '', status: '', fromDate: '', toDate: '', keyword: '' }
    setFilters(empty)
    setAppliedFilters({})
    setPage(0)
  }

  const openDetail = async (bookingCode) => {
    setDetailLoading(true)
    setError('')
    try {
      setDetail(await adminApi.booking(bookingCode))
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setDetailLoading(false)
    }
  }

  const updateStatus = async (booking, status) => {
    const note = window.prompt(`Ghi chú khi chuyển sang “${STATUS_LABELS[status]}”`, `Quản lý chuyển booking sang ${STATUS_LABELS[status]}`)
    if (note === null) return
    if (status === 'CANCELLED' && !window.confirm(`Xác nhận hủy booking ${booking.bookingCode}? Tồn phòng sẽ được hoàn lại.`)) return

    setWorkingCode(booking.bookingCode)
    setError('')
    setNotice('')
    try {
      await adminApi.updateBookingStatus(booking.bookingCode, { status, note })
      setNotice(`Đã chuyển booking ${booking.bookingCode} sang ${STATUS_LABELS[status].toLowerCase()}.`)
      if (detail?.bookingCode === booking.bookingCode) setDetail(await adminApi.booking(booking.bookingCode))
      await load()
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setWorkingCode(null)
    }
  }

  return (
    <main className="manager-page">
      <header className="manager-page-header">
        <div>
          <p className="manager-kicker">System bookings</p>
          <h1>Booking toàn hệ thống</h1>
          <p>Theo dõi và xử lý booking của mọi chỗ nghỉ trên nền tảng.</p>
        </div>
      </header>

      <ErrorAlert message={error} />
      {notice && <div className="alert alert-success">{notice}</div>}

      <section className="manager-stat-grid compact-stats">
        <article className="manager-stat-card"><span>Booking trên trang</span><strong>{data.content.length}</strong><small>{data.totalElements} booking phù hợp</small></article>
        <article className="manager-stat-card"><span>Chờ xác nhận</span><strong>{summary.PENDING || 0}</strong><small>Cần xử lý sớm</small></article>
        <article className="manager-stat-card"><span>Đang lưu trú</span><strong>{summary.CHECKED_IN || 0}</strong><small>Khách đang ở</small></article>
        <article className="manager-stat-card highlight"><span>Giá trị trên trang</span><strong>{money(summary.total, 'VND')}</strong><small>Không phải báo cáo kế toán</small></article>
      </section>

      <form className="manager-booking-filters" onSubmit={applyFilters}>
        <label className="manager-field">Tìm kiếm
          <input value={filters.keyword} onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} placeholder="Mã booking, tên khách, email..." />
        </label>

        <label className="manager-field">Trạng thái
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">Tất cả</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label className="manager-field">Nhận phòng từ<input type="date" value={filters.fromDate} onChange={(event) => setFilters({ ...filters, fromDate: event.target.value })} /></label>
        <label className="manager-field">Nhận phòng đến<input type="date" min={filters.fromDate || undefined} value={filters.toDate} onChange={(event) => setFilters({ ...filters, toDate: event.target.value })} /></label>
        <div className="manager-filter-actions"><button className="btn btn-primary" type="submit">Lọc booking</button><button className="btn btn-ghost dark" type="button" onClick={clearFilters}>Xóa lọc</button></div>
      </form>

      {loading ? <Loading /> : data.content.length === 0 ? (
        <section className="empty-state manager-empty"><h2>Không có booking phù hợp</h2><p>Thử thay đổi bộ lọc hoặc chờ khách tạo booking mới.</p></section>
      ) : (
        <section className="manager-panel manager-booking-panel">
          <div className="manager-table-wrap">
            <table className="manager-table manager-booking-table">
              <thead><tr><th>Booking</th><th>Chỗ nghỉ</th><th>Khách</th><th>Lưu trú</th><th>Thanh toán</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {data.content.map((booking) => (
                  <tr key={booking.id}>
                    <td><strong>{booking.bookingCode}</strong><small>{dateTimeVN(booking.createdAt)}</small></td>
                    <td><strong>{booking.propertyName}</strong><small>{booking.propertyCity}</small></td>
                    <td><strong>{booking.guestFullName}</strong><small>{booking.guestPhone}</small><small>{booking.guestEmail}</small></td>
                    <td><strong>{dateVN(booking.checkIn)} → {dateVN(booking.checkOut)}</strong><small>{booking.nights} đêm · {booking.roomsCount} phòng</small></td>
                    <td><strong>{money(booking.totalAmount, booking.currency)}</strong><small>{PAYMENT_LABELS[booking.paymentStatus] || booking.paymentStatus}</small></td>
                    <td><span className={`status status-${booking.status.toLowerCase()}`}>{STATUS_LABELS[booking.status] || booking.status}</span></td>
                    <td>
                      <div className="manager-row-actions booking-actions-inline">
                        <button type="button" onClick={() => openDetail(booking.bookingCode)}>Chi tiết</button>
                        {(TRANSITIONS[booking.status] || []).map((status) => (
                          <button type="button" disabled={workingCode === booking.bookingCode} className={status === 'CANCELLED' ? 'danger' : ''} key={status} onClick={() => updateStatus(booking, status)}>{STATUS_LABELS[status]}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {data.totalPages > 1 && (
        <nav className="pagination manager-pagination">
          <button disabled={data.first} onClick={() => setPage((value) => value - 1)}>← Trang trước</button>
          <span>Trang {page + 1} / {data.totalPages}</span>
          <button disabled={data.last} onClick={() => setPage((value) => value + 1)}>Trang sau →</button>
        </nav>
      )}

      {(detail || detailLoading) && (
        <div className="manager-drawer-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDetail(null)
        }}>
          <aside className="manager-drawer">
            <div className="manager-drawer-header">
              <div><span>Chi tiết booking</span><h2>{detail?.bookingCode || 'Đang tải...'}</h2></div>
              <button type="button" onClick={() => setDetail(null)}>×</button>
            </div>

            {detailLoading ? <Loading /> : detail && (
              <div className="manager-drawer-body">
                <section className="manager-booking-detail-head">
                  <div><span className={`status status-${detail.status.toLowerCase()}`}>{STATUS_LABELS[detail.status]}</span><h3>{detail.propertyName}</h3><p>{detail.propertyCity}</p></div>
                  <strong>{money(detail.totalAmount, detail.currency)}</strong>
                </section>

                <section className="manager-detail-section">
                  <h3>Thông tin khách</h3>
                  <dl className="manager-detail-list">
                    <div><dt>Họ tên</dt><dd>{detail.guestFullName}</dd></div>
                    <div><dt>Email</dt><dd>{detail.guestEmail}</dd></div>
                    <div><dt>Điện thoại</dt><dd>{detail.guestPhone}</dd></div>
                    <div><dt>Nhận phòng</dt><dd>{dateVN(detail.checkIn)}</dd></div>
                    <div><dt>Trả phòng</dt><dd>{dateVN(detail.checkOut)}</dd></div>
                    <div><dt>Khách</dt><dd>{detail.adults} người lớn, {detail.children} trẻ em</dd></div>
                  </dl>
                </section>

                <section className="manager-detail-section">
                  <h3>Phòng đã đặt</h3>
                  <div className="manager-drawer-room-list">
                    {detail.rooms.map((room) => (
                      <article key={room.id}><div><strong>{room.roomName}</strong><span>{room.ratePlanName}</span><small>{room.mealPlan}</small></div><div><span>{room.quantity} phòng</span><strong>{money(room.subtotal, detail.currency)}</strong></div></article>
                    ))}
                  </div>
                </section>

                <section className="manager-detail-section">
                  <h3>Chi tiết thanh toán</h3>
                  <dl className="manager-detail-list">
                    <div><dt>Tiền phòng</dt><dd>{money(detail.subtotal, detail.currency)}</dd></div>
                    <div><dt>Giảm giá</dt><dd>-{money(detail.discountAmount, detail.currency)}</dd></div>
                    <div><dt>Thuế và phí</dt><dd>{money(detail.taxAmount, detail.currency)}</dd></div>
                    <div className="total"><dt>Tổng cộng</dt><dd>{money(detail.totalAmount, detail.currency)}</dd></div>
                    <div><dt>Thanh toán</dt><dd>{PAYMENT_LABELS[detail.paymentStatus] || detail.paymentStatus}</dd></div>
                  </dl>
                </section>

                {detail.specialRequest && <section className="manager-detail-section manager-special-request"><h3>Yêu cầu đặc biệt</h3><p>{detail.specialRequest}</p></section>}

                {!!TRANSITIONS[detail.status]?.length && (
                  <section className="manager-drawer-actions">
                    {TRANSITIONS[detail.status].map((status) => <button className={`btn ${status === 'CANCELLED' ? 'btn-danger' : 'btn-primary'}`} type="button" key={status} onClick={() => updateStatus(detail, status)}>{STATUS_LABELS[status]}</button>)}
                  </section>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  )
}
