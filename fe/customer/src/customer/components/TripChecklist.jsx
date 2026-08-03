import { useMemo, useState } from 'react'

import {
    getTripChecklist,
    saveTripChecklist,
} from '@/customer/utils/customerStorage'

const defaultItems = [
    'Lưu mã booking và giấy tờ tùy thân',
    'Kiểm tra giờ nhận phòng và giờ di chuyển',
    'Chuẩn bị phương tiện đến chỗ nghỉ',
    'Kiểm tra thời tiết và hành lý',
    'Gửi yêu cầu đặc biệt trước khi đến',
]

export default function TripChecklist({ booking }) {
    const initial = useMemo(() => {
        return getTripChecklist(booking.bookingCode) || {
            checked: [],
            note: '',
        }
    }, [booking.bookingCode])

    const [checked, setChecked] = useState(initial.checked)
    const [note, setNote] = useState(initial.note)
    const [saved, setSaved] = useState(false)

    const toggleItem = (index) => {
        setChecked((current) => current.includes(index)
            ? current.filter((item) => item !== index)
            : [...current, index])
        setSaved(false)
    }

    const save = () => {
        saveTripChecklist(booking.bookingCode, {
            checked,
            note,
        })
        setSaved(true)
    }

    const progress = Math.round((checked.length / defaultItems.length) * 100)

    return (
        <section className="trip-checklist">
            <div className="trip-checklist-heading">
                <div>
                    <p className="eyebrow dark">Trợ lý chuyến đi</p>
                    <h3>Chuẩn bị trước ngày nhận phòng</h3>
                </div>

                <strong>{progress}%</strong>
            </div>

            <div className="trip-progress">
                <span style={{ width: `${progress}%` }} />
            </div>

            <div className="trip-checklist-items">
                {defaultItems.map((item, index) => (
                    <label key={item}>
                        <input
                            type="checkbox"
                            checked={checked.includes(index)}
                            onChange={() => toggleItem(index)}
                        />
                        <span>{item}</span>
                    </label>
                ))}
            </div>

            <label className="trip-note">
                Ghi chú riêng
                <textarea
                    rows="3"
                    value={note}
                    onChange={(event) => {
                        setNote(event.target.value)
                        setSaved(false)
                    }}
                    placeholder="Ví dụ: Đặt xe lúc 7:30, mang theo sạc dự phòng..."
                />
            </label>

            <div className="trip-checklist-footer">
                {saved && <span>✓ Đã lưu trên thiết bị này</span>}
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={save}
                >
                    Lưu danh sách
                </button>
            </div>
        </section>
    )
}