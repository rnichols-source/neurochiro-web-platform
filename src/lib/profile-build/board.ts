import 'server-only'

import { isMissingTable } from '@/lib/leads/schema'
import { profileDb } from './db.ts'

export type ProfileBuildRow = {
  id: string
  doctorId: string
  doctorName: string
  clinicName: string
  status: string
  attempts: number
  lastError: string
  updatedAt: string
}

export type ProfileBuildBoard = {
  ready: boolean
  failed: ProfileBuildRow[]
  retrying: ProfileBuildRow[]
  loadError: boolean
}

type JobRecord = {
  id: string
  doctor_id: string
  status: string
  attempts: number | null
  last_error: string | null
  updated_at: string | null
}

type DoctorRecord = {
  id: string
  first_name: string | null
  last_name: string | null
  clinic_name: string | null
}

export async function loadProfileBuildBoard(): Promise<ProfileBuildBoard> {
  const failedLoad = { ready: false, failed: [], retrying: [], loadError: true }
  try {
    const admin = profileDb()
    const jobs = await admin
      .from('profile_build_jobs')
      .select('id, doctor_id, status, attempts, last_error, updated_at')
      .or('status.eq.failed,last_error.not.is.null')
      .order('updated_at', { ascending: false })
      .limit(40)
    if (jobs.error) {
      if (isMissingTable(jobs.error)) return { ready: false, failed: [], retrying: [], loadError: false }
      return failedLoad
    }
    const rows = ((jobs.data || []) as JobRecord[]).filter((row) => row.status !== 'succeeded')
    const doctorIds = [...new Set(rows.map((row) => row.doctor_id).filter(Boolean))]
    const doctors = doctorIds.length
      ? await admin.from('doctors').select('id, first_name, last_name, clinic_name').in('id', doctorIds)
      : { data: [] }
    const names = new Map<string, DoctorRecord>()
    for (const doctor of (doctors.data || []) as DoctorRecord[]) names.set(doctor.id, doctor)
    const mapped = rows.map((row) => toRow(row, names.get(row.doctor_id)))
    return {
      ready: true,
      failed: mapped.filter((row) => row.status === 'failed'),
      retrying: mapped.filter((row) => row.status !== 'failed'),
      loadError: false,
    }
  } catch {
    return failedLoad
  }
}

function toRow(row: JobRecord, doctor: DoctorRecord | undefined): ProfileBuildRow {
  const name = [doctor?.first_name, doctor?.last_name].filter(Boolean).join(' ').trim()
  return {
    id: row.id,
    doctorId: row.doctor_id,
    doctorName: name ? `Dr. ${name}` : 'Doctor',
    clinicName: doctor?.clinic_name || '',
    status: row.status,
    attempts: row.attempts || 0,
    lastError: row.last_error || 'Profile research failed',
    updatedAt: row.updated_at || '',
  }
}
