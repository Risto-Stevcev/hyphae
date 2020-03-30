import { describe, it } from 'mocha'
import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {
  pipe,
  tap,
  take,
  map,
  filter,
  reduce,
  interval,
  fromArray,
  toArray
} from '../'
import { endOfTransmission } from '../signal'

use(chaiAsPromised)

describe('Async', () => {
  describe('map + filter + reduce', () => {
    it('should apply the transformations', () => {
      return expect(
        pipe(
          fromArray([1, 2, 3, 4, 5]),
          map(x => x * 2),
          filter(x => x < 10),
          reduce((acc, e) => acc + e, 0)
        )
      ).to.eventually.equal(20)
    })
  })

  describe('interval', () => {
    it.only('should run on an interval', () => {
      let stream = interval(100)
      return expect(
        pipe(
          interval(100),
          take(3),
          map(x => x * 2),
          toArray
        )
      ).to.eventually.deep.equal([2, 4, 6])
    })
  })
})
