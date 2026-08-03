import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { propertyApi } from '@/api/customer/propertyApi'
import { favouriteApi } from '@/api/customer/favouriteApi'
import { apiMessage } from '@/api/http'
import { defaultStay, ratingLabel } from '@/shared/utils/format'
import SearchBox from '@/customer/components/SearchBox'
import RoomOfferCard from '@/customer/components/RoomOfferCard'
import RatingBadge from '@/shared/components/RatingBadge'
import Loading from '@/shared/components/Loading'
import ErrorAlert from '@/shared/components/ErrorAlert'
import { useAuth } from '@/auth/AuthContext'

export default function PropertyPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()
  const stay = defaultStay()
  const query = {
    checkIn: searchParams.get('checkIn') || stay.checkIn,
    checkOut: searchParams.get('checkOut') || stay.checkOut,
    adults: searchParams.get('adults') || 2,
    children: searchParams.get('children') || 0,
    rooms: searchParams.get('rooms') || 1,
    destination: searchParams.get('destination') || '',
  }
  const [property, setProperty] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favouriteMessage, setFavouriteMessage] = useState('')

  useEffect(() => {
    setLoading(true)
    propertyApi.detail(slug, query).then(async (data) => {
      setProperty(data)
      try { setReviews((await propertyApi.reviews(data.id)).content || []) } catch { setReviews([]) }
    }).catch((e) => setError(apiMessage(e))).finally(() => setLoading(false))
  }, [slug, searchParams.toString()])

  const toggleFavourite = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    try {
      const result = await favouriteApi.toggle(property.id)
      setFavouriteMessage(result.favourite ? 'Đã lưu vào yêu thích' : 'Đã xóa khỏi yêu thích')
    } catch (e) {
      setFavouriteMessage(apiMessage(e))
    }
  }

  if (loading) return <main className="container page-section"><Loading /></main>
  if (error) return <main className="container page-section"><ErrorAlert message={error} /></main>
  if (!property) return null
  const bookingQuery = new URLSearchParams({ property: property.slug, ...query }).toString()

  return (
    <>
      <div className="search-strip"><div className="container"><SearchBox initial={query} compact /></div></div>
      <main className="container property-page page-section">
        <div className="property-head"><div><div className="stars">{'★'.repeat(property.starRating)}</div><h1>{property.name}</h1>
          <p>{property.addressLine}, {property.district}, {property.city}, {property.country}</p></div>
          <div className="property-head-actions"><RatingBadge score={property.reviewScore} count={property.reviewCount} />
            <button className="btn btn-ghost dark" type="button" onClick={toggleFavourite}>♡ Lưu chỗ nghỉ</button>
            {favouriteMessage && <small>{favouriteMessage}</small>}</div></div>
        <div className="gallery">
          {property.images.slice(0, 5).map((image, index) => <img className={index === 0 ? 'gallery-main' : ''} key={image.id} src={image.url} alt={image.altText || property.name} />)}
        </div>
        <div className="detail-grid">
          <section><h2>Giới thiệu</h2><p className="long-copy">{property.description}</p>
            <h2>Tiện nghi nổi bật</h2><div className="amenities-large">{property.amenities.map((a) => <span key={a.id}>✓ {a.name}</span>)}</div></section>
          <aside className="location-card"><h3>Vị trí</h3><p>{property.addressLine}</p><p>{property.district}, {property.city}</p>
            <strong>Nhận phòng từ {property.checkInFrom?.slice(0, 5)}</strong><strong>Trả phòng đến {property.checkOutUntil?.slice(0, 5)}</strong></aside>
        </div>
        <section id="rooms" className="page-section"><div className="section-heading"><div><h2>Phòng và gói giá còn trống</h2><p>{query.checkIn} → {query.checkOut}</p></div></div>
          {property.offers.length ? property.offers.map((offer) => <RoomOfferCard key={offer.ratePlanId} offer={offer} bookingQuery={bookingQuery} />)
            : <div className="empty-state"><h3>Không còn phòng cho lựa chọn này</h3><p>Hãy thử ngày khác hoặc giảm số phòng.</p></div>}</section>
        <section className="page-section"><div className="section-heading"><div><h2>Đánh giá của khách</h2><p>{ratingLabel(property.reviewScore)} · {property.reviewCount} đánh giá</p></div></div>
          <div className="review-grid">{reviews.length ? reviews.map((r) => <article className="review-card" key={r.id}>
            <div><span className="rating-badge">{Number(r.score).toFixed(1)}</span><strong>{r.userName}</strong></div><h3>{r.title}</h3><p>{r.content}</p></article>)
            : <p>Chưa có nội dung đánh giá mẫu.</p>}</div></section>
        {property.policies && <section className="policy-box"><h2>Quy tắc chỗ nghỉ</h2><div><p>Trẻ em: {property.policies.childrenAllowed ? 'Được phép' : 'Không được phép'}</p>
          <p>Thú cưng: {property.policies.petsPolicy}</p><p>Hút thuốc: {property.policies.smokingPolicy}</p><p>{property.policies.importantInformation}</p></div></section>}
      </main>
    </>
  )
}
