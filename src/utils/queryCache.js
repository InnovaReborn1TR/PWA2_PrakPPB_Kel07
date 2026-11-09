export function createQueryCache(staleTime = 30_000) {
  const entries = new Map()
  const pendingRequests = new Map()
  let generation = 0

  return {
    fetch(key, fetcher, { force = false } = {}) {
      if (force) entries.delete(key)

      const cached = entries.get(key)
      if (cached && cached.expiresAt > Date.now()) {
        return Promise.resolve(cached.value)
      }

      const pending = pendingRequests.get(key)
      if (pending) return pending

      const requestGeneration = generation
      const request = Promise.resolve()
        .then(fetcher)
        .then((value) => {
          if (requestGeneration === generation) {
            entries.set(key, { value, expiresAt: Date.now() + staleTime })
          }
          return value
        })
        .finally(() => {
          if (pendingRequests.get(key) === request) {
            pendingRequests.delete(key)
          }
        })

      pendingRequests.set(key, request)
      return request
    },

    clear() {
      generation += 1
      entries.clear()
      pendingRequests.clear()
    },
  }
}
