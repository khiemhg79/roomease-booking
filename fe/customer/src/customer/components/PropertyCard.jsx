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
          {property.breakfastIncluded && (
            <span className="image-tag">Có bữa sáng</span>
          )}
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

        {property.freeCancellation && (
          <p className="success-text">✓ Có lựa chọn hủy miễn phí</p>
        )}

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
        <strong>{money(property.minNightlyPrice, property.currency)}</strong>
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