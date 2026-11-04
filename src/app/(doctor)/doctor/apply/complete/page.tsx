import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import { isApplicationFlowEnabled } from '@/lib/applications/flag'
import { fulfillDoctorApplicationSetup } from '@/lib/applications/fulfill'

export const dynamic = 'force-dynamic'

export default async function ApplyCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  if (!isApplicationFlowEnabled()) redirect('/doctor/dashboard')
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/doctor/apply')

  const params = await searchParams
  const saved = params.session_id
    ? await fulfillDoctorApplicationSetup({ id: params.session_id }, user.id).catch(() => false)
    : false

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold text-neuro-navy">
        {saved ? 'Application under review' : 'We could not confirm the card'}
      </h1>
      <p className="mt-3 text-sm text-neuro-navy/80">
        {saved
          ? 'Your card is saved and you have not been charged. Raymond will review the application. Your listing stays off the directory until he approves it.'
          : 'Go back and save the card again. If Stripe already showed a success page, refresh this page in a minute.'}
      </p>
      <Link href={saved ? '/doctor/dashboard' : '/doctor/apply'} className="mt-6 inline-flex min-h-11 items-center font-bold text-neuro-orange">
        {saved ? 'Back to the portal' : 'Return to the application'}
      </Link>
    </div>
  )
}
