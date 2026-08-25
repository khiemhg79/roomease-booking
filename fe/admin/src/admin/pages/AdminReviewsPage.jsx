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
    propertyId: '',
}

const STATUS_LABELS = {
    PENDING: 'Chờ duyệt',
    PUBLISHED: 'Đang hiển thị',
    HIDDEN: 'Đã ẩn',
}

export default function AdminReviewsPage() {
    const [data, setData] = useState(EMPTY)
    const [properties, setProperties] = useState([])
    const [filters, setFilters] = useState(EMPTY_FILTERS)
    const [applied, setApplied] = useState({})
    const [page, setPage] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [working, setWorking] = useState(null)
    const [detail, setDetail] = useState(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            const [reviews, propertyPage] = await Promise.all([
                adminApi.reviews({
                    page,
                    size: 20,
                    ...applied,
                }),
                adminApi.properties({
                    page: 0,
                    size: 100,
                }),
            ])

            setData({
                ...EMPTY,
                ...reviews,
            })

            setProperties(
                propertyPage.content || [],
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

    const updateStatus = async (
        review,
        status,
    ) => {
        setWorking(review.id)
        setError('')
        setNotice('')

        try {
            const updated =
                await adminApi.updateReviewStatus(
                    review.id,
                    status,
                )

            setNotice(
                `Đã chuyển đánh giá sang "${STATUS_LABELS[status]}".`,
            )

            if (detail?.id === review.id) {
                setDetail(updated)
            }

            await load()
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
                    <p>Trust & safety</p>
                    <h1>Kiểm duyệt đánh giá</h1>
                    <span>
                        Kiểm tra đánh giá sau lưu trú, ẩn nội dung vi phạm
                        hoặc xuất bản lại khi hợp lệ.
                    </span>
                </div>

                <strong>
                    {data.totalElements} đánh giá
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
                className="admin-filters admin-review-filters"
                onSubmit={apply}
            >
                <label>
                    Nội dung
                    <input
                        value={filters.keyword}
                        onChange={(event) => setFilters({
                            ...filters,
                            keyword: event.target.value,
                        })}
                        placeholder="Tiêu đề hoặc nội dung..."
                    />
                </label>

                <label>
                    Chỗ nghỉ
                    <select
                        value={filters.propertyId}
                        onChange={(event) => setFilters({
                            ...filters,
                            propertyId: event.target.value,
                        })}
                    >
                        <option value="">Tất cả chỗ nghỉ</option>

                        {properties.map((property) => (
                            <option
                                key={property.id}
                                value={property.id}
                            >
                                {property.name}
                            </option>
                        ))}
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
                        <option value="PUBLISHED">Đang hiển thị</option>
                        <option value="HIDDEN">Đã ẩn</option>
                        <option value="PENDING">Chờ duyệt</option>
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
            ) : data.content.length === 0 ? (
                <section className="admin-panel admin-empty-state">
                    <strong>Chưa có đánh giá phù hợp</strong>
                    <span>
                        Thay đổi bộ lọc hoặc chờ khách hoàn tất kỳ nghỉ.
                    </span>
                </section>
            ) : (
                <section className="admin-review-grid">
                    {data.content.map((review) => (
                        <article
                            className="admin-review-card"
                            key={review.id}
                        >
                            <header>
                                <div>
                                    <strong>{review.userName}</strong>
                                    <span>{review.userEmail}</span>
                                </div>

                                <div className="admin-review-score">
                                    {Number(review.score).toFixed(1)}
                                </div>
                            </header>

                            <div className="admin-review-property">
                                <strong>{review.propertyName}</strong>
                                <span>
                                    Booking: {review.bookingCode || '—'}
                                </span>
                            </div>

                            <h2>
                                {review.title || 'Đánh giá sau kỳ nghỉ'}
                            </h2>

                            <p>
                                {review.content || 'Khách không để lại nội dung.'}
                            </p>

                            <footer>
                                <div>
                                    <span className={`admin-chip review-${review.status.toLowerCase()}`}>
                                        {STATUS_LABELS[review.status] || review.status}
                                    </span>

                                    <small>{dateTimeVN(review.createdAt)}</small>
                                </div>

                                <div className="admin-review-actions">
                                    <button
                                        type="button"
                                        className="admin-action-detail"
                                        onClick={() => setDetail(review)}
                                    >
                                        Chi tiết
                                    </button>

                                    {review.status !== 'PUBLISHED' && (
                                        <button
                                            type="button"
                                            disabled={working === review.id}
                                            className="admin-action-status"
                                            onClick={() => updateStatus(
                                                review,
                                                'PUBLISHED',
                                            )}
                                        >
                                            Xuất bản
                                        </button>
                                    )}

                                    {review.status !== 'HIDDEN' && (
                                        <button
                                            type="button"
                                            disabled={working === review.id}
                                            className="admin-action-danger"
                                            onClick={() => updateStatus(
                                                review,
                                                'HIDDEN',
                                            )}
                                        >
                                            Ẩn
                                        </button>
                                    )}
                                </div>
                            </footer>
                        </article>
                    ))}
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

            {detail && (
                <div
                    className="admin-drawer-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setDetail(null)
                        }
                    }}
                >
                    <aside className="admin-drawer">
                        <div className="admin-drawer-head">
                            <div>
                                <span>Chi tiết đánh giá</span>
                                <h2>{detail.propertyName}</h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setDetail(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="admin-drawer-body">
                            <section className="admin-detail-hero">
                                <div>
                                    <div className="admin-inline-chips">
                                        <span className={`admin-chip review-${detail.status.toLowerCase()}`}>
                                            {STATUS_LABELS[detail.status]}
                                        </span>
                                    </div>

                                    <h3>
                                        {detail.title || 'Đánh giá sau kỳ nghỉ'}
                                    </h3>

                                    <p>{detail.userName} · {detail.userEmail}</p>
                                </div>

                                <div className="admin-review-score large">
                                    {Number(detail.score).toFixed(1)}
                                </div>
                            </section>

                            <section className="admin-detail-section">
                                <h3>Nội dung</h3>
                                <p className="admin-review-full-content">
                                    {detail.content || 'Không có nội dung.'}
                                </p>
                            </section>

                            <section className="admin-detail-section">
                                <h3>Điểm thành phần</h3>

                                <dl className="admin-detail-list">
                                    <div>
                                        <dt>Nhân viên</dt>
                                        <dd>{detail.staffScore ?? '—'}</dd>
                                    </div>
                                    <div>
                                        <dt>Sạch sẽ</dt>
                                        <dd>{detail.cleanlinessScore ?? '—'}</dd>
                                    </div>
                                    <div>
                                        <dt>Vị trí</dt>
                                        <dd>{detail.locationScore ?? '—'}</dd>
                                    </div>
                                    <div>
                                        <dt>Thoải mái</dt>
                                        <dd>{detail.comfortScore ?? '—'}</dd>
                                    </div>
                                    <div>
                                        <dt>Đáng tiền</dt>
                                        <dd>{detail.valueScore ?? '—'}</dd>
                                    </div>
                                </dl>
                            </section>

                            <section className="admin-detail-section">
                                <h3>Liên kết</h3>

                                <dl className="admin-detail-list">
                                    <div>
                                        <dt>Booking</dt>
                                        <dd>{detail.bookingCode || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt>Chỗ nghỉ</dt>
                                        <dd>{detail.propertyName}</dd>
                                    </div>
                                    <div>
                                        <dt>Ngày đánh giá</dt>
                                        <dd>{dateTimeVN(detail.createdAt)}</dd>
                                    </div>
                                </dl>
                            </section>

                            <section className="admin-drawer-actions">
                                {detail.status !== 'PUBLISHED' && (
                                    <button
                                        className="admin-primary-button"
                                        type="button"
                                        disabled={working === detail.id}
                                        onClick={() => updateStatus(
                                            detail,
                                            'PUBLISHED',
                                        )}
                                    >
                                        Xuất bản
                                    </button>
                                )}

                                {detail.status !== 'HIDDEN' && (
                                    <button
                                        className="admin-danger-button"
                                        type="button"
                                        disabled={working === detail.id}
                                        onClick={() => updateStatus(
                                            detail,
                                            'HIDDEN',
                                        )}
                                    >
                                        Ẩn đánh giá
                                    </button>
                                )}
                            </section>
                        </div>
                    </aside>
                </div>
            )}
        </main>
    )
}