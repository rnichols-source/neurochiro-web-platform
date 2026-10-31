export type LeadLike = {
  id?: string;
  email?: string | null;
  phone?: string | null;
  stage?: string | null;
  created_at?: string | null;
  source?: string | null;
};

export type PortalStats = {
  patientRequests: { total: number; new: number; contacted: number; booked: number };
  profileViews: number;
  viewsInRange: number | null;
  introductions: number;
  profileClicks: number;
  referralsSent: number;
  referralsReceived: number;
  market: { rank: number; total: number; avgViews: number } | null;
};

function inRange(iso: string | null | undefined, start: Date | null): boolean {
  if (!start) return true;
  if (!iso) return false;
  return new Date(iso).getTime() >= start.getTime();
}

function stageBucket(stage: string | null | undefined): 'new' | 'contacted' | 'booked' {
  const value = (stage || 'new').toLowerCase();
  if (value === 'scheduled' || value === 'converted' || value === 'booked') return 'booked';
  if (value === 'contacted' || value === 'follow_up') return 'contacted';
  return 'new';
}

export function rangeStart(range: '30d' | 'month' | 'all', now = new Date()): Date | null {
  if (range === 'all') return null;
  if (range === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Same merge as getLeadPipeline: contact requests are mapped onto the lead list, then counted. */
export function countPatientRequests(leads: LeadLike[], contactRequests: LeadLike[], start: Date | null) {
  const rows = [...leads, ...contactRequests].filter((row) => inRange(row.created_at, start));
  const counts = { total: rows.length, new: 0, contacted: 0, booked: 0 };
  for (const row of rows) counts[stageBucket(row.stage)] += 1;
  return counts;
}

export function marketRank(peers: { id: string; views: number }[], doctorId: string): PortalStats['market'] {
  if (peers.length < 3) return null;
  const sorted = [...peers].sort((a, b) => b.views - a.views);
  const rank = sorted.findIndex((peer) => peer.id === doctorId) + 1;
  const avgViews = Math.round(sorted.reduce((sum, peer) => sum + peer.views, 0) / sorted.length);
  return { rank: rank || sorted.length, total: sorted.length, avgViews };
}
