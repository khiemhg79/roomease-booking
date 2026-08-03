import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { bookingApi } from '@/api/customer/bookingApi'
import { favouriteApi } from '@/api/customer/favouriteApi'
import { apiMessage } from '@/api/http'
import { useAuth } from '@/auth/AuthContext'
import { getRecentlyViewed } from '@/customer/utils/customerStorage'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'
import RatingBadge from '@/shared/components/RatingBadge'
import { dateVN, money } from '@/shared/utils/format'

const activeStatuses = ['PENDING', 'CONFIRMED', 'CHECKED_IN']

export default function AccountPage() {
    const { user } = useAuth()
    const [bookings, setBookings] = useState([])
    const [favourites, setFavourites] = useState([])
    const [recent] = useState(getRecentlyViewed)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        Promise.all([
            bookingApi.mine(0, 20),
            favouriteApi.list(),
        ])
            .then(([bookingData, favouriteData]) => {
                setBookings(bookingData?.content || [])
                setFavourites(Array.isArray(favouriteData) ? favouriteData : [])
            })
            .catch((requestError) => setError(apiMessage(requestError)))
            .finally(() => setLoading(false))
    }, [])

    const upcoming = useMemo(() => {
        return bookings
            .filter((booking) => activeStatuses.includes(booking.status))
            .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
    }, [bookings])

    if (loading) {
        return <main className="container page-section"><Loading /></main>
    }

    return (
        <main className="container page-section account-dashboard">
            <section className="account-welcome">
                <div>
                    <p className="eyebrow dark">Không gian cá nhân</p>
                    <h1>Xin chào, {user?.fullName}</h1>
                    <p>
                        Theo dõi chuyến đi, danh sách đã lưu và các lựa chọn gần đây ở một nơi.
                    </p>
                </div>

                <div className="account-avatar">
                    {(user?.fullName || 'R').charAt(0).toUpperCase()}
                </div>
            </section>

            <ErrorAlert message={error} />

            <section className="account-stats">
                <Link to="/bookings">
                    <span>Chuyến đi đang hoạt động</span>
                    <strong>{upcoming.length}</strong>
                    <small>Xem lịch trình →</small>
                </Link>

                <Link to="/favourites">
                    <span>Chỗ nghỉ yêu thích</span>
                    <strong>{favourites.length}</strong>
                    <small>Mở danh sách →</small>
                </Link>

                <Link to="/compare">
                    <span>Công cụ lựa chọn</span>
                    <strong>⇄</strong>
                    <small>So sánh khách sạn →</small>
                </Link>
            </section>

            {upcoming[0] && (
                <section className="next-trip-card">
                    <div className="next-trip-copy">
                        <p className="eyebrow">Chuyến đi tiếp theo</p>
                        <h2>{upcoming[0].propertyName}</h2>
                        <p>{upcoming[0].propertyAddress}, {upcoming[0].propertyCity}</p>

                        <div className="next-trip-facts">
                            <div>
                                <span>Nhận phòng</span>
                                <strong>{dateVN(upcoming[0].checkIn)}</strong>
                            </div>
                            <div>
                                <span>Trả phòng</span>
                                <strong>{dateVN(upcoming[0].checkOut)}</strong>
                            </div>
                            <div>
                                <span>Tổng tiền</span>
                                <strong>{money(upcoming[0].totalAmount, upcoming[0].currency)}</strong>
                            </div>
                        </div>

                        <Link className="btn btn-light" to="/bookings">
                            Quản lý chuyến đi
                        </Link>
                    </div>

                    <div className="next-trip-code">
                        <span>Mã booking</span>
                        <strong>{upcoming[0].bookingCode}</strong>
                        <small>{upcoming[0].nights} đêm · {upcoming[0].roomsCount} phòng</small>
                    </div>
                </section>
            )}

            {recent.length > 0 && (
                <section className="page-section account-recent">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow dark">Tiếp tục khám phá</p>
                            <h2>Chỗ nghỉ đã xem gần đây</h2>
                        </div>
                    </div>

                    <div className="recent-grid">
                        {recent.slice(0, 4).map((item) => (
                            <Link
                                className="recent-card"
                                key={item.id}
                                to={`/property/${item.slug}`}
                            >
                                <img src={item.thumbnailUrl} alt={item.name} />
                                <div>
                                    <h3>{item.name}</h3>
                                    <p>{item.city}, {item.country}</p>
                                    <RatingBadge
                                        score={item.reviewScore}
                                        count={item.reviewCount}
                                    />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </main>
    )
}