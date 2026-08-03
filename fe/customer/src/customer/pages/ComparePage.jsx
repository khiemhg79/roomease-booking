import { Link } from 'react-router-dom'

import { useCompare } from '@/customer/context/CompareContext'
import { money, ratingLabel } from '@/shared/utils/format'

function yesNo(value) {
    return value ? 'Có' : 'Không'
}

export default function ComparePage() {
    const {
        items,
        remove,
        clear,
    } = useCompare()

    if (!items.length) {
        return (
            <main className="container page-section">
                <section className="empty-state compare-empty">
                    <div className="empty-state-icon">⇄</div>
                    <h1>Chưa có chỗ nghỉ để so sánh</h1>
                    <p>
                        Tại trang tìm kiếm, chọn tối đa 3 chỗ nghỉ rồi mở bảng so sánh.
                    </p>
                    <Link className="btn btn-primary" to="/search">
                        Tìm chỗ nghỉ
                    </Link>
                </section>
            </main>
        )
    }

    return (
        <main className="container page-section compare-page">
            <div className="section-heading compare-page-heading">
                <div>
                    <p className="eyebrow dark">Quyết định dễ hơn</p>
                    <h1>So sánh chỗ nghỉ</h1>
                    <p>{items.length}/3 chỗ nghỉ đang được so sánh</p>
                </div>

                <button
                    type="button"
                    className="btn btn-danger"
                    onClick={clear}
                >
                    Xóa tất cả
                </button>
            </div>

            <section
                className="compare-grid"
                style={{ '--compare-columns': items.length }}
            >
                <div className="compare-label-column" aria-hidden="true">
                    <div className="compare-label-spacer" />
                    <strong>Loại hình</strong>
                    <strong>Vị trí</strong>
                    <strong>Hạng sao</strong>
                    <strong>Điểm đánh giá</strong>
                    <strong>Giá từ/đêm</strong>
                    <strong>Tổng giá</strong>
                    <strong>Hủy miễn phí</strong>
                    <strong>Bữa sáng</strong>
                    <strong>Phòng còn lại</strong>
                    <strong>Tiện nghi nổi bật</strong>
                </div>

                {items.map((item) => (
                    <article className="compare-column" key={item.id}>
                        <div className="compare-property-head">
                            <button
                                type="button"
                                className="compare-remove"
                                onClick={() => remove(item.id)}
                                aria-label={`Xóa ${item.name} khỏi so sánh`}
                            >
                                ×
                            </button>

                            <img src={item.thumbnailUrl} alt={item.name} />
                            <h2>{item.name}</h2>

                            <Link
                                className="btn btn-primary"
                                to={`/property/${item.slug}`}
                            >
                                Xem phòng
                            </Link>
                        </div>

                        <div>{item.propertyType || 'Chỗ nghỉ'}</div>
                        <div>{item.address || item.city}, {item.city}</div>
                        <div>{item.starRating ? `${item.starRating} sao` : 'Chưa xếp hạng'}</div>
                        <div>
                            <strong>{item.reviewScore.toFixed(1)}</strong>
                            <small>{ratingLabel(item.reviewScore)} · {item.reviewCount} đánh giá</small>
                        </div>
                        <div className="compare-price">
                            {item.minNightlyPrice
                                ? money(item.minNightlyPrice, item.currency)
                                : 'Chọn ngày để xem giá'}
                        </div>
                        <div>
                            {item.minTotalPrice
                                ? money(item.minTotalPrice, item.currency)
                                : '—'}
                        </div>
                        <div className={item.freeCancellation ? 'compare-positive' : ''}>
                            {yesNo(item.freeCancellation)}
                        </div>
                        <div className={item.breakfastIncluded ? 'compare-positive' : ''}>
                            {yesNo(item.breakfastIncluded)}
                        </div>
                        <div>{item.availableRooms || '—'}</div>
                        <div className="compare-amenities">
                            {item.amenities.length
                                ? item.amenities.slice(0, 7).map((amenity) => (
                                    <span key={amenity}>{amenity}</span>
                                ))
                                : 'Chưa có thông tin'}
                        </div>
                    </article>
                ))}
            </section>
        </main>
    )
}