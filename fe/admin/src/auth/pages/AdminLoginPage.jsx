import PortalLoginCard from '@/auth/PortalLoginCard'
import { useAuth } from '@/auth/AuthContext'
export default function AdminLoginPage() {
  const { adminLogin } = useAuth()
  return <PortalLoginCard portal="ADMIN" title="Quản trị toàn bộ nền tảng" description="Kiểm soát người dùng, manager, chỗ nghỉ, booking và hoạt động toàn hệ thống." defaultEmail="admin@roomease.vn" defaultPassword="Admin@123" login={adminLogin} home="/admin" />
}
