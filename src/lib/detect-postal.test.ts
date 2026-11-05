import assert from 'node:assert/strict'
import test from 'node:test'
import {
  acceptPostalCode,
  detectPostalCode,
  postalFieldFor,
  validatePostalFormat,
  waitlistCountryGroups,
} from './detect-postal.ts'
import { callingCode, toInternationalE164 } from './calling-codes.ts'

test('India PIN codes are 6 digits and are not treated as US ZIPs', () => {
  assert.deepEqual(detectPostalCode('110001', 'IN'), { code: '110001', country: 'IN' })
  assert.deepEqual(detectPostalCode('560 001', 'IN'), { code: '560001', country: 'IN' })
  assert.equal(detectPostalCode('11000', 'IN'), null)
  assert.equal(detectPostalCode('110001', 'US'), null)
  assert.equal(validatePostalFormat('110001', 'IN'), null)
  assert.match(validatePostalFormat('11000', 'IN') || '', /6-digit/)
  const field = postalFieldFor('IN')
  assert.equal(field.label, 'PIN Code')
  assert.equal(field.placeholder, '110001')
  assert.equal(field.maxLength, 6)
})

test('existing US, Canada, UK, Australia, and New Zealand codes still resolve', () => {
  assert.deepEqual(detectPostalCode('29651', 'US'), { code: '29651', country: 'US' })
  assert.deepEqual(detectPostalCode('29651-1234', 'US'), { code: '29651', country: 'US' })
  assert.deepEqual(detectPostalCode('V5K 1A1', 'CA'), { code: 'V5K', country: 'CA' })
  assert.deepEqual(detectPostalCode('SW1A 1AA', 'GB'), { code: 'SW1A', country: 'GB' })
  assert.deepEqual(detectPostalCode('3000', 'AU'), { code: '3000', country: 'AU' })
  assert.deepEqual(detectPostalCode('1010', 'NZ'), { code: '1010', country: 'NZ' })
  assert.equal(detectPostalCode('3000', 'US'), null)
})

test('a selected country is not rewritten as a US ZIP', () => {
  assert.deepEqual(detectPostalCode('10115', 'DE'), { code: '10115', country: 'DE' })
  assert.equal(detectPostalCode('10115', 'IN'), null)
  assert.deepEqual(detectPostalCode('10115', 'US'), { code: '10115', country: 'US' })
})

test('UAE can leave the postal field blank and can enter a city', () => {
  const field = postalFieldFor('AE')
  assert.equal(field.required, false)
  assert.equal(validatePostalFormat('', 'AE'), null)
  assert.equal(validatePostalFormat('', 'US'), 'Please enter your zip code.')
  assert.deepEqual(detectPostalCode('Dubai', 'AE'), { code: 'Dubai', country: 'AE' })
})

test('the waitlist pins countries in the order patients come from, then lists the rest', () => {
  const groups = waitlistCountryGroups()
  assert.deepEqual(
    groups.priority.map((country) => country.iso2),
    ['US', 'CA', 'GB', 'AU', 'IN', 'ZA', 'DE', 'AE', 'NL', 'IE', 'NZ'],
  )
  assert.ok(groups.rest.length > 20)
  assert.equal(groups.rest.some((country) => country.iso2 === 'US'), false)
  assert.equal(groups.rest.some((country) => country.iso2 === 'ZA'), false)
  assert.equal(groups.rest.some((country) => country.iso2 === 'FR'), true)
  for (const code of ['RS', 'BW', 'BO', 'JM', 'LB']) {
    assert.equal(groups.rest.some((country) => country.iso2 === code), true, code)
  }
})

test('Serbia uses a 5-digit postal code, and Botswana, Bolivia, Jamaica, and Lebanon ask for a city', () => {
  assert.deepEqual(detectPostalCode('11000', 'RS'), { code: '11000', country: 'RS' })
  assert.equal(detectPostalCode('1100', 'RS'), null)
  assert.equal(validatePostalFormat('11000', 'RS'), null)
  assert.equal(postalFieldFor('RS').label, 'Postal Code')
  for (const code of ['BW', 'BO', 'JM', 'LB'] as const) {
    const field = postalFieldFor(code)
    assert.equal(field.required, false, code)
    assert.equal(field.label, 'City or area (optional)')
    assert.equal(validatePostalFormat('', code), null)
  }
  assert.deepEqual(detectPostalCode('Gaborone', 'BW'), { code: 'Gaborone', country: 'BW' })
  assert.deepEqual(detectPostalCode('La Paz', 'BO'), { code: 'La Paz', country: 'BO' })
  assert.deepEqual(detectPostalCode('Kingston', 'JM'), { code: 'Kingston', country: 'JM' })
  assert.deepEqual(detectPostalCode('Beirut', 'LB'), { code: 'Beirut', country: 'LB' })
})

test('a form without a country still accepts an India PIN', () => {
  assert.equal(acceptPostalCode('110001'), true)
  assert.equal(acceptPostalCode('29601'), true)
  assert.equal(acceptPostalCode('12'), false)
})

test('mobile numbers become E.164 with the selected country code', () => {
  assert.equal(callingCode('IN'), '91')
  assert.equal(callingCode('AE'), '971')
  assert.equal(callingCode('GB'), '44')
  assert.equal(callingCode('RS'), '381')
  assert.equal(callingCode('BW'), '267')
  assert.equal(callingCode('BO'), '591')
  assert.equal(callingCode('LB'), '961')
  assert.equal(callingCode('JM'), '1876')
  assert.equal(toInternationalE164('601234567', 'RS'), '+381601234567')
  assert.equal(toInternationalE164('71234567', 'BW'), '+26771234567')
  assert.equal(toInternationalE164('71234567', 'BO'), '+59171234567')
  assert.equal(toInternationalE164('70123456', 'LB'), '+96170123456')
  assert.equal(toInternationalE164('5550100', 'JM'), '+18765550100')
  assert.equal(toInternationalE164('9876543210', 'IN'), '+919876543210')
  assert.equal(toInternationalE164('+44 7911 123456', 'GB'), '+447911123456')
  assert.equal(toInternationalE164('8645550100', 'US'), '+18645550100')
  assert.equal(toInternationalE164('123', 'IN'), null)
})
