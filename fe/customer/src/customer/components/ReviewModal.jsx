import { useState } from 'react'

import { reviewApi } from '@/api/customer/reviewApi'
import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'

const scoreFields = [
    ['staffScore', 'Nhân viên'],
    ['cleanlinessScore', 'Sạch sẽ'],
    ['locationScore', 'Vị trí'],
    ['comfortScore', 'Thoải mái'],
    ['valueScore', 'Đáng tiền'],
]

export default function ReviewModal({
    booking,
    onClose,
    onSuccess,
}) {
    const [form, setForm] = useState({
        score: 9,
        title: '',
        content: '',
        staffScore: 9,
        cleanlinessScore: 9,
        locationScore: 9,
        comfortScore: 9,
        valueScore: 9,
    })

    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const change = (event) => {
        const { name, value } = event.target

        setForm((current) => ({
            ...current,
            [name]: name.includes('Score') || name === 'score'
                ? Number(value)
                : value,
        }))
    }

    const submit = async (event) => {
        event.preventDefault()
        setSubmitting(true)
        setError('')

        try {
            await reviewApi.create({
                bookingId: booking.id,
                ...form,
            })

            onSuccess()
        } catch (requestError) {
            setError(apiMessage(requestError))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div
            className="modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <section
                className="review-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="review-title"
            >
                <button
                    type="button"
                    className="modal-close"
                    onClick={onClose}
                    aria-label="Đóng"
                >
                    ×
                </button>

                <div className="review-modal-heading">
                    <p className="eyebrow dark">Khách đã lưu trú</p>
                    <h2 id="review-title">Đánh giá {booking.propertyName}</h2>
                    <p>
                        Chia sẻ trải nghiệm thật để giúp những khách hàng khác lựa chọn.
                    </p>
                </div>

                <ErrorAlert message={error} />

                <form onSubmit={submit}>
                    <label className="overall-score-field">
                        Điểm tổng thể
                        <div>
                            <input
                                type="range"
                                name="score"
                                min="1"
                                max="10"
                                step="0.5"
                                value={form.score}
                                onChange={change}
                            />
                            <strong>{Number(form.score).toFixed(1)}</strong>
                        </div>
                    </label>

                    <div className="review-score-grid">
                        {scoreFields.map(([name, label]) => (
                            <label key={name}>
                                {label}
                                <input
                                    type="number"
                                    name={name}
                                    min="1"
                                    max="10"
                                    step="0.5"
                                    value={form[name]}
                                    onChange={change}
                                    required
                                />
                            </label>
                        ))}
                    </div>

                    <label>
                        Tiêu đề
                        <input
                            type="text"
                            name="title"
                            maxLength="180"
                            value={form.title}
                            onChange={change}
                            placeholder="Ví dụ: Kỳ nghỉ rất đáng nhớ"
                        />
                    </label>

                    <label>
                        Nội dung đánh giá
                        <textarea
                            name="content"
                            rows="5"
                            maxLength="5000"
                            value={form.content}
                            onChange={change}
                            placeholder="Bạn thích điều gì? Có điểm nào cần cải thiện?"
                        />
                    </label>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-ghost dark"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Để sau
                        </button>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    )
}