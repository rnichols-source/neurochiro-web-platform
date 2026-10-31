import assert from 'node:assert/strict';
import test from 'node:test';
import { escapeHtml, shouldSendUnreadEmail, unreadEmailHtml } from './email.ts';

test('escapeHtml neutralises a script tag and an anchor', () => {
  const raw = '<script>alert(1)</script><a href="https://evil.example">x</a>';
  const escaped = escapeHtml(raw);
  assert.equal(escaped.includes('<script>'), false);
  assert.equal(escaped.includes('<a '), false);
  assert.match(escaped, /&lt;script&gt;/);
  const html = unreadEmailHtml({
    recipientName: 'Sam',
    senderName: 'Dr. <Ada>',
    preview: raw,
    ctaUrl: 'https://neurochiro.co/doctor/messages?c=11111111-1111-4111-8111-111111111111',
    settingsUrl: 'https://neurochiro.co/doctor/settings',
  });
  assert.equal(html.includes('<script>'), false);
  assert.match(html, /Replies to this email aren't delivered/);
  assert.match(html, /Manage email settings/);
});

test('prefs off or a mute skips the unread email', () => {
  const base = { prefsMessages: true, muted: false, alreadyLogged: false, stillUnread: true, dailyCount: 0 };
  assert.equal(shouldSendUnreadEmail({ ...base, prefsMessages: false }), false);
  assert.equal(shouldSendUnreadEmail({ ...base, muted: true }), false);
  assert.equal(shouldSendUnreadEmail(base), true);
});
