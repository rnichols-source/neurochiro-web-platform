import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { isApplicationFlowEnabled } from '@/lib/applications/flag'
import { loadApplicationGate } from '@/lib/applications/gate'
import GetStartedClient from './GetStartedClient'

export default async function GetStartedPage() {
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
          redirect(gate === 'finish' ? '/doctor/apply' : '/doctor/dashboard')
        }
      }
    }
  }
  return <GetStartedClient applicationFlow={applicationFlow} />
}
