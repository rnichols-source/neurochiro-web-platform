import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isBotUserAgent,
  isTrackedEvent,
  isUuid,
  utcDayStart,
  visitorKey,
} from './profile-events.ts';

describe('profile analytics events', () => {
  it('accepts the doctor profile actions and a dated profile view', () => {
    assert.equal(isTrackedEvent('phone_tap'), true);
    assert.equal(isTrackedEvent('booking_click'), true);
    assert.equal(isTrackedEvent('website_click'), true);
    assert.equal(isTrackedEvent('contact_click'), true);
    assert.equal(isTrackedEvent('profile_view'), true);
    assert.equal(isTrackedEvent('page_view'), false);
    assert.equal(isTrackedEvent(''), false);
  });

  it('ignores crawlers and keeps a normal browser', () => {
    assert.equal(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), true);
    assert.equal(isBotUserAgent('facebookexternalhit/1.1'), true);
    assert.equal(isBotUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'), false);
    assert.equal(isBotUserAgent(''), false);
    assert.equal(isBotUserAgent(null), false);
  });

  it('counts a visitor once per UTC day', () => {
    const morning = utcDayStart(new Date('2026-11-16T01:15:00.000Z'));
    const evening = utcDayStart(new Date('2026-11-16T23:40:00.000Z'));
    const nextDay = utcDayStart(new Date('2026-11-17T00:05:00.000Z'));
    assert.equal(morning, '2026-11-16T00:00:00.000Z');
    assert.equal(evening, morning);
    assert.notEqual(nextDay, morning);
  });

  it('keeps only a uuid visitor key', () => {
    assert.equal(visitorKey('62625FB3-1111-4111-8111-111111111111'), '62625fb3-1111-4111-8111-111111111111');
    assert.equal(visitorKey('not-a-visitor'), null);
    assert.equal(isUuid('62625fb3-1111-4111-8111-111111111111'), true);
  });
});
