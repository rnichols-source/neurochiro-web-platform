export const LIMIT_MESSAGE = 'You have 2 active posts. Close one or feature this one.';
export const DESCRIPTION_MAX = 5000;
export const MEMBER_UPSELL =
  'Members post 2 associateships free and get listed in the NeuroChiro directory. Join NeuroChiro →';
export const MEMBER_UPSELL_PATH = '/pricing/doctors';
export const EXPIRY_REMINDER_DAYS = 7;
export const MANAGE_TOKEN_DAYS = 60;

const MEMBER_TIERS = new Set(['pro', 'neuros']);
const MEMBER_STATUSES = new Set(['active', 'trialing', 'past_due']);
const INTERVIEW_STAGES = new Set(['reviewing', 'interview', 'offer', 'hired', 'phone screen']);

export function isDoctorMember(tier: string, status: string): boolean {
  return MEMBER_TIERS.has(tier) && MEMBER_STATUSES.has(status);
}

export function postDecision(input: {
  tier: string;
  status: string;
  activeCount: number;
  limit: number;
}):
  | { ok: true; mode: 'free' }
  | { ok: false; reason: 'limit'; message: string }
  | { ok: false; reason: 'not_member' } {
  if (!isDoctorMember(input.tier, input.status)) {
    return { ok: false, reason: 'not_member' };
  }
  if (input.activeCount >= input.limit) {
    return { ok: false, reason: 'limit', message: LIMIT_MESSAGE };
  }
  return { ok: true, mode: 'free' };
}

export function oneTimePriceOk(unitAmount: number | null | undefined, expectCents: number): boolean {
  return typeof unitAmount === 'number' && unitAmount === expectCents;
}

export function descriptionOk(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= DESCRIPTION_MAX;
}

export function jobPaymentMetadata(type: 'job_feature' | 'job_post_nonmember', jobId: string) {
  return { type, job_id: jobId };
}

export function metadataIsSafe(meta: Record<string, string>): boolean {
  if ('description' in meta) return false;
  return JSON.stringify(meta).length < 500;
}

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export function nextFeaturedUntil(now: Date, current: string | null | undefined, days: number): Date {
  const existing = current ? new Date(current) : null;
  const start = existing && existing.getTime() > now.getTime() ? existing : now;
  return addDays(start, days);
}

export function planFeatureUpdate(
  row: { stripe_checkout_session_id: string | null; featured_until: string | null },
  sessionId: string,
  now: Date,
  days: number,
): { apply: false } | { apply: true; featured_until: string; stripe_checkout_session_id: string } {
  if (row.stripe_checkout_session_id && row.stripe_checkout_session_id === sessionId) {
    return { apply: false };
  }
  return {
    apply: true,
    featured_until: nextFeaturedUntil(now, row.featured_until, days).toISOString(),
    stripe_checkout_session_id: sessionId,
  };
}

export function planNonMemberPaid(
  row: { stripe_checkout_session_id: string | null; approval_status: string | null },
  sessionId: string,
): { apply: false } | { apply: true; approval_status: 'pending'; is_paid: true; stripe_checkout_session_id: string } {
  if (row.approval_status === 'approved' || row.approval_status === 'rejected') {
    return { apply: false };
  }
  // The draft stores the session id before payment. A second delivery is pending + the same id.
  if (row.approval_status === 'pending' && row.stripe_checkout_session_id === sessionId) {
    return { apply: false };
  }
  return { apply: true, approval_status: 'pending', is_paid: true, stripe_checkout_session_id: sessionId };
}

export function planApprove(
  approvalStatus: string | null,
  now: Date,
  days: number,
): { ok: false; reason: 'not_pending' } | { ok: true; expires_at: string; approval_status: 'approved'; status: 'Active' } {
  if (approvalStatus !== 'pending') return { ok: false, reason: 'not_pending' };
  return { ok: true, expires_at: addDays(now, days).toISOString(), approval_status: 'approved', status: 'Active' };
}

export function planReject(input: {
  approvalStatus: string | null;
  refundOnReject: boolean;
  refundId: string | null;
  paymentIntent: string | null;
}): { ok: false; reason: 'not_pending' } | { ok: true; refund: boolean; approval_status: 'rejected' } {
  if (input.approvalStatus !== 'pending') return { ok: false, reason: 'not_pending' };
  const refund = input.refundOnReject && Boolean(input.paymentIntent) && !input.refundId;
  return { ok: true, refund, approval_status: 'rejected' };
}

export function tokenFresh(createdAt: string, nowMs: number, days = MANAGE_TOKEN_DAYS): boolean {
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return false;
  return nowMs - created < days * 24 * 60 * 60 * 1000;
}

export function isPublicJob(
  row: { status?: string | null; approval_status?: string | null; expires_at?: string | null },
  nowMs: number,
): boolean {
  const status = (row.status || '').toLowerCase();
  if (status !== 'active' && status !== 'open') return false;
  if (row.expires_at && Date.parse(row.expires_at) <= nowMs) return false;
  if (!('approval_status' in row) || row.approval_status == null) return true;
  return row.approval_status === 'approved';
}

