import assert from 'node:assert/strict'
import test from 'node:test'
import { countryStoredValues, includeNullCountry } from '../geo/country-alias.ts'
import { regionCodes } from '../geo/region-alias.ts'
import {
  cityOrFilter,
  describeEmpty,
  doctorLocationPlan,
  doctorTextFilters,
  isNearbyPlace,
  parseLocationQuery,
  postalOrFilter,
  postgrestOrIlike,
  postgrestOrPrefix,
} from './location-query.ts'

function parsed(q: string, country?: string) {
  return parseLocationQuery(q, country ? { country } : undefined)
}

test('US ZIP and ZIP+4 collapse to five digits', () => {
  for (const query of ['29651', '29651-1234']) {
    const result = parsed(query)
    assert.equal(result.postal?.code, '29651')
    assert.equal(result.postal?.compact, '29651')
    assert.equal(result.postal?.prefix, false)
    assert.equal(result.postal?.country, 'US')
    assert.equal(result.text.length, 0)
    assert.equal(isNearbyPlace(result), true)
  }
})

test('three digits are a US ZIP prefix', () => {
  const result = parsed('296')
  assert.equal(result.postal?.prefix, true)
  assert.equal(result.postal?.code, '296')
  assert.equal(result.postal?.country, 'US')
  assert.equal(isNearbyPlace(result), false)
  assert.equal(describeEmpty(result), 'No doctors with ZIP starting 296')
  const filter = postalOrFilter(result.postal!)
  assert.match(filter, /zip_code\.ilike\."296%"/)
  assert.match(filter, /address\.ilike\."% 296%"/)
})

test('Canadian postal forms share the Toronto FSA', () => {
  for (const query of ['M5V 2T6', 'm5v2t6', 'M5V']) {
    const result = parsed(query)
    assert.equal(result.postal?.code, 'M5V')
    assert.equal(result.postal?.country, 'CA')
    assert.equal(result.postal?.prefix, false)
    assert.equal(isNearbyPlace(result), true)
  }
  assert.equal(parsed('M5V 2T6').postal?.compact, 'M5V2T6')
  assert.equal(parsed('m5v2t6').postal?.compact, 'M5V2T6')
  assert.equal(parsed('M5V').postal?.compact, 'M5V')
})

test('UK postcodes keep the outward code', () => {
  const full = parsed('SW1A 1AA')
  const outward = parsed('SW1A')
  assert.equal(full.postal?.code, 'SW1A')
  assert.equal(full.postal?.compact, 'SW1A1AA')
  assert.equal(full.postal?.country, 'GB')
  assert.equal(full.postal?.prefix, false)
  assert.equal(outward.postal?.code, 'SW1A')
  assert.equal(outward.postal?.compact, 'SW1A')
  assert.equal(isNearbyPlace(full), true)
})

test('an India PIN stays 6 digits and is not a US ZIP', () => {
  const pin = parsed('110001', 'IN')
  assert.equal(pin.postal?.code, '110001')
  assert.equal(pin.postal?.country, 'IN')
  assert.equal(pin.postal?.prefix, false)
  const bare = parsed('110001')
  assert.equal(bare.postal?.country, 'IN')
  assert.equal(bare.postal?.code, '110001')
})

test('four digits are ambiguous unless the country hint is AU or NZ', () => {
  const open = parsed('2000')
  assert.equal(open.postal?.prefix, true)
  assert.equal(open.postal?.country, 'US')
  assert.deepEqual(open.ambiguous[0]?.options.map((option) => option.code), ['AU', 'NZ'])
  const au = parsed('2000', 'AU')
  assert.equal(au.postal?.country, 'AU')
  assert.equal(au.postal?.prefix, false)
  assert.equal(au.ambiguous.length, 0)
  const nz = parsed('2000', 'NZ')
  assert.equal(nz.postal?.country, 'NZ')
  assert.equal(nz.postal?.prefix, false)
})

test('country names and aliases become ISO2 and clear the text', () => {
  assert.deepEqual(parsed('Canada').countries, ['CA'])
  assert.deepEqual(parsed('Canada').text, [])
  assert.deepEqual(parsed('USA').countries, ['US'])
  assert.deepEqual(parsed('United States').countries, ['US'])
  assert.deepEqual(parsed('US').countries, ['US'])
  assert.deepEqual(parsed('UK').countries, ['GB'])
  assert.deepEqual(parsed('United Kingdom').countries, ['GB'])
  assert.deepEqual(parsed('GB').countries, ['GB'])
  assert.deepEqual(parsed('Australia').countries, ['AU'])
  assert.deepEqual(parsed('AU').countries, ['AU'])
  assert.deepEqual(parsed('New Zealand').countries, ['NZ'])
  assert.deepEqual(parsed('NZ').countries, ['NZ'])
  assert.equal(includeNullCountry('US'), true)
  assert.equal(includeNullCountry('CA'), false)
  for (const value of ['US', 'USA', 'United States', 'us']) {
    assert.equal(countryStoredValues('US').includes(value), true)
  }
  assert.equal(countryStoredValues('US').includes('UK'), false)
  for (const value of ['GB', 'UK', 'gb', 'uk', 'United Kingdom']) {
    assert.equal(countryStoredValues('GB').includes(value), true)
  }
})

