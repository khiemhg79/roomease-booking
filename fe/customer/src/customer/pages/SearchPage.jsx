import { useEffect, useMemo, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { favouriteApi } from '@/api/customer/favouriteApi'
import { propertyApi } from '@/api/customer/propertyApi'
import { apiMessage } from '@/api/http'
import { useAuth } from '@/auth/AuthContext'
import FilterSidebar from '@/customer/components/FilterSidebar'
import PropertyCard from '@/customer/components/PropertyCard'
import SearchBox from '@/customer/components/SearchBox'
import { useCompare } from '@/customer/context/CompareContext'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'

const emptyFilters = {
  propertyTypes: [],
  stars: [],
  amenities: [],
  minReviewScore: '',
  minPrice: '',
  maxPrice: '',
}

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const compare = useCompare()

  const initial = useMemo(
    () => Object.fromEntries(searchParams.entries()),
    [searchParams],
  )

  const [filters, setFilters] = useState(emptyFilters)
  const [sort, setSort] = useState('recommended')
  const [page, setPage] = useState(0)
  const [data, setData] = useState({
    content: [],
    totalElements: 0,
    totalPages: 0,
  })
  const [favouriteIds, setFavouriteIds] = useState(new Set())
  const [favouriteLoadingId, setFavouriteLoadingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')

    const params = {
      destination: initial.destination,
      checkIn: initial.checkIn,
      checkOut: initial.checkOut,
      adults: initial.adults || 2,
      children: initial.children || 0,
      rooms: initial.rooms || 1,
      propertyTypes: filters.propertyTypes,
      stars: filters.stars,
      amenities: filters.amenities,
      minReviewScore: filters.minReviewScore || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      sort,
      page,
      size: 10,
    }

    propertyApi
      .search(params)
      .then(setData)
      .catch((requestError) => setError(apiMessage(requestError)))
      .finally(() => setLoading(false))
  }, [initial, filters, sort, page])

  useEffect(() => {
    if (!isAuthenticated) {
      setFavouriteIds(new Set())
      return
    }

    favouriteApi
      .list()
      .then((items) => {
        setFavouriteIds(new Set(
          (Array.isArray(items) ? items : []).map((item) => item.propertyId),
        ))
      })
      .catch(() => setFavouriteIds(new Set()))
  }, [isAuthenticated])

  const changeFilter = (key, value) => {
    setPage(0)
    setFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const toggleFavourite = async (property) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: `${location.pathname}${location.search}`,
        },
      })
      return
    }

    setFavouriteLoadingId(property.id)
    setError('')

    try {
      const result = await favouriteApi.toggle(property.id)

      setFavouriteIds((current) => {
        const next = new Set(current)
        if (result.favourite) next.add(property.id)
        else next.delete(property.id)
        return next
      })

      setNotice(
        result.favourite
          ? `Đã lưu ${property.name} vào yêu thích.`
          : `Đã bỏ ${property.name} khỏi yêu thích.`,
      )
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setFavouriteLoadingId(null)
    }
  }

  const toggleCompare = (property) => {
    const result = compare.toggle(property)

    if (result.reason === 'LIMIT') {
      setNotice('Bạn chỉ có thể so sánh tối đa 3 chỗ nghỉ.')
      return
    }

    setNotice(
      result.added
        ? `Đã thêm ${property.name} vào bảng so sánh.`
        : `Đã bỏ ${property.name} khỏi bảng so sánh.`,
    )
  }

  const baseQuery = new URLSearchParams(initial).toString()

  return (
    <>
      <div className="search-strip">
        <div className="container">
          <SearchBox initial={initial} compact />
        </div>
      </div>

      <main className="container search-layout page-section">
        <FilterSidebar
          filters={filters}
          onChange={changeFilter}
          onReset={() => {
            setFilters(emptyFilters)
            setPage(0)
          }}
        />

        <section className="search-results">
          <div className="results-heading">
            <div>
              <h1>{initial.destination || 'Kết quả tìm kiếm'}</h1>
              <p>{data.totalElements} chỗ nghỉ phù hợp</p>
            </div>

            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value)
                setPage(0)
              }}
            >
              <option value="recommended">Đề xuất</option>
              <option value="price_asc">Giá thấp nhất</option>
              <option value="price_desc">Giá cao nhất</option>
              <option value="rating_desc">Điểm đánh giá</option>
              <option value="stars_desc">Hạng sao</option>
            </select>
          </div>

          <ErrorAlert message={error} />

          {notice && (
            <div className="alert alert-info search-notice">
              {notice}
              <button type="button" onClick={() => setNotice('')}>×</button>
            </div>
          )}

          {loading ? (
            <Loading />
          ) : data.content.length ? (
            <>
              <div className="property-list">
                {data.content.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    query={baseQuery}
                    isFavourite={favouriteIds.has(property.id)}
                    favouriteLoading={favouriteLoadingId === property.id}
                    onToggleFavourite={toggleFavourite}
                    isCompared={compare.contains(property.id)}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>

              <div className="pagination">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Trang trước
                </button>
                <span>Trang {page + 1}/{Math.max(1, data.totalPages)}</span>
                <button
                  type="button"
                  disabled={page + 1 >= data.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Trang sau
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>Không tìm thấy chỗ nghỉ phù hợp</h2>
              <p>Hãy đổi ngày, số khách hoặc bỏ bớt bộ lọc.</p>
            </div>
          )}
        </section>
      </main>

      {compare.count > 0 && (
        <aside className="compare-dock">
          <div>
            <strong>Đang so sánh {compare.count}/{compare.maxItems}</strong>
            <span>
              {compare.items.map((item) => item.name).join(' · ')}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost dark"
            onClick={compare.clear}
          >
            Xóa
          </button>
          <Link className="btn btn-primary" to="/compare">
            Mở so sánh
          </Link>
        </aside>
      )}
    </>
  )
}