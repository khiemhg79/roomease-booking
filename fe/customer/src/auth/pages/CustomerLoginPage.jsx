import PortalLoginCard from '@/auth/PortalLoginCard'
import { useAuth } from '@/auth/AuthContext'
export default function CustomerLoginPage() {
  const { customerLogin, customerGoogleLogin } = useAuth()
  return <PortalLoginCard portal="CUSTOMER" title="Đặt phòng cho chuyến đi của bạn" description="Tìm chỗ nghỉ, lưu yêu thích và quản lý toàn bộ booking cá nhân." defaultEmail="user@roomease.vn" defaultPassword="User@123" login={customerLogin} googleLogin={customerGoogleLogin} home="/" />
}
