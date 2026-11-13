import { redirect } from 'next/navigation'
import PageHeader from '@/components/portal/PageHeader'
import EmptyState from '@/components/portal/EmptyState'
import { Bell } from 'lucide-react'
import { markVisitSeen } from '@/lib/community/actions'
import { loadDoctorVisitRequests } from '@/lib/community/data'
import { getPortalContext } from '@/lib/portal/context'

export const dynamic = 'force-dynamic'

export default async function DoctorVisitRequestsPage() {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  if (ctx.role === 'patient') redirect('/portal')
  if (!ctx.doctor?.id) {
    return (
      <div>
        <PageHeader title="Visit requests" description="Requests from community members show up here." />
        <EmptyState icon={Bell} title="No office on this login" sentence="A doctor profile is required before visit requests can land here." />
      </div>
    )
  }

  const { ready, requests } = await loadDoctorVisitRequests(ctx.doctor.id)
  return (
    <div>
      <PageHeader
        title="Visit requests"
        description="A community member only sends what they chose to share. Email and text alerts from the public directory are not sent for these."
      />
      {!ready ? <p className="text-sm text-portal-ink-2">The visit request table is not on this database yet.</p> : null}
      {ready && requests.length === 0 ? (
        <EmptyState icon={Bell} title="No visit requests" sentence="When a community member asks to see you, it shows up here and in notifications." />
      ) : null}
      <ul className="space-y-3">
        {requests.map((request) => (
          <li key={request.id} className="rounded-2xl border border-portal-border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-portal-ink">
                  {request.sharedFirstName || 'A community member'}
                  {request.forFirstName ? ` · for ${request.forFirstName}` : ''}
                </p>
                <p className="mt-1 text-xs text-portal-ink-2">
                  {new Date(request.createdAt).toLocaleString()} · {request.status}
                  {request.preferredWindow ? ` · ${request.preferredWindow}` : ''}
                </p>
              </div>
              {request.status === 'requested' ? (
                <form action={markVisitSeen}>
                  <input type="hidden" name="id" value={request.id} />
                  <button type="submit" className="min-h-11 rounded-lg border border-portal-border px-3 text-sm font-bold text-portal-ink">Mark seen</button>
                </form>
              ) : null}
            </div>
            {request.note ? <p className="mt-3 text-sm text-portal-ink">{request.note}</p> : null}
            {request.sharedFamilyNames ? <p className="mt-2 text-sm text-portal-ink-2">Household first names: {request.sharedFamilyNames}</p> : null}
            {request.sharedEmail ? <p className="mt-2 text-sm text-portal-ink-2">Email: {request.sharedEmail}</p> : null}
            {request.callbackPhone ? <p className="mt-2 text-sm text-portal-ink-2">Phone: {request.callbackPhone}</p> : null}
            {!request.sharedEmail && !request.callbackPhone ? <p className="mt-2 text-sm text-portal-ink-2">No email or phone was shared.</p> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
