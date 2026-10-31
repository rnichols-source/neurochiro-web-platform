import Link from 'next/link';
import PageHeader from '@/components/portal/PageHeader';
import { getVendors } from '@/app/(public)/marketplace/actions';

export default async function DoctorMarketplacePage() {
  const vendors = (await getVendors()) || [];
  const counts = new Map<string, number>();
  for (const vendor of vendors) {
    for (const category of vendor.categories || []) {
      counts.set(category, (counts.get(category) || 0) + 1);
    }
  }
  const categories = [...counts.entries()].filter(([, count]) => count > 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Marketplace" description="Vetted vendors with member deals." />
      {categories.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {categories.map(([category, count]) => (
            <li key={category} className="min-h-11 px-3 inline-flex items-center rounded-lg bg-white border border-portal-border text-sm">
              {category} · {count}
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {vendors.map((vendor: { id: string; name?: string; slug?: string; short_description?: string; categories?: string[] }) => (
          <li key={vendor.id} className="bg-white border border-portal-border rounded-xl p-4">
            <h2 className="font-bold">{vendor.name}</h2>
            <p className="text-sm text-portal-ink-2 mt-1">{vendor.short_description}</p>
            {vendor.slug ? (
              <Link href={`/marketplace/${vendor.slug}?from=portal`} className="mt-3 min-h-11 inline-flex items-center text-sm font-bold text-portal-accent">View vendor</Link>
            ) : null}
          </li>
        ))}
      </ul>
      {vendors.length === 0 ? <p className="text-sm text-portal-ink-2">No vendors are listed yet.</p> : null}
    </div>
  );
}
