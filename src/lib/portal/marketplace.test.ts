import assert from 'node:assert/strict';
import test from 'node:test';
import { categoryCounts, filterVendors } from './marketplace.ts';

const vendors = [
  { id: 'a', categories: ['Labs', 'Imaging'] },
  { id: 'b', categories: ['Labs'] },
  { id: 'c', categories: ['Imaging', 'Supplies', 'Labs'] },
  { id: 'd', categories: [] as string[] },
  { id: 'e', categories: ['Supplies'] },
];

test('category counts do not add up to the vendor total', () => {
  const counts = categoryCounts(vendors);
  assert.deepEqual(counts, [
    ['Imaging', 2],
    ['Labs', 3],
    ['Supplies', 2],
  ]);
  assert.equal(counts.reduce((sum, [, count]) => sum + count, 0), 7);
  assert.equal(vendors.length, 5);
});

test('All shows every card and a chip shows only its vendors', () => {
  assert.equal(filterVendors(vendors, null).length, 5);
  assert.equal(filterVendors(vendors, '').length, 5);
  assert.equal(filterVendors(vendors, 'all').length, 5);
  assert.deepEqual(filterVendors(vendors, 'Labs').map((vendor) => vendor.id), ['a', 'b', 'c']);
  assert.equal(filterVendors(vendors, 'Labs').length, categoryCounts(vendors).find(([name]) => name === 'Labs')?.[1]);
  assert.equal(filterVendors(vendors, 'Missing').length, 0);
});
