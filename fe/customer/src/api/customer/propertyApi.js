import http from '../http'

const unwrapApiData = (response) => {
  const body = response?.data

  if (body === undefined || body === null) {
    return null
  }

  if (body.data !== undefined) {
    return body.data
  }

  return body
}

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value
  }

  if (Array.isArray(value?.content)) {
    return value.content
  }

  if (Array.isArray(value?.items)) {
    return value.items
  }

  if (Array.isArray(value?.data)) {
    return value.data
  }

  return []
}

const normalizeSearchPage = (value) => {
  if (!value || typeof value !== 'object') {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: 10,
    }
  }

  if (Array.isArray(value)) {
    return {
      content: value,
      totalElements: value.length,
      totalPages: value.length > 0 ? 1 : 0,
      page: 0,
      size: value.length,
    }
  }

  return {
    ...value,
    content: Array.isArray(value.content)
      ? value.content
      : Array.isArray(value.items)
        ? value.items
        : [],
    totalElements: Number(value.totalElements ?? value.total ?? 0),
    totalPages: Number(value.totalPages ?? 0),
    page: Number(value.page ?? value.number ?? 0),
    size: Number(value.size ?? 10),
  }
}

const cleanParams = (params = {}) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null || value === '') {
        return false
      }

      if (Array.isArray(value) && value.length === 0) {
        return false
      }

      return true
    }),
  )
}

export const propertyApi = {
  /**
   * Lấy danh sách chỗ nghỉ nổi bật.
   *
   * GET /api/v1/properties/featured
   */
  featured: async () => {
    const response = await http.get('/properties/featured')
    const data = unwrapApiData(response)

    return normalizeArray(data)
  },

  /**
   * Tìm kiếm chỗ nghỉ.
   *
   * GET /api/v1/properties/search
   */
  search: async (params = {}) => {
    const response = await http.get('/properties/search', {
      params: cleanParams(params),
    })

    const data = unwrapApiData(response)

    return normalizeSearchPage(data)
  },

  /**
   * Lấy chi tiết chỗ nghỉ theo slug.
   *
   * GET /api/v1/properties/{slug}
   */
  detail: async (slug, params = {}) => {
    if (typeof slug !== 'string' || !slug.trim()) {
      throw new Error('Slug của chỗ nghỉ không được để trống.')
    }

    const response = await http.get(
      `/properties/${encodeURIComponent(slug.trim())}`,
      {
        params: cleanParams(params),
      },
    )

    return unwrapApiData(response)
  },

  /**
   * Lấy danh sách tiện nghi từ bảng amenities.
   *
   * GET /api/v1/properties/amenities
   */
  amenities: async () => {
    const response = await http.get('/properties/amenities')
    const data = unwrapApiData(response)

    return normalizeArray(data)
  },

  /**
   * Lấy các gói phòng còn khả dụng.
   *
   * GET /api/v1/properties/{propertyId}/offers
   */
  offers: async (propertyId, params = {}) => {
    if (!propertyId) {
      throw new Error('Property ID không được để trống.')
    }

    const response = await http.get(
      `/properties/${encodeURIComponent(propertyId)}/offers`,
      {
        params: cleanParams(params),
      },
    )

    const data = unwrapApiData(response)

    return normalizeArray(data)
  },

  /**
   * Lấy đánh giá của một chỗ nghỉ.
   *
   * GET /api/v1/reviews/property/{propertyId}
   */
  reviews: async (propertyId, page = 0) => {
    if (!propertyId) {
      throw new Error('Property ID không được để trống.')
    }

    const response = await http.get(
      `/reviews/property/${encodeURIComponent(propertyId)}`,
      {
        params: {
          page,
          size: 10,
        },
      },
    )

    return unwrapApiData(response)
  },
}

export default propertyApi