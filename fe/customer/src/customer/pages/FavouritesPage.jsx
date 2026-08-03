import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { favouriteApi } from '@/api/customer/favouriteApi'
import { apiMessage } from '@/api/http'
import Loading from '@/shared/components/Loading'
import ErrorAlert from '@/shared/components/ErrorAlert'
import RatingBadge from '@/shared/components/RatingBadge'

export default function FavouritesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = () => favouriteApi.list().then(setItems).catch((e) => setError(apiMessage(e))).finally(() => setLoading(false))
  useEffect(load, [])
  const remove = async (id) => { await favouriteApi.toggle(id); load() }
  return <main className="container page-section"><div className="section-heading"><div><p className="eyebrow dark">Danh sách đã lưu</p><h1>Chỗ nghỉ yêu thích</h1></div></div>
    <ErrorAlert message={error} />{loading ? <Loading /> : items.length ? <div className="featured-grid">{items.map((item) => <article className="featured-card" key={item.propertyId}>
      <Link to={`/property/${item.slug}`}><img src={item.thumbnailUrl} alt={item.name} /></Link><div className="featured-body"><Link to={`/property/${item.slug}`}><h3>{item.name}</h3></Link><p>{item.city}, {item.country}</p>
        <RatingBadge score={item.reviewScore} count={item.reviewCount} /><button className="link-danger" onClick={() => remove(item.propertyId)}>Bỏ yêu thích</button></div></article>)}</div>
      : <div className="empty-state"><h2>Chưa có chỗ nghỉ yêu thích</h2><p>Lưu chỗ nghỉ để xem lại nhanh hơn.</p></div>}</main>
}
