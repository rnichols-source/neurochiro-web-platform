'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { headers } from 'next/headers'

export async function trackProfileAction(
  doctorId: string,
  destination: 'booking' | 'website' | 'phone' | 'email',
  replyLogId?: string
) {
  const admin = createAdminClient()
  const headersList = await headers()

  await (admin as any).from('link_clicks').insert({
    reply_log_id: replyLogId || null,
    doctor_id: doctorId,
    destination,
    user_agent: headersList.get('user-agent') || null,
    referrer: headersList.get('referer') || null,
  })
}
