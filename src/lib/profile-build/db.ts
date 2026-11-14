import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'

export type DbError = { code?: string; message?: string; details?: string } | null

export type DbResult<T> = {
  data: T
  error: DbError
  count?: number | null
}

export interface Query {
  select: (columns: string, options?: { count?: 'exact'; head?: boolean }) => Query
  insert: (values: Record<string, unknown>) => Query
  update: (values: Record<string, unknown>) => Query
  eq: (column: string, value: unknown) => Query
  in: (column: string, values: readonly unknown[]) => Query
  lt: (column: string, value: unknown) => Query
  or: (filters: string) => Query
  order: (column: string, options?: { ascending?: boolean }) => Query
  limit: (count: number) => Query
  maybeSingle: () => Promise<DbResult<Record<string, unknown> | null>>
  then: <TResult1 = DbResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) => Promise<TResult1 | TResult2>
}

export function profileDb(): { from: (table: string) => Query } {
  return createAdminClient() as unknown as { from: (table: string) => Query }
}
