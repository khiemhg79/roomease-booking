import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { propertyApi } from '@/api/customer/propertyApi'
import { apiMessage } from '@/api/http'
import SearchBox from '@/customer/components/SearchBox'
import { getRecentlyViewed } from '@/customer/utils/customerStorage'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'
import RatingBadge from '@/shared/components/RatingBadge'

const destinations = [
  [
    'Đà Nẵng',
    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=900&q=85',
  ],
  [
    'TP. Hồ Chí Minh',
    'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=85',
  ],
  [
    'Hà Nội',
    'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=900&q=85',
  ],
  [
    'Nha Trang',
    'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=900&q=85',
  ],
]

export default function HomePage() {
  const [featured, setFeatured] = useState([])
  const [recent, setRecent] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setRecent(getRecentlyViewed())

    propertyApi
      .featured()
      .then(setFeatured)
      .catch((requestError) => setError(apiMessage(requestError)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <section className="hero">
        <div className="container hero-content">
          <p className="eyebrow">Tìm chỗ nghỉ phù hợp với bạn</p>
          <h1>
            Ở đâu cũng dễ dàng
            <br />
            với RoomEase
          </h1>
          <p>
            Tìm kiếm theo ngày, so sánh chỗ nghỉ, lưu yêu thích và quản lý
            toàn bộ chuyến đi trong một tài khoản.
          </p>
          <SearchBox />
        </div>
      </section>

      <main className="container page-section">
        <section className="customer-tool-grid">
          <Link to="/compare">
            <span>⇄</span>
            <div>
              <h3>So sánh chỗ nghỉ</h3>
              <p>Đặt tối đa 3 lựa chọn cạnh nhau để quyết định nhanh hơn.</p>
            </div>
          </Link>

          <Link to="/favourites">
            <span>♡</span>
            <div>
              <h3>Danh sách yêu thích</h3>
              <p>Lưu lại khách sạn phù hợp để xem và đặt sau.</p>
            </div>
          </Link>

          <Link to="/bookings">
            <span>✓</span>
            <div>
              <h3>Trợ lý chuyến đi</h3>
              <p>Checklist chuẩn bị, thông tin booking và đánh giá sau kỳ nghỉ.</p>
            </div>
          </Link>
        </section>

        <section className="page-section compact-top-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow dark">Khám phá Việt Nam</p>
              <h2>Điểm đến được yêu thích</h2>
            </div>
          </div>

          <div className="destination-grid">
            {destinations.map(([name, image]) => (
              <Link
                className="destination-card"
                key={name}
                to={`/search?destination=${encodeURIComponent(name)}&checkIn=${tomorrow(1)}&checkOut=${tomorrow(3)}&adults=2&children=0&rooms=1`}
              >
                <img src={image} alt={name} />
                <span>{name}</span>
              </Link>
            ))}
          </div>
        </section>

        {recent.length > 0 && (
          <section className="page-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow dark">Tiếp tục khám phá</p>
                <h2>Chỗ nghỉ đã xem gần đây</h2>
              </div>
              <Link className="section-link" to="/account">
                Mở không gian cá nhân →
              </Link>
            </div>

            <div className="recent-grid">
              {recent.slice(0, 4).map((item) => (
                <Link
                  className="recent-card"
                  to={`/property/${item.slug}`}
                  key={item.id}
                >
                  <img src={item.thumbnailUrl} alt={item.name} />
                  <div>
                    <span className="type-label">{item.propertyType}</span>
                    <h3>{item.name}</h3>
                    <p>{item.city}, {item.country}</p>
                    <RatingBadge
                      score={item.reviewScore}
                      count={item.reviewCount}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="page-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow dark">Được đánh giá cao</p>
              <h2>Chỗ nghỉ nổi bật</h2>
            </div>
          </div>

          <ErrorAlert message={error} />

          {loading ? (
            <Loading />
          ) : (
            <div className="featured-grid">
              {featured.map((item) => (
                <Link
                  className="featured-card"
                  to={`/property/${item.slug}`}
                  key={item.id}
                >
                  <img src={item.thumbnailUrl} alt={item.name} />
                  <div className="featured-body">
                    <span className="type-label">{item.propertyType}</span>
                    <h3>{item.name}</h3>
                    <p>{item.city}, {item.country}</p>
                    <RatingBadge
                      score={item.reviewScore}
                      count={item.reviewCount}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="benefit-grid page-section">
          <div>
            <b>✓</b>
            <h3>Giá và tồn phòng theo ngày</h3>
            <p>Không dùng một mức giá cố định cho mọi ngày.</p>
          </div>
          <div>
            <b>✓</b>
            <h3>Chính sách rõ ràng</h3>
            <p>Biết trước bữa sáng, hoàn hủy và thanh toán.</p>
          </div>
          <div>
            <b>✓</b>
            <h3>Quản lý booking thông minh</h3>
            <p>Theo dõi trạng thái, checklist và đánh giá sau kỳ nghỉ.</p>
          </div>
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