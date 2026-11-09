import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createQueryCache } from '../src/utils/queryCache.js'

describe('query cache', () => {
  it('reuses a cached result for the same query key', async () => {
    const cache = createQueryCache()
    let fetchCount = 0
    const fetch = async () => {
      fetchCount += 1
      return ['Pistol']
    }

    const first = await cache.fetch('catalog:page=1', fetch)
    const second = await cache.fetch('catalog:page=1', fetch)

    assert.deepEqual(first, ['Pistol'])
    assert.deepEqual(second, ['Pistol'])
    assert.equal(fetchCount, 1)
  })

  it('deduplicates requests that are still in flight', async () => {
    const cache = createQueryCache()
    let resolveFetch
    let fetchCount = 0
    const fetch = () => {
      fetchCount += 1
      return new Promise((resolve) => {
        resolveFetch = resolve
      })
    }

    const first = cache.fetch('catalog:page=1', fetch)
    const second = cache.fetch('catalog:page=1', fetch)
    await Promise.resolve()
    resolveFetch(['Rifle'])

    assert.deepEqual(await first, ['Rifle'])
    assert.deepEqual(await second, ['Rifle'])
    assert.equal(fetchCount, 1)
  })

  it('can force a refresh after a cached result', async () => {
    const cache = createQueryCache()
    let fetchCount = 0

    const fetch = async () => ++fetchCount
    await cache.fetch('catalog:page=1', fetch)
    const refreshed = await cache.fetch('catalog:page=1', fetch, { force: true })

    assert.equal(refreshed, 2)
  })

  it('does not repopulate the cache with a request completed after clearing', async () => {
    const cache = createQueryCache()
    let finishFirstRequest
    let fetchCount = 0
    const firstRequest = cache.fetch(
      'catalog:page=1',
      () =>
        new Promise((resolve) => {
          finishFirstRequest = resolve
        }),
    )

    cache.clear()
    await Promise.resolve()
    finishFirstRequest(['stale'])
    await firstRequest

    const fresh = await cache.fetch('catalog:page=1', async () => {
      fetchCount += 1
      return ['fresh']
    })

    assert.deepEqual(fresh, ['fresh'])
    assert.equal(fetchCount, 1)
  })
})
