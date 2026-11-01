export type PostgrestError = { message: string; code?: string; details?: string } | null

export type LooseList = {
  data: Record<string, unknown>[] | null
  error: PostgrestError
  count: number | null
}

type LooseFilter = {
  select: (columns: string, options?: { count?: 'exact'; head?: boolean }) => LooseFilter
  order: (column: string, options?: { ascending?: boolean }) => LooseFilter
  limit: (count: number) => LooseFilter
  range: (from: number, to: number) => LooseFilter
  eq: (column: string, value: string) => LooseFilter
  gte: (column: string, value: string) => LooseFilter
  lt: (column: string, value: string) => LooseFilter
  in: (column: string, values: readonly string[]) => LooseFilter
  is: (column: string, value: null) => LooseFilter
  not: (column: string, operator: string, value: null) => LooseFilter
  maybeSingle: () => Promise<{ data: { value?: unknown } | null; error: PostgrestError }>
  then: Promise<LooseList>['then']
}

/** Query tables or columns the generated Database type does not list yet. */
export function looseFrom(client: unknown, table: string): LooseFilter {
  const from = (client as { from: (name: string) => LooseFilter }).from
  return from.call(client, table)
}
