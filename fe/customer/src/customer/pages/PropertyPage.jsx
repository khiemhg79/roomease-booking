import { useEffect, useMemo, useState } from 'react'
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { favouriteApi } from '@/api/customer/favouriteApi'
import { propertyApi } from '@/api/customer/propertyApi'
import { apiMessage } from '@/api/http'
import { useAuth } from '@/auth/AuthContext'
import RoomOfferCard from '@/customer/components/RoomOfferCard'
import SearchBox from '@/customer/components/SearchBox'
import { useCompare } from '@/customer/context/CompareContext'
import { addRecentlyViewed } from '@/customer/utils/customerStorage'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'
import RatingBadge from '@/shared/components/RatingBadge'
import {
  defaultStay,
  money,
  ratingLabel,
} from '@/shared/utils/format'

function toCompareProperty(property) {
  const offers = property.offers || []
  const nightlyPrices = offers
    .map((offer) => Number(offer.averageNightlyPrice || 0))
    .filter((value) => value > 0)
  const totalPrices = offers
    .map((offer) => Number(offer.totalPrice || 0))
    .filter((value) => value > 0)

  return {
    ...property,
    address: property.addressLine,
    thumbnailUrl: property.images?.[0]?.url,
    amenities: property.amenities?.map((item) => item.name) || [],
    minNightlyPrice: nightlyPrices.length ? Math.min(...nightlyPrices) : 0,
    minTotalPrice: totalPrices.length ? Math.min(...totalPrices) : 0,
    currency: offers[0]?.currency || 'VND',
    freeCancellation: offers.some((offer) => offer.refundable),
    breakfastIncluded: offers.some((offer) => {
      const mealPlan = String(offer.mealPlan || '').toUpperCase()
      return mealPlan && mealPlan !== 'ROOM_ONLY'
    }),
    availableRooms: offers.length
      ? Math.max(...offers.map((offer) => Number(offer.availableRooms || 0)))
      : 0,
  }
}

