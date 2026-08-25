import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { defaultStay } from '@/shared/utils/format'

import './SearchBox.css'

const LIMITS = {
  adults: {
    min: 1,
    max: 30,
  },
  children: {
    min: 0,
    max: 20,
  },
  rooms: {
    min: 1,
    max: 10,
  },
}

const GUEST_ROWS = [
  {
    key: 'adults',
    label: 'Người lớn',
    description: 'Từ 18 tuổi trở lên',
  },
  {
    key: 'children',
    label: 'Trẻ em',
    description: 'Từ 0 đến 17 tuổi',
  },
  {
    key: 'rooms',
    label: 'Phòng',
    description: 'Số phòng cần đặt',
  },
]

export default function SearchBox({
  initial = {
    destination: '',
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0,
    rooms: 1,
  },
  compact = false,
}) {
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

  const [guestOpen, setGuestOpen] = useState(false)
  const guestRef = useRef(null)

  useEffect(() => {
    const closeGuestPicker = (event) => {
      if (
        guestRef.current
        && !guestRef.current.contains(event.target)
      ) {
        setGuestOpen(false)
      }
    }

    document.addEventListener('mousedown', closeGuestPicker)

    return () => {
      document.removeEventListener('mousedown', closeGuestPicker)
    }
  }, [])

  const change = (event) => {
    const {
      name,
      value,
    } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const changeGuest = (
    key,
    amount,
  ) => {
    setForm((current) => {
      const limits = LIMITS[key]
      const currentValue = Number(current[key])
      const nextValue = Math.min(
        limits.max,
        Math.max(
          limits.min,
          currentValue + amount,
        ),
      )

      return {
        ...current,
        [key]: nextValue,
      }
    })
  }

  const submit = (event) => {
    event.preventDefault()

    if (!form.destination.trim()) {
      return
    }

    const params = new URLSearchParams({
      ...form,
      destination: form.destination.trim(),
    })

    navigate(
      `/search?${params.toString()}`,
    )
  }

  const guestSummary =
    `${form.adults} người lớn · ${form.children} trẻ em · ${form.rooms} phòng`

  return (
    <form
      className={
        `search-box roomease-search-box ${compact
          ? 'search-box-compact roomease-search-box-compact'
          : ''
        }`
      }
      onSubmit={submit}
    >
      <label className="search-field search-destination roomease-search-field destination-field">
        <span className="search-field-label">
          <i className="search-field-icon location-icon" aria-hidden="true">
            ●
          </i>
          Điểm đến
        </span>

        <input
          name="destination"
          value={form.destination}
          onChange={change}
          placeholder="Thành phố hoặc chỗ nghỉ"
          autoComplete="off"
          required
        />
      </label>

      <label className="search-field roomease-search-field date-field">
        <span className="search-field-label">
          <i className="search-field-icon calendar-icon" aria-hidden="true">
            □
          </i>
          Nhận phòng
        </span>

        <input
          type="date"
          name="checkIn"
          value={form.checkIn}
          onChange={change}
          required
        />
      </label>

      <label className="search-field roomease-search-field date-field">
        <span className="search-field-label">
          <i className="search-field-icon calendar-icon" aria-hidden="true">
            □
          </i>
          Trả phòng
        </span>

        <input
          type="date"
          name="checkOut"
          min={form.checkIn}
          value={form.checkOut}
          onChange={change}
          required
        />
      </label>

      <div
        className="search-field roomease-search-field guest-field"
        ref={guestRef}
      >
        <span className="search-field-label">
          <i className="search-field-icon guest-icon" aria-hidden="true">
            ◉
          </i>
          Khách và phòng
        </span>

        <button
          className="guest-summary-button"
          type="button"
          aria-expanded={guestOpen}
          onClick={() => setGuestOpen((current) => !current)}
        >
          <span>{guestSummary}</span>

          <span
            className={`guest-chevron ${guestOpen ? 'open' : ''}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        {guestOpen && (
          <div className="guest-picker">
            <div className="guest-picker-heading">
              <div>
                <strong>Khách và phòng</strong>
                <span>Chọn số lượng phù hợp với chuyến đi</span>
              </div>

              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setGuestOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="guest-picker-list">
              {GUEST_ROWS.map((row) => {
                const limits = LIMITS[row.key]
                const value = Number(form[row.key])

                return (
                  <div
                    className="guest-picker-row"
                    key={row.key}
                  >
                    <div className="guest-picker-copy">
                      <strong>{row.label}</strong>
                      <span>{row.description}</span>
                    </div>

                    <div className="guest-stepper">
                      <button
                        type="button"
                        aria-label={`Giảm ${row.label}`}
                        disabled={value <= limits.min}
                        onClick={() => changeGuest(row.key, -1)}
                      >
                        −
                      </button>

                      <strong>{value}</strong>

                      <button
                        type="button"
                        aria-label={`Tăng ${row.label}`}
                        disabled={value >= limits.max}
                        onClick={() => changeGuest(row.key, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              className="guest-picker-done"
              type="button"
              onClick={() => setGuestOpen(false)}
            >
              Xong
            </button>
          </div>
        )}
      </div>

      <button
        className="btn btn-primary search-submit roomease-search-submit"
        type="submit"
      >
        <span className="search-button-icon" aria-hidden="true">
          ⌕
        </span>
        <span>Tìm kiếm</span>
      </button>
    </form>
  )
}