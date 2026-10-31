import 'server-only';

import { Resend } from 'resend';
import { OUTCOMES } from '@/config/match-questions';
import { wrapEmail } from '@/lib/email-template';
import { createAdminClient } from '@/lib/supabase-admin';
import { missingSchema } from '@/lib/students/schema';
import { readOutcomeToken, signOutcomeToken, tokenHash, type OutcomeKey } from './token';

function db() {
  return createAdminClient() as any;
}

async function send(to: string, html: string) {
  if (!to || !process.env.RESEND_API_KEY) return false;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: 'NeuroChiro <support@neurochirodirectory.com>',
      to: [to],
      subject: 'How did it go?',
      html: wrapEmail(html),
    });
    return !result.error;
  } catch {
    console.error('[MATCH] Outcome email failed');
    return false;
  }
}

export async function sendOutcomePrompts(): Promise<{ sent: number }> {
  const secret = process.env.CRON_SECRET || '';
  if (!secret) return { sent: 0 };
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const matches = await db().from('matches').select('id, student_user_id, doctor_user_id').is('closed_at', null).lt('created_at', cutoff).limit(100);
  if (matches.error) return { sent: 0 };
  let sent = 0;
  const exp = Math.floor(Date.now() / 1000) + 21 * 24 * 60 * 60;
  for (const match of (matches.data || []) as { id: string; student_user_id: string; doctor_user_id: string }[]) {
    for (const userId of [match.student_user_id, match.doctor_user_id]) {
      const already = await db().from('match_outcome_prompts').select('user_id').eq('match_id', match.id).eq('user_id', userId).maybeSingle();
      if (already.error && missingSchema(already.error)) return { sent };
      if (already.data) continue;
      const profile = await db().from('profiles').select('email').eq('id', userId).maybeSingle();
      const email = profile.data?.email as string | undefined;
      if (!email) continue;
      const links: string[] = [];
      let stored = true;
      for (const outcome of OUTCOMES) {
        const token = signOutcomeToken({ matchId: match.id, userId, outcome: outcome.key as OutcomeKey, exp }, secret);
        const saved = await db().from('match_outcome_tokens').insert({
          token_hash: tokenHash(token),
          match_id: match.id,
          user_id: userId,
          outcome: outcome.key,
          expires_at: new Date(exp * 1000).toISOString(),
        });
        if (saved.error) {
          stored = false;
          break;
        }
        links.push(`<li><a href="https://neurochiro.co/match/outcome?token=${encodeURIComponent(token)}">${outcome.label}</a></li>`);
      }
      if (!stored || !links.length) continue;
      const ok = await send(email, `<h1>How did it go?</h1><p>How did it go?</p><ul>${links.join('')}</ul>`);
      if (!ok) continue;
      const marked = await db().from('match_outcome_prompts').insert({ match_id: match.id, user_id: userId });
      if (!marked.error) sent += 1;
    }
  }
  return { sent };
}

export async function consumeOutcomeLink(token: string): Promise<string> {
  const secret = process.env.CRON_SECRET || '';
  const read = readOutcomeToken(token, secret, Math.floor(Date.now() / 1000));
  if (!read.ok) return read.reason === 'expired' ? 'This link has expired.' : 'This link is not valid.';
  const hash = tokenHash(token);
  const row = await db().from('match_outcome_tokens').select('match_id, user_id, outcome, used_at').eq('token_hash', hash).maybeSingle();
  if (row.error && missingSchema(row.error)) return 'ChiroMatch is not ready yet.';
  const data = row.data as { match_id?: string; user_id?: string; outcome?: string; used_at?: string | null } | null;
  if (!data || data.used_at) return 'This link was already used.';
  if (data.match_id !== read.payload.matchId || data.user_id !== read.payload.userId || data.outcome !== read.payload.outcome) {
    return 'This link is not valid.';
  }
  const claimed = await db().from('match_outcome_tokens').update({ used_at: new Date().toISOString() }).eq('token_hash', hash).is('used_at', null).select('token_hash');
  if (claimed.error || !claimed.data?.length) return 'This link was already used.';
  await db().from('match_outcomes').insert({ match_id: data.match_id, reported_by: data.user_id, outcome: data.outcome });
  const label = OUTCOMES.find((item) => item.key === data.outcome)?.label || 'Saved';
  return `Saved. ${label}.`;
}
