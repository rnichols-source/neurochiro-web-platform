/**
 * Hide demo listings from public queries.
 * `is_demo` is not a column on doctors, so the guard is the slug.
 */
export function excludeDemo<T extends { not: (column: string, operator: string, value: string) => T }>(query: T): T {
  return query.not("slug", "ilike", "%-demo%");
}

export function isDemoSlug(slug: string | null | undefined): boolean {
  return !!slug && slug.toLowerCase().includes("-demo");
}
