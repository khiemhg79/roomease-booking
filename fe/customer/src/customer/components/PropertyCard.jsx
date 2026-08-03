import { Link } from 'react-router-dom'

import RatingBadge from '@/shared/components/RatingBadge'
import { money } from '@/shared/utils/format'

export default function PropertyCard({
  property,
  query = '',
  isFavourite = false,
  favouriteLoading = false,
  onToggleFavourite,
  isCompared = false,
  onToggleCompare,
}) {
  const detailUrl = `/property/${property.slug}${query ? `?${query}` : ''}`

  return (
    <article className={`property-card ${isCompared ? 'property-card-compared' : ''}`}>
      <div className="property-image-cell">
        <Link to={detailUrl} className="property-image-wrap">
          <img
            className="property-image"
            src={property.thumbnailUrl}
            alt={property.name}
          />
          {property.discountPercent > 0 ? (
            <span className="image-tag discount-tag">Giảm {property.discountPercent}%</span>
          ) : property.breakfastIncluded ? (
            <span className="image-tag">Có bữa sáng</span>
          ) : null}
        </Link>

        <div className="property-image-actions">
          <button
            type="button"
            className={`property-round-button ${isFavourite ? 'active favourite' : ''}`}
            onClick={() => onToggleFavourite?.(property)}
            disabled={favouriteLoading}
            title={isFavourite ? 'Bỏ yêu thích' : 'Lưu yêu thích'}
            aria-label={isFavourite ? 'Bỏ yêu thích' : 'Lưu yêu thích'}
          >
            {isFavourite ? '♥' : '♡'}
          </button>
        </div>
      </div>

      <div className="property-main">
        <div className="property-title-row">
          <div>
            <div className="stars">{'★'.repeat(property.starRating || 0)}</div>
            <Link to={detailUrl}>
              <h3>{property.name}</h3>
            </Link>
            <p className="property-location">
              {property.address || property.city}, {property.city}
            </p>
          </div>

          <RatingBadge
            score={property.reviewScore}
            count={property.reviewCount}
          />
        </div>

        <div className="amenity-chips">
          {property.amenities?.slice(0, 5).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>

        <div className="booking-benefits">
          {property.freeCancellation && <span>✓ Hủy miễn phí</span>}
          {property.breakfastIncluded && <span>✓ Có bữa sáng</span>}
          {property.payAtProperty && <span>✓ Thanh toán tại chỗ nghỉ</span>}
          {['ALLOWED', 'ON_REQUEST'].includes(property.petsPolicy) && <span>✓ Có chính sách thú cưng</span>}
        </div>

        <button
          type="button"
          className={`compare-toggle ${isCompared ? 'active' : ''}`}
          onClick={() => onToggleCompare?.(property)}
        >
          <span>{isCompared ? '✓' : '+'}</span>
          {isCompared ? 'Đã thêm vào so sánh' : 'Thêm vào so sánh'}
        </button>
      </div>

      <div className="property-price">
        <span>Giá từ mỗi đêm</span>
        {property.originalMinNightlyPrice && Number(property.originalMinNightlyPrice) > Number(property.minNightlyPrice) && (
          <del>{money(property.originalMinNightlyPrice, property.currency)}</del>
        )}
        <strong>{money(property.minNightlyPrice, property.currency)}</strong>
        {property.originalMinTotalPrice && Number(property.originalMinTotalPrice) > Number(property.minTotalPrice) && (
          <small><del>{money(property.originalMinTotalPrice, property.currency)}</del></small>
        )}
        <small>Tổng {money(property.minTotalPrice, property.currency)}</small>
        {property.availableRooms > 0 && property.availableRooms <= 3 && (
          <em>Chỉ còn {property.availableRooms} phòng</em>
        )}
        <Link className="btn btn-primary" to={detailUrl}>
          Xem phòng
        </Link>
      </div>
    </article>
  )
}