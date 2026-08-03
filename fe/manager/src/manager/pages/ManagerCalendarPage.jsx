import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { managerApi } from '@/api/manager/managerApi'
import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'
import { isoDate, money } from '@/shared/utils/format'

function plusDays(value, days) {
  const date = new Date(`${value}T00:00:00`)
  date.setDate(date.getDate() + days)
  return isoDate(date)
}

const today = isoDate(new Date())

const EMPTY_UPDATE = {
  roomTypeId: '',
  ratePlanId: '',
  fromDate: today,
  toDate: plusDays(today, 6),
  allotment: 1,
  minStay: 1,
  maxStay: '',
  stopSell: false,
  closedToArrival: false,
  closedToDeparture: false,
  price: 1000000,
  originalPrice: '',
  currency: 'VND',
  rateAvailable: true,
}

export default function ManagerCalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [propertyId, setPropertyId] = useState(searchParams.get('propertyId') || '')
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(plusDays(today, 13))
  const [data, setData] = useState(null)
  const [form, setForm] = useState(EMPTY_UPDATE)
  const [loading, setLoading] = useState(true)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    managerApi.properties()
      .then((values) => {
        setProperties(values || [])
        if (!propertyId && values?.length) setPropertyId(values[0].id)
      })
      .catch((requestError) => setError(apiMessage(requestError)))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadCalendar = useCallback(async () => {
    if (!propertyId) {
      setData(null)
      return
    }
    setCalendarLoading(true)
    setError('')
    try {
      const response = await managerApi.calendar({ propertyId, fromDate, toDate })
      setData(response)
      const firstRoom = response.rooms?.find((room) => room.ratePlans?.length)
      const currentRoom = response.rooms?.find((room) => room.roomTypeId === form.roomTypeId)
      const selectedRoom = currentRoom || firstRoom
      const currentPlan = selectedRoom?.ratePlans?.find((plan) => plan.ratePlanId === form.ratePlanId)
      const selectedPlan = currentPlan || selectedRoom?.ratePlans?.[0]
      if (selectedRoom && selectedPlan) {
        setForm((current) => ({
          ...current,
          roomTypeId: selectedRoom.roomTypeId,
          ratePlanId: selectedPlan.ratePlanId,
          fromDate,
          toDate,
          allotment: Math.min(selectedRoom.totalRooms, Number(current.allotment || selectedRoom.totalRooms)),
          currency: selectedPlan.currency || 'VND',
        }))
      }
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setCalendarLoading(false)
    }
  }, [propertyId, fromDate, toDate]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (propertyId) {
      setSearchParams({ propertyId })
      loadCalendar()
    }
  }, [propertyId, fromDate, toDate, loadCalendar, setSearchParams])

  const selectedRoom = useMemo(() => data?.rooms?.find((room) => room.roomTypeId === form.roomTypeId), [data, form.roomTypeId])
  const dateColumns = useMemo(() => {
    if (!data?.rooms?.length) return []
    const plan = data.rooms.flatMap((room) => room.ratePlans || [])[0]
    return plan?.days || []
  }, [data])

  const selectRoom = (roomTypeId) => {
    const room = data?.rooms?.find((item) => item.roomTypeId === roomTypeId)
    setForm((current) => ({
      ...current,
      roomTypeId,
      ratePlanId: room?.ratePlans?.[0]?.ratePlanId || '',
      allotment: room?.totalRooms || 0,
      currency: room?.ratePlans?.[0]?.currency || 'VND',
    }))
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await managerApi.updateCalendar({
        ...form,
        allotment: Number(form.allotment),
        minStay: Number(form.minStay),
        maxStay: form.maxStay === '' ? null : Number(form.maxStay),
        price: Number(form.price),
        originalPrice: form.originalPrice === '' ? null : Number(form.originalPrice),
      })
      setNotice('Đã cập nhật giá và tồn phòng cho khoảng ngày đã chọn.')
      await loadCalendar()
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <main className="manager-page manager-calendar-page">
      <header className="manager-page-header">
        <div>
          <p className="manager-kicker">Quản lý phân phối phòng</p>
          <h1>Giá và tồn phòng</h1>
          <p>Thiết lập số phòng mở bán, giá mỗi đêm và các hạn chế lưu trú.</p>
        </div>
      </header>

      <ErrorAlert message={error} />
      {notice && <div className="alert alert-success">{notice}</div>}

      {properties.length === 0 ? (
        <section className="empty-state manager-empty"><h2>Chưa có chỗ nghỉ</h2><p>Hãy tạo chỗ nghỉ và loại phòng trước khi thiết lập lịch.</p></section>
      ) : (
        <>
          <section className="manager-calendar-toolbar">
            <label className="manager-field">Chỗ nghỉ
              <select value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>
                {properties.filter((property) => property.status !== 'ARCHIVED').map((property) => (
                  <option value={property.id} key={property.id}>{property.name}</option>
                ))}
              </select>
            </label>
            <label className="manager-field">Từ ngày
              <input type="date" min={today} value={fromDate} onChange={(event) => {
                const value = event.target.value
                setFromDate(value)
                if (toDate < value) setToDate(plusDays(value, 13))
              }} />
            </label>
            <label className="manager-field">Đến ngày
              <input type="date" min={fromDate} value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </label>
            <button className="btn btn-ghost dark" type="button" onClick={loadCalendar}>Tải lại</button>
          </section>

          {calendarLoading ? <Loading /> : !data?.rooms?.length ? (
            <section className="empty-state manager-empty"><h2>Chưa có loại phòng</h2><p>Thêm phòng và gói giá để bắt đầu mở bán.</p></section>
          ) : (
            <>
              <section className="manager-panel manager-calendar-panel">
                <div className="manager-panel-heading">
                  <div><h2>Lịch mở bán</h2><p>Mỗi ô hiển thị giá, phòng còn lại và trạng thái bán.</p></div>
                </div>
                <div className="manager-calendar-scroll">
                  <table className="manager-calendar-table">
                    <thead>
                      <tr>
                        <th className="manager-calendar-sticky">Loại phòng / Gói giá</th>
                        {dateColumns.map((day) => (
                          <th key={day.date}>
                            <span>{new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(new Date(`${day.date}T00:00:00`))}</span>
                            <strong>{new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(`${day.date}T00:00:00`))}</strong>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.rooms.flatMap((room) => room.ratePlans.map((plan, planIndex) => (
                        <tr key={plan.ratePlanId}>
                          <td className="manager-calendar-sticky">
                            {planIndex === 0 && <strong>{room.roomName}</strong>}
                            <span>{plan.ratePlanName}</span>
                          </td>
                          {plan.days.map((day) => (
                            <td key={day.date} className={`${day.stopSell || !day.rateAvailable ? 'is-closed' : ''} ${day.availableRooms === 0 ? 'is-sold-out' : ''}`}>
                              <strong>{day.price ? money(day.price, plan.currency) : 'Chưa có giá'}</strong>
                              <span>Còn {day.availableRooms}/{day.allotment}</span>
                              {day.stopSell || !day.rateAvailable ? <em>Đóng bán</em> : day.availableRooms === 0 ? <em>Hết phòng</em> : null}
                            </td>
                          ))}
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="manager-editor-card">
                <div className="manager-panel-heading">
                  <div><h2>Cập nhật hàng loạt</h2><p>Áp dụng cùng giá và tồn phòng cho một khoảng ngày.</p></div>
                </div>
                <form className="manager-form-grid manager-calendar-update-form" onSubmit={save}>
                  <label className="manager-field">Loại phòng
                    <select value={form.roomTypeId} onChange={(event) => selectRoom(event.target.value)} required>
                      {data.rooms.map((room) => <option value={room.roomTypeId} key={room.roomTypeId}>{room.roomName}</option>)}
                    </select>
                  </label>
                  <label className="manager-field">Gói giá
                    <select value={form.ratePlanId} onChange={(event) => setForm({ ...form, ratePlanId: event.target.value })} required>
                      {(selectedRoom?.ratePlans || []).map((plan) => <option value={plan.ratePlanId} key={plan.ratePlanId}>{plan.ratePlanName}</option>)}
                    </select>
                  </label>
                  <label className="manager-field">Từ ngày<input type="date" min={today} value={form.fromDate} onChange={(event) => setForm({ ...form, fromDate: event.target.value })} required /></label>
                  <label className="manager-field">Đến ngày<input type="date" min={form.fromDate} value={form.toDate} onChange={(event) => setForm({ ...form, toDate: event.target.value })} required /></label>
                  <label className="manager-field">Số phòng mở bán<input type="number" min="0" max={selectedRoom?.totalRooms || 0} value={form.allotment} onChange={(event) => setForm({ ...form, allotment: event.target.value })} required /></label>
                  <label className="manager-field">Giá mỗi đêm<input type="number" min="1" step="1000" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></label>
                  <label className="manager-field">Giá gốc<input type="number" min="1" step="1000" value={form.originalPrice} onChange={(event) => setForm({ ...form, originalPrice: event.target.value })} placeholder="Không bắt buộc" /></label>
                  <label className="manager-field">Tiền tệ<select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}><option value="VND">VND</option><option value="USD">USD</option></select></label>
                  <label className="manager-field">Số đêm tối thiểu<input type="number" min="1" value={form.minStay} onChange={(event) => setForm({ ...form, minStay: event.target.value })} /></label>
                  <label className="manager-field">Số đêm tối đa<input type="number" min={form.minStay} value={form.maxStay} onChange={(event) => setForm({ ...form, maxStay: event.target.value })} placeholder="Không giới hạn" /></label>
                  <label className="manager-check"><input type="checkbox" checked={form.rateAvailable} onChange={(event) => setForm({ ...form, rateAvailable: event.target.checked })} /> Mở gói giá</label>
                  <label className="manager-check"><input type="checkbox" checked={form.stopSell} onChange={(event) => setForm({ ...form, stopSell: event.target.checked })} /> Dừng bán toàn bộ phòng</label>
                  <label className="manager-check"><input type="checkbox" checked={form.closedToArrival} onChange={(event) => setForm({ ...form, closedToArrival: event.target.checked })} /> Không cho nhận phòng</label>
                  <label className="manager-check"><input type="checkbox" checked={form.closedToDeparture} onChange={(event) => setForm({ ...form, closedToDeparture: event.target.checked })} /> Không cho trả phòng</label>
                  <div className="manager-form-actions manager-field-full">
                    <button className="btn btn-primary" type="submit" disabled={saving || !form.ratePlanId}>{saving ? 'Đang cập nhật...' : 'Áp dụng cho khoảng ngày'}</button>
                  </div>
                </form>
              </section>
            </>
          )}
        </>
      )}
    </main>
  )
}
