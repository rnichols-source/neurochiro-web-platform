import { NextRequest, NextResponse } from 'next/server'
import {
  getNotifySettings,
  findUnqueuedVerifiedDoctors,
  enqueueDoctorNotification,
  logNotification,
} from '@/lib/doctor-joined-notify'

/**
 * Cron: Scan for newly verified doctors and queue notifications.
 *
 * Runs twice daily. Finds doctors verified after the cutoff date
 * that haven't been queued yet. Queues them with the hold window
 * so they don't send immediately.
 *
 * Kill switch: platform_settings.doctor_joined_notify.enabled
 * When OFF, still scans and logs what it would queue, but doesn't queue.
 *
 * Schedule: 0 10,22 * * * (10am and 10pm UTC)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await getNotifySettings()
  const doctors = await findUnqueuedVerifiedDoctors()

  if (doctors.length === 0) {
    return NextResponse.json({ scanned: true, found: 0, queued: 0, dryRun: !settings.enabled })
  }

  let queued = 0
  let held = 0
  let skipped = 0
  const results: any[] = []

  for (const doctor of doctors) {
    if (!settings.enabled) {
      // Dry run: find matches but don't queue
      const result = await enqueueDoctorNotification(doctor.id, true)
      results.push({
        doctor: `Dr. ${doctor.first_name} ${doctor.last_name}`,
        city: doctor.city,
        state: doctor.state,
        matchedCount: result.matchedCount,
        action: 'dry_run',
        exclusionReason: result.exclusionReason || null,
      })
      skipped++
      continue
    }

    const result = await enqueueDoctorNotification(doctor.id)
    if (result.queued) {
      if (result.held) {
        held++
        results.push({
          doctor: `Dr. ${doctor.first_name} ${doctor.last_name}`,
          city: doctor.city,
          matchedCount: result.matchedCount,
          action: 'held',
          reason: result.heldReason,
        })
      } else {
        queued++
        results.push({
          doctor: `Dr. ${doctor.first_name} ${doctor.last_name}`,
          city: doctor.city,
          matchedCount: result.matchedCount,
          action: 'queued',
          queueId: result.queueId,
        })
      }
    } else {
      skipped++
      results.push({
        doctor: `Dr. ${doctor.first_name} ${doctor.last_name}`,
        city: doctor.city,
        matchedCount: result.matchedCount,
        action: 'skipped',
        exclusionReason: result.exclusionReason || 'no_matches',
      })
    }
  }

  console.log('[DOCTOR-JOINED-SCAN]', JSON.stringify({
    enabled: settings.enabled,
    found: doctors.length,
    queued,
    held,
    skipped,
    results,
  }))

  return NextResponse.json({
    scanned: true,
    enabled: settings.enabled,
    found: doctors.length,
    queued,
    held,
    skipped,
    results,
  })
}
