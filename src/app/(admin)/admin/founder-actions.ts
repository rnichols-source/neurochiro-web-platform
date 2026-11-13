'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { isAudience, type AudienceKey, type Channel } from '@/lib/founder/audience'
import { deliverBroadcast, nudgeWaitingDoctors, rerouteWaiting, sendMondayDigest } from '@/lib/founder/send'
import { automationsFrom, figuresFrom, saveFounderAutomations, saveFounderFigures } from '@/lib/founder/settings'
import { writeAudit } from '@/lib/founder/audit'

function clean(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : ''
}

function refreshRoster() {
  revalidateTag('founder-roster', { expire: 0 })
}

export async function nudgeWaitingAction(expected: number): Promise<{ ok: boolean; message: string }> {
  const user = await checkAdminAuth()
  const result = await nudgeWaitingDoctors(user.id, expected)
  revalidatePath('/admin')
  refreshRoster()
  return { ok: result.ok, message: result.ok ? result.detail : result.error }
}

export async function rerouteWaitingAction(doctorId: string, expected: number): Promise<{ ok: boolean; message: string }> {
  const user = await checkAdminAuth()
  const result = await rerouteWaiting(user.id, doctorId, expected)
  revalidatePath('/admin/people')
  refreshRoster()
  return { ok: result.ok, message: result.ok ? result.detail : result.error }
}

export async function saveSettingsAction(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const user = await checkAdminAuth()
  const figures = figuresFrom({
    followers: clean(formData.get('followers')),
    peopleUsed: clean(formData.get('peopleUsed')),
    peopleUsedApproximate: formData.get('approximate') === 'on',
  })
  const automations = automationsFrom({
    didYouGetIn: formData.get('didYouGetIn') === 'on',
    autoNudge: formData.get('autoNudge') === 'on',
    mondayDigest: formData.get('mondayDigest') === 'on',
  })
  const savedFigures = await saveFounderFigures(figures)
  const savedAuto = await saveFounderAutomations(automations)
  if (!savedFigures.ok || !savedAuto.ok) return { ok: false, message: 'Settings could not be saved.' }
  await writeAudit({ actorId: user.id, action: 'settings_saved', summary: 'Updated founder figures and automation switches' })
  revalidatePath('/admin/settings')
  revalidatePath('/admin/card')
  refreshRoster()
  return { ok: true, message: 'Saved.' }
}

export async function sendDigestNowAction(): Promise<{ ok: boolean; message: string }> {
  await checkAdminAuth()
  const result = await sendMondayDigest('manual')
  refreshRoster()
  return { ok: result.ok, message: result.ok ? result.detail : result.error }
}

export async function sendBroadcastAction(input: {
  audience: string
  state: string
  country: string
  channels: Channel[]
  subject: string
  body: string
  href: string
  startsAt: string
  endsAt: string
  expected: number
  scheduledFor: string
}): Promise<{ ok: boolean; message: string }> {
  const user = await checkAdminAuth()
  if (!isAudience(input.audience)) return { ok: false, message: 'Pick who this is for.' }
  const audience: AudienceKey = input.audience
  const result = await deliverBroadcast({
    actorId: user.id,
    audience,
    filters: { state: input.state, country: input.country },
    channels: input.channels,
    subject: input.subject,
    body: input.body,
    href: input.href || null,
    startsAt: input.startsAt || null,
    endsAt: input.endsAt || null,
    expected: input.expected,
    scheduledFor: input.scheduledFor || null,
  })
  revalidatePath('/admin/broadcast')
  revalidatePath('/admin/audit')
  refreshRoster()
  return { ok: result.ok, message: result.ok ? result.detail : result.error }
}

export async function previewBroadcastAction(input: {
  audience: string
  state: string
  country: string
  channels: Channel[]
}): Promise<{ ok: boolean; count: number; names: string[]; message?: string }> {
  await checkAdminAuth()
  if (!isAudience(input.audience)) return { ok: false, count: 0, names: [], message: 'Pick who this is for.' }
  const { loadFounderRoster } = await import('@/lib/founder/roster')
  const { reachable, resolveAudience } = await import('@/lib/founder/audience')
  const roster = await loadFounderRoster()
  const rows = reachable(resolveAudience(roster, input.audience, { state: input.state, country: input.country }), input.channels)
  return { ok: true, count: rows.length, names: rows.slice(0, 5).map((row) => row.name) }
}

export async function recordDoctorPreview(doctorId: string, name: string): Promise<void> {
  const user = await checkAdminAuth()
  await writeAudit({
    actorId: user.id,
    action: 'view_as_doctor',
    summary: `Viewed ${name} as the doctor would see the public page`,
    targetType: 'doctor',
    targetId: doctorId,
  })
  refreshRoster()
}
