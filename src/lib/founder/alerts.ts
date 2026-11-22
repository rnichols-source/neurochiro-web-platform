import 'server-only'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase-admin'
import { daysUntil, FOUNDING_END } from './format'

export type ShellAlert = { id: string; title: string; href: string }

async function loadShellAlertsFresh(): Promise<ShellAlert[]> {
  const admin = createAdminClient() as any
  const cutoff = new Date(Date.now() - 48 * 3_600_000).toISOString()
  const [waiting, review, drafts, gaps, founding, builds] = await Promise.all([
    admin.from('contact_requests').select('doctor_id').is('acknowledged_at', null).neq('status', 'withdrawn').neq('status', 'spam').lt('created_at', cutoff).limit(200),
    admin.from('doctor_applications').select('id', { count: 'exact', head: true }).eq('status', 'under_review'),
    admin.from('doctor_applications').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    admin.from('demand_mentions').select('id', { count: 'exact', head: true }).gte('nearest_distance_mi', 50),
    admin.from('doctors').select('id', { count: 'exact', head: true }).eq('is_founding_member', true).eq('is_test', false),
    admin.from('profile_build_jobs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
  ])
  const alerts: ShellAlert[] = []
  const waitingRows = (waiting.data || []) as { doctor_id: string | null }[]
  if (waitingRows.length) {
    alerts.push({ id: 'waiting', title: `${waitingRows.length} visit requests waiting 48h+`, href: '/admin' })
  }
  const reviewCount = review.count || 0
  const draftCount = drafts.count || 0
  if (reviewCount || draftCount) {
    alerts.push({ id: 'applications', title: `${reviewCount} to review · ${draftCount} drafts`, href: '/admin/applications' })
  }
  if (gaps.count) alerts.push({ id: 'gaps', title: `${gaps.count} asks are 50+ miles out`, href: '/admin/growth#targets' })
  const days = daysUntil(new Date(), FOUNDING_END)
  if (days > 0) alerts.push({ id: 'founding', title: `Founding rate ends in ${days} days · ${founding.count || 0} members`, href: '/admin/money#heads-up' })
  if (!builds.error && builds.count) {
    alerts.push({ id: 'profile-builds', title: `${builds.count} profile research ${builds.count === 1 ? 'failure' : 'failures'}`, href: '/admin/profile-builds' })
  }
  return alerts
}

const loadShellAlertsCached = unstable_cache(loadShellAlertsFresh, ['founder-shell-alerts-v2'], { revalidate: 60 })

export const loadShellAlerts = cache(loadShellAlertsCached)
