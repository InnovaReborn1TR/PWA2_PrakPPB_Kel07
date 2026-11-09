import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createGunShareUrl } from '../src/utils/shareLink.js'

describe('catalog share links', () => {
  it('creates a deep link to the selected catalog item', () => {
    const url = createGunShareUrl(
      { id: 'local-2', name: 'Remington 870' },
      'https://catalog.example/catalog?source=share#top',
    )

    assert.equal(
      url,
      'https://catalog.example/catalog?source=share&gun=local-2#top',
    )
  })

  it('requires an item identifier to create a share link', () => {
    assert.throws(
      () => createGunShareUrl({ name: 'Unidentified item' }, 'https://catalog.example/'),
      /product ID/i,
    )
  })
})
