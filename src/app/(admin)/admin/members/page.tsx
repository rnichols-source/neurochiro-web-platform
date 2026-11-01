import { redirect } from 'next/navigation'
import { checkAdminAuth } from '@/lib/admin-auth'
import { parseMemberSearchParams, type MemberDetail, type MemberSearchResult } from '@/lib/admin/member-search'
import { loadMemberDetail, searchMembers } from './actions'
import { MembersClient } from './members-client'

export const dynamic = 'force-dynamic'

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  try {
    await checkAdminAuth()
  } catch {
    redirect('/login?next=/admin')
  }

  const query = parseMemberSearchParams(await searchParams)
  let result: MemberSearchResult = { rows: [], total: 0 }
  let loadError = false
  try {
    result = await searchMembers(query)
  } catch (err) {
    console.error('admin members', err instanceof Error ? err.name : 'error')
    loadError = true
  }

  let detail: MemberDetail | null = null
  let detailError = false
  if (query.member) {
    try {
      detail = await loadMemberDetail(query.member)
    } catch (err) {
      console.error('admin member detail', err instanceof Error ? err.name : 'error')
      detailError = true
    }
  }

  return (
    <MembersClient
      key={`${query.q}|${query.role}|${query.status}|${query.tier}|${query.state}|${query.country}|${query.page}|${query.sort}`}
      query={query}
      result={result}
      loadError={loadError}
      detail={detail}
      detailError={detailError}
    />
  )
}
