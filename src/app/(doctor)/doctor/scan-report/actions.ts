'use server'

import { createServerSupabase } from '@/lib/supabase-server'

// Table: scan_reports (id uuid PK, user_id uuid, patient_name text, patient_age int,
// scan_date date, scan_type text, report_data jsonb, score int, created_at timestamptz)

interface SaveReportInput {
  patientName: string
  patientAge: number
  scanDate: string
  scanType: string
  reportData: Record<string, unknown>
  score: number
}

export async function saveReport(data: SaveReportInput): Promise<{ success: true; id: string } | { error: string }> {
  try {
    const supabase = createServerSupabase()
    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData?.user) {
      return { error: 'You must be logged in to save a report.' }
    }

    const { data: report, error } = await (supabase as any)
      .from('scan_reports')
      .insert({
        user_id: userData.user.id,
        patient_name: data.patientName,
        patient_age: data.patientAge,
        scan_date: data.scanDate,
        scan_type: data.scanType,
        report_data: data.reportData,
        score: data.score,
      })
      .select('id')
      .single()

    if (error) {
      console.error('saveReport error:', error)
      return { error: 'Failed to save report. Please try again.' }
    }

    return { success: true, id: report.id }
  } catch (err) {
    console.error('saveReport unexpected error:', err)
    return { error: 'An unexpected error occurred while saving the report.' }
  }
}

export async function getReportHistory(search?: string): Promise<
  { id: string; patient_name: string; patient_age: number; scan_date: string; scan_type: string; score: number; created_at: string }[]
> {
  try {
    const supabase = createServerSupabase()
    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData?.user) {
      return []
    }

    let query = (supabase as any)
      .from('scan_reports')
      .select('id, patient_name, patient_age, scan_date, scan_type, score, created_at')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (search && search.trim()) {
      query = query.ilike('patient_name', `%${search.trim()}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('getReportHistory error:', error)
      return []
    }

    return data ?? []
  } catch (err) {
    console.error('getReportHistory unexpected error:', err)
    return []
  }
}

export async function getReport(id: string): Promise<{
  id: string
  user_id: string
  patient_name: string
  patient_age: number
  scan_date: string
  scan_type: string
  report_data: Record<string, unknown>
  score: number
  created_at: string
} | null> {
  try {
    const supabase = createServerSupabase()
    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData?.user) {
      return null
    }

    const { data, error } = await (supabase as any)
      .from('scan_reports')
      .select('*')
      .eq('id', id)
      .eq('user_id', userData.user.id)
      .single()

    if (error) {
      console.error('getReport error:', error)
      return null
    }

    return data ?? null
  } catch (err) {
    console.error('getReport unexpected error:', err)
    return null
  }
}

export async function getReportCount(): Promise<number> {
  try {
    const supabase = createServerSupabase()
    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData?.user) {
      return 0
    }

    const { count, error } = await (supabase as any)
      .from('scan_reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)

    if (error) {
      console.error('getReportCount error:', error)
      return 0
    }

    return count ?? 0
  } catch (err) {
    console.error('getReportCount unexpected error:', err)
    return 0
  }
}
