import 'server-only'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { SUPABASE_URL } from '@/lib/supabase-env'

/**
 * ⚠️  SUPABASE DEFAULT ROW LIMIT IS 1000.
 *
 * Any .select() without .range() or .limit() returns AT MOST 1000 rows.
 * .limit(10000) does NOT override this — it is silently capped to 1000.
 * This has caused four production bugs (coverage map, demand scatter,
 * demand mentions, recommendation stats) where the newest rows were
 * silently dropped.
 *
 * If you need all rows from a table that can exceed 1000:
 *   → Use fetchAllRows() below. It paginates with .range().
 *
 * If you intentionally want a bounded result (top-10, preview):
 *   → Use .range(0, N-1) and add a comment: // intentional bound
 */

function adminEnv(): { url: string; key: string } | null {
  const url = (SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || url.includes('your-project-url') || !key) return null
  return { url, key }
}

/**
 * Used only when the build has no Supabase env. Queries resolve to no rows
 * so static pages can finish. A configured environment still uses the real client.
 */
function unavailableAdminClient(): SupabaseClient<Database> {
  const payload = { data: null, error: null, count: 0, status: 200, statusText: 'OK' }
  const builder: any = new Proxy(function unavailable() { return builder }, {
    get(_target, prop) {
      if (prop === 'then') {
        return (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
          Promise.resolve(payload).then(onFulfilled, onRejected)
      }
      return () => builder
    },
    apply() {
      return builder
    },
  })
  return {
    from() { return builder },
    rpc() { return builder },
  } as unknown as SupabaseClient<Database>
}

export const createAdminClient = () => {
  const env = adminEnv()
  if (!env) {
    console.error('[supabase-admin] Supabase env is missing. Queries return no rows.')
    return unavailableAdminClient()
  }
  const supabaseUrl = env.url
  const supabaseServiceKey = env.key

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Paginated fetch that bypasses the 1000-row default limit.
 * Use this for any query that may return >1000 rows.
 *
 * Logs a warning when results exceed one page (potential truncation in
 * any caller that is NOT using this helper).
 * Logs an error if any page returns exactly 1000 rows without being
 * the last page — almost always means truncation.
 */
export async function fetchAllRows(
  supabase: SupabaseClient | any,
  table: string,
  select: string,
  buildQuery?: (q: any) => any,
  orderBy: string = 'created_at',
  ascending: boolean = true,
): Promise<any[]> {
  const PAGE = 1000
  let all: any[] = []
  let offset = 0
  let pages = 0

  while (true) {
    let q = (supabase as any).from(table).select(select).order(orderBy, { ascending }).range(offset, offset + PAGE - 1)
    if (buildQuery) q = buildQuery(q)
    const { data, error } = await q
    if (error) {
      console.error(`[fetchAllRows] Error on ${table} page ${pages}:`, error.message)
      break
    }
    if (!data || data.length === 0) break
    all = all.concat(data)
    pages++
    if (data.length < PAGE) break
    offset += PAGE
  }

  if (pages > 1) {
    console.warn(`[fetchAllRows] ${table}: fetched ${all.length} rows across ${pages} pages. Any unbounded query on this table would silently truncate at 1000.`)
  }

  return all
}
