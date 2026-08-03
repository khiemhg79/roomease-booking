export default function Loading({ label = 'Đang tải dữ liệu...' }) {
  return <div className="loading"><span className="spinner" />{label}</div>
}