export default function PropertyPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const compare = useCompare()
  const [searchParams] = useSearchParams()
  const stay = defaultStay()

  const query = useMemo(() => ({
    checkIn: searchParams.get('checkIn') || stay.checkIn,
    checkOut: searchParams.get('checkOut') || stay.checkOut,
    adults: searchParams.get('adults') || 2,
    children: searchParams.get('children') || 0,
    rooms: searchParams.get('rooms') || 1,
    destination: searchParams.get('destination') || '',
  }), [searchParams])

  const [property, setProperty] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isFavourite, setIsFavourite] = useState(false)
  const [favouriteLoading, setFavouriteLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')

    propertyApi
      .detail(slug, query)
      .then(async (data) => {
        setProperty(data)
        addRecentlyViewed(data)

        try {
          const reviewData = await propertyApi.reviews(data.id)
          setReviews(reviewData.content || [])
        } catch {
          setReviews([])
        }
      })
      .catch((requestError) => setError(apiMessage(requestError)))
      .finally(() => setLoading(false))
  }, [slug, query])

  useEffect(() => {
    if (!isAuthenticated || !property?.id) {
      setIsFavourite(false)
      return
    }

    favouriteApi
      .list()
      .then((items) => {
        setIsFavourite(
          (Array.isArray(items) ? items : [])
            .some((item) => item.propertyId === property.id),
        )
      })
      .catch(() => setIsFavourite(false))
  }, [isAuthenticated, property?.id])

  const toggleFavourite = async () => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: `${location.pathname}${location.search}`,
        },
      })
      return
    }

    setFavouriteLoading(true)
    setNotice('')

    try {
      const result = await favouriteApi.toggle(property.id)
      setIsFavourite(result.favourite)
      setNotice(
        result.favourite
          ? 'Đã lưu chỗ nghỉ vào danh sách yêu thích.'
          : 'Đã bỏ chỗ nghỉ khỏi danh sách yêu thích.',
      )
    } catch (requestError) {
      setNotice(apiMessage(requestError))
    } finally {
      setFavouriteLoading(false)
    }
  }

  const toggleCompare = () => {
    const result = compare.toggle(toCompareProperty(property))

    if (result.reason === 'LIMIT') {
      setNotice('Bảng so sánh đã đủ 3 chỗ nghỉ. Hãy bỏ bớt một lựa chọn.')
      return
    }

    setNotice(
      result.added
        ? 'Đã thêm chỗ nghỉ vào bảng so sánh.'
        : 'Đã bỏ chỗ nghỉ khỏi bảng so sánh.',
    )
  }

  if (loading) {
    return <main className="container page-section"><Loading /></main>
  }

  if (error) {
    return (
      <main className="container page-section">
        <ErrorAlert message={error} />
      </main>
    )
  }

  if (!property) return null

  const bookingQuery = new URLSearchParams({
    property: property.slug,
    ...query,
  }).toString()
  const compareActive = compare.contains(property.id)
  const lowestOffer = [...(property.offers || [])]
    .sort((a, b) => Number(a.totalPrice) - Number(b.totalPrice))[0]

  return (
    <>
      <div className="search-strip">
        <div className="container">
          <SearchBox initial={query} compact />
        </div>
      </div>

      <main className="container property-page page-section">
        <div className="property-head">
          <div>
            <div className="stars">{'★'.repeat(property.starRating)}</div>
            <h1>{property.name}</h1>
            <p>
              {property.addressLine}, {property.district}, {property.city}, {property.country}
            </p>
          </div>

          <div className="property-head-actions">
            <RatingBadge
              score={property.reviewScore}
              count={property.reviewCount}
            />

            <div className="property-action-row">
              <button
                className={`btn btn-ghost dark ${isFavourite ? 'active-action' : ''}`}
                type="button"
                onClick={toggleFavourite}
                disabled={favouriteLoading}
              >
                {isFavourite ? '♥ Đã yêu thích' : '♡ Lưu chỗ nghỉ'}
              </button>

              <button
                className={`btn btn-ghost dark ${compareActive ? 'active-action' : ''}`}
                type="button"
                onClick={toggleCompare}
              >
                {compareActive ? '✓ Đang so sánh' : '⇄ So sánh'}
              </button>
            </div>

            {notice && <small className="property-action-notice">{notice}</small>}
          </div>
        </div>

        <div className="gallery">
          {property.images.slice(0, 5).map((image, index) => (
            <img
              className={index === 0 ? 'gallery-main' : ''}
              key={image.id}
              src={image.url}
              alt={image.altText || property.name}
            />
          ))}
        </div>

        {lowestOffer && (
          <section className="property-highlight-bar">
            <div>
              <span>Giá tốt nhất cho ngày đã chọn</span>
              <strong>{money(lowestOffer.averageNightlyPrice, lowestOffer.currency)}/đêm</strong>
            </div>
            <div>
              <span>Chính sách</span>
              <strong>{lowestOffer.refundable ? 'Có hủy miễn phí' : 'Không hoàn tiền'}</strong>
            </div>
            <div>
              <span>Tình trạng</span>
              <strong>Còn {lowestOffer.availableRooms} phòng</strong>
            </div>
            <a className="btn btn-primary" href="#rooms">Chọn phòng</a>
          </section>
        )}

        <div className="detail-grid">
          <section>
            <h2>Giới thiệu</h2>
            <p className="long-copy">{property.description}</p>

            <h2>Tiện nghi nổi bật</h2>
            <div className="amenities-large">
              {property.amenities.map((amenity) => (
                <span key={amenity.id}>✓ {amenity.name}</span>
              ))}
            </div>
          </section>

          <aside className="location-card">
            <h3>Thông tin lưu trú</h3>
            <p>{property.addressLine}</p>
            <p>{property.district}, {property.city}</p>
            <strong>Nhận phòng từ {property.checkInFrom?.slice(0, 5)}</strong>
            <strong>Trả phòng đến {property.checkOutUntil?.slice(0, 5)}</strong>
          </aside>
        </div>

        <section id="rooms" className="page-section">
          <div className="section-heading">
            <div>
              <h2>Phòng và gói giá còn trống</h2>
              <p>{query.checkIn} → {query.checkOut}</p>
            </div>
          </div>

          {property.offers.length ? (
            property.offers.map((offer) => (
              <RoomOfferCard
                key={offer.ratePlanId}
                offer={offer}
                bookingQuery={bookingQuery}
              />
            ))
          ) : (
            <div className="empty-state">
              <h3>Không còn phòng cho lựa chọn này</h3>
              <p>Hãy thử ngày khác hoặc giảm số phòng.</p>
            </div>
          )}
        </section>

        <section className="page-section">
          <div className="section-heading">
            <div>
              <h2>Đánh giá của khách</h2>
              <p>
                {ratingLabel(property.reviewScore)} · {property.reviewCount} đánh giá
              </p>
            </div>
          </div>

          <div className="review-grid">
            {reviews.length ? (
              reviews.map((review) => (
                <article className="review-card" key={review.id}>
                  <div>
                    <span className="rating-badge">
                      {Number(review.score).toFixed(1)}
                    </span>
                    <strong>{review.userName}</strong>
                  </div>
                  <h3>{review.title || 'Trải nghiệm lưu trú'}</h3>
                  <p>{review.content || 'Khách hàng đã để lại điểm đánh giá.'}</p>
                </article>
              ))
            ) : (
              <p>Chưa có nội dung đánh giá.</p>
            )}
          </div>
        </section>

        {property.policies && (
          <section className="policy-box">
            <h2>Quy tắc chỗ nghỉ</h2>
            <div>
              <p>
                Trẻ em: {property.policies.childrenAllowed ? 'Được phép' : 'Không được phép'}
              </p>
              <p>Thú cưng: {property.policies.petsPolicy}</p>
              <p>Hút thuốc: {property.policies.smokingPolicy}</p>
              <p>{property.policies.importantInformation}</p>
            </div>
          </section>
        )}
      </main>
    </>
  )
}