import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-admin'

export async function SmsPromptBanner({ doctorId }: { doctorId: string }) {
  const admin = createAdminClient() as any
  const { data, error } = await admin
    .from('doctors')
    .select('sms_prompt_required')
    .eq('id', doctorId)
    .maybeSingle()
  if (error || data?.sms_prompt_required !== true) return null
  return (
    <div className="mx-4 mt-4 rounded-2xl border border-[#F0D3C2] bg-[#FCEBDF] px-4 py-3 lg:mx-8">
      <p className="text-[14px] font-bold text-[#15202B]">Add a mobile number so community member requests can reach you by text.</p>
      <Link href="/doctor/settings" className="mt-1 inline-flex min-h-11 items-center text-[14px] font-extrabold text-[#D66829]">
        Add your mobile
      </Link>
    </div>
  )
}
