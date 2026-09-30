'use server'

import { checkAdminAuth } from '@/lib/admin-auth'
import {
  getNotifySettings,
  updateNotifySettings,
  getNotifyQueue,
  cancelQueuedNotification,
  releaseHeldNotification,
  getNotifyStats,
  getNotifyLog,
  type NotifySettings,
  type QueuedNotification,
  type LogEntry,
} from '@/lib/doctor-joined-notify'

export async function loadSettings(): Promise<NotifySettings> {
  await checkAdminAuth()
  return getNotifySettings()
}

export async function saveSettings(updates: Partial<NotifySettings>): Promise<void> {
  await checkAdminAuth()
  await updateNotifySettings(updates)
}

export async function loadQueue(): Promise<QueuedNotification[]> {
  await checkAdminAuth()
  return getNotifyQueue()
}

export async function cancelNotification(queueId: string, reason?: string): Promise<boolean> {
  await checkAdminAuth()
  return cancelQueuedNotification(queueId, reason)
}

export async function releaseNotification(queueId: string): Promise<boolean> {
  await checkAdminAuth()
  return releaseHeldNotification(queueId)
}

export async function loadStats(): Promise<{
  totalSent: number
  totalSuppressed: number
  totalContactRequests: number
  conversionRate: number
}> {
  await checkAdminAuth()
  return getNotifyStats()
}

export async function loadLog(filters?: {
  status?: string
  limit?: number
  offset?: number
}): Promise<{ entries: LogEntry[]; total: number }> {
  await checkAdminAuth()
  return getNotifyLog(filters)
}
