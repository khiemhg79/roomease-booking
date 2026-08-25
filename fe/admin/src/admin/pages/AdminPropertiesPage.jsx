import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '@/api/admin/adminApi'
import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'
import { dateTimeVN } from '@/shared/utils/format'

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
    status: '',
}

const STATUS_LABELS = {
    DRAFT: 'Bản nháp',
    ACTIVE: 'Đang hoạt động',
    SUSPENDED: 'Tạm khóa',
    ARCHIVED: 'Đã lưu trữ',
}

export default function AdminPropertiesPage() {
    const [data, setData] = useState(EMPTY)
    const [managers, setManagers] = useState([])
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
            const [properties, users] = await Promise.all([
                adminApi.properties({
                    page,
                    size: 20,
                    ...applied,
                }),
                adminApi.users({
                    role: 'HOTEL_MANAGER',
                    status: 'ACTIVE',
                    page: 0,
                    size: 100,
                }),
            ])

            setData({
                ...EMPTY,
                ...properties,
            })

            setManagers(
                users.content || [],
            )
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

    const openDetail = async (id) => {
        setDetailLoading(true)
        setError('')

        try {
            setDetail(
                await adminApi.property(id),
            )
        } catch (requestError) {
            setError(apiMessage(requestError))
        } finally {
            setDetailLoading(false)
        }
    }

    const refreshDetail = async (id) => {
        if (!detail || detail.id !== id) return

        setDetail(
            await adminApi.property(id),
        )
    }

    const update = async (
        property,
        payload,
    ) => {
        setWorking(property.id)
        setError('')
        setNotice('')

        try {
            await adminApi.moderateProperty(
                property.id,
                payload,
            )

            setNotice(
                `Đã cập nhật ${property.name}.`,
            )

            await load()
            await refreshDetail(property.id)
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
                    <p>Marketplace governance</p>
                    <h1>Kiểm duyệt chỗ nghỉ</h1>
                    <span>
                        Duyệt chỗ nghỉ, khóa vi phạm, phân công manager
                        và kiểm tra toàn bộ loại phòng.
                    </span>
                </div>

                <strong>
                    {data.totalElements} chỗ nghỉ
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
                className="admin-filters property-filters"
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
                        placeholder="Tên, thành phố, slug, owner..."
                    />
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
                        <option value="DRAFT">Bản nháp</option>
                        <option value="ACTIVE">Đang hoạt động</option>
                        <option value="SUSPENDED">Tạm khóa</option>
                        <option value="ARCHIVED">Đã lưu trữ</option>
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
                            <h2>Danh sách chỗ nghỉ</h2>
                            <small>
                                Nhấn tên chỗ nghỉ để xem chi tiết và toàn bộ loại phòng.
                            </small>
                        </div>
                    </div>

                    <div className="admin-table-wrap">
                        <table className="admin-table property-admin-table">
                            <thead>
                                <tr>
                                    <th>Chỗ nghỉ</th>
                                    <th>Manager</th>
                                    <th>Phòng / Booking</th>
                                    <th>Nổi bật</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.content.map((property) => (
                                    <tr key={property.id}>
                                        <td>
                                            <button
                                                type="button"
                                                className="admin-link-button"
                                                onClick={() => openDetail(property.id)}
                                            >
                                                {property.name}
                                            </button>

                                            <small>
                                                {property.propertyType} · {property.city},
                                                {' '}
                                                {property.country}
                                            </small>

                                            <small>{property.slug}</small>
                                        </td>

                                        <td>
                                            <select
                                                disabled={working === property.id}
                                                value={property.ownerId || ''}
                                                onChange={(event) => update(
                                                    property,
                                                    event.target.value
                                                        ? {
                                                            ownerId: event.target.value,
                                                            clearOwner: false,
                                                        }
                                                        : {
                                                            clearOwner: true,
                                                        },
                                                )}
                                            >
                                                <option value="">
                                                    Chưa phân công
                                                </option>

                                                {managers.map((manager) => (
                                                    <option
                                                        key={manager.id}
                                                        value={manager.id}
                                                    >
                                                        {manager.fullName} · {manager.email}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        <td>
                                            <strong>
                                                {property.roomTypeCount} loại phòng
                                            </strong>
                                            <small>
                                                {property.bookingCount} booking
                                            </small>
                                        </td>

                                        <td>
                                            <label className="admin-toggle">
                                                <input
                                                    type="checkbox"
                                                    checked={property.featured}
                                                    disabled={working === property.id}
                                                    onChange={(event) => update(
                                                        property,
                                                        {
                                                            featured: event.target.checked,
                                                        },
                                                    )}
                                                />

                                                <span>
                                                    {property.featured ? 'Có' : 'Không'}
                                                </span>
                                            </label>
                                        </td>

                                        <td>
                                            <select
                                                disabled={working === property.id}
                                                value={property.status}
                                                onChange={(event) => update(
                                                    property,
                                                    {
                                                        status: event.target.value,
                                                    },
                                                )}
                                            >
                                                <option value="DRAFT">DRAFT</option>
                                                <option value="ACTIVE">ACTIVE</option>
                                                <option value="SUSPENDED">SUSPENDED</option>
                                                <option value="ARCHIVED">ARCHIVED</option>
                                            </select>
                                        </td>

                                        <td>{dateTimeVN(property.createdAt)}</td>
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
                        if (event.target === event.currentTarget) {
                            setDetail(null)
                        }
                    }}
                >
                    <aside className="admin-drawer admin-property-drawer">
                        <div className="admin-drawer-head">
                            <div>
                                <span>Chi tiết chỗ nghỉ</span>
                                <h2>{detail?.name || 'Đang tải...'}</h2>
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
                                <section className="admin-detail-hero property">
                                    <div>
                                        <div className="admin-inline-chips">
                                            <span className={`admin-chip status-${detail.status.toLowerCase()}`}>
                                                {STATUS_LABELS[detail.status] || detail.status}
                                            </span>

                                            {detail.featured && (
                                                <span className="admin-chip role-admin">
                                                    Nổi bật
                                                </span>
                                            )}
                                        </div>

                                        <h3>{detail.name}</h3>
                                        <p>
                                            {detail.addressLine}, {detail.city}, {detail.country}
                                        </p>
                                    </div>

                                    <div className="admin-property-score">
                                        <strong>
                                            {Number(detail.reviewScore || 0).toFixed(1)}
                                        </strong>
                                        <span>
                                            {detail.reviewCount} đánh giá
                                        </span>
                                    </div>
                                </section>

                                <section className="admin-detail-section">
                                    <h3>Thông tin vận hành</h3>

                                    <dl className="admin-detail-list">
                                        <div>
                                            <dt>Loại</dt>
                                            <dd>{detail.propertyType}</dd>
                                        </div>

                                        <div>
                                            <dt>Hạng sao</dt>
                                            <dd>{detail.starRating} sao</dd>
                                        </div>

                                        <div>
                                            <dt>Manager</dt>
                                            <dd>
                                                {detail.ownerName || 'Chưa phân công'}
                                                {detail.ownerEmail
                                                    ? ` · ${detail.ownerEmail}`
                                                    : ''}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt>Tổng booking</dt>
                                            <dd>{detail.bookingCount}</dd>
                                        </div>

                                        <div>
                                            <dt>Check-in</dt>
                                            <dd>
                                                {detail.checkInFrom}
                                                {detail.checkInUntil
                                                    ? ` – ${detail.checkInUntil}`
                                                    : ''}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt>Check-out</dt>
                                            <dd>
                                                {detail.checkOutFrom || '—'}
                                                {detail.checkOutUntil
                                                    ? ` – ${detail.checkOutUntil}`
                                                    : ''}
                                            </dd>
                                        </div>
                                    </dl>
                                </section>

                                {detail.description && (
                                    <section className="admin-detail-section">
                                        <h3>Mô tả</h3>
                                        <p className="admin-detail-description">
                                            {detail.description}
                                        </p>
                                    </section>
                                )}

                                <section className="admin-detail-section">
                                    <h3>
                                        Loại phòng ({detail.rooms.length})
                                    </h3>

                                    <div className="admin-room-admin-list">
                                        {detail.rooms.map((room) => (
                                            <article key={room.id}>
                                                <div>
                                                    <strong>{room.name}</strong>
                                                    <span>{room.code}</span>
                                                    <small>
                                                        {room.bedSummary}
                                                        {' · '}
                                                        tối đa {room.maxGuests} khách
                                                    </small>
                                                </div>

                                                <div>
                                                    <strong>{room.totalRooms}</strong>
                                                    <span>phòng</span>
                                                    <em className={`admin-chip ${room.active ? 'status-active' : 'status-blocked'}`}>
                                                        {room.active ? 'Đang bán' : 'Đang tắt'}
                                                    </em>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </section>

                                <section className="admin-detail-section">
                                    <h3>Kiểm duyệt</h3>

                                    <div className="admin-detail-controls">
                                        <label>
                                            Manager
                                            <select
                                                disabled={working === detail.id}
                                                value={detail.ownerId || ''}
                                                onChange={(event) => update(
                                                    detail,
                                                    event.target.value
                                                        ? {
                                                            ownerId: event.target.value,
                                                            clearOwner: false,
                                                        }
                                                        : {
                                                            clearOwner: true,
                                                        },
                                                )}
                                            >
                                                <option value="">
                                                    Chưa phân công
                                                </option>

                                                {managers.map((manager) => (
                                                    <option
                                                        key={manager.id}
                                                        value={manager.id}
                                                    >
                                                        {manager.fullName} · {manager.email}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label>
                                            Trạng thái
                                            <select
                                                disabled={working === detail.id}
                                                value={detail.status}
                                                onChange={(event) => update(
                                                    detail,
                                                    {
                                                        status: event.target.value,
                                                    },
                                                )}
                                            >
                                                <option value="DRAFT">DRAFT</option>
                                                <option value="ACTIVE">ACTIVE</option>
                                                <option value="SUSPENDED">SUSPENDED</option>
                                                <option value="ARCHIVED">ARCHIVED</option>
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