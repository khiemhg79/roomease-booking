import { Route, Routes } from 'react-router-dom'
import PortalRoute from '@/auth/PortalRoute'
import CustomerLayout from '@/customer/layout/CustomerLayout'
import CustomerLoginPage from '@/auth/pages/CustomerLoginPage'
import CustomerRegisterPage from '@/auth/pages/CustomerRegisterPage'
import HomePage from '@/customer/pages/HomePage'
import SearchPage from '@/customer/pages/SearchPage'
import PropertyPage from '@/customer/pages/PropertyPage'
import CheckoutPage from '@/customer/pages/CheckoutPage'
import BookingSuccessPage from '@/customer/pages/BookingSuccessPage'
import MyBookingsPage from '@/customer/pages/MyBookingsPage'
import FavouritesPage from '@/customer/pages/FavouritesPage'
import NotFoundPage from '@/shared/pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="property/:slug" element={<PropertyPage />} />
        <Route path="checkout" element={<PortalRoute roles={['CUSTOMER']} loginPath="/login"><CheckoutPage /></PortalRoute>} />
        <Route path="booking-success/:code" element={<PortalRoute roles={['CUSTOMER']} loginPath="/login"><BookingSuccessPage /></PortalRoute>} />
        <Route path="bookings" element={<PortalRoute roles={['CUSTOMER']} loginPath="/login"><MyBookingsPage /></PortalRoute>} />
        <Route path="favourites" element={<PortalRoute roles={['CUSTOMER']} loginPath="/login"><FavouritesPage /></PortalRoute>} />
      </Route>
      <Route path="login" element={<CustomerLoginPage />} />
      <Route path="register" element={<CustomerRegisterPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
