export const CLICK_EVENTS = ['phone_tap', 'booking_click', 'website_click', 'contact_click'] as const;

export const TRACKED_EVENTS = [...CLICK_EVENTS, 'profile_view'] as const;

export type ClickEvent = (typeof CLICK_EVENTS)[number];
export type TrackedEvent = (typeof TRACKED_EVENTS)[number];

export const COMMUNITY_REQUEST_EVENT = 'community member request submitted';
export const VISITOR_COOKIE = 'nc_vid';

const BOT_USER_AGENT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|quora link preview|whatsapp|telegram|slackbot|discordbot|lighthouse|pagespeed|headless|wget|curl|python-requests|go-http-client/i;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  const value = (userAgent || '').trim();
  if (!value) return false;
  return BOT_USER_AGENT.test(value);
}

export function isTrackedEvent(value: unknown): value is TrackedEvent {
  return typeof value === 'string' && (TRACKED_EVENTS as readonly string[]).includes(value);
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function visitorKey(value: unknown): string | null {
  if (!isUuid(value)) return null;
  return value.toLowerCase();
}

/** Start of the current UTC day, used to count one profile view per visitor per doctor. */
export function utcDayStart(now: Date): string {
  const start = new Date(now.getTime());
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}
