import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '@/api/admin/adminApi'
import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'
import { dateTimeVN, dateVN, money } from '@/shared/utils/format'

const EMPTY = {
  content: [],
  page: 0,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
}

const EMPTY_FILTERS = {
  keyword: '',
  role: '',
  status: '',
}

const ROLE_LABELS = {
  CUSTOMER: 'Khách hàng',
  HOTEL_MANAGER: 'Quản lý khách sạn',
  ADMIN: 'Quản trị viên',
}

const STATUS_LABELS = {
  ACTIVE: 'Đang hoạt động',
  BLOCKED: 'Đã khóa',
  PENDING: 'Chờ kích hoạt',
}

export default function AdminUsersPage() {
  const [data, setData] = useState(EMPTY)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [applied, setApplied] = useState({})
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [working, setWorking] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await adminApi.users({
        page,
        size: 20,
        ...applied,
      })

      setData({
        ...EMPTY,
        ...response,
      })
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [page, applied])

  useEffect(() => {
    load()
  }, [load])

  const apply = (event) => {
    event.preventDefault()
    setPage(0)

    setApplied(
      Object.fromEntries(
        Object.entries(filters)
          .filter(([, value]) => value),
      ),
    )
  }

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setApplied({})
    setPage(0)
  }

  const openDetail = async (userId) => {
    setDetailLoading(true)
    setError('')

    try {
      setDetail(
        await adminApi.user(userId),
      )
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setDetailLoading(false)
    }
  }

  const refreshDetail = async (userId) => {
    if (!detail || detail.id !== userId) return

    setDetail(
      await adminApi.user(userId),
    )
  }

  const mutate = async (
    user,
    kind,
    value,
  ) => {
    setWorking(user.id)
    setError('')
    setNotice('')

    try {
      if (kind === 'role') {
        await adminApi.updateUserRole(
          user.id,
          value,
        )
      } else {
        await adminApi.updateUserStatus(
          user.id,
          value,
        )
      }

      setNotice(
        `Đã cập nhật ${user.email}.`,
      )

      await load()
      await refreshDetail(user.id)
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setWorking(null)
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p>Identity & access</p>
          <h1>Người dùng và phân quyền</h1>
          <span>
            Xem chi tiết tài khoản, khóa/mở và phân quyền
            CUSTOMER, HOTEL_MANAGER hoặc ADMIN.
          </span>
        </div>

        <strong>
          {data.totalElements} tài khoản
        </strong>
      </header>

      <ErrorAlert message={error} />

      {notice && (
        <div className="admin-success-notice">
          <span>✓</span>
          {notice}
        </div>
      )}

      <form
        className="admin-filters"
        onSubmit={apply}
      >
        <label>
          Tìm kiếm
          <input
            value={filters.keyword}
            onChange={(event) => setFilters({
              ...filters,
              keyword: event.target.value,
            })}
            placeholder="Tên, email, điện thoại..."
          />
        </label>

        <label>
          Vai trò
          <select
            value={filters.role}
            onChange={(event) => setFilters({
              ...filters,
              role: event.target.value,
            })}
          >
            <option value="">Tất cả</option>
            <option value="CUSTOMER">Khách hàng</option>
            <option value="HOTEL_MANAGER">Quản lý khách sạn</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        </label>

        <label>
          Trạng thái
          <select
            value={filters.status}
            onChange={(event) => setFilters({
              ...filters,
              status: event.target.value,
            })}
          >
            <option value="">Tất cả</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="BLOCKED">Đã khóa</option>
            <option value="PENDING">Chờ kích hoạt</option>
          </select>
        </label>

        <div className="admin-filter-buttons">
          <button
            className="admin-primary-button"
            type="submit"
          >
            Lọc
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
        <Loading />
      ) : (
        <section className="admin-panel admin-table-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Danh sách tài khoản</h2>
              <small>
                Nhấn tên tài khoản để xem lịch sử booking gần nhất.
              </small>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table users-table">
              <thead>
                <tr>
                  <th>Tài khoản</th>
                  <th>Liên hệ</th>
                  <th>Xác minh</th>
                  <th>Chỗ nghỉ</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>

              <tbody>
                {data.content.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <button
                        type="button"
                        className="admin-link-button"
                        onClick={() => openDetail(user.id)}
                      >
                        {user.fullName}
                      </button>

                      <small>
                        {String(user.id).slice(0, 13)}...
                      </small>
                    </td>

                    <td>
                      <strong>{user.email}</strong>
                      <small>
                        {user.phone || 'Chưa có điện thoại'}
                      </small>
                    </td>

                    <td>
                      <span
                        className={
                          user.emailVerified
                            ? 'admin-chip status-active'
                            : 'admin-chip status-pending'
                        }
                      >
                        {user.emailVerified
                          ? 'Đã xác minh'
                          : 'Chưa xác minh'}
                      </span>
                    </td>

                    <td>
                      <strong>{user.propertyCount}</strong>
                      <small>chỗ nghỉ sở hữu</small>
                    </td>

                    <td>
                      <select
                        disabled={working === user.id}
                        value={user.role}
                        onChange={(event) => mutate(
                          user,
                          'role',
                          event.target.value,
                        )}
                      >
                        <option value="CUSTOMER">
                          CUSTOMER
                        </option>
                        <option value="HOTEL_MANAGER">
                          HOTEL_MANAGER
                        </option>
                        <option value="ADMIN">
                          ADMIN
                        </option>
                      </select>
                    </td>

                    <td>
                      <select
                        disabled={working === user.id}
                        value={user.status}
                        onChange={(event) => mutate(
                          user,
                          'status',
                          event.target.value,
                        )}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="BLOCKED">BLOCKED</option>
                        <option value="PENDING">PENDING</option>
                      </select>
                    </td>

                    <td>{dateTimeVN(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {data.totalPages > 1 && (
        <nav className="admin-pagination">
          <button
            disabled={data.first}
            onClick={() => setPage((value) => value - 1)}
          >
            ← Trước
          </button>

          <span>
            Trang {page + 1}/{data.totalPages}
          </span>

          <button
            disabled={data.last}
            onClick={() => setPage((value) => value + 1)}
          >
            Sau →
          </button>
        </nav>
      )}

      {(detail || detailLoading) && (
        <div
          className="admin-drawer-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setDetail(null)
            }
          }}
        >
          <aside className="admin-drawer">
            <div className="admin-drawer-head">
              <div>
                <span>Chi tiết tài khoản</span>
                <h2>{detail?.fullName || 'Đang tải...'}</h2>
              </div>

              <button
                type="button"
                onClick={() => setDetail(null)}
              >
                ×
              </button>
            </div>

            {detailLoading ? (
              <div className="admin-drawer-loading">
                <Loading />
              </div>
            ) : detail && (
              <div className="admin-drawer-body">
                <section className="admin-detail-hero">
                  <div className="admin-avatar-placeholder">
                    {detail.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  <div>
                    <h3>{detail.fullName}</h3>
                    <p>{detail.email}</p>

                    <div className="admin-inline-chips">
                      <span className={`admin-chip role-${detail.role.toLowerCase()}`}>
                        {ROLE_LABELS[detail.role] || detail.role}
                      </span>

                      <span className={`admin-chip status-${detail.status.toLowerCase()}`}>
                        {STATUS_LABELS[detail.status] || detail.status}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="admin-detail-section">
                  <h3>Thông tin tài khoản</h3>

                  <dl className="admin-detail-list">
                    <div>
                      <dt>Điện thoại</dt>
                      <dd>{detail.phone || 'Chưa cập nhật'}</dd>
                    </div>

                    <div>
                      <dt>Email</dt>
                      <dd>{detail.email}</dd>
                    </div>

                    <div>
                      <dt>Xác minh email</dt>
                      <dd>
                        {detail.emailVerified
                          ? 'Đã xác minh'
                          : 'Chưa xác minh'}
                      </dd>
                    </div>

                    <div>
                      <dt>Chỗ nghỉ sở hữu</dt>
                      <dd>{detail.propertyCount}</dd>
                    </div>

                    <div>
                      <dt>Tổng booking</dt>
                      <dd>{detail.bookingCount}</dd>
                    </div>

                    <div>
                      <dt>Ngày tạo</dt>
                      <dd>{dateTimeVN(detail.createdAt)}</dd>
                    </div>
                  </dl>
                </section>

                <section className="admin-detail-section">
                  <h3>Booking gần nhất</h3>

                  {detail.recentBookings.length === 0 ? (
                    <p className="admin-muted">
                      Tài khoản chưa có booking.
                    </p>
                  ) : (
                    <div className="admin-mini-list">
                      {detail.recentBookings.map((booking) => (
                        <article key={booking.bookingCode}>
                          <div>
                            <strong>{booking.bookingCode}</strong>
                            <span>{booking.propertyName}</span>
                            <small>
                              {dateVN(booking.checkIn)}
                              {' → '}
                              {dateVN(booking.checkOut)}
                            </small>
                          </div>

                          <div>
                            <strong>
                              {money(
                                booking.totalAmount,
                                booking.currency,
                              )}
                            </strong>

                            <span className={`admin-chip status-${booking.status.toLowerCase()}`}>
                              {booking.status}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="admin-detail-section">
                  <h3>Quản trị</h3>

                  <div className="admin-detail-controls">
                    <label>
                      Vai trò
                      <select
                        value={detail.role}
                        disabled={working === detail.id}
                        onChange={(event) => mutate(
                          detail,
                          'role',
                          event.target.value,
                        )}
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="HOTEL_MANAGER">
                          HOTEL_MANAGER
                        </option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </label>

                    <label>
                      Trạng thái
                      <select
                        value={detail.status}
                        disabled={working === detail.id}
                        onChange={(event) => mutate(
                          detail,
                          'status',
                          event.target.value,
                        )}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="BLOCKED">BLOCKED</option>
                        <option value="PENDING">PENDING</option>
                      </select>
                    </label>
                  </div>
                </section>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  )
}