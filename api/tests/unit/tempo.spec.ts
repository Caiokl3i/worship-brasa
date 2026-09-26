import { test } from '@japa/runner'
import { bpmFromIntervals, intervalsFromTaps } from '#ministries/tempo'

test.group('Metrônomo', () => {
  test('a média dos intervalos vira o BPM', ({ assert }) => {
    assert.equal(bpmFromIntervals(intervalsFromTaps([0, 500, 1000])), 120)
    assert.isNull(bpmFromIntervals([]))
    assert.isNull(bpmFromIntervals([0]))
    assert.equal(bpmFromIntervals(intervalsFromTaps([0, 500, 3000, 3500])), 120)
  })
})
