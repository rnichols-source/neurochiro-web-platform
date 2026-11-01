import { redirect } from 'next/navigation'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getThresholds } from '@/lib/thresholds'
import { getOutreachLinks, getReplyTemplates } from '../actions'
import ReplyStation from '../ReplyStation'

export const dynamic = 'force-dynamic'

export default async function ReplyPage() {
  try {
    await checkAdminAuth()
  } catch {
    redirect('/login?next=/admin')
  }

  const [templates, outreachLinks, thresholds] = await Promise.all([
    getReplyTemplates(),
    getOutreachLinks(),
    getThresholds(),
  ])

  return (
    <div>
      <header className="bg-neuro-cream px-4 py-4 text-neuro-navy">
        <h1 className="font-heading text-2xl font-bold">Reply station</h1>
        <p className="mt-1 text-sm text-neuro-navy/70">Look up a city, copy a reply, and log it.</p>
      </header>
      <ReplyStation
        templates={templates}
        outreachLinks={outreachLinks}
        lookupMax={thresholds.lookup_max}
      />
    </div>
  )
}
