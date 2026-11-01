import { redirect } from 'next/navigation'
import { checkAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/** Temporary stand-in so Coverage can link here before the Members page lands. */
export default async function MembersRedirect({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  try {
    await checkAdminAuth()
  } catch {
    redirect('/login?next=/admin')
  }
  const params = await searchParams
  const q = params.q?.trim()
  redirect(q ? `/admin/directory?search=${encodeURIComponent(q)}` : '/admin/directory')
}
