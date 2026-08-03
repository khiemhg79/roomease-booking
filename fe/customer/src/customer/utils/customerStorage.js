const RECENT_KEY = 'roomease_customer_recently_viewed'
const CHECKLIST_KEY = 'roomease_customer_trip_checklists'
const REVIEWED_KEY = 'roomease_customer_reviewed_bookings'

function readJson(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key))
        return value ?? fallback
    } catch {
        return fallback
    }
}

export function getRecentlyViewed() {
    const value = readJson(RECENT_KEY, [])
    return Array.isArray(value) ? value : []
}

export function addRecentlyViewed(property) {
    const item = {
        id: property.id,
        slug: property.slug,
        name: property.name,
        propertyType: property.propertyType,
        city: property.city,
        country: property.country,
        starRating: Number(property.starRating || 0),
        reviewScore: Number(property.reviewScore || 0),
        reviewCount: Number(property.reviewCount || 0),
        thumbnailUrl: property.thumbnailUrl
            || property.images?.[0]?.url
            || '',
        viewedAt: new Date().toISOString(),
    }

    const next = [
        item,
        ...getRecentlyViewed().filter((current) => current.id !== item.id),
    ].slice(0, 6)

    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    return next
}

export function getTripChecklist(bookingCode) {
    const all = readJson(CHECKLIST_KEY, {})
    return all[bookingCode] || null
}

export function saveTripChecklist(bookingCode, checklist) {
    const all = readJson(CHECKLIST_KEY, {})
    const next = {
        ...all,
        [bookingCode]: checklist,
    }

    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next))
}

export function isBookingReviewed(bookingId) {
    const reviewed = readJson(REVIEWED_KEY, [])
    return Array.isArray(reviewed) && reviewed.includes(bookingId)
}

export function markBookingReviewed(bookingId) {
    const reviewed = readJson(REVIEWED_KEY, [])
    const next = Array.from(new Set([
        ...(Array.isArray(reviewed) ? reviewed : []),
        bookingId,
    ]))

    localStorage.setItem(REVIEWED_KEY, JSON.stringify(next))
}