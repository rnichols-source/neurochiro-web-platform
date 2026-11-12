import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { isApplicationFlowEnabled } from '@/lib/applications/flag'
import { loadApplicationGate } from '@/lib/applications/gate'
import { referrerLabelForSlug } from '@/lib/member-referrals/db'
import { MEMBER_REF_COOKIE, persistedRef, withReferralQuery } from '@/lib/member-referrals/logic'
import GetStartedClient from './GetStartedClient'

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const params = await searchParams
  const jar = await cookies()
  const referralSlug = persistedRef({
    query: params.ref,
    cookie: jar.get(MEMBER_REF_COOKIE)?.value,
  }) || ''
  const applicationFlow = isApplicationFlowEnabled()
  if (applicationFlow) {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      const role = String((profile as { role?: string | null } | null)?.role || '')
      if (role === 'doctor' || role.startsWith('doctor')) {
        const admin = createAdminClient()
        const { data: doctor } = await admin.from('doctors').select('id').eq('user_id', user.id).maybeSingle()
        if (doctor?.id) {
          const gate = await loadApplicationGate(doctor.id)
          redirect(gate === 'finish' ? withReferralQuery('/doctor/apply', referralSlug) : '/doctor/dashboard')
        }
      }
    }
  }
  let referredBy: string | null = null
  try {
    referredBy = referralSlug ? await referrerLabelForSlug(referralSlug) : null
  } catch {
    referredBy = null
  }
  return <GetStartedClient applicationFlow={applicationFlow} referralSlug={referralSlug} referredBy={referredBy} />
}
