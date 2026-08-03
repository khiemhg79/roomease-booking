import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { managerApi } from '@/api/manager/managerApi'
import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'

const EMPTY_ROOM = {
  code: '',
  name: '',
  description: '',
  roomSizeSqm: '',
  maxAdults: 2,
  maxChildren: 1,
  maxGuests: 3,
  totalRooms: 1,
  bedSummary: '1 giường đôi',
  bathroomCount: 1,
  viewName: '',
  smokingAllowed: false,
  active: true,
  imageUrls: '',
  amenityCodes: [],
}

const EMPTY_PLAN = {
  code: '',
  name: '',
  mealPlan: 'ROOM_ONLY',
  cancellationType: 'FREE_UNTIL_DAYS',
  cancellationDays: 3,
  prepaymentType: 'NONE',
  refundable: true,
  payAtProperty: true,
  description: '',
  active: true,
}

const MEAL_LABELS = {
  ROOM_ONLY: 'Chỉ phòng',
  BREAKFAST_INCLUDED: 'Bao gồm bữa sáng',
  HALF_BOARD: 'Nửa ngày',
  FULL_BOARD: 'Toàn phần',
  ALL_INCLUSIVE: 'Trọn gói',
}

function roomToForm(room) {
  return {
    ...EMPTY_ROOM,
    ...room,
    roomSizeSqm: room.roomSizeSqm ?? '',
    viewName: room.viewName || '',
    description: room.description || '',
    imageUrls: (room.images || []).sort((a, b) => a.sortOrder - b.sortOrder).map((image) => image.imageUrl).join('\n'),
    amenityCodes: room.amenityCodes || [],
  }
}

function planToForm(plan) {
  return { ...EMPTY_PLAN, ...plan, description: plan.description || '' }
}

