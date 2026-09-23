'use server'

import { checkAdminAuth } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { getMarketingResend, getMarketingFrom, getMailingAddress } from '@/lib/marketing-email';

export interface BroadcastSegment {
  type: 'all' | 'state' | 'zip_prefix';
  value?: string;
}

export async function getSegmentCount(segment: BroadcastSegment): Promise<number> {
  await checkAdminAuth();
  const supabase = createAdminClient();

  let query = (supabase as any)
    .from('subscribers')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'confirmed')
    .is('unsubscribed_at', null);

  if (segment.type === 'state' && segment.value) {
    query = query.eq('state', segment.value);
  } else if (segment.type === 'zip_prefix' && segment.value) {
    query = query.like('zip', `${segment.value}%`);
  }

  const { count } = await query;
  return count || 0;
}

export async function getAvailableStates(): Promise<string[]> {
  await checkAdminAuth();
  const supabase = createAdminClient();

  const { data } = await (supabase as any)
    .from('subscribers')
    .select('state')
    .eq('status', 'confirmed')
    .is('unsubscribed_at', null)
    .not('state', 'is', null);

  const states = new Set((data || []).map((d: any) => d.state).filter(Boolean));
  return Array.from(states).sort() as string[];
}

export async function sendTestBroadcast(
  subject: string,
  markdownBody: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await checkAdminAuth();
  const supabase = createAdminClient();

  // Get admin's email
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single();

  if (!profile?.email) {
    return { ok: false, error: 'Could not find your email address' };
  }

  try {
    const resend = getMarketingResend();
    const from = getMarketingFrom();
    const html = markdownToHtml(markdownBody);

    await resend.emails.send({
      from,
      to: [profile.email],
      subject: `[TEST] ${subject}`,
      html: wrapBroadcastEmail(html),
      headers: {
        'List-Unsubscribe': '<{{{RESEND_UNSUBSCRIBE_URL}}}>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function sendBroadcast(
  subject: string,
  markdownBody: string,
  segment: BroadcastSegment,
): Promise<{ ok: boolean; sent: number; error?: string }> {
  await checkAdminAuth();
  const supabase = createAdminClient();

  // Fetch recipients
  let query = (supabase as any)
    .from('subscribers')
    .select('email')
    .eq('status', 'confirmed')
    .is('unsubscribed_at', null);

  if (segment.type === 'state' && segment.value) {
    query = query.eq('state', segment.value);
  } else if (segment.type === 'zip_prefix' && segment.value) {
    query = query.like('zip', `${segment.value}%`);
  }

  const { data: recipients, error } = await query;

  if (error || !recipients || recipients.length === 0) {
    return { ok: false, sent: 0, error: error?.message || 'No recipients found' };
  }

  const resend = getMarketingResend();
  const from = getMarketingFrom();
  const html = markdownToHtml(markdownBody);
  const wrappedHtml = wrapBroadcastEmail(html);

  let sent = 0;
  const batchSize = 50;

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    for (const recipient of batch) {
      try {
        await resend.emails.send({
          from,
          to: [recipient.email],
          subject,
          html: wrappedHtml,
          headers: {
            'List-Unsubscribe': '<{{{RESEND_UNSUBSCRIBE_URL}}}>',
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });
        sent++;
      } catch (sendErr) {
        console.error(`[BROADCAST] Failed to send to ${recipient.email}:`, sendErr);
      }
    }

    // Rate limit between batches
    if (i + batchSize < recipients.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return { ok: true, sent };
}

/**
 * Simple markdown to HTML converter for broadcast emails.
 * Handles paragraphs, bold, italic, links, and line breaks.
 */
function markdownToHtml(md: string): string {
  return md
    .split('\n\n')
    .map(paragraph => {
      let html = paragraph.trim();
      if (!html) return '';
      // Bold
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Italic
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
      // Links
      html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#D66829;font-weight:bold;">$1</a>');
      // Line breaks within paragraph
      html = html.replace(/\n/g, '<br>');
      return `<p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;">${html}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

function wrapBroadcastEmail(bodyHtml: string): string {
  const address = getMailingAddress();
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1E2D3B;padding:28px;text-align:center;">
        <h1 style="color:white;font-size:22px;margin:0;">NEURO<span style="color:#D66829;">CHIRO</span></h1>
      </div>
      <div style="padding:28px;background:white;">
        ${bodyHtml}
        <p style="font-size:15px;color:#333;margin-top:24px;"><strong>Dr. Ray</strong><br>NeuroChiro | <a href="https://neurochiro.co" style="color:#D66829;">neurochiro.co</a></p>
      </div>
      <div style="background:#f5f3ef;padding:20px;text-align:center;font-size:11px;color:#999;line-height:1.6;">
        <p style="margin:0 0 8px;">This email contains educational content only. It is not medical advice and does not create a doctor-patient relationship.</p>
        <p style="margin:0 0 8px;">${address}</p>
        <p style="margin:0;">
          <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#D66829;">Unsubscribe</a>
        </p>
      </div>
    </div>
  `;
}
