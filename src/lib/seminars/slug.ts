export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function seminarSlug(title: string, city?: string | null, year?: string | null): string {
  let slug = slugify(title || "seminar");
  const citySlug = slugify(city || "");
  if (citySlug && !slug.includes(citySlug)) slug = `${slug}-${citySlug}`;
  if (year && !slug.includes(year)) slug = `${slug}-${year}`;
  return slug || "seminar";
}

export function dedupeSlugs<T extends { slug: string }>(rows: T[]): T[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const count = seen.get(row.slug) || 0;
    seen.set(row.slug, count + 1);
    if (count === 0) return row;
    return { ...row, slug: `${row.slug}-${count + 1}` };
  });
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
