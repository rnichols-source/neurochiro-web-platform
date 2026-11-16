'use client';

import { track } from '@vercel/analytics';
import { COMMUNITY_REQUEST_EVENT, type ClickEvent } from './profile-events';

const VISITOR_HINT = 'nc_vid';

function rememberVisitor(): string {
  try {
    const existing = sessionStorage.getItem(VISITOR_HINT);
    if (existing) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(VISITOR_HINT, created);
    return created;
  } catch {
    return '';
  }
}

function send(eventType: string, doctorId: string, visitorKey?: string) {
  if (!doctorId) return;
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      doctorId,
      eventType,
      visitorKey: visitorKey || undefined,
    }),
    keepalive: true,
  }).catch(() => {});
}

export function trackDoctorClick(eventType: ClickEvent, input: { doctorId: string; slug: string }) {
  const slug = (input.slug || '').slice(0, 200);
  try {
    track(eventType, { slug });
  } catch {
    // Web Analytics can be off. The database row is recorded separately.
  }
  send(eventType, input.doctorId);
}

export function trackProfileView(doctorId: string) {
  send('profile_view', doctorId, rememberVisitor());
}

export function trackCommunityRequest(slug: string) {
  const value = (slug || '').slice(0, 200);
  if (!value) return;
  try {
    track(COMMUNITY_REQUEST_EVENT, { slug: value });
  } catch {
    // The request itself already went through.
  }
}
