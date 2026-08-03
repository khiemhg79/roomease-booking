import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import { Link } from 'react-router-dom'

import { favouriteApi } from '@/api/customer/favouriteApi'
import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'
import RatingBadge from '@/shared/components/RatingBadge'

export default function FavouritesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [
    removingPropertyId,
    setRemovingPropertyId,
  ] = useState(null)

  const loadFavourites = useCallback(
    async () => {
      setLoading(true)
      setError('')

      try {
        const response =
          await favouriteApi.list()

        setItems(
          Array.isArray(response)
            ? response
            : [],
        )
      } catch (requestError) {
        setError(
          apiMessage(requestError),
        )
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    /*
     * Không return Promise từ useEffect.
     * React chỉ cho phép return một hàm cleanup.
     */
    void loadFavourites()
  }, [loadFavourites])

  const removeFavourite =
    async (propertyId) => {
      const confirmed = window.confirm(
        'Bạn muốn bỏ chỗ nghỉ này khỏi danh sách yêu thích?',
      )

      if (!confirmed) {
        return
      }

      setRemovingPropertyId(propertyId)
      setError('')

      try {
        await favouriteApi.toggle(
          propertyId,
        )

        setItems((currentItems) =>
          currentItems.filter(
            (item) =>
              item.propertyId
              !== propertyId,
          ),
        )
      } catch (requestError) {
        setError(
          apiMessage(requestError),
        )
      } finally {
        setRemovingPropertyId(null)
      }
    }

  return (
    <main className="container page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow dark">
            Danh sách đã lưu
          </p>

          <h1>Chỗ nghỉ yêu thích</h1>

          <p>
            Xem lại những chỗ nghỉ bạn đã lưu
            và lựa chọn nơi phù hợp nhất.
          </p>
        </div>

        {!loading && (
          <div className="account-summary-card">
            <strong>{items.length}</strong>
            <span>chỗ nghỉ đã lưu</span>
          </div>
        )}
      </div>

      <ErrorAlert message={error} />

      {loading ? (
        <Loading />
      ) : items.length > 0 ? (
        <div className="featured-grid">
          {items.map((item) => {
            const isRemoving =
              removingPropertyId
              === item.propertyId

            return (
              <article
                className="featured-card"
                key={item.propertyId}
              >
                <Link
                  className="featured-image"
                  to={`/property/${item.slug}`}
                >
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="image-placeholder">
                      RoomEase
                    </div>
                  )}
                </Link>

                <div className="featured-body">
                  <div>
                    <span className="property-type">
                      {item.propertyType
                        || 'Chỗ nghỉ'}
                    </span>

                    <Link
                      to={`/property/${item.slug}`}
                    >
                      <h3>{item.name}</h3>
                    </Link>

                    <p>
                      {item.city}
                      {item.country
                        ? `, ${item.country}`
                        : ''}
                    </p>
                  </div>

                  <RatingBadge
                    score={item.reviewScore}
                    count={item.reviewCount}
                  />

                  <div className="favourite-card-actions">
                    <Link
                      className="btn btn-primary"
                      to={`/property/${item.slug}`}
                    >
                      Xem chỗ nghỉ
                    </Link>

                    <button
                      type="button"
                      className="link-danger"
                      disabled={isRemoving}
                      onClick={() =>
                        removeFavourite(
                          item.propertyId,
                        )
                      }
                    >
                      {isRemoving
                        ? 'Đang xóa...'
                        : 'Bỏ yêu thích'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <section className="empty-state">
          <div className="empty-state-icon">
            ♡
          </div>

          <h2>
            Chưa có chỗ nghỉ yêu thích
          </h2>

          <p>
            Hãy mở một chỗ nghỉ và nhấn nút
            lưu để xem lại nhanh hơn.
          </p>

          <Link
            className="btn btn-primary"
            to="/"
          >
            Khám phá chỗ nghỉ
          </Link>
        </section>
      )}
    </main>
  )
}