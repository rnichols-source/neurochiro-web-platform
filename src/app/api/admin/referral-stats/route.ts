import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'
import { looseFrom } from '@/lib/admin/loose-query'

type ReferralRow = {
  status?: string
  receiving_doctor?: { first_name?: string | null; last_name?: string | null } | null
}

export async function GET() {
  try {
    await checkAdminAuth()
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Forbidden' }, { status })
  }

  const admin = createAdminClient()

  // Fetch all referrals with joined doctor info (admin sees the raw table, not the safe view)
  const { data } = await looseFrom(admin, 'doctor_referrals')
    .select('id, patient_first_name, patient_last_initial, reason, urgency, status, decline_reason, created_at, responded_at, referring_doctor:referring_doctor_id(first_name, last_name, clinic_name), receiving_doctor:receiving_doctor_id(first_name, last_name, clinic_name)')
    .order('created_at', { ascending: false })
    .limit(500) // intentional bound
  const referrals = (data || []) as ReferralRow[]

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