export default function ManagerRoomsPage() {
  const { propertyId } = useParams()
  const location = useLocation()
  const [property, setProperty] = useState(null)
  const [rooms, setRooms] = useState([])
  const [amenities, setAmenities] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')
  const [roomEditorOpen, setRoomEditorOpen] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState(null)
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM)
  const [planEditorRoomId, setPlanEditorRoomId] = useState(null)
  const [editingPlanId, setEditingPlanId] = useState(null)
  const [planForm, setPlanForm] = useState(EMPTY_PLAN)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [propertyData, roomData, amenityData] = await Promise.all([
        managerApi.property(propertyId),
        managerApi.rooms(propertyId),
        managerApi.amenities(),
      ])
      setProperty(propertyData)
      setRooms(roomData || [])
      setAmenities(amenityData || [])
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => { load() }, [load])

  const roomAmenities = useMemo(() => amenities.filter((amenity) => ['ROOM', 'BATHROOM', 'POPULAR', 'ACCESSIBILITY', 'SAFETY'].includes(amenity.category)), [amenities])

  const openCreateRoom = () => {
    setEditingRoomId(null)
    setRoomForm(EMPTY_ROOM)
    setRoomEditorOpen(true)
    setError('')
  }

  const openEditRoom = (room) => {
    setEditingRoomId(room.id)
    setRoomForm(roomToForm(room))
    setRoomEditorOpen(true)
    setError('')
  }

  const closeRoomEditor = () => {
    setRoomEditorOpen(false)
    setEditingRoomId(null)
    setRoomForm(EMPTY_ROOM)
  }

  const toggleRoomAmenity = (code) => setRoomForm((current) => ({
    ...current,
    amenityCodes: current.amenityCodes.includes(code)
      ? current.amenityCodes.filter((value) => value !== code)
      : [...current.amenityCodes, code],
  }))

  const saveRoom = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    const urls = roomForm.imageUrls.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
    const payload = {
      code: roomForm.code,
      name: roomForm.name,
      description: roomForm.description || null,
      roomSizeSqm: roomForm.roomSizeSqm === '' ? null : Number(roomForm.roomSizeSqm),
      maxAdults: Number(roomForm.maxAdults),
      maxChildren: Number(roomForm.maxChildren),
      maxGuests: Number(roomForm.maxGuests),
      totalRooms: Number(roomForm.totalRooms),
      bedSummary: roomForm.bedSummary,
      bathroomCount: Number(roomForm.bathroomCount),
      viewName: roomForm.viewName || null,
      smokingAllowed: roomForm.smokingAllowed,
      active: roomForm.active,
      images: urls.map((imageUrl, index) => ({ imageUrl, altText: roomForm.name, sortOrder: index })),
      amenityCodes: roomForm.amenityCodes,
    }
    try {
      if (editingRoomId) await managerApi.updateRoom(editingRoomId, payload)
      else await managerApi.createRoom(propertyId, payload)
      setNotice(editingRoomId ? 'Đã cập nhật loại phòng.' : 'Đã tạo loại phòng mới.')
      closeRoomEditor()
      await load()
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const toggleRoomActive = async (room) => {
    setError('')
    try {
      await managerApi.setRoomActive(room.id, !room.active)
      setNotice(room.active ? 'Đã tạm dừng loại phòng.' : 'Đã mở lại loại phòng.')
      await load()
    } catch (requestError) {
      setError(apiMessage(requestError))
    }
  }

  const openCreatePlan = (room) => {
    setPlanEditorRoomId(room.id)
    setEditingPlanId(null)
    setPlanForm({ ...EMPTY_PLAN, code: `${room.code}_FLEX`, name: `${room.name} - Linh hoạt` })
    setError('')
  }

  const openEditPlan = (room, plan) => {
    setPlanEditorRoomId(room.id)
    setEditingPlanId(plan.id)
    setPlanForm(planToForm(plan))
    setError('')
  }

  const closePlanEditor = () => {
    setPlanEditorRoomId(null)
    setEditingPlanId(null)
    setPlanForm(EMPTY_PLAN)
  }

  const savePlan = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    const payload = {
      ...planForm,
      cancellationDays: Number(planForm.cancellationDays),
      description: planForm.description || null,
    }
    try {
      if (editingPlanId) await managerApi.updateRatePlan(editingPlanId, payload)
      else await managerApi.createRatePlan(planEditorRoomId, payload)
      setNotice(editingPlanId ? 'Đã cập nhật gói giá.' : 'Đã tạo gói giá mới.')
      closePlanEditor()
      await load()
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const togglePlanActive = async (plan) => {
    setError('')
    try {
      await managerApi.setRatePlanActive(plan.id, !plan.active)
      setNotice(plan.active ? 'Đã tạm dừng gói giá.' : 'Đã mở lại gói giá.')
      await load()
    } catch (requestError) {
      setError(apiMessage(requestError))
    }
  }

  if (loading) return <Loading />

  return (
    <main className="manager-page">
      <header className="manager-page-header">
        <div>
          <p className="manager-kicker">{property?.name}</p>
          <h1>Loại phòng và gói giá</h1>
          <p>Quản lý sức chứa, số lượng phòng, hình ảnh và điều kiện giá bán.</p>
        </div>
        <div className="manager-header-actions">
          <Link className="btn btn-ghost dark" to={`/manager/properties/${propertyId}/edit`}>Sửa chỗ nghỉ</Link>
          <button className="btn btn-primary" type="button" onClick={openCreateRoom}>+ Thêm loại phòng</button>
        </div>
      </header>

      <ErrorAlert message={error} />
      {notice && <div className="alert alert-success">{notice}</div>}

      {roomEditorOpen && (
        <section className="manager-editor-card">
          <div className="manager-panel-heading">
            <div><h2>{editingRoomId ? 'Chỉnh sửa loại phòng' : 'Thêm loại phòng'}</h2><p>Nhập sức chứa và số lượng phòng có thể bán.</p></div>
            <button className="manager-close-button" type="button" onClick={closeRoomEditor}>×</button>
          </div>
          <form onSubmit={saveRoom} className="manager-form-grid">
            <label className="manager-field">Mã phòng
              <input value={roomForm.code} onChange={(e) => setRoomForm({ ...roomForm, code: e.target.value })} maxLength={60} required />
            </label>
            <label className="manager-field manager-field-wide">Tên loại phòng
              <input value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} required />
            </label>
            <label className="manager-field manager-field-full">Mô tả
              <textarea rows="4" value={roomForm.description} onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })} />
            </label>
            <label className="manager-field">Diện tích m²
              <input type="number" min="1" step="0.1" value={roomForm.roomSizeSqm} onChange={(e) => setRoomForm({ ...roomForm, roomSizeSqm: e.target.value })} />
            </label>
            <label className="manager-field">Tổng số phòng
              <input type="number" min="1" value={roomForm.totalRooms} onChange={(e) => setRoomForm({ ...roomForm, totalRooms: e.target.value })} required />
            </label>
            <label className="manager-field">Người lớn tối đa
              <input type="number" min="1" value={roomForm.maxAdults} onChange={(e) => setRoomForm({ ...roomForm, maxAdults: e.target.value })} required />
            </label>
            <label className="manager-field">Trẻ em tối đa
              <input type="number" min="0" value={roomForm.maxChildren} onChange={(e) => setRoomForm({ ...roomForm, maxChildren: e.target.value })} required />
            </label>
            <label className="manager-field">Tổng khách tối đa
              <input type="number" min="1" value={roomForm.maxGuests} onChange={(e) => setRoomForm({ ...roomForm, maxGuests: e.target.value })} required />
            </label>
            <label className="manager-field">Số phòng tắm
              <input type="number" min="1" value={roomForm.bathroomCount} onChange={(e) => setRoomForm({ ...roomForm, bathroomCount: e.target.value })} required />
            </label>
            <label className="manager-field manager-field-wide">Giường
              <input value={roomForm.bedSummary} onChange={(e) => setRoomForm({ ...roomForm, bedSummary: e.target.value })} required />
            </label>
            <label className="manager-field">Hướng nhìn
              <input value={roomForm.viewName} onChange={(e) => setRoomForm({ ...roomForm, viewName: e.target.value })} />
            </label>
            <label className="manager-check"><input type="checkbox" checked={roomForm.smokingAllowed} onChange={(e) => setRoomForm({ ...roomForm, smokingAllowed: e.target.checked })} /> Cho phép hút thuốc</label>
            <label className="manager-check"><input type="checkbox" checked={roomForm.active} onChange={(e) => setRoomForm({ ...roomForm, active: e.target.checked })} /> Đang hoạt động</label>
            <label className="manager-field manager-field-full">URL ảnh, mỗi dòng một ảnh
              <textarea rows="5" value={roomForm.imageUrls} onChange={(e) => setRoomForm({ ...roomForm, imageUrls: e.target.value })} />
            </label>
            <div className="manager-field manager-field-full">
              <span>Tiện nghi trong phòng</span>
              <div className="manager-checkbox-grid compact">
                {roomAmenities.map((amenity) => (
                  <label className="manager-check" key={amenity.code}>
                    <input type="checkbox" checked={roomForm.amenityCodes.includes(amenity.code)} onChange={() => toggleRoomAmenity(amenity.code)} />
                    {amenity.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="manager-form-actions manager-field-full">
              <button className="btn btn-ghost dark" type="button" onClick={closeRoomEditor}>Hủy</button>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu loại phòng'}</button>
            </div>
          </form>
        </section>
      )}

      {rooms.length === 0 ? (
        <section className="empty-state manager-empty"><h2>Chưa có loại phòng</h2><p>Thêm phòng trước khi mở bán chỗ nghỉ.</p><button className="btn btn-primary" onClick={openCreateRoom}>Thêm loại phòng</button></section>
      ) : (
        <section className="manager-room-list">
          {rooms.map((room) => {
            const cover = room.images?.[0]
            const planEditorOpen = planEditorRoomId === room.id
            return (
              <article className={`manager-room-card ${room.active ? '' : 'is-inactive'}`} key={room.id}>
                <div className="manager-room-summary">
                  <div className="manager-room-image">
                    {cover ? <img src={cover.imageUrl} alt={room.name} /> : <div className="manager-image-placeholder">Phòng</div>}
                  </div>
                  <div className="manager-room-copy">
                    <div className="manager-room-title-row">
                      <div><span>{room.code}</span><h2>{room.name}</h2></div>
                      <span className={`manager-status ${room.active ? 'manager-status-active' : 'manager-status-suspended'}`}>{room.active ? 'Đang bán' : 'Tạm dừng'}</span>
                    </div>
                    <p>{room.description || 'Chưa có mô tả.'}</p>
                    <div className="manager-room-facts">
                      <span>{room.roomSizeSqm || '--'} m²</span>
                      <span>{room.maxGuests} khách</span>
                      <span>{room.bedSummary}</span>
                      <span>{room.totalRooms} phòng</span>
                    </div>
                    <div className="manager-room-actions">
                      <button className="btn btn-ghost dark" onClick={() => openEditRoom(room)}>Chỉnh sửa</button>
                      <button className="btn btn-ghost dark" onClick={() => toggleRoomActive(room)}>{room.active ? 'Tạm dừng' : 'Mở lại'}</button>
                      <button className="btn btn-primary" onClick={() => openCreatePlan(room)}>+ Thêm gói giá</button>
                    </div>
                  </div>
                </div>

                {planEditorOpen && (
                  <form className="manager-rate-form" onSubmit={savePlan}>
                    <div className="manager-panel-heading"><div><h3>{editingPlanId ? 'Sửa gói giá' : 'Thêm gói giá'}</h3></div><button type="button" className="manager-close-button" onClick={closePlanEditor}>×</button></div>
                    <div className="manager-form-grid">
                      <label className="manager-field">Mã gói giá<input value={planForm.code} onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })} required /></label>
                      <label className="manager-field manager-field-wide">Tên gói giá<input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} required /></label>
                      <label className="manager-field">Bữa ăn<select value={planForm.mealPlan} onChange={(e) => setPlanForm({ ...planForm, mealPlan: e.target.value })}>{Object.entries(MEAL_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                      <label className="manager-field">Chính sách hủy<select value={planForm.cancellationType} onChange={(e) => {
                        const value = e.target.value
                        setPlanForm({ ...planForm, cancellationType: value, refundable: value !== 'NON_REFUNDABLE' })
                      }}><option value="FREE_UNTIL_DAYS">Miễn phí trước số ngày</option><option value="FLEXIBLE">Linh hoạt</option><option value="NON_REFUNDABLE">Không hoàn tiền</option></select></label>
                      <label className="manager-field">Số ngày hủy miễn phí<input type="number" min="0" value={planForm.cancellationDays} onChange={(e) => setPlanForm({ ...planForm, cancellationDays: e.target.value })} /></label>
                      <label className="manager-field">Trả trước<select value={planForm.prepaymentType} disabled={planForm.payAtProperty} onChange={(e) => setPlanForm({ ...planForm, prepaymentType: e.target.value })}><option value="NONE">Không</option><option value="FULL">Toàn bộ</option><option value="FIRST_NIGHT">Đêm đầu</option><option value="PERCENTAGE">Theo phần trăm</option></select></label>
                      <label className="manager-check"><input type="checkbox" checked={planForm.payAtProperty} onChange={(e) => setPlanForm({ ...planForm, payAtProperty: e.target.checked, prepaymentType: e.target.checked ? 'NONE' : planForm.prepaymentType })} /> Thanh toán tại chỗ nghỉ</label>
                      <label className="manager-check"><input type="checkbox" checked={planForm.active} onChange={(e) => setPlanForm({ ...planForm, active: e.target.checked })} /> Đang hoạt động</label>
                      <label className="manager-field manager-field-full">Mô tả<textarea rows="3" value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} /></label>
                      <div className="manager-form-actions manager-field-full"><button className="btn btn-ghost dark" type="button" onClick={closePlanEditor}>Hủy</button><button className="btn btn-primary" type="submit" disabled={saving}>Lưu gói giá</button></div>
                    </div>
                  </form>
                )}

                <div className="manager-rate-list">
                  <div className="manager-rate-list-heading"><h3>Gói giá</h3><span>{room.ratePlans?.length || 0} gói</span></div>
                  {room.ratePlans?.length ? room.ratePlans.map((plan) => (
                    <div className={`manager-rate-row ${plan.active ? '' : 'is-inactive'}`} key={plan.id}>
                      <div><strong>{plan.name}</strong><small>{plan.code} · {MEAL_LABELS[plan.mealPlan] || plan.mealPlan}</small></div>
                      <div><span>{plan.refundable ? `Hủy miễn phí trước ${plan.cancellationDays} ngày` : 'Không hoàn tiền'}</span><small>{plan.payAtProperty ? 'Thanh toán tại chỗ nghỉ' : `Trả trước: ${plan.prepaymentType}`}</small></div>
                      <span className={`manager-status ${plan.active ? 'manager-status-active' : 'manager-status-suspended'}`}>{plan.active ? 'Đang bán' : 'Tạm dừng'}</span>
                      <div className="manager-row-actions"><button onClick={() => openEditPlan(room, plan)}>Sửa</button><button onClick={() => togglePlanActive(plan)}>{plan.active ? 'Dừng' : 'Mở'}</button></div>
                    </div>
                  )) : <p className="manager-muted-copy">Chưa có gói giá. Khách chưa thể đặt loại phòng này.</p>}
                </div>
              </article>
            )
          })}
        </section>
      )}

      <div className="manager-bottom-actions">
        <Link className="btn btn-ghost dark" to="/manager/properties">← Danh sách chỗ nghỉ</Link>
        <Link className="btn btn-primary" to={`/manager/calendar?propertyId=${propertyId}`}>Tiếp theo: Cập nhật giá và tồn phòng →</Link>
      </div>
    </main>
  )
}
