import { ANONYMITY_FLOOR } from './config.ts'

export type CountBucket = { key: string; count: number }

/** Buckets under the floor are reported as "<10" and never include row identifiers. */
export function suppressSmallBuckets(rows: CountBucket[], floor = ANONYMITY_FLOOR): { key: string; count: number | null; label: string }[] {
  return rows.map((row) => {
    if (row.count < floor) return { key: row.key, count: null, label: `<${floor}` }
    return { key: row.key, count: row.count, label: String(row.count) }
  })
}
