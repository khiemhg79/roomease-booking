import { useMemo, useState } from 'react'

import { reviewApi } from '@/api/customer/reviewApi'
import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'

import './ReviewModal.css'

const scoreFields = [
    ['staffScore', 'Nhân viên', 'Thái độ và hỗ trợ'],
    ['cleanlinessScore', 'Sạch sẽ', 'Phòng và khu vực chung'],
    ['locationScore', 'Vị trí', 'Thuận tiện di chuyển'],
    ['comfortScore', 'Thoải mái', 'Không gian và tiện nghi'],
    ['valueScore', 'Đáng tiền', 'Trải nghiệm so với chi phí'],
]

function scoreText(score) {
    if (score >= 9) return 'Xuất sắc'
    if (score >= 8) return 'Rất tốt'
    if (score >= 7) return 'Tốt'
    if (score >= 5) return 'Ổn'
    return 'Chưa hài lòng'
}

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

    const contentLength = form.content.length

    const overallLabel = useMemo(
        () => scoreText(Number(form.score)),
        [form.score],
    )

    const change = (event) => {
        const {
            name,
            value,
        } = event.target

        setForm((current) => ({
            ...current,
            [name]:
                name.includes('Score') || name === 'score'
                    ? Number(value)
                    : value,
        }))
    }

    const submit = async (event) => {
        event.preventDefault()

        setSubmitting(true)
        setError('')

        try {
            const review =
                await reviewApi.create({
                    bookingId: booking.id,
                    ...form,
                })

            await onSuccess(review)
        } catch (requestError) {
            setError(apiMessage(requestError))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div
            className="modal-backdrop review-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose()
                }
            }}
        >
            <section
                className="review-modal review-modal-v2"
                role="dialog"
                aria-modal="true"
                aria-labelledby="review-title"
            >
                <button
                    type="button"
                    className="modal-close review-modal-close"
                    onClick={onClose}
                    aria-label="Đóng"
                >
                    ×
                </button>

                <div className="review-modal-heading review-modal-heading-v2">
                    <div className="review-property-badge">
                        ✓ Kỳ nghỉ đã hoàn thành
                    </div>

                    <h2 id="review-title">
                        Đánh giá {booking.propertyName}
                    </h2>

                    <p>
                        Chia sẻ trải nghiệm thực tế của bạn.
                        Mỗi booking chỉ có thể đánh giá một lần.
                    </p>
                </div>

                <ErrorAlert message={error} />

                <form
                    className="review-form-v2"
                    onSubmit={submit}
                >
                    <section className="review-overall-card">
                        <div>
                            <span>Điểm tổng thể</span>
                            <strong>{overallLabel}</strong>
                        </div>

                        <div className="review-overall-score">
                            {Number(form.score).toFixed(1)}
                        </div>

                        <input
                            type="range"
                            name="score"
                            min="1"
                            max="10"
                            step="0.5"
                            value={form.score}
                            onChange={change}
                            aria-label="Điểm tổng thể"
                        />

                        <div className="review-range-caption">
                            <span>1.0</span>
                            <span>10.0</span>
                        </div>
                    </section>

                    <section className="review-category-section">
                        <div className="review-form-section-heading">
                            <div>
                                <h3>Điểm chi tiết</h3>
                                <p>
                                    Giúp chỗ nghỉ hiểu điểm mạnh và điều cần cải thiện.
                                </p>
                            </div>
                        </div>

                        <div className="review-score-grid review-score-grid-v2">
                            {scoreFields.map(([
                                name,
                                label,
                                description,
                            ]) => (
                                <label
                                    className="review-score-item"
                                    key={name}
                                >
                                    <span>
                                        <strong>{label}</strong>
                                        <small>{description}</small>
                                    </span>

                                    <div>
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

                                        <em>/ 10</em>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </section>

                    <section className="review-writing-section">
                        <label>
                            <span>Tiêu đề</span>

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
                            <span>
                                Nội dung đánh giá
                                <small>{contentLength}/5000</small>
                            </span>

                            <textarea
                                name="content"
                                rows="5"
                                maxLength="5000"
                                value={form.content}
                                onChange={change}
                                placeholder="Bạn thích điều gì? Có điểm nào chỗ nghỉ có thể cải thiện?"
                            />
                        </label>
                    </section>

                    <div className="review-privacy-note">
                        <span>i</span>
                        <p>
                            Đánh giá đã đăng sẽ xuất hiện công khai trên trang chỗ nghỉ.
                            Thông tin thanh toán của bạn không được hiển thị.
                        </p>
                    </div>

                    <div className="modal-actions review-modal-actions">
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
                            {submitting
                                ? 'Đang gửi đánh giá...'
                                : 'Gửi đánh giá'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    )
}