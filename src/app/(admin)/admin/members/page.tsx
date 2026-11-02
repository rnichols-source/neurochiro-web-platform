import { redirect } from 'next/navigation'
import { checkAdminAuth } from '@/lib/admin-auth'
import { parseMemberSearchParams, type MemberDetail, type MemberSearchResult } from '@/lib/admin/member-search'
import { loadMemberDetail, memberLocationOptions, searchMembers, type MemberLocationOptions } from './actions'
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
  let result: MemberSearchResult = { rows: [], total: 0, billingOk: true, note: null }
  let locations: MemberLocationOptions = { countries: [], states: [] }
  let loadError = false
  try {
    ;[result, locations] = await Promise.all([
      searchMembers(query),
      memberLocationOptions().catch((err) => {
        console.error('admin member locations', err instanceof Error ? err.name : 'error')
        return locations
      }),
    ])
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
      key={`${query.role}|${query.status}|${query.tier}|${query.state}|${query.country}|${query.page}|${query.sort}|${query.near ?? ''}`}
      query={query}
      result={result}
      locations={locations}
      loadError={loadError}
      detail={detail}
      detailError={detailError}
      updatedAt={new Date().toISOString()}
    />
  )
}
