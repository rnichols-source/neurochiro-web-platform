'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function getCEHistory() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient() as any;

  // Get all certificates
  const { data: certificates } = await admin
    .from('ce_certificates')
    .select('id, seminar_id, user_id, registration_id, ce_hours, certificate_number, issued_at')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });

  const uniqueCertificates = dedupeCertificates(certificates || []);

  if (uniqueCertificates.length === 0) {
    return { totalHours: 0, thisYearHours: 0, certificates: [], bySeminar: [] };
  }

  // Get seminar titles
  const seminarIds = [...new Set(uniqueCertificates.map((c: any) => c.seminar_id))];
  const { data: seminars } = await admin
    .from('seminars')
    .select('id, title, dates, city')
    .in('id', seminarIds);

  const seminarMap: Map<string, any> = new Map((seminars || []).map((s: any) => [s.id, s]));

  const currentYear = new Date().getFullYear();
  const totalHours = uniqueCertificates.reduce((sum: number, c: any) => sum + (c.ce_hours || 0), 0);
  const thisYearHours = uniqueCertificates
    .filter((c: any) => new Date(c.issued_at).getFullYear() === currentYear)
    .reduce((sum: number, c: any) => sum + (c.ce_hours || 0), 0);

  const enriched = uniqueCertificates.map((c: any) => {
    const sem = seminarMap.get(c.seminar_id);
    return {
      ...c,
      seminar_title: sem?.title || 'Unknown Seminar',
      seminar_dates: sem?.dates,
      seminar_city: sem?.city,
    };
  });

  return { totalHours, thisYearHours, certificates: enriched };
}

function dedupeCertificates(certificates: any[]) {
  const seen = new Set<string>();
  const unique = [];
  for (const cert of certificates) {
    const key = cert.registration_id
      ? `registration:${cert.registration_id}`
      : `seminar:${cert.seminar_id || ''}:${cert.user_id || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(cert);
  }
  return unique;
}
