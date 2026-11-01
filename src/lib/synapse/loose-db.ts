/** Untyped tables (Synapse) without using `any`. Runtime is still the Supabase client. */

export interface PostgrestError {
  code?: string
  message?: string
  details?: string
  hint?: string
}

export interface QueryResult<T> {
  data: T
  error: PostgrestError | null
  count: number | null
}

export interface FilterBuilder<T> extends PromiseLike<QueryResult<T>> {
  select(columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }): FilterBuilder<T>
  insert(values: object | object[]): FilterBuilder<T>
  update(values: object): FilterBuilder<T>
  upsert(values: object | object[], options?: { onConflict?: string }): FilterBuilder<T>
  delete(): FilterBuilder<T>
  eq(column: string, value: unknown): FilterBuilder<T>
  neq(column: string, value: unknown): FilterBuilder<T>
  in(column: string, values: readonly unknown[]): FilterBuilder<T>
  is(column: string, value: unknown): FilterBuilder<T>
  not(column: string, operator: string, value: unknown): FilterBuilder<T>
  or(filters: string): FilterBuilder<T>
  gte(column: string, value: unknown): FilterBuilder<T>
  lte(column: string, value: unknown): FilterBuilder<T>
  gt(column: string, value: unknown): FilterBuilder<T>
  lt(column: string, value: unknown): FilterBuilder<T>
  ilike(column: string, pattern: string): FilterBuilder<T>
  contains(column: string, value: unknown): FilterBuilder<T>
  overlaps(column: string, value: unknown): FilterBuilder<T>
  order(column: string, options?: { ascending?: boolean }): FilterBuilder<T>
  limit(count: number): FilterBuilder<T>
  range(from: number, to: number): FilterBuilder<T>
  maybeSingle(): Promise<QueryResult<T>>
  single(): Promise<QueryResult<T>>
}

export interface LooseDb {
  from(table: string): FilterBuilder<unknown>
  rpc(fn: string, args?: object): Promise<QueryResult<unknown>>
}

export function asLooseDb(client: unknown): LooseDb {
  return client as LooseDb
}

export function asRows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : []
}

export function asRow<T>(data: unknown): T | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  return data as T
}
