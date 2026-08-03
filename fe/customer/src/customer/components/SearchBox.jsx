import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { defaultStay } from '@/shared/utils/format'

export default function SearchBox({ initial = { destination: '', checkIn: '', checkOut: '', adults: 2, children: 0, rooms: 1 }, compact = false }) {
  const navigate = useNavigate()
  const stay = defaultStay()
  const [form, setForm] = useState({
    destination: initial.destination || '',
    checkIn: initial.checkIn || stay.checkIn,
    checkOut: initial.checkOut || stay.checkOut,
    adults: Number(initial.adults || 2),
    children: Number(initial.children || 0),
    rooms: Number(initial.rooms || 1),
  })

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const submit = (event) => {
    event.preventDefault()
    if (!form.destination.trim()) return
    const params = new URLSearchParams(form)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <form className={`search-box ${compact ? 'search-box-compact' : ''}`} onSubmit={submit}>
      <label className="search-field search-destination">
        <span>Điểm đến</span>
        <input name="destination" value={form.destination} onChange={change} placeholder="Bạn muốn đến đâu?" required />
      </label>
      <label className="search-field">
        <span>Nhận phòng</span>
        <input type="date" name="checkIn" value={form.checkIn} onChange={change} required />
      </label>
      <label className="search-field">
        <span>Trả phòng</span>
        <input type="date" name="checkOut" min={form.checkIn} value={form.checkOut} onChange={change} required />
      </label>
      <label className="search-field">
        <span>Khách và phòng</span>
        <div className="guest-inputs">
          <input type="number" name="adults" min="1" max="30" value={form.adults} onChange={change} title="Người lớn" />
          <input type="number" name="children" min="0" max="20" value={form.children} onChange={change} title="Trẻ em" />
          <input type="number" name="rooms" min="1" max="10" value={form.rooms} onChange={change} title="Phòng" />
        </div>
      </label>
      <button className="btn btn-primary search-submit" type="submit">Tìm kiếm</button>
    </form>
  )
}
