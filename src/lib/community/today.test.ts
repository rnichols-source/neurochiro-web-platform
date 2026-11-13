import assert from 'node:assert/strict'
import test from 'node:test'
import { firstOpenPhase, splitPhaseName, todayFocus, type TodayPlan } from './today.ts'

const plan: TodayPlan = {
  title: 'SI Joint Stability & Pelvic Rebalancing',
  detail: 'Phase 1 · 5 moves',
  done: 2,
  total: 5,
  href: '/portal/care/exercises',
}

test('an assigned plan is the one thing, even before a home doctor or check-in', () => {
  assert.equal(todayFocus({ hasDoctor: false, checkedIn: false, plan }).kind, 'plan')
  assert.equal(todayFocus({ hasDoctor: false, checkedIn: false, plan: null }).kind, 'doctor')
  assert.equal(todayFocus({ hasDoctor: true, checkedIn: false, plan: null }).kind, 'checkin')
  assert.equal(todayFocus({ hasDoctor: true, checkedIn: true, plan: null }).kind, 'show')
  assert.equal(todayFocus({ hasDoctor: true, checkedIn: true, plan: { ...plan, total: 0 } }).kind, 'show')
})

test('phase names split into the chip and the rest of the line', () => {
  assert.deepEqual(splitPhaseName('Phase 1: Reset & Realign'), { short: 'Phase 1', rest: 'Reset & Realign' })
  assert.deepEqual(splitPhaseName('Week set'), { short: 'Week set', rest: '' })
  assert.equal(firstOpenPhase([{ done: 5, total: 5 }, { done: 1, total: 6 }]), 1)
  assert.equal(firstOpenPhase([{ done: 5, total: 5 }]), 0)
})
