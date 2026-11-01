import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCoords } from './geo.ts';

test('normalizeCoords keeps a real pair', () => {
  assert.deepEqual(normalizeCoords(34.85, -82.39), { latitude: 34.85, longitude: -82.39 });
});

test('normalizeCoords parses numeric strings', () => {
  assert.deepEqual(normalizeCoords(' 51.5 ', '-0.12'), { latitude: 51.5, longitude: -0.12 });
});

test('normalizeCoords rejects 0,0', () => {
  assert.deepEqual(normalizeCoords(0, 0), { latitude: null, longitude: null });
  assert.deepEqual(normalizeCoords('0', '0'), { latitude: null, longitude: null });
});

test('normalizeCoords allows a single zero on the equator or prime meridian', () => {
  const equator = normalizeCoords(0, -82.39);
  assert.equal(equator.latitude, 0);
  assert.equal(equator.longitude, -82.39);
  const meridian = normalizeCoords(51.5, 0);
  assert.equal(meridian.latitude, 51.5);
  assert.equal(meridian.longitude, 0);
});

test('normalizeCoords rejects NaN', () => {
  assert.deepEqual(normalizeCoords(Number.NaN, -82), { latitude: null, longitude: null });
  assert.deepEqual(normalizeCoords('nope', '1'), { latitude: null, longitude: null });
});

test('normalizeCoords rejects empty strings', () => {
  assert.deepEqual(normalizeCoords('', ''), { latitude: null, longitude: null });
  assert.deepEqual(normalizeCoords('   ', '  '), { latitude: null, longitude: null });
});

test('normalizeCoords rejects only one value', () => {
  assert.deepEqual(normalizeCoords(34.85, ''), { latitude: null, longitude: null });
  assert.deepEqual(normalizeCoords(null, -82.39), { latitude: null, longitude: null });
  assert.deepEqual(normalizeCoords(undefined, undefined), { latitude: null, longitude: null });
});

test('normalizeCoords rejects out of range values', () => {
  assert.deepEqual(normalizeCoords(91, -82), { latitude: null, longitude: null });
  assert.deepEqual(normalizeCoords(34, 181), { latitude: null, longitude: null });
});

test('normalizeCoords keeps the range edges', () => {
  assert.deepEqual(normalizeCoords(90, -180), { latitude: 90, longitude: -180 });
  assert.deepEqual(normalizeCoords(-90, 180), { latitude: -90, longitude: 180 });
});
