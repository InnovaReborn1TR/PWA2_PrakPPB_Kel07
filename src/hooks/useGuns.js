import { useState, useEffect, useCallback, useRef } from 'react'
import gunService from '../services/gunService'

// ---------------------------------------------------------------------------
// useGuns — fetch the paginated / filtered product list from the API.
//
// Returns { guns, loading, error, pagination, refetch }.
// When the API is unreachable the `error` string will be set and `guns`
// will remain an empty array so the UI can show a proper error state.
// ---------------------------------------------------------------------------

export function useGuns(params = {}) {
  const [guns, setGuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)
  const requestId = useRef(0)

  // Serialise params so the effect re-runs when they change.
  const paramKey = JSON.stringify(params)

  const fetchGuns = useCallback(async (force = false) => {
    const currentRequestId = ++requestId.current
    try {
      setLoading(true)
      setError(null)

      const response = await gunService.getGuns(params, { force })

      if (currentRequestId === requestId.current && response.success) {
        setGuns(response.data || [])
        setPagination(response.pagination || null)
      } else if (currentRequestId === requestId.current) {
        setError(response.message || 'Failed to fetch products.')
      }
    } catch (err) {
      if (currentRequestId === requestId.current) {
        setError(err.message || 'An error occurred while fetching products.')
        setGuns([])
      }
    } finally {
      if (currentRequestId === requestId.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey])

  useEffect(() => {
    fetchGuns()
  }, [fetchGuns])

  const refetch = useCallback(() => fetchGuns(true), [fetchGuns])
  return { guns, loading, error, pagination, refetch }
}

// ---------------------------------------------------------------------------
// useGunById — fetch a single product by its UUID.
//
// Returns { gun, loading, error, refetch }.
// ---------------------------------------------------------------------------

export function useGunById(id) {
  const [gun, setGun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGun = useCallback(async (force = false) => {
    if (!id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)

      const response = await gunService.getGunById(id, { force })

      if (response.success) {
        setGun(response.data)
      } else {
        setError(response.message || 'Product not found.')
      }
    } catch (err) {
      setError(err.message || 'Failed to load product details.')
      setGun(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchGun()
  }, [fetchGun])

  const refetch = useCallback(() => fetchGun(true), [fetchGun])
  return { gun, loading, error, refetch }
}
