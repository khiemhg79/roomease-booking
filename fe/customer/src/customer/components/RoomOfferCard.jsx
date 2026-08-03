import { Link } from 'react-router-dom'
import { money } from '@/shared/utils/format'

const mealLabel = {
  ROOM_ONLY: 'Không gồm bữa ăn', BREAKFAST_INCLUDED: 'Đã gồm bữa sáng', HALF_BOARD: 'Bao gồm 2 bữa',
  FULL_BOARD: 'Bao gồm 3 bữa', ALL_INCLUSIVE: 'Trọn gói',
}

export default function RoomOfferCard({ offer, bookingQuery }) {
  const params = new URLSearchParams(bookingQuery)
  params.set('ratePlanId', offer.ratePlanId)
  return (
    <article className="offer-card">
      <div className="offer-room">
        <img src={offer.imageUrl} alt={offer.roomName} />
        <div><h3>{offer.roomName}</h3><p>{offer.roomDescription}</p>
          <ul className="compact-list">
            <li>{offer.bedSummary}</li><li>Tối đa {offer.maxAdults} người lớn, {offer.maxChildren} trẻ em</li>
            {offer.roomSizeSqm && <li>{offer.roomSizeSqm} m²</li>}{offer.viewName && <li>Hướng {offer.viewName}</li>}
          </ul>
          <div className="amenity-chips">{offer.roomAmenities?.slice(0, 5).map((a) => <span key={a}>{a}</span>)}</div>
        </div>
      </div>
      <div className="offer-policy">
        <strong>{offer.ratePlanName}</strong>
        <p className="success-text">{mealLabel[offer.mealPlan] || offer.mealPlan}</p>
        <p className={offer.refundable ? 'success-text' : 'danger-text'}>
          {offer.refundable ? `Hủy miễn phí trước ${offer.cancellationDays} ngày` : 'Không hoàn tiền'}
        </p>
        {offer.payAtProperty && <p>Không cần thanh toán trước</p>}
      </div>
      <div className="offer-price">
        <span>Còn {offer.availableRooms} phòng</span>
        {Number(offer.originalTotalPrice) > Number(offer.totalPrice) && <del>{money(offer.originalTotalPrice, offer.currency)}</del>}
        <strong>{money(offer.totalPrice, offer.currency)}</strong>
        <small>Đã gồm giá phòng, chưa gồm thuế 8%</small>
        <Link className="btn btn-primary" to={`/checkout?${params.toString()}`}>Chọn phòng</Link>
      </div>
    </article>
  )
}
