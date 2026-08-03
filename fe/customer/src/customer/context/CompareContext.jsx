import {
    createContext,
    useContext,
    useMemo,
    useState,
} from 'react'

const CompareContext = createContext(null)
const STORAGE_KEY = 'roomease_customer_compare'
const MAX_ITEMS = 3

function readStoredItems() {
    try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY))
        return Array.isArray(value) ? value.slice(0, MAX_ITEMS) : []
    } catch {
        return []
    }
}

function compactProperty(property) {
    return {
        id: property.id,
        slug: property.slug,
        name: property.name,
        propertyType: property.propertyType,
        address: property.address || property.addressLine,
        city: property.city,
        country: property.country,
        starRating: Number(property.starRating || 0),
        reviewScore: Number(property.reviewScore || 0),
        reviewCount: Number(property.reviewCount || 0),
        thumbnailUrl: property.thumbnailUrl
            || property.images?.[0]?.url
            || '',
        amenities: (property.amenities || [])
            .map((item) => typeof item === 'string' ? item : item.name)
            .filter(Boolean),
        minNightlyPrice: Number(property.minNightlyPrice || 0),
        minTotalPrice: Number(property.minTotalPrice || 0),
        currency: property.currency || 'VND',
        freeCancellation: Boolean(property.freeCancellation),
        breakfastIncluded: Boolean(property.breakfastIncluded),
        availableRooms: Number(property.availableRooms || 0),
    }
}

export function CompareProvider({ children }) {
    const [items, setItems] = useState(readStoredItems)

    const persist = (nextItems) => {
        setItems(nextItems)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems))
    }

    const add = (property) => {
        const item = compactProperty(property)

        if (items.some((current) => current.id === item.id)) {
            return { added: false, reason: 'EXISTS' }
        }

        if (items.length >= MAX_ITEMS) {
            return { added: false, reason: 'LIMIT' }
        }

        persist([...items, item])
        return { added: true }
    }

    const remove = (propertyId) => {
        persist(items.filter((item) => item.id !== propertyId))
    }

    const toggle = (property) => {
        if (items.some((item) => item.id === property.id)) {
            remove(property.id)
            return { added: false, reason: 'REMOVED' }
        }

        return add(property)
    }

    const clear = () => persist([])

    const value = useMemo(() => ({
        items,
        count: items.length,
        maxItems: MAX_ITEMS,
        contains: (propertyId) => items.some((item) => item.id === propertyId),
        add,
        remove,
        toggle,
        clear,
    }), [items])

    return (
        <CompareContext.Provider value={value}>
            {children}
        </CompareContext.Provider>
    )
}

export function useCompare() {
    const context = useContext(CompareContext)

    if (!context) {
        throw new Error('useCompare phải được dùng bên trong CompareProvider')
    }

    return context
}