import { Outlet } from 'react-router-dom'
import CustomerHeader from '@/customer/components/CustomerHeader'
import Footer from '@/customer/components/Footer'

export default function CustomerLayout() {
  return <div className="app-shell"><CustomerHeader /><Outlet /><Footer /></div>
}
