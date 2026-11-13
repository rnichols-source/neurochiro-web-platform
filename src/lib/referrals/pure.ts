import { getCountryByIso2 } from '../../config/countries.ts';
import { haversineDistance } from '../geo.ts';

export const CONTACT_VISIBLE_STATUSES = ['accepted', 'patient_contacted', 'scheduled'] as const;
export const OPEN_STATUSES = ['pending', 'sent', 'viewed'] as const;
export const REASON_MAX = 2000;
export const NOTE_MAX = 1000;
export const DECLINE_MAX = 500;

export type Place = { city: string; state: string; lat: number; lng: number };

export type LocationShape = {
  resolved: Place | null;
  ambiguous: Place[] | null;
  confidence?: 'exact' | 'dominant' | 'ambiguous' | 'approximate' | string;
  rejectedCandidates?: Place[];
};

export function referralCountry(value: string | null | undefined): string {
  const raw = (value || 'US').trim().toUpperCase();
  if (raw === 'ALL') return 'ALL';
  if (raw === 'UK') return 'GB';
  if (getCountryByIso2(raw)) return raw;
  return 'US';
}

/** Compact postal code when it matches that country's pattern. US ZIP stays on the 5-digit check. */
export function matchesCountryPostal(query: string, country: string): string | null {
  const iso = referralCountry(country);
  if (iso === 'ALL' || iso === 'US') return null;
  const config = getCountryByIso2(iso);
  if (!config?.postalPattern) return null;
  const spaced = query.trim().replace(/\s+/g, ' ');
  const compact = spaced.replace(/\s+/g, '');
  let pattern: RegExp;
  try {
    pattern = new RegExp(config.postalPattern, 'i');
  } catch {
    return null;
  }
  if (pattern.test(spaced) || pattern.test(compact) || pattern.test(compact.toUpperCase())) {
    return compact.toUpperCase();
  }
  return null;
}

export function looksLikePostal(query: string, country = 'US'): boolean {
  const iso = referralCountry(country);
  const compact = query.trim().replace(/\s+/g, '');
  if (iso === 'ALL') {
    if (/^\d{5}(?:-\d{4})?$/.test(compact)) return true;
    if (/^\d{6}$/.test(compact)) return true;
    if (/^[A-Za-z]\d[A-Za-z](?:\d[A-Za-z]\d)?$/.test(compact)) return true;
    if (/^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/i.test(query.trim())) return true;
    return false;
  }
  if (matchesCountryPostal(query, iso)) return true;
  if (iso === 'US' && /^\d{5}(?:-\d{4})?$/.test(compact)) return true;
  // A 6-digit code is an India PIN even when the doctor is browsing from the US.
  if (iso === 'US' && /^\d{6}$/.test(compact)) return true;
  if (iso === 'GB' && /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/.test(query.trim())) return true;
  return false;
}

/** Search India when a US doctor types a 6-digit PIN. Other searches stay on the chosen country. */
export function searchCountryForQuery(country: string, query: string): string {
  const iso = referralCountry(country);
  const compact = query.trim().replace(/\s+/g, '');
  if (iso === 'US' && /^\d{6}$/.test(compact)) return 'IN';
  return iso;
}

