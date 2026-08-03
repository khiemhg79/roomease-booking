import { Navigate, Route, Routes } from 'react-router-dom'
import PortalRoute from '@/auth/PortalRoute'
import AdminLayout from '@/admin/layout/AdminLayout'
import AdminLoginPage from '@/auth/pages/AdminLoginPage'
import AdminDashboardPage from '@/admin/pages/AdminDashboardPage'
import AdminUsersPage from '@/admin/pages/AdminUsersPage'
import AdminPropertiesPage from '@/admin/pages/AdminPropertiesPage'
import AdminBookingsPage from '@/admin/pages/AdminBookingsPage'
import NotFoundPage from '@/shared/pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<PortalRoute roles={['ADMIN']} loginPath="/admin/login"><AdminLayout /></PortalRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="properties" element={<AdminPropertiesPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
