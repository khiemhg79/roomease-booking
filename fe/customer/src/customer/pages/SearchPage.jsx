import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { propertyApi } from '@/api/customer/propertyApi'
import { apiMessage } from '@/api/http'
import SearchBox from '@/customer/components/SearchBox'
import FilterSidebar from '@/customer/components/FilterSidebar'
import PropertyCard from '@/customer/components/PropertyCard'
import Loading from '@/shared/components/Loading'
import ErrorAlert from '@/shared/components/ErrorAlert'

const emptyFilters = { propertyTypes: [], stars: [], amenities: [], minReviewScore: '', minPrice: '', maxPrice: '' }

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const initial = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams])
  const [filters, setFilters] = useState(emptyFilters)
  const [sort, setSort] = useState('recommended')
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
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
      sort, page, size: 10,
    }
    propertyApi.search(params).then(setData).catch((e) => {
      if (e.code !== 'ERR_CANCELED') setError(apiMessage(e))
    }).finally(() => setLoading(false))
    return () => controller.abort()
  }, [initial, filters, sort, page])

  const changeFilter = (key, value) => { setPage(0); setFilters((current) => ({ ...current, [key]: value })) }
  const baseQuery = new URLSearchParams(initial).toString()

  return (
    <>
      <div className="search-strip"><div className="container"><SearchBox initial={initial} compact /></div></div>
      <main className="container search-layout page-section">
        <FilterSidebar filters={filters} onChange={changeFilter} onReset={() => { setFilters(emptyFilters); setPage(0) }} />
        <section className="search-results">
          <div className="results-heading">
            <div><h1>{initial.destination || 'Kết quả tìm kiếm'}</h1><p>{data.totalElements} chỗ nghỉ phù hợp</p></div>
            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(0) }}>
              <option value="recommended">Đề xuất</option><option value="price_asc">Giá thấp nhất</option>
              <option value="price_desc">Giá cao nhất</option><option value="rating_desc">Điểm đánh giá</option>
              <option value="stars_desc">Hạng sao</option>
            </select>
          </div>
          <ErrorAlert message={error} />
          {loading ? <Loading /> : data.content.length ? (
            <><div className="property-list">{data.content.map((p) => <PropertyCard key={p.id} property={p} query={baseQuery} />)}</div>
              <div className="pagination"><button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Trang trước</button>
                <span>Trang {page + 1}/{Math.max(1, data.totalPages)}</span>
                <button disabled={page + 1 >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Trang sau</button></div></>
          ) : <div className="empty-state"><h2>Không tìm thấy chỗ nghỉ phù hợp</h2><p>Hãy đổi ngày, số khách hoặc bỏ bớt bộ lọc.</p></div>}
        </section>
      </main>
    </>
  )
}
