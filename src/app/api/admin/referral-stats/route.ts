import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET() {
  // Auth check: must be logged-in admin
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Fetch all referrals with joined doctor info (admin sees the raw table, not the safe view)
  const { data: referrals } = await (admin as any)
    .from('doctor_referrals')
    .select('id, patient_first_name, patient_last_initial, reason, urgency, status, decline_reason, created_at, responded_at, referring_doctor:referring_doctor_id(first_name, last_name, clinic_name), receiving_doctor:receiving_doctor_id(first_name, last_name, clinic_name)')
    .order('created_at', { ascending: false })
    .limit(500) // intentional bound

  // Flag doctors who have declined or had 3+ referrals expire
  const declineMap: Record<string, { name: string; count: number }> = {}
  for (const r of referrals || []) {
    if (r.status === 'declined' || r.status === 'expired') {
      const key = `${r.receiving_doctor?.first_name} ${r.receiving_doctor?.last_name}`
      if (!declineMap[key]) declineMap[key] = { name: `Dr. ${key}`, count: 0 }
      declineMap[key].count++
    }
  }

  const flaggedDoctors = Object.values(declineMap)
    .filter((d) => d.count >= 3)
    .map((d) => ({ name: d.name, declinedOrIgnored: d.count }))
    .sort((a, b) => b.declinedOrIgnored - a.declinedOrIgnored)

  return NextResponse.json({
    referrals: referrals || [],
    flaggedDoctors,
  })
}
