import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { propertyApi } from '@/api/customer/propertyApi'
import { apiMessage } from '@/api/http'
import SearchBox from '@/customer/components/SearchBox'
import Loading from '@/shared/components/Loading'
import ErrorAlert from '@/shared/components/ErrorAlert'
import RatingBadge from '@/shared/components/RatingBadge'

const destinations = [
  ['Đà Nẵng', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=900&q=85'],
  ['TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=85'],
  ['Hà Nội', 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=900&q=85'],
  ['Nha Trang', 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=900&q=85'],
]

export default function HomePage() {
  const [featured, setFeatured] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    propertyApi.featured().then(setFeatured).catch((e) => setError(apiMessage(e))).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <section className="hero">
        <div className="container hero-content">
          <p className="eyebrow">Tìm chỗ nghỉ phù hợp với bạn</p>
          <h1>Ở đâu cũng dễ dàng<br />với RoomEase</h1>
          <p>Tìm kiếm theo ngày, so sánh loại phòng, gói giá và chính sách hủy trước khi đặt.</p>
          <SearchBox />
        </div>
      </section>
      <main className="container page-section">
        <section>
          <div className="section-heading"><div><p className="eyebrow dark">Khám phá Việt Nam</p><h2>Điểm đến được yêu thích</h2></div></div>
          <div className="destination-grid">
            {destinations.map(([name, image]) => (
              <Link className="destination-card" key={name} to={`/search?destination=${encodeURIComponent(name)}&checkIn=${tomorrow(1)}&checkOut=${tomorrow(3)}&adults=2&children=0&rooms=1`}>
                <img src={image} alt={name} /><span>{name}</span>
              </Link>
            ))}
          </div>
        </section>
        <section className="page-section">
          <div className="section-heading"><div><p className="eyebrow dark">Được đánh giá cao</p><h2>Chỗ nghỉ nổi bật</h2></div></div>
          <ErrorAlert message={error} />
          {loading ? <Loading /> : (
            <div className="featured-grid">
              {featured.map((item) => <Link className="featured-card" to={`/property/${item.slug}`} key={item.id}>
                <img src={item.thumbnailUrl} alt={item.name} />
                <div className="featured-body"><span className="type-label">{item.propertyType}</span><h3>{item.name}</h3>
                  <p>{item.city}, {item.country}</p><RatingBadge score={item.reviewScore} count={item.reviewCount} /></div>
              </Link>)}
            </div>
          )}
        </section>
        <section className="benefit-grid page-section">
          <div><b>✓</b><h3>Giá và tồn phòng theo ngày</h3><p>Không dùng một mức giá cố định cho mọi ngày.</p></div>
          <div><b>✓</b><h3>Chính sách rõ ràng</h3><p>Biết trước bữa sáng, hoàn hủy và thanh toán.</p></div>
          <div><b>✓</b><h3>Quản lý booking</h3><p>Xem lịch sử và hủy đơn ngay trong tài khoản.</p></div>
        </section>
      </main>
    </>
  )
}

function tomorrow(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}
