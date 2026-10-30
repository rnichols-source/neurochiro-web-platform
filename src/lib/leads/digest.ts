import { adminLeadEmails, siteUrl } from './config'
import { sendTracked } from './send'
import { isMissingColumn, isMissingTable } from './schema'
import { escapeHtml } from './validate'

function hoursSince(value: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 3_600_000))
}

function cell(value: string): string {
  return `<td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px;">${escapeHtml(value)}</td>`
}

function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return ''
  const head = headers.map((header) => `<th style="text-align:left;padding:8px;font-size:12px;">${escapeHtml(header)}</th>`).join('')
  const body = rows.map((row) => `<tr>${row.map(cell).join('')}</tr>`).join('')
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0 24px;"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

export async function runLeadAdminDigest(db: any): Promise<{ sent: boolean; open: number; attention: number; failed: number; error?: string }> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const openRes = await db
    .from('contact_requests')
    .select('id, name, phone, status, created_at, doctor_id')
    .eq('status', 'new')
    .lt('created_at', dayAgo)
    .order('created_at', { ascending: true })
    .limit(200)
  if (openRes.error) console.error('[LEADS] digest open query failed:', openRes.error.message)

  let attentionRows: any[] = []
  const attention = await db
    .from('contact_requests')
    .select('id, name, phone, attention_reason, created_at')
    .eq('needs_admin_attention', true)
    .order('created_at', { ascending: true })
    .limit(200)
  if (attention.error && isMissingColumn(attention.error)) {
    console.error('[LEADS] needs_admin_attention is missing. Digest will omit that section. Apply migration 20261030000000_lead_followup.sql.', attention.error.message)
  } else if (attention.error) {
    console.error('[LEADS] digest attention query failed:', attention.error.message)
  } else {
    attentionRows = attention.data || []
  }

  let failedRows: any[] = []
  const failed = await db
    .from('lead_notifications')
    .select('id, contact_request_id, kind, recipient, status, error, created_at')
    .in('status', ['failed', 'bounced'])
    .gte('created_at', dayAgo)
    .order('created_at', { ascending: false })
    .limit(200)
  if (failed.error && isMissingTable(failed.error)) {
    console.error('[LEADS] lead_notifications is missing. Digest will omit failed sends. Apply migration 20261030000000_lead_followup.sql.', failed.error.message)
  } else if (failed.error) {
    console.error('[LEADS] digest failed-send query failed:', failed.error.message)
  } else {
    failedRows = failed.data || []
  }

  const openRows = openRes.data || []
  if (openRows.length === 0 && attentionRows.length === 0 && failedRows.length === 0) {
    return { sent: false, open: 0, attention: 0, failed: 0 }
  }

  const html = `
    <h1 style="font-size:22px;">Lead digest</h1>
    <p>Open requests older than 24 hours, anything flagged for you, and sends that failed or bounced in the last day.</p>
    <h2>Open more than 24 hours (${openRows.length})</h2>
    ${table(['Patient', 'Phone', 'Age', 'Link'], openRows.map((row: any) => [
      row.name || '',
      row.phone || '',
      `${hoursSince(row.created_at)}h`,
      `${siteUrl()}/admin/contact-requests?focus=${row.id}`,
    ]))}
    <h2>Needs attention (${attentionRows.length})</h2>
    ${table(['Patient', 'Phone', 'Reason'], attentionRows.map((row: any) => [row.name || '', row.phone || '', row.attention_reason || '']))}
    <h2>Failed or bounced in the last 24 hours (${failedRows.length})</h2>
    ${table(['Kind', 'Status', 'Recipient', 'Error'], failedRows.map((row: any) => [row.kind || '', row.status || '', row.recipient || '', row.error || '']))}
  `
  const text = [
    `Open >24h: ${openRows.length}`,
    ...openRows.map((row: any) => `${row.name} ${row.phone || ''} ${hoursSince(row.created_at)}h ${siteUrl()}/admin/contact-requests?focus=${row.id}`),
    `Needs attention: ${attentionRows.length}`,
    ...attentionRows.map((row: any) => `${row.name} ${row.attention_reason || ''}`),
    `Failed or bounced: ${failedRows.length}`,
    ...failedRows.map((row: any) => `${row.kind} ${row.status} ${row.recipient || ''} ${row.error || ''}`),
  ].join('\n')

  const sent = await sendTracked({
    requestId: null,
    kind: 'admin_digest',
    channel: 'email',
    to: adminLeadEmails(),
    subject: `Lead digest: ${openRows.length} open, ${attentionRows.length} need attention, ${failedRows.length} failed`,
    html,
    text,
  })
  return {
    sent: sent.ok,
    open: openRows.length,
    attention: attentionRows.length,
    failed: failedRows.length,
    error: sent.ok ? undefined : sent.error,
  }
}
