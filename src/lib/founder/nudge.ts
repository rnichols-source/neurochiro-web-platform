/** Doctors nudged inside this window are skipped by Nudge all and by auto-nudge. */
export const NUDGE_COOLDOWN_MS = 20 * 3_600_000

export type NudgeStamp = { doctorId: string; at: string }

export function doctorsToNudge(waitingDoctorIds: string[], recent: NudgeStamp[], now: Date): { send: string[]; skipped: string[] } {
  const cutoff = now.getTime() - NUDGE_COOLDOWN_MS
  const recentIds = new Set<string>()
  for (const row of recent) {
    if (!row.doctorId) continue
    const at = new Date(row.at).getTime()
    if (!Number.isFinite(at) || at < cutoff) continue
    recentIds.add(row.doctorId)
  }
  const unique = [...new Set(waitingDoctorIds.filter(Boolean))]
  return {
    send: unique.filter((id) => !recentIds.has(id)),
    skipped: unique.filter((id) => recentIds.has(id)),
  }
}

export function nudgeLeadsUrl(site = 'https://neurochiro.co'): string {
  return `${site.replace(/\/$/, '')}/doctor/leads`
}

export function nudgeCopy(count: number, leadsUrl: string): { subject: string; text: string; button: string; html: string } {
  const safeCount = Math.max(0, Math.floor(count))
  const subject = 'A patient is waiting to hear from you'
  const waiting = safeCount === 1
    ? '1 patient requested a visit with you on NeuroChiro and is waiting more than 48 hours.'
    : `${safeCount.toLocaleString('en-US')} patients requested a visit with you on NeuroChiro and are waiting more than 48 hours.`
  const help = 'A quick reply helps them get in.'
  const button = safeCount === 1 ? 'See the request' : 'See the requests'
  const text = `${waiting} ${help}`
  const html = `<p>${waiting}</p><p>${help}</p><p style="margin:28px 0;"><a href="${leadsUrl}" style="display:inline-block;background:#D66829;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px;">${button}</a></p>`
  return { subject, text, button, html }
}

export function nudgeConfirm(send: number, skipped: number): string {
  const who = send === 1 ? '1 doctor' : `${send.toLocaleString('en-US')} doctors`
  const skip = skipped === 1
    ? '1 was nudged in the last 20 hours and will be skipped.'
    : `${skipped.toLocaleString('en-US')} were nudged in the last 20 hours and will be skipped.`
  return [
    `Send a reminder to ${who}?`,
    '',
    skip,
    '',
    'Each doctor who gets this has a patient visit request waiting 48 hours or more.',
    '',
    'Email goes to doctors who have an email. An in-app note goes to doctors who have a login. A doctor with neither gets no message. No texts are sent. This does not reroute anyone.',
  ].join('\n')
}
