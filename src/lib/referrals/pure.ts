import { haversineDistance } from '../geo.ts';

export const CONTACT_VISIBLE_STATUSES = ['accepted', 'patient_contacted', 'scheduled'] as const;
export const OPEN_STATUSES = ['pending', 'sent', 'viewed'] as const;

export type Place = { city: string; state: string; lat: number; lng: number };

export type LocationShape = {
  resolved: Place | null;
  ambiguous: Place[] | null;
  confidence?: 'exact' | 'dominant' | 'ambiguous' | 'approximate' | string;
  rejectedCandidates?: Place[];
};

export function looksLikePostal(query: string): boolean {
  return /^\d{5}(?:-\d{4})?$/.test(query.trim().replace(/\s+/g, ''));
}

/** A city, "City, ST", or a postal code. A long sentence is a name or clinic. */
export function shouldResolvePlace(query: string): boolean {
  const trimmed = query.trim();
  if (looksLikePostal(trimmed)) return true;
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
  if (result.resolved && result.confidence !== 'approximate') {
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
