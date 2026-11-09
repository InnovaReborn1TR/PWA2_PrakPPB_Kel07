import { apiClient, IS_SUPABASE } from '../config/api'
import { createQueryCache } from '../utils/queryCache'

const queryCache = createQueryCache()

const stableParams = (params) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(params).sort(([left], [right]) => left.localeCompare(right)),
    ),
  )

const invalidateGunQueries = () => queryCache.clear()

// ---------------------------------------------------------------------------
// Normalizer — standardizes product shape whether received from Supabase
// (public.products) or from the university API (/api/v1/recipes).
// ---------------------------------------------------------------------------
export const normalizeProduct = (item) => {
  if (!item) return null

  // Resolve specifications from Supabase `specs` (text array) or API `ingredients`
  let specsList = []
  if (Array.isArray(item.specs)) {
    specsList = item.specs.map((s, idx) => {
      if (typeof s === 'string') {
        const colonIndex = s.indexOf(':')
        if (colonIndex > -1) {
          return {
            id: `spec-${idx}`,
            name: s.substring(0, colonIndex).trim(),
            quantity: s.substring(colonIndex + 1).trim(),
          }
        }
        return {
          id: `spec-${idx}`,
          name: 'Specification',
          quantity: s.trim(),
        }
      }
      return s
    })
  } else if (Array.isArray(item.ingredients)) {
    specsList = item.ingredients
  }

  // Resolve steps
  const stepsList =
    Array.isArray(item.steps) && item.steps.length > 0
      ? item.steps
      : ['Verify firearm is completely unloaded and point in safe direction.', 'Inspect receiver and mechanism for maintenance.']

  return {
    ...item,
    id: item.id,
    name: item.name || 'Hardware Piece',
    type: item.type || item.category || 'Hardware',
    category: item.type || item.category || 'Hardware',
    caliber: item.caliber || 'Standard',
    price: Number(item.price ?? item.cook_time ?? 0),
    description: item.description || '',
    image_url: item.image_url || item.image || '/guns/pistol.svg',
    image: item.image_url || item.image || '/guns/pistol.svg',
    ingredients: specsList,
    steps: stepsList,
  }
}

