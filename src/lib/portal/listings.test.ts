import test from 'node:test'
import assert from 'node:assert/strict'
import {
  chooseOwnedListing,
  compareListings,
  listingLabel,
  readSelectionFromCookie,
  resolveSelectedListing,
  selectionCookieValue,
  shouldShowLocationSwitcher,
  sortListings,
} from './listings.ts'

const auburn = { id: 'auburn', city: 'Auburn', clinic_name: 'CFC4Health', first_name: 'Rachel', last_name: 'Lamberth' }
const opelika = { id: 'opelika', city: 'Opelika', clinic_name: 'CFC4Health', first_name: 'Rachel', last_name: 'Lamberth' }
const montgomery = { id: 'montgomery', city: 'Montgomery', clinic_name: 'CFC Spine', first_name: 'Rachel', last_name: 'Lamberth' }
const sameCityB = { id: 'b', city: 'Auburn', clinic_name: 'Beta Clinic', first_name: 'Ann', last_name: 'Bee' }
const sameCityA = { id: 'a', city: 'Auburn', clinic_name: 'Alpha Clinic', first_name: 'Ann', last_name: 'Bee' }

test('listings sort by city, then clinic or doctor name, then id', () => {
  const sorted = sortListings([montgomery, sameCityB, opelika, sameCityA, auburn])
  assert.deepEqual(sorted.map((row) => row.id), ['a', 'b', 'auburn', 'montgomery', 'opelika'])
  assert.ok(compareListings(sameCityA, sameCityB) < 0)
})

test('one listing does not show a switcher and stays that listing', () => {
  assert.equal(shouldShowLocationSwitcher(0), false)
  assert.equal(shouldShowLocationSwitcher(1), false)
  assert.equal(shouldShowLocationSwitcher(2), true)
  const only = resolveSelectedListing(sortListings([opelika]), null)
  assert.equal(only?.id, 'opelika')
  assert.equal(listingLabel(opelika), 'CFC4Health · Opelika')
})

test('a valid selection is kept and an unowned or stale id falls back', () => {
  const listings = sortListings([montgomery, auburn, opelika])
  assert.equal(resolveSelectedListing(listings, 'opelika')?.id, 'opelika')
  assert.equal(resolveSelectedListing(listings, null)?.id, 'auburn')
  assert.equal(resolveSelectedListing(listings, undefined)?.id, 'auburn')
  assert.equal(resolveSelectedListing(listings, 'someone-elses-clinic')?.id, 'auburn')
  assert.equal(resolveSelectedListing(listings, 'deleted-listing')?.id, 'auburn')
  assert.equal(resolveSelectedListing([], 'auburn'), null)
})

test('several rows resolve without a single-row lookup', () => {
  const listings = sortListings([opelika, auburn, montgomery, sameCityA])
  assert.doesNotThrow(() => resolveSelectedListing(listings, null))
  assert.equal(listings.length, 4)
  assert.equal(resolveSelectedListing(listings, 'montgomery')?.id, 'montgomery')
})

test('the selection cookie is scoped to the user', () => {
  const raw = selectionCookieValue('user-rachel', 'opelika')
  assert.equal(readSelectionFromCookie(raw, 'user-rachel'), 'opelika')
  assert.equal(readSelectionFromCookie(raw, 'user-other'), null)
  assert.equal(readSelectionFromCookie('opelika', 'user-rachel'), null)
  assert.equal(readSelectionFromCookie('', 'user-rachel'), null)
  assert.equal(readSelectionFromCookie(selectionCookieValue('user-rachel', ''), 'user-rachel'), null)
})

test('an owned paid listing blocks a new draft and wins over a blank row', () => {
  assert.equal(chooseOwnedListing([]), null)
  const draft = chooseOwnedListing([{ id: 'draft', city: 'Auburn', clinic_name: '', membership_tier: 'free' }])
  assert.equal(draft?.paid, false)
  assert.equal(draft?.row.id, 'draft')

  const paid = {
    id: 'paid',
    city: 'Opelika',
    clinic_name: 'CFC4Health',
    is_approved: true,
    membership_tier: 'pro',
    stripe_subscription_id: 'sub_shared',
  }
  const choice = chooseOwnedListing([
    { id: 'draft', city: 'Auburn', clinic_name: 'New draft', membership_tier: 'free' },
    paid,
  ])
  assert.equal(choice?.paid, true)
  assert.equal(choice?.row.id, 'paid')

  const twoPaid = chooseOwnedListing([
    { ...paid, id: 'opelika', city: 'Opelika' },
    { ...paid, id: 'auburn', city: 'Auburn' },
  ])
  assert.equal(twoPaid?.row.id, 'auburn')
})

test('a listing without a clinic name uses the doctor name', () => {
  assert.equal(listingLabel({ id: '1', city: 'Auburn', clinic_name: '', first_name: 'Rachel', last_name: 'Lamberth' }), 'Rachel Lamberth · Auburn')
  assert.equal(listingLabel({ id: '1', city: null, clinic_name: null, first_name: null, last_name: null }), 'Clinic')
})
