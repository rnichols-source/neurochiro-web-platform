import 'server-only'

import { Resend } from 'resend'
import { wrapEmail } from '@/lib/email-template'
import type { Mail } from './emails.ts'
import { applicationDiscordMessage, type DiscordApplication } from './discord.ts'

export async function sendApplicationEmail(mail: Mail): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || !mail.to.includes('@')) return false
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const result = await resend.emails.send({
      from: 'Dr. Ray <ray@neurochirodirectory.com>',
      to: mail.to,
      subject: mail.subject,
      html: wrapEmail(mail.html),
    })
    return !result.error
  } catch (error) {
    console.error('[application] email failed', error instanceof Error ? error.name : 'error')
    return false
  }
}

export async function pingApplicationDiscord(app: DiscordApplication): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: applicationDiscordMessage(app) }),
    })
  } catch (error) {
    console.error('[application] discord failed', error instanceof Error ? error.name : 'error')
  }
}
