import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { paginateItems } from '../src/utils/helpers.js'

describe('catalog pagination', () => {
  const items = ['one', 'two', 'three', 'four', 'five', 'six']

  it('returns only the requested page of items', () => {
    assert.deepEqual(paginateItems(items, 2, 4), ['five', 'six'])
  })

  it('keeps the first page within the page size', () => {
    assert.deepEqual(paginateItems(items, 1, 4), ['one', 'two', 'three', 'four'])
  })
})
