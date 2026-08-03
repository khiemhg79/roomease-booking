import { useAuth } from '@/auth/AuthContext'
import PortalLoginCard from '@/auth/PortalLoginCard'

export default function ManagerLoginPage() {
  const {
    managerLogin,
  } = useAuth()

  return (
    <PortalLoginCard
      portal="MANAGER"
      title="Điều hành chỗ nghỉ tập trung"
      description="Quản lý phòng, gói giá, tồn kho theo ngày và xử lý booking của khách."
      defaultEmail="manager@roomease.vn"
      defaultPassword="Manager@123"
      login={managerLogin}
      home="/manager"
    />
  )
}