import { ratingLabel } from '@/shared/utils/format'

export default function RatingBadge({ score, count }) {
  return (
    <div className="rating-wrap">
      <div className="rating-copy"><strong>{ratingLabel(score)}</strong><span>{count || 0} đánh giá</span></div>
      <span className="rating-badge">{Number(score || 0).toFixed(1)}</span>
    </div>
  )
}
