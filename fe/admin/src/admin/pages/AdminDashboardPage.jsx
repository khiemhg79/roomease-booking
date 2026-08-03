import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '@/api/admin/adminApi'
import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'
import { dateTimeVN, dateVN, money } from '@/shared/utils/format'
export default function AdminDashboardPage() {
 const [data,setData]=useState(null),[error,setError]=useState('')
 useEffect(()=>{adminApi.dashboard().then(setData).catch(e=>setError(apiMessage(e)))},[])
 if(!data) return <main className="admin-page"><ErrorAlert message={error}/>{!error&&<Loading/>}</main>
 const stats=[['Tổng tài khoản',data.totalUsers,'Người dùng toàn hệ thống'],['Khách hàng',data.customers,'Tài khoản CUSTOMER'],['Manager',data.managers,'Tài khoản HOTEL_MANAGER'],['Chỗ nghỉ hoạt động',data.activeProperties,`${data.totalProperties} chỗ nghỉ tổng cộng`],['Booking',data.totalBookings,`${data.pendingBookings} chờ xử lý`],['Doanh thu đã trả',money(data.paidRevenue,data.currency),'Tổng booking PAID']]
 return <main className="admin-page"><header className="admin-page-header"><div><p>System overview</p><h1>Bảng điều khiển quản trị</h1><span>Theo dõi sức khỏe và hoạt động tổng thể của RoomEase.</span></div><Link className="btn btn-primary" to="/admin/users">Quản lý người dùng</Link></header><ErrorAlert message={error}/>
 <section className="admin-stat-grid">{stats.map(([label,value,note])=><article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section>
 <section className="admin-dashboard-grid"><article className="admin-panel"><div className="admin-panel-head"><h2>Tài khoản mới</h2><Link to="/admin/users">Xem tất cả</Link></div><div className="admin-list">{data.recentUsers.map(u=><div key={u.id}><div><strong>{u.fullName}</strong><span>{u.email}</span></div><div><em className={`admin-chip role-${u.role.toLowerCase()}`}>{u.role}</em><small>{dateTimeVN(u.createdAt)}</small></div></div>)}</div></article>
 <article className="admin-panel"><div className="admin-panel-head"><h2>Chỗ nghỉ mới</h2><Link to="/admin/properties">Kiểm duyệt</Link></div><div className="admin-list">{data.recentProperties.map(p=><div key={p.id}><div><strong>{p.name}</strong><span>{p.city} · {p.ownerEmail||'Chưa có manager'}</span></div><em className={`admin-chip status-${p.status.toLowerCase()}`}>{p.status}</em></div>)}</div></article></section>
 <section className="admin-panel"><div className="admin-panel-head"><h2>Booking gần nhất</h2><Link to="/admin/bookings">Xem booking</Link></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Mã</th><th>Chỗ nghỉ</th><th>Khách</th><th>Nhận phòng</th><th>Giá trị</th><th>Trạng thái</th></tr></thead><tbody>{data.recentBookings.map(b=><tr key={b.bookingCode}><td><strong>{b.bookingCode}</strong></td><td>{b.propertyName}</td><td>{b.guestFullName}</td><td>{dateVN(b.checkIn)}</td><td>{money(b.totalAmount,'VND')}</td><td><em className={`admin-chip status-${b.status.toLowerCase()}`}>{b.status}</em></td></tr>)}</tbody></table></div></section></main>
}
