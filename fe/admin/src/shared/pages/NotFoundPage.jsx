import { Link } from 'react-router-dom'
export default function NotFoundPage() {
  return <main className="container success-page page-section"><h1>404</h1><p>Trang bạn tìm không tồn tại.</p><Link className="btn btn-primary" to="/">Về trang chủ</Link></main>
}
