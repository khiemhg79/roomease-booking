import { Navigate, Route, Routes } from 'react-router-dom'
import PortalRoute from '@/auth/PortalRoute'
import ManagerLayout from '@/manager/layout/ManagerLayout'
import ManagerLoginPage from '@/auth/pages/ManagerLoginPage'
import ManagerDashboardPage from '@/manager/pages/ManagerDashboardPage'
import ManagerPropertiesPage from '@/manager/pages/ManagerPropertiesPage'
import ManagerPropertyFormPage from '@/manager/pages/ManagerPropertyFormPage'
import ManagerRoomsPage from '@/manager/pages/ManagerRoomsPage'
import ManagerCalendarPage from '@/manager/pages/ManagerCalendarPage'
import ManagerBookingsPage from '@/manager/pages/ManagerBookingsPage'
import NotFoundPage from '@/shared/pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/manager" replace />} />
      <Route path="/manager/login" element={<ManagerLoginPage />} />
      <Route path="/manager" element={<PortalRoute roles={['HOTEL_MANAGER']} loginPath="/manager/login"><ManagerLayout /></PortalRoute>}>
        <Route index element={<ManagerDashboardPage />} />
        <Route path="properties" element={<ManagerPropertiesPage />} />
        <Route path="properties/new" element={<ManagerPropertyFormPage />} />
        <Route path="properties/:propertyId/edit" element={<ManagerPropertyFormPage />} />
        <Route path="properties/:propertyId/rooms" element={<ManagerRoomsPage />} />
        <Route path="calendar" element={<ManagerCalendarPage />} />
        <Route path="bookings" element={<ManagerBookingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
