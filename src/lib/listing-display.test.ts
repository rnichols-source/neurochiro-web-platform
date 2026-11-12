import assert from 'node:assert/strict'
import test from 'node:test'
import {
  coOwnerLine,
  isPracticeListing,
  listingCardCopy,
  listingDisplayName,
  listingMeta,
  parseCoOwners,
  sameListingPerson,
} from './listing-display.ts'

const rise = {
  listing_format: 'practice',
  clinic_name: 'Rise Wellness Chiropractic',
  first_name: 'Rachel',
  last_name: 'Babbitt',
  co_owners: [
    { name: 'Dr. Rachel Babbitt', credentials: 'DC', photo_url: 'https://example.com/rachel.jpg', bio: 'Rachel bio' },
    { name: 'Dr. Annie Bishop', credentials: 'DC, CACCP', photo_url: 'https://example.com/annie.jpg', bio: 'Annie bio' },
  ],
}

test('lead-doctor listings keep the doctor name', () => {
  const lead = { listing_format: 'lead', first_name: 'Trey', last_name: 'Smith', clinic_name: 'Cornerstone Family Chiropractic' }
  assert.equal(isPracticeListing(lead), false)
  assert.equal(listingDisplayName(lead), 'Dr. Trey Smith')
  assert.deepEqual(listingCardCopy(lead), {
    title: 'Dr. Trey Smith',
    detail: 'Cornerstone Family Chiropractic',
  })
  const meta = listingMeta(lead, { location: 'Foley, AL', specialties: ['Pediatric'] })
  assert.equal(meta.title, 'Dr. Trey Smith | Nervous System Specialist at Cornerstone Family Chiropractic')
  assert.match(meta.description, /^Visit Dr\. Trey Smith in Foley, AL\./)
  assert.doesNotMatch(meta.title, /Cornerstone Family Chiropractic \|/)
})

test('an unset listing format stays a lead-doctor listing', () => {
  assert.equal(listingDisplayName({ first_name: 'Cam', last_name: 'Good', clinic_name: 'Cornerstone Family Chiropractic' }), 'Dr. Cam Good')
})

test('practice-first listings use the practice name and both co-owners', () => {
  assert.equal(listingDisplayName(rise), 'Rise Wellness Chiropractic')
  assert.equal(listingDisplayName(rise).includes('Rachel'), false)
  assert.equal(coOwnerLine(rise), 'Dr. Rachel Babbitt, DC and Dr. Annie Bishop, DC, CACCP')
  assert.deepEqual(listingCardCopy(rise), {
    title: 'Rise Wellness Chiropractic',
    detail: 'Dr. Rachel Babbitt, DC and Dr. Annie Bishop, DC, CACCP',
  })
  const meta = listingMeta(rise, { location: 'Grand Rapids, MI', specialties: ['Pediatric'] })
  assert.match(meta.title, /^Rise Wellness Chiropractic \|/)
  assert.match(meta.title, /Dr\. Rachel Babbitt, DC and Dr\. Annie Bishop, DC, CACCP/)
  assert.match(meta.description, /Co-owners Dr\. Rachel Babbitt, DC and Dr\. Annie Bishop, DC, CACCP/)
  assert.equal(meta.title.startsWith('Dr.'), false)
})

test('co-owner records drop empty names and non-http photos', () => {
  const owners = parseCoOwners([
    { name: '  Dr. Annie Bishop ', credentials: 'DC, CACCP', photo_url: 'javascript:alert(1)', bio: 'Care' },
    { name: '   ' },
    null,
  ])
  assert.equal(owners.length, 1)
  assert.equal(owners[0].name, 'Dr. Annie Bishop')
  assert.equal(owners[0].photo_url, null)
})

test('a co-owner is the same person as their old team-member row', () => {
  assert.equal(sameListingPerson('Dr. Annie Bishop', 'Dr. Annie Bishop, DC, CACCP'), true)
  assert.equal(sameListingPerson('Dr. Rachel Babbitt', 'Dr. Annie Bishop'), false)
})
