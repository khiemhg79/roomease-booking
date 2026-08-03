import { Link } from 'react-router-dom'
import { money } from '@/shared/utils/format'
import RatingBadge from '@/shared/components/RatingBadge'

export default function PropertyCard({ property, query = '' }) {
  return (
    <article className="property-card">
      <Link to={`/property/${property.slug}${query ? `?${query}` : ''}`} className="property-image-wrap">
        <img className="property-image" src={property.thumbnailUrl} alt={property.name} />
        {property.breakfastIncluded && <span className="image-tag">Có bữa sáng</span>}
      </Link>
      <div className="property-main">
        <div className="property-title-row">
          <div>
            <div className="stars">{'★'.repeat(property.starRating || 0)}</div>
            <Link to={`/property/${property.slug}${query ? `?${query}` : ''}`}><h3>{property.name}</h3></Link>
            <p className="property-location">{property.address || property.city}, {property.city}</p>
          </div>
          <RatingBadge score={property.reviewScore} count={property.reviewCount} />
        </div>
        <div className="amenity-chips">
          {property.amenities?.slice(0, 5).map((item) => <span key={item}>{item}</span>)}
        </div>
        {property.freeCancellation && <p className="success-text">✓ Có lựa chọn hủy miễn phí</p>}
      </div>
      <div className="property-price">
        <span>Giá từ mỗi đêm</span>
        <strong>{money(property.minNightlyPrice, property.currency)}</strong>
        <small>Tổng {money(property.minTotalPrice, property.currency)}</small>
        <Link className="btn btn-primary" to={`/property/${property.slug}${query ? `?${query}` : ''}`}>Xem phòng</Link>
      </div>
    </article>
  )
}