test('a bare state and country code defaults to the US state and offers a country chip', () => {
  const ca = parsed('CA')
  assert.deepEqual(ca.states, ['CA'])
  assert.deepEqual(ca.countries, [])
  const state = ca.ambiguous[0]?.options.find((option) => option.kind === 'state')
  const country = ca.ambiguous[0]?.options.find((option) => option.kind === 'country')
  assert.equal(state?.label, 'California')
  assert.equal(country?.code, 'CA')
  assert.equal(country?.label, 'Canada')
  const sc = parsed('SC')
  assert.deepEqual(sc.states, ['SC'])
  assert.equal(sc.ambiguous[0]?.options.some((option) => option.kind === 'country'), false)
  assert.equal(sc.ambiguous[0]?.options[0]?.label, 'South Carolina')
})

test('state names and city plus state queries', () => {
  assert.deepEqual(parsed('South Carolina').states, ['SC'])
  assert.deepEqual(parsed('Texas').states, ['TX'])
  assert.deepEqual(parsed('TX').states, ['TX'])
  assert.deepEqual(parsed('British Columbia').states, ['BC'])
  assert.deepEqual(parsed('BC').states, ['BC'])
  for (const code of ['SC', 'BC', 'TX']) {
    const forms = regionCodes(code)
    assert.equal(forms.includes(code), true)
    assert.equal(forms.some((form) => form.length > 2), true)
  }
  assert.equal(regionCodes('SC').includes('South Carolina'), true)
  assert.equal(regionCodes('BC').includes('British Columbia'), true)
  assert.equal(regionCodes('QC').includes('Québec'), true)
  for (const query of ['Greer SC', 'Greer, SC', 'greer, south carolina']) {
    const result = parsed(query)
    assert.equal(result.city?.toLowerCase(), 'greer')
    assert.deepEqual(result.states, ['SC'])
    assert.deepEqual(result.text, [])
    assert.equal(isNearbyPlace(result), true)
  }
  const mount = parsed('Mount Pleasant SC')
  assert.equal(mount.city, 'Mount Pleasant')
  assert.deepEqual(mount.states, ['SC'])
})

test('name queries stay tokens and special characters are escaped', () => {
  const smith = parsed('Dr. Smith Greer')
  assert.deepEqual(smith.text, ['smith', 'greer'])
  assert.equal(smith.city, null)
  assert.equal(smith.states.length, 0)
  assert.deepEqual(parsed('John Smith').text, ['john', 'smith'])
  assert.deepEqual(parsed('Smith, John').text, ['smith', 'john'])
  assert.equal(parsed('Smith, John').city, null)
  assert.deepEqual(parsed('dragon smith').text, ['dragon', 'smith'])
  const obrien = doctorTextFilters(["O'Brien"])[0]
  assert.match(obrien, /O'Brien/)
  assert.equal(postgrestOrIlike('50%'), '"%50\\\\%%"')
  assert.match(doctorTextFilters(['50%'])[0], /50\\\\%/)
  assert.equal(postgrestOrPrefix('296'), '"296%"')
})

test('accented and plain city spellings share one OR filter', () => {
  const accented = parsed('Montréal')
  const plain = parsed('Montreal')
  assert.deepEqual(accented.text, ['montréal'])
  assert.deepEqual(plain.text, ['montreal'])
  const filter = doctorTextFilters(accented.text)[0]
  assert.match(filter, /montréal/i)
  assert.match(filter, /montreal/)
  assert.equal(filter.split('first_name.ilike.').length > 1, true)
  const city = cityOrFilter('Montréal', 'exact')
  assert.match(city, /montréal/i)
  assert.match(city, /montreal/)
})

test('a place plan does not also treat the state as a name token', () => {
  const plan = doctorLocationPlan('Greer, SC')
  assert.equal(plan.textFilters.length, 0)
  assert.equal(plan.city, 'Greer')
  assert.equal(plan.stateValues.includes('SC'), true)
  assert.equal(plan.stateValues.includes('South Carolina'), true)
  assert.equal(plan.locationActive, true)
  const canada = doctorLocationPlan('Canada')
  assert.equal(canada.countryValues.includes('CA'), true)
  assert.equal(canada.countryValues.includes('Canada'), true)
  assert.equal(canada.includeNullCountry, false)
  const usa = doctorLocationPlan('United States')
  assert.equal(usa.includeNullCountry, true)
  assert.equal(usa.countryValues.includes('USA'), true)
  assert.equal(usa.countryValues.includes('United States'), true)
})

function optionCode(result: ReturnType<typeof parsed>, kind: 'state' | 'country'): string | undefined {
  return result.ambiguous[0]?.options.find((option) => option.kind === kind)?.code
}

test('CA chip codes are the state default and the Canada country', () => {
  assert.equal(optionCode(parsed('CA'), 'state'), 'CA')
  assert.equal(optionCode(parsed('CA'), 'country'), 'CA')
})
