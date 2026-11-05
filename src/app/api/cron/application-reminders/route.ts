import { NextResponse } from 'next/server'
import { deliverReminders, applicationReminderSmsEnabled } from '@/lib/applications/reminder-plan'
import { claimReminder, loadReminderCandidates, releaseReminder } from '@/lib/applications/reminder-run'
import { sendApplicationEmail } from '@/lib/applications/notify'
import { quoSend } from '@/lib/sms/quo'

export const maxDuration = 60

/**
 * Unfinished doctor applications.
 * About 1 hour after signup, then about 24 hours after.
 * Each note is claimed before it is sent, and only while the application is still a draft with no card.
 * Email is on. Texts stay off unless APPLICATION_REMINDER_SMS_ENABLED is exactly true.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const loaded = await loadReminderCandidates(now)
    if (loaded.unavailable) {
      return NextResponse.json({ ok: true, ready: false, emailed: 0, texted: 0 })
    }
    const result = await deliverReminders({
      now,
      rows: loaded.rows,
      smsEnabled: applicationReminderSmsEnabled(),
      claim: (id, kind) => claimReminder(id, kind, now),
      release: releaseReminder,
      sendEmail: (mail) => sendApplicationEmail(mail),
      sendSms: async (message) => {
        const sent = await quoSend({ to: message.to, content: message.content })
        return sent.ok
      },
    })
    if (result.unavailable) {
      return NextResponse.json({ ok: true, ready: false, emailed: result.emailed, texted: result.texted })
    }
    return NextResponse.json({ ok: true, ready: true, emailed: result.emailed, texted: result.texted })
  } catch (error) {
    console.error('[application-reminder] failed', error instanceof Error ? error.name : 'error')
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
