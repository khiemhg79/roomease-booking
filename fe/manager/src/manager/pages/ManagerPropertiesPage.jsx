import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { managerApi } from '@/api/manager/managerApi'
import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'

const STATUS_LABELS = {
  DRAFT: 'Bản nháp',
  ACTIVE: 'Đang mở bán',
  SUSPENDED: 'Tạm dừng',
  ARCHIVED: 'Đã lưu trữ',
}

export default function ManagerPropertiesPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [workingId, setWorkingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setProperties(await managerApi.properties())
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const changeStatus = async (property, status) => {
    setWorkingId(property.id)
    setError('')
    setNotice('')
    try {
      await managerApi.updatePropertyStatus(property.id, status)
      setNotice(`Đã chuyển “${property.name}” sang ${STATUS_LABELS[status].toLowerCase()}.`)
      await load()
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setWorkingId(null)
    }
  }

  const archive = async (property) => {
    if (!window.confirm(`Lưu trữ chỗ nghỉ “${property.name}”? Chỗ nghỉ sẽ không còn xuất hiện với khách.`)) return
    setWorkingId(property.id)
    setError('')
    try {
      await managerApi.archiveProperty(property.id)
      setNotice(`Đã lưu trữ “${property.name}”.`)
      await load()
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <main className="manager-page">
      <header className="manager-page-header">
        <div>
          <p className="manager-kicker">Danh mục kinh doanh</p>
          <h1>Quản lý chỗ nghỉ</h1>
          <p>Thêm khách sạn, chỉnh sửa thông tin, phòng, tiện nghi và trạng thái mở bán.</p>
        </div>
        <Link className="btn btn-primary" to="/manager/properties/new">+ Thêm chỗ nghỉ</Link>
      </header>

      <ErrorAlert message={error} />
      {notice && <div className="alert alert-success">{notice}</div>}

      {loading ? <Loading /> : properties.length === 0 ? (
        <section className="empty-state manager-empty">
          <div className="empty-state-icon">⌂</div>
          <h2>Chưa có chỗ nghỉ</h2>
          <p>Tạo chỗ nghỉ đầu tiên, sau đó thêm loại phòng, gói giá và lịch mở bán.</p>
          <Link className="btn btn-primary" to="/manager/properties/new">Tạo chỗ nghỉ</Link>
        </section>
      ) : (
        <section className="manager-property-grid">
          {properties.map((property) => {
            const cover = property.images?.find((image) => image.cover) || property.images?.[0]
            const busy = workingId === property.id
            return (
              <article className="manager-property-card" key={property.id}>
                <div className="manager-property-cover">
                  {cover ? <img src={cover.imageUrl} alt={property.name} /> : <div className="manager-image-placeholder">RoomEase</div>}
                  <span className={`manager-status manager-status-${property.status.toLowerCase()}`}>
                    {STATUS_LABELS[property.status] || property.status}
                  </span>
                </div>

                <div className="manager-property-body">
                  <span className="manager-property-type">{property.propertyType}</span>
                  <h2>{property.name}</h2>
                  <p>{property.addressLine}, {property.city}</p>
                  <div className="manager-property-meta">
                    <span>{'★'.repeat(property.starRating || 0) || 'Chưa xếp hạng'}</span>
                    <span>{property.reviewScore || 0}/10 · {property.reviewCount || 0} đánh giá</span>
                  </div>

                  <div className="manager-property-actions">
                    <Link className="btn btn-ghost dark" to={`/manager/properties/${property.id}/edit`}>Sửa thông tin</Link>
                    <Link className="btn btn-ghost dark" to={`/manager/properties/${property.id}/rooms`}>Phòng và giá</Link>
                    <Link className="btn btn-ghost dark" to={`/manager/calendar?propertyId=${property.id}`}>Lịch mở bán</Link>
                  </div>

                  <div className="manager-property-status-actions">
                    {property.status !== 'ACTIVE' && property.status !== 'ARCHIVED' && (
                      <button className="btn btn-primary" disabled={busy} onClick={() => changeStatus(property, 'ACTIVE')}>Mở bán</button>
                    )}
                    {property.status === 'ACTIVE' && (
                      <button className="btn btn-ghost dark" disabled={busy} onClick={() => changeStatus(property, 'SUSPENDED')}>Tạm dừng</button>
                    )}
                    {property.status === 'SUSPENDED' && (
                      <button className="btn btn-ghost dark" disabled={busy} onClick={() => changeStatus(property, 'DRAFT')}>Chuyển về nháp</button>
                    )}
                    {property.status !== 'ARCHIVED' && (
                      <button className="btn btn-danger" disabled={busy} onClick={() => archive(property)}>Lưu trữ</button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