// ---------------------------------------------------------------------------
// GunService — wraps backend CRUD endpoints.
// Supports both Supabase PostgREST table (/rest/v1/products) and
// standard REST API (/api/v1/recipes).
// ---------------------------------------------------------------------------
class GunService {
  /**
   * Fetch a paginated, filterable list of products.
   */
  async getGuns(params = {}, options = {}) {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== '' && value != null),
    )
    const page = Math.max(1, Number(clean.page) || 1)
    const limit = Math.max(1, Number(clean.limit) || 50)
    const queryKey = `guns:${stableParams(clean)}`

    return queryCache.fetch(queryKey, async () => {
      if (IS_SUPABASE) {
        const queryParts = ['select=*']

        if (clean.search) {
          const search = encodeURIComponent(clean.search)
          queryParts.push(
            `or=(name.ilike.*${search}*,description.ilike.*${search}*)`,
          )
        }

        if (clean.category && clean.category !== 'All') {
          queryParts.push(`type=eq.${encodeURIComponent(clean.category)}`)
        }

        if (clean.sort_by) {
          const order = clean.order === 'desc' ? 'desc' : 'asc'
          queryParts.push(`order=${encodeURIComponent(clean.sort_by)}.${order}`)
        } else {
          queryParts.push('order=created_at.desc')
        }

        const offset = (page - 1) * limit
        queryParts.push(`limit=${limit + 1}`, `offset=${offset}`)

        const data = await apiClient.get(`/rest/v1/products?${queryParts.join('&')}`)
        const fetched = Array.isArray(data) ? data.map(normalizeProduct) : []
        const hasMore = fetched.length > limit

        return {
          success: true,
          data: fetched.slice(0, limit),
          pagination: { page, limit, total: null, hasMore },
        }
      }

      const response = await apiClient.get('/api/v1/recipes', {
        params: { ...clean, limit: limit + 1 },
      })
      if (!response?.success) return response

      const backendPagination = response.pagination || {}
      const items = Array.isArray(response.data) ? response.data : []
      const hasMore =
        backendPagination.hasMore ??
        (backendPagination.total != null
          ? page * limit < backendPagination.total
          : items.length > limit)

      return {
        ...response,
        data: items.slice(0, limit),
        pagination: {
          ...backendPagination,
          page: backendPagination.page ?? page,
          limit,
          hasMore,
        },
      }
    }, options)
  }

  /**
   * Fetch a single product by ID.
   */
  async getGunById(id, options = {}) {
    return queryCache.fetch(`gun:${id}`, async () => {
      const encodedId = encodeURIComponent(String(id))
      if (IS_SUPABASE) {
        const data = await apiClient.get(`/rest/v1/products?id=eq.${encodedId}&select=*`)
        if (Array.isArray(data) && data.length > 0) {
          return { success: true, data: normalizeProduct(data[0]) }
        }
        throw new Error('Hardware item not found.')
      }
      return apiClient.get(`/api/v1/recipes/${encodedId}`)
    }, options)
  }

  /**
   * Create a new product.
   */
  async createGun(data) {
    if (IS_SUPABASE) {
      const specsArray = Array.isArray(data.ingredients)
        ? data.ingredients.map((i) => `${i.name}: ${i.quantity}`)
        : Array.isArray(data.specs)
        ? data.specs
        : []

      const payload = {
        name: data.name,
        type: data.type || (data.category === 'minuman' ? 'Rifle' : 'Pistol'),
        caliber: data.caliber || '9mm',
        price: Number(data.price ?? data.cook_time ?? 0),
        description: data.description || '',
        specs: specsArray,
        image_url: data.image_url || null,
      }

      const res = await apiClient.post('/rest/v1/products', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      invalidateGunQueries()
      return { success: true, data: normalizeProduct(created) }
    }
    const response = await apiClient.post('/api/v1/recipes', data)
    invalidateGunQueries()
    return response
  }

  /**
   * Update existing product.
   */
  async updateGun(id, data) {
    if (IS_SUPABASE) {
      const specsArray = Array.isArray(data.ingredients)
        ? data.ingredients.map((i) => `${i.name}: ${i.quantity}`)
        : Array.isArray(data.specs)
        ? data.specs
        : undefined

      const payload = {
        updated_at: new Date().toISOString(),
      }
      if (data.name !== undefined) payload.name = data.name
      if (data.type !== undefined) payload.type = data.type
      if (data.caliber !== undefined) payload.caliber = data.caliber
      if (data.price !== undefined || data.cook_time !== undefined) {
        payload.price = Number(data.price ?? data.cook_time ?? 0)
      }
      if (data.description !== undefined) payload.description = data.description
      if (specsArray !== undefined) payload.specs = specsArray
      if (data.image_url !== undefined) payload.image_url = data.image_url

      const res = await apiClient.patch(`/rest/v1/products?id=eq.${id}`, payload, {
        headers: { Prefer: 'return=representation' },
      })
      const updated = Array.isArray(res) ? res[0] : res
      invalidateGunQueries()
      return { success: true, data: normalizeProduct(updated) }
    }
    const response = await apiClient.put(`/api/v1/recipes/${id}`, data)
    invalidateGunQueries()
    return response
  }

  /**
   * Partial update (PATCH).
   */
  async patchGun(id, data) {
    if (IS_SUPABASE) {
      return this.updateGun(id, data)
    }
    const response = await apiClient.patch(`/api/v1/recipes/${id}`, data)
    invalidateGunQueries()
    return response
  }

  /**
   * Delete product.
   */
  async deleteGun(id) {
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/products?id=eq.${id}`)
      invalidateGunQueries()
      return { success: true }
    }
    const response = await apiClient.delete(`/api/v1/recipes/${id}`)
    invalidateGunQueries()
    return response
  }
}

export default new GunService()