/** A city, "City, ST", or a postal code. A long sentence is a name or clinic. */
export function shouldResolvePlace(query: string, country = 'US'): boolean {
  const trimmed = query.trim();
  if (looksLikePostal(trimmed, country)) return true;
  if (trimmed.includes(',')) return true;
  const words = trimmed.split(/\s+/).filter(Boolean);
  return words.length > 0 && words.length <= 3 && words.every((word) => /^[A-Za-z][A-Za-z.'-]{0,40}$/.test(word));
}

/**
 * Turn a resolveLocation() result into a choice the referral search can show.
 * Dominant matches are NOT auto-picked here. resolve-city.ts still auto-picks
 * those for the directory. Referral search shows every state instead.
 */
export function interpretLocation(result: LocationShape):
  | { kind: 'resolved'; place: Place }
  | { kind: 'choices'; choices: Place[] }
  | { kind: 'none' } {
  if (result.confidence === 'dominant' && result.resolved) {
    const choices = [result.resolved, ...(result.rejectedCandidates || [])];
    if (choices.length > 1) return { kind: 'choices', choices };
  }
  if (result.confidence === 'ambiguous' || (result.ambiguous && result.ambiguous.length > 1 && !result.resolved)) {
    return { kind: 'choices', choices: result.ambiguous || [] };
  }
  if (result.resolved) {
    return { kind: 'resolved', place: result.resolved };
  }
  if (result.ambiguous && result.ambiguous.length > 0) {
    return { kind: 'choices', choices: result.ambiguous };
  }
  return { kind: 'none' };
}

/** Same function and origin the directory uses in enrichWithDistance. */
export function referralDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversineDistance(lat1, lng1, lat2, lng2);
}

export function canSeePatientContact(input: {
  viewerDoctorId: string;
  referringDoctorId: string;
  receivingDoctorId: string;
  status: string;
}): boolean {
  if (input.viewerDoctorId === input.referringDoctorId) return true;
  if (input.viewerDoctorId !== input.receivingDoctorId) return false;
  return (CONTACT_VISIBLE_STATUSES as readonly string[]).includes(input.status);
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'pending':
    case 'sent':
      return 'Sent';
    case 'viewed':
      return 'Seen';
    case 'accepted':
      return 'Accepted';
    case 'declined':
      return 'Declined';
    case 'patient_contacted':
      return 'Called';
    case 'scheduled':
      return 'Booked';
    case 'expired':
      return 'Expired';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export type ReminderRow = {
  status: string;
  created_at: string;
  expires_at?: string | null;
  responded_at?: string | null;
  contacted_at?: string | null;
  reminder_sent_at?: string | null;
  receiver_reminder_1_at?: string | null;
  receiver_reminder_2_at?: string | null;
  referrer_nudge_at?: string | null;
};

export type ReminderKind = 'receiver_24h' | 'receiver_48h_after_accept' | 'referrer_7d_expire';

const HOUR = 60 * 60 * 1000;

export function planReminders(row: ReminderRow, now: Date): ReminderKind[] {
  if (['declined', 'expired', 'cancelled', 'scheduled', 'patient_contacted'].includes(row.status)) return [];
  const created = new Date(row.created_at).getTime();
  const kinds: ReminderKind[] = [];
  if ((OPEN_STATUSES as readonly string[]).includes(row.status)) {
    const reminded = Boolean(row.receiver_reminder_1_at || row.reminder_sent_at);
    if (!reminded && now.getTime() - created >= 24 * HOUR) kinds.push('receiver_24h');
    const expireAt = row.expires_at ? new Date(row.expires_at).getTime() : created + 7 * 24 * HOUR;
    if (!row.referrer_nudge_at && now.getTime() >= expireAt) kinds.push('referrer_7d_expire');
  }
  if (row.status === 'accepted') {
    const acceptedAt = row.responded_at ? new Date(row.responded_at).getTime() : created;
    if (!row.contacted_at && !row.receiver_reminder_2_at && now.getTime() - acceptedAt >= 48 * HOUR) {
      kinds.push('receiver_48h_after_accept');
    }
  }
  return kinds;
}

export function shouldSendPatientIntro(input: {
  consentConfirmed: boolean;
  patientEmail: string | null | undefined;
  alreadySent: boolean;
}): boolean {
  return input.consentConfirmed && Boolean(input.patientEmail && input.patientEmail.includes('@')) && !input.alreadySent;
}

export function patientLabel(first: string, initial: string): string {
  const name = first.trim();
  const last = initial.trim().charAt(0).toUpperCase();
  return last ? `${name} ${last}.` : name;
}

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Keeps the caller's formatting, including +91 and spaces. Rejects letters and too-short numbers. */
export function validPhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!/^[+()\d][\d\s().-]{5,24}$/.test(trimmed)) return null;
  const digits = phoneDigits(trimmed);
  if (digits.length < 7 || digits.length > 15) return null;
  return trimmed;
}

