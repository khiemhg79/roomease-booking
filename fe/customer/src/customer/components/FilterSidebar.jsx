const types = [
  ['HOTEL', 'Khách sạn'], ['APARTMENT', 'Căn hộ'], ['RESORT', 'Khu nghỉ dưỡng'],
  ['VILLA', 'Biệt thự'], ['HOSTEL', 'Hostel'], ['HOMESTAY', 'Homestay'],
]
const amenities = [
  ['FREE_WIFI', 'Wi-Fi miễn phí'], ['BREAKFAST', 'Bữa sáng'], ['SWIMMING_POOL', 'Hồ bơi'],
  ['PARKING', 'Chỗ đỗ xe'], ['BEACHFRONT', 'Giáp biển'], ['AIRPORT_SHUTTLE', 'Đưa đón sân bay'],
]

export default function FilterSidebar({ filters, onChange, onReset }) {
  const toggle = (key, value) => {
    const current = filters[key] || []
    onChange(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
  }
  return (
    <aside className="filter-panel">
      <div className="filter-heading"><h3>Lọc kết quả</h3><button onClick={onReset}>Đặt lại</button></div>
      <div className="filter-section">
        <strong>Giá mỗi đêm</strong>
        <div className="price-range">
          <input type="number" min="0" step="100000" placeholder="Từ" value={filters.minPrice || ''}
            onChange={(e) => onChange('minPrice', e.target.value)} />
          <input type="number" min="0" step="100000" placeholder="Đến" value={filters.maxPrice || ''}
            onChange={(e) => onChange('maxPrice', e.target.value)} />
        </div>
      </div>
      <div className="filter-section">
        <strong>Loại chỗ nghỉ</strong>
        {types.map(([value, label]) => <label className="check-row" key={value}>
          <input type="checkbox" checked={filters.propertyTypes?.includes(value) || false} onChange={() => toggle('propertyTypes', value)} />{label}
        </label>)}
      </div>
      <div className="filter-section">
        <strong>Hạng sao</strong>
        {[5, 4, 3, 2].map((star) => <label className="check-row" key={star}>
          <input type="checkbox" checked={filters.stars?.includes(star) || false} onChange={() => toggle('stars', star)} />
          {star} sao
        </label>)}
      </div>
      <div className="filter-section">
        <strong>Điểm đánh giá</strong>
        {[9, 8, 7].map((score) => <label className="radio-row" key={score}>
          <input type="radio" name="review" checked={Number(filters.minReviewScore) === score}
            onChange={() => onChange('minReviewScore', score)} />Từ {score} điểm
        </label>)}
      </div>
      <div className="filter-section">
        <strong>Tiện nghi phổ biến</strong>
        {amenities.map(([value, label]) => <label className="check-row" key={value}>
          <input type="checkbox" checked={filters.amenities?.includes(value) || false} onChange={() => toggle('amenities', value)} />{label}
        </label>)}
      </div>
    </aside>
  )
}
