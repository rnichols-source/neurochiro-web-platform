export type MarketplaceVendor = {
  id: string;
  categories?: string[] | null;
};

/** How many vendors carry each category. A vendor in three categories counts once on each chip. */
export function categoryCounts(vendors: MarketplaceVendor[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const vendor of vendors) {
    const seen = new Set<string>();
    for (const category of vendor.categories || []) {
      const name = (category || '').trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      counts.set(name, (counts.get(name) || 0) + 1);
    }
  }
  return [...counts.entries()].filter(([, count]) => count > 0).sort((a, b) => a[0].localeCompare(b[0]));
}

/** All (or a blank category) returns every vendor. Otherwise only vendors that list that category. */
export function filterVendors<T extends MarketplaceVendor>(vendors: T[], category: string | null | undefined): T[] {
  const name = (category || '').trim();
  if (!name || name.toLowerCase() === 'all') return vendors;
  return vendors.filter((vendor) => (vendor.categories || []).some((item) => (item || '').trim() === name));
}