export function isFeatured(featuredUntil: string | null | undefined, nowMs: number): boolean {
  if (!featuredUntil) return false;
  return Date.parse(featuredUntil) > nowMs;
}

export type BoardJob = {
  id: string;
  title?: string | null;
  type?: string | null;
  employment_type?: string | null;
  state?: string | null;
  clinic_state?: string | null;
  technique_tags?: string[] | null;
  description?: string | null;
  featured_until?: string | null;
  created_at: string;
  poster_type?: string | null;
};

export function filterBoard<T extends BoardJob>(
  rows: T[],
  filters: { state?: string; type?: string; technique?: string },
  nowMs: number,
): T[] {
  const state = (filters.state || '').trim().toLowerCase();
  const type = (filters.type || '').trim().toLowerCase();
  const technique = (filters.technique || '').trim().toLowerCase();
  const matched = rows.filter((row) => {
    if (state) {
      const rowState = `${row.state || ''} ${row.clinic_state || ''}`.toLowerCase();
      if (!rowState.includes(state)) return false;
    }
    if (type) {
      const rowType = `${row.type || ''} ${row.employment_type || ''}`.toLowerCase();
      if (!rowType.includes(type)) return false;
    }
    if (technique) {
      const tags = (row.technique_tags || []).join(' ').toLowerCase();
      const blob = `${tags} ${row.description || ''}`.toLowerCase();
      if (!blob.includes(technique)) return false;
    }
    return true;
  });
  return matched.sort((a, b) => {
    const af = isFeatured(a.featured_until, nowMs) ? 1 : 0;
    const bf = isFeatured(b.featured_until, nowMs) ? 1 : 0;
    if (af !== bf) return bf - af;
    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });
}

export function payRange(min: number | null | undefined, max: number | null | undefined): string | null {
  if (min && max) return `$${min.toLocaleString('en-US')}–$${max.toLocaleString('en-US')}`;
  if (min) return `From $${min.toLocaleString('en-US')}`;
  if (max) return `Up to $${max.toLocaleString('en-US')}`;
  return null;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function receivesMonthlyDigest(status: string): boolean {
  return status === 'member' || status === 'grace' || status === 'past_due';
}

export function digestMonth(iso: string): string {
  return iso.slice(0, 7);
}

export function expiryReminderVerb(posterType: string | null | undefined): 'Renew' | 'Extend' {
  return posterType === 'nonmember' ? 'Renew' : 'Extend';
}

export type AppRef = {
  id: string;
  jobId: string;
  personId: string | null;
  stage: string | null;
  source: 'canonical' | 'legacy';
};

export function dedupeApplications<T extends AppRef>(rows: T[]): T[] {
  const seen = new Set<string>();
  const ordered = [
    ...rows.filter((row) => row.source === 'canonical'),
    ...rows.filter((row) => row.source === 'legacy'),
  ];
  const out: T[] = [];
  for (const row of ordered) {
    const key = row.personId ? `${row.jobId}:${row.personId}` : `solo:${row.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function isInterviewStage(stage: string | null | undefined): boolean {
  return INTERVIEW_STAGES.has((stage || '').toLowerCase());
}

export function applicationTotals(rows: AppRef[]): { applicationsSubmitted: number; interviewsReached: number } {
  const unique = dedupeApplications(rows);
  return {
    applicationsSubmitted: unique.length,
    interviewsReached: unique.filter((row) => isInterviewStage(row.stage)).length,
  };
}

const STAGE_LABELS: Record<string, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  declined: 'Rejected',
};

export function stageLabel(stage: string | null | undefined): string {
  if (!stage) return 'New';
  const mapped = STAGE_LABELS[stage.toLowerCase()];
  return mapped || stage;
}

export function toApplicationStage(label: string): string {
  const map: Record<string, string> = {
    new: 'new',
    reviewing: 'reviewing',
    'phone screen': 'reviewing',
    interview: 'interview',
    offer: 'offer',
    hired: 'hired',
    rejected: 'declined',
    declined: 'declined',
  };
  return map[label.toLowerCase()] || 'new';
}

export type AdminQueue = 'pending' | 'live' | 'expired' | 'rejected';

export function adminQueue(
  job: {
    status?: string | null;
    approval_status?: string | null;
    expires_at?: string | null;
  },
  nowMs: number,
): AdminQueue {
  if (job.approval_status === 'rejected') return 'rejected';
  if (job.approval_status === 'pending' || job.approval_status === 'awaiting_payment') return 'pending';
  if (job.status === 'Expired' || (job.expires_at && Date.parse(job.expires_at) <= nowMs)) return 'expired';
  return 'live';
}

export function paidAmountLabel(job: { poster_type?: string | null; is_paid?: boolean | null }): string {
  if (job.poster_type === 'nonmember' && job.is_paid) return '$149';
  if (job.poster_type === 'member') return '$0';
  return '—';
}
