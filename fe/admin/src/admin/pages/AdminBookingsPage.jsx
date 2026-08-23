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

const EMPTY_FILTERS = {
  status: '',
  fromDate: '',
  toDate: '',
  keyword: '',
}

function statusClass(status) {
  return `admin-chip booking-status booking-status-${String(status || '').toLowerCase()}`
}

function paymentClass(status) {
  return `admin-payment booking-payment-${String(status || '').toLowerCase()}`
}

export default function AdminBookingsPage() {
  const [data, setData] = useState(EMPTY_PAGE)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
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
        ...Object.fromEntries(
          Object.entries(appliedFilters)
            .filter(([, value]) => value !== '' && value != null),
        ),
      }

      const response = await adminApi.bookings(params)
      setData({ ...EMPTY_PAGE, ...response })
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [page, appliedFilters])

  useEffect(() => {
    load()
  }, [load])

  const summary = useMemo(() => (
    data.content.reduce((result, booking) => {
      result.total += Number(booking.totalAmount || 0)
      result[booking.status] = (result[booking.status] || 0) + 1
      return result
    }, { total: 0 })
  ), [data.content])

  const applyFilters = (event) => {
    event.preventDefault()
    setPage(0)
    setAppliedFilters(filters)
  }

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters({})
    setPage(0)
  }

  const openDetail = async (bookingCode) => {
    setDetailLoading(true)
    setError('')

    try {
      const response = await adminApi.booking(bookingCode)
      setDetail(response)
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setDetailLoading(false)
    }
  }

  const updateStatus = async (booking, status) => {
    const label = STATUS_LABELS[status] || status

    const note = window.prompt(
      `Ghi chú khi chuyển sang "${label}"`,
      `Admin chuyển booking sang ${label}`,
    )

    if (note === null) return

    if (
      status === 'CANCELLED'
      && !window.confirm(
        `Xác nhận hủy booking ${booking.bookingCode}? Tồn phòng sẽ được hoàn lại.`,
      )
    ) {
      return
    }

    setWorkingCode(booking.bookingCode)
    setError('')
    setNotice('')

    try {
      await adminApi.updateBookingStatus(
        booking.bookingCode,
        { status, note },
      )

      setNotice(
        `Đã chuyển booking ${booking.bookingCode} sang ${label.toLowerCase()}.`,
      )

      if (detail?.bookingCode === booking.bookingCode) {
        setDetail(await adminApi.booking(booking.bookingCode))
      }

      await load()
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setWorkingCode(null)
    }
  }

  return (
    <main className="admin-page admin-bookings-page">
      <header className="admin-page-header admin-bookings-header">
        <div>
          <p>System bookings</p>
          <h1>Booking toàn hệ thống</h1>
          <span>
            Theo dõi tình trạng lưu trú, thanh toán và xử lý booking
            của toàn bộ chỗ nghỉ.
          </span>
        </div>

        <strong>
          {data.totalElements}
          {' '}
          booking
        </strong>
      </header>

      <ErrorAlert message={error} />

      {notice && (
        <div className="admin-success-notice">
          <span>✓</span>
          {notice}
        </div>
      )}

      <section className="admin-stat-grid admin-booking-stats">
        <article>
          <span>Booking trên trang</span>
          <strong>{data.content.length}</strong>
          <small>{data.totalElements} booking phù hợp bộ lọc</small>
        </article>

        <article>
          <span>Chờ xác nhận</span>
          <strong>{summary.PENDING || 0}</strong>
          <small>Các booking cần xử lý</small>
        </article>

        <article>
          <span>Đang lưu trú</span>
          <strong>{summary.CHECKED_IN || 0}</strong>
          <small>Khách đang ở tại chỗ nghỉ</small>
        </article>

        <article className="admin-stat-highlight">
          <span>Giá trị trên trang</span>
          <strong>{money(summary.total, 'VND')}</strong>
          <small>Giá trị booking, không phải báo cáo kế toán</small>
        </article>
      </section>

      <form className="admin-panel admin-booking-filters" onSubmit={applyFilters}>
        <div className="admin-filter-heading">
          <div>
            <h2>Bộ lọc booking</h2>
            <p>Tìm theo mã booking, tên khách, email hoặc khoảng ngày nhận phòng.</p>
          </div>

          {Object.keys(appliedFilters).length > 0 && (
            <button
              className="admin-clear-filter"
              type="button"
              onClick={clearFilters}
            >
              Xóa tất cả
            </button>
          )}
        </div>

        <div className="admin-booking-filter-grid">
          <label className="admin-booking-field admin-booking-search">
            <span>Tìm kiếm</span>
            <input
              value={filters.keyword}
              onChange={(event) => setFilters({
                ...filters,
                keyword: event.target.value,
              })}
              placeholder="Mã booking, tên khách, email..."
            />
          </label>

          <label className="admin-booking-field">
            <span>Trạng thái</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters({
                ...filters,
                status: event.target.value,
              })}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-booking-field">
            <span>Nhận phòng từ</span>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(event) => setFilters({
                ...filters,
                fromDate: event.target.value,
              })}
            />
          </label>

          <label className="admin-booking-field">
            <span>Nhận phòng đến</span>
            <input
              type="date"
              min={filters.fromDate || undefined}
              value={filters.toDate}
              onChange={(event) => setFilters({
                ...filters,
                toDate: event.target.value,
              })}
            />
          </label>
        </div>

        <div className="admin-booking-filter-actions">
          <button className="admin-primary-button" type="submit">
            Lọc booking
          </button>

          <button
            className="admin-secondary-button"
            type="button"
            onClick={clearFilters}
          >
            Xóa lọc
          </button>
        </div>
      </form>

      {loading ? (
        <div className="admin-booking-loading">
          <Loading />
        </div>
      ) : data.content.length === 0 ? (
        <section className="admin-panel admin-booking-empty">
          <div>⌕</div>
          <h2>Không có booking phù hợp</h2>
          <p>Thử thay đổi bộ lọc hoặc chờ khách tạo booking mới.</p>
        </section>
      ) : (
        <section className="admin-panel admin-booking-list-panel">
          <div className="admin-booking-list-head">
            <div>
              <h2>Danh sách booking</h2>
              <p>
                Hiển thị {data.content.length} / {data.totalElements} booking
              </p>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table admin-booking-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Chỗ nghỉ</th>
                  <th>Khách</th>
                  <th>Lưu trú</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {data.content.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <button
                        className="admin-booking-code"
                        type="button"
                        onClick={() => openDetail(booking.bookingCode)}
                      >
                        {booking.bookingCode}
                      </button>
                      <small>{dateTimeVN(booking.createdAt)}</small>
                    </td>

                    <td>
                      <strong>{booking.propertyName}</strong>
                      <small>{booking.propertyCity}</small>
                    </td>

                    <td>
                      <strong>{booking.guestFullName}</strong>
                      <small>{booking.guestPhone}</small>
                      <small className="admin-email-cell">
                        {booking.guestEmail}
                      </small>
                    </td>

                    <td>
                      <strong>
                        {dateVN(booking.checkIn)}
                        {' → '}
                        {dateVN(booking.checkOut)}
                      </strong>
                      <small>
                        {booking.nights} đêm · {booking.roomsCount} phòng
                      </small>
                    </td>

                    <td>
                      <strong className="admin-booking-money">
                        {money(booking.totalAmount, booking.currency)}
                      </strong>
                      <small className={paymentClass(booking.paymentStatus)}>
                        {PAYMENT_LABELS[booking.paymentStatus]
                          || booking.paymentStatus}
                      </small>
                    </td>

                    <td>
                      <span className={statusClass(booking.status)}>
                        {STATUS_LABELS[booking.status] || booking.status}
                      </span>
                    </td>

                    <td>
                      <div className="admin-booking-row-actions">
                        <button
                          className="admin-action-detail"
                          type="button"
                          onClick={() => openDetail(booking.bookingCode)}
                        >
                          Chi tiết
                        </button>

                        {(TRANSITIONS[booking.status] || []).map((status) => (
                          <button
                            type="button"
                            disabled={workingCode === booking.bookingCode}
                            className={
                              status === 'CANCELLED'
                                ? 'admin-action-danger'
                                : 'admin-action-status'
                            }
                            key={status}
                            onClick={() => updateStatus(booking, status)}
                          >
                            {STATUS_LABELS[status]}
                          </button>
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
        <nav className="admin-booking-pagination">
          <button
            disabled={data.first}
            onClick={() => setPage((value) => value - 1)}
          >
            ← Trang trước
          </button>

          <span>
            Trang <strong>{page + 1}</strong> / {data.totalPages}
          </span>

          <button
            disabled={data.last}
            onClick={() => setPage((value) => value + 1)}
          >
            Trang sau →
          </button>
        </nav>
      )}

      {(detail || detailLoading) && (
        <div
          className="admin-booking-drawer-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDetail(null)
            }
          }}
        >
          <aside className="admin-booking-drawer">
            <div className="admin-booking-drawer-header">
              <div>
                <span>Chi tiết booking</span>
                <h2>{detail?.bookingCode || 'Đang tải...'}</h2>
              </div>

              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            {detailLoading ? (
              <div className="admin-booking-loading">
                <Loading />
              </div>
            ) : detail && (
              <div className="admin-booking-drawer-body">
                <section className="admin-booking-detail-hero">
                  <div>
                    <span className={statusClass(detail.status)}>
                      {STATUS_LABELS[detail.status] || detail.status}
                    </span>

                    <h3>{detail.propertyName}</h3>
                    <p>{detail.propertyCity}</p>
                  </div>

                  <div>
                    <span>Tổng cộng</span>
                    <strong>
                      {money(detail.totalAmount, detail.currency)}
                    </strong>
                  </div>
                </section>

                <section className="admin-booking-detail-section">
                  <h3>Thông tin khách</h3>

                  <dl className="admin-booking-detail-list">
                    <div>
                      <dt>Họ tên</dt>
                      <dd>{detail.guestFullName}</dd>
                    </div>

                    <div>
                      <dt>Email</dt>
                      <dd>{detail.guestEmail}</dd>
                    </div>

                    <div>
                      <dt>Điện thoại</dt>
                      <dd>{detail.guestPhone}</dd>
                    </div>

                    <div>
                      <dt>Nhận phòng</dt>
                      <dd>{dateVN(detail.checkIn)}</dd>
                    </div>

                    <div>
                      <dt>Trả phòng</dt>
                      <dd>{dateVN(detail.checkOut)}</dd>
                    </div>

                    <div>
                      <dt>Khách</dt>
                      <dd>
                        {detail.adults} người lớn
                        {' · '}
                        {detail.children} trẻ em
                      </dd>
                    </div>
                  </dl>
                </section>

                <section className="admin-booking-detail-section">
                  <h3>Phòng đã đặt</h3>

                  <div className="admin-booking-room-list">
                    {detail.rooms.map((room) => (
                      <article key={room.id}>
                        <div>
                          <strong>{room.roomName}</strong>
                          <span>{room.ratePlanName}</span>
                          <small>{room.mealPlan}</small>
                        </div>

                        <div>
                          <span>{room.quantity} phòng</span>
                          <strong>
                            {money(room.subtotal, detail.currency)}
                          </strong>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="admin-booking-detail-section">
                  <h3>Thanh toán</h3>

                  <dl className="admin-booking-detail-list">
                    <div>
                      <dt>Tiền phòng</dt>
                      <dd>{money(detail.subtotal, detail.currency)}</dd>
                    </div>

                    <div>
                      <dt>Giảm giá</dt>
                      <dd>-{money(detail.discountAmount, detail.currency)}</dd>
                    </div>

                    <div>
                      <dt>Thuế và phí</dt>
                      <dd>{money(detail.taxAmount, detail.currency)}</dd>
                    </div>

                    <div className="admin-booking-total-row">
                      <dt>Tổng cộng</dt>
                      <dd>{money(detail.totalAmount, detail.currency)}</dd>
                    </div>

                    <div>
                      <dt>Thanh toán</dt>
                      <dd className={paymentClass(detail.paymentStatus)}>
                        {PAYMENT_LABELS[detail.paymentStatus]
                          || detail.paymentStatus}
                      </dd>
                    </div>
                  </dl>
                </section>

                {detail.specialRequest && (
                  <section className="admin-booking-detail-section admin-booking-special-request">
                    <h3>Yêu cầu đặc biệt</h3>
                    <p>{detail.specialRequest}</p>
                  </section>
                )}

                {!!TRANSITIONS[detail.status]?.length && (
                  <section className="admin-booking-drawer-actions">
                    {TRANSITIONS[detail.status].map((status) => (
                      <button
                        type="button"
                        key={status}
                        disabled={workingCode === detail.bookingCode}
                        className={
                          status === 'CANCELLED'
                            ? 'admin-danger-button'
                            : 'admin-primary-button'
                        }
                        onClick={() => updateStatus(detail, status)}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    ))}
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