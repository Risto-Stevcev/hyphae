import { describe, it } from 'mocha'
import { expect } from 'chai'
import { pipe, pure, map, filter, fromArray, toArray } from '../sync'
import { endOfTransmission } from '../signal'

describe('Sync', () => {
  describe('pure', () => {
    it('should convert an value to a finite stream', () => {
      const stream = pure('foo')
      expect(stream()).to.equal('foo')
      expect(stream()).to.equal(endOfTransmission)
    })
  })

  describe('fromArray', () => {
    it('should convert an array to a finite stream', () => {
      const array = ['foo', 'bar', 'baz']
      const stream = fromArray(array)

      for (let i = 0; i < array.length; i++) {
        expect(stream()).to.equal(array[i])
      }
      expect(stream()).to.equal(endOfTransmission)
      expect(stream()).to.equal(endOfTransmission)
    })
  })

  describe('map + filter', () => {
    it('should map and filter', () => {
      expect(
        pipe(
          fromArray([1, 2, 3, 4, 5]),
          map(e => e + 1),
          filter(e => e % 2 === 0),
          toArray
        )
      ).to.deep.equal([2, 4, 6])
    })
  })
})