export function validEmail(email: string | null | undefined): string | null {
  const trimmed = (email || '').trim();
  if (!trimmed) return null;
  if (trimmed.length > 200) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

const ALWAYS_A_PLACE = new Set([
  'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'london', 'toronto', 'vancouver',
  'montreal', 'calgary', 'ottawa', 'auckland', 'wellington', 'dublin', 'paris', 'berlin',
])

/** A person or clinic hit is the result. A city name still goes to the map. */
export function nameMatchSkipsPlace(
  query: string,
  rows: { firstName: string; lastName: string; clinicName: string | null }[],
): boolean {
  const q = query.trim().toLowerCase().replace(/^dr\s+/, '')
  if (!q || !rows.length || ALWAYS_A_PLACE.has(q)) return false
  const parts = q.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const first = parts[0]
    const last = parts[parts.length - 1]
    return rows.some((row) => {
      const clinic = (row.clinicName || '').toLowerCase()
      const person = row.firstName.toLowerCase().includes(first) && row.lastName.toLowerCase().includes(last)
      return person || clinic.includes(q)
    })
  }
  return rows.some((row) => row.lastName.toLowerCase() === q || row.firstName.toLowerCase() === q)
}

export function nameNeedles(query: string): { full: string; first?: string; last?: string } {
  const cleaned = query.replace(/[%_,().:*\\"]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  const withoutTitle = cleaned.replace(/^dr\s+/i, '');
  const parts = withoutTitle.split(' ').filter((part) => part.length >= 2);
  if (parts.length >= 2) {
    return { full: withoutTitle, first: parts[0], last: parts[parts.length - 1] };
  }
  return { full: withoutTitle };
}

export function referralBlockReason(input: {
  doctorId: string;
  selfDoctorId: string;
  userId: string | null;
  verificationStatus: string | null;
  membershipTier: string;
  membershipStatus: string;
  hidden: boolean;
}): 'self' | 'hidden' | 'no-account' | 'unapproved' | 'inactive' | null {
  if (input.doctorId === input.selfDoctorId) return 'self';
  if (input.hidden) return 'hidden';
  if ((input.verificationStatus || '').toLowerCase() !== 'verified') return 'unapproved';
  if (!input.userId) return 'no-account';
  const status = (input.membershipStatus || '').toLowerCase();
  if (input.membershipTier === 'free' || status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
    return 'inactive';
  }
  return null;
}

export function blockedSearchNote(reasons: Array<'unapproved' | 'inactive' | 'no-account'>): string {
  const unique = [...new Set(reasons)];
  if (unique.length === 1 && unique[0] === 'unapproved') {
    return 'That doctor is not approved yet, so they cannot take a referral.';
  }
  if (unique.length === 1 && unique[0] === 'inactive') {
    return 'That doctor is not an active member, so they cannot take a referral.';
  }
  if (unique.length === 1 && unique[0] === 'no-account') {
    return 'That listing has no NeuroChiro login, so they cannot receive a referral.';
  }
  if (unique.length === 0) return 'No active member matches. Try another name, city, or country.';
  return 'No active member matches. Inactive and unapproved doctors are hidden.';
}

export function isOpenDuplicate(rows: Array<{ status: string; phone: string | null }>, phone: string): boolean {
  const digits = phoneDigits(phone);
  if (digits.length < 7) return false;
  return rows.some((row) => (
    (OPEN_STATUSES as readonly string[]).includes(row.status) && phoneDigits(row.phone || '') === digits
  ));
}

export function canReceiverSet(from: string, to: string): boolean {
  const open = (OPEN_STATUSES as readonly string[]).includes(from);
  if (to === 'viewed') return from === 'pending' || from === 'sent';
  if (to === 'accepted' || to === 'declined') return open;
  if (to === 'patient_contacted') return from === 'accepted';
  if (to === 'scheduled') return from === 'accepted' || from === 'patient_contacted';
  return false;
}

export function canReferrerCancel(from: string): boolean {
  return (OPEN_STATUSES as readonly string[]).includes(from);
}

export type ReferralDraft = {
  first: string;
  initial: string;
  phone: string;
  email: string | null;
  zip: string | null;
  reason: string;
  urgency: 'routine' | 'urgent';
};

export function validateReferralDraft(input: {
  receivingDoctorId: string;
  selfDoctorId: string;
  patientFirstName: string;
  patientLastInitial: string;
  patientPhone: string;
  patientEmail?: string | null;
  patientZip?: string | null;
  reason: string;
  urgency: string;
  consentConfirmed: boolean;
}): { ok: true; value: ReferralDraft } | { ok: false; error: string } {
  if (!input.consentConfirmed) return { ok: false, error: 'Patient consent is required.' };
  if (!input.receivingDoctorId) return { ok: false, error: 'Pick a doctor.' };
  if (input.receivingDoctorId === input.selfDoctorId) return { ok: false, error: 'Pick another doctor. You cannot refer a patient to yourself.' };
  const first = input.patientFirstName.trim();
  if (!/^[\p{L}][\p{L}\s'.-]{0,59}$/u.test(first)) {
    return { ok: false, error: 'Enter the patient\'s first name.' };
  }
  const initial = input.patientLastInitial.trim().charAt(0).toUpperCase();
  if (!/^[\p{L}]$/u.test(initial)) return { ok: false, error: 'Enter one last initial.' };
  const phone = validPhone(input.patientPhone);
  if (!phone) return { ok: false, error: 'Enter a phone number, including the country code if it is outside the US.' };
  const emailRaw = (input.patientEmail || '').trim();
  if (emailRaw && !validEmail(emailRaw)) return { ok: false, error: 'That email does not look right. Leave it blank if you do not have one.' };
  const zip = (input.patientZip || '').trim();
  if (zip.length > 16) return { ok: false, error: 'That postal code is too long.' };
  const reason = input.reason.trim();
  if (!reason) return { ok: false, error: 'Add a short reason for the referral.' };
  if (reason.length > REASON_MAX) return { ok: false, error: `Keep the reason under ${REASON_MAX} characters.` };
  return {
    ok: true,
    value: {
      first,
      initial,
      phone,
      email: validEmail(emailRaw),
      zip: zip || null,
      reason,
      urgency: input.urgency === 'urgent' ? 'urgent' : 'routine',
    },
  };
}

export function limitText(value: string, max: number): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (trimmed.length > max) return { ok: false, error: `Keep that under ${max} characters.` };
  return { ok: true, value: trimmed };
}

export function referralSaveMessage(input: {
  receiverName: string;
  emailed: boolean;
  inPortal: boolean;
}): string {
  const name = input.receiverName || 'that doctor';
  if (input.emailed && input.inPortal) return `Sent to ${name}. They got an email, and it is in their portal.`;
  if (input.emailed) return `Sent to ${name}. They got an email.`;
  if (input.inPortal) return `Saved for ${name}. They have no email on file, so it is waiting in their portal.`;
  return `Saved for ${name}. It is in your sent list. We could not reach them by email.`;
}

export function formatReferralWhen(value: string | null | undefined, timeZone: string | null): string {
  if (!value) return 'Not yet';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not yet';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: timeZone || 'UTC',
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    }).format(date);
  }
}

export function formatDistance(miles: number, country: string): string {
  if (!Number.isFinite(miles)) return '';
  if (referralCountry(country) === 'US') return `${miles.toFixed(1)} mi`;
  return `${(miles * 1.60934).toFixed(1)} km`;
}

export function placeLabel(place: { city?: string | null; state?: string | null }): string {
  return [place.city, place.state].filter(Boolean).join(', ');
}
