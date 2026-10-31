import Link from 'next/link';
import PageHeader from '@/components/portal/PageHeader';
import { getVendors } from '@/app/(public)/marketplace/actions';
import { categoryCounts, filterVendors } from '@/lib/portal/marketplace';

type VendorCard = {
  id: string;
  name?: string;
  slug?: string;
  short_description?: string;
  categories?: string[] | null;
};

export default async function DoctorMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const vendors = ((await getVendors()) || []) as VendorCard[];
  const selected = (params.category || '').trim();
  const counts = categoryCounts(vendors);
  const shown = filterVendors(vendors, selected);

  return (
    <div className="space-y-6">
      <PageHeader title="Marketplace" description="Vetted vendors with member deals." />
      <ul className="flex flex-wrap gap-2" data-marketplace-chips>
        <li>
          <Link
            href="/doctor/marketplace"
            aria-current={selected ? undefined : 'page'}
            className={`min-h-11 px-3 inline-flex items-center rounded-lg border text-sm font-bold ${selected ? 'bg-white border-portal-border text-portal-ink' : 'bg-portal-ink text-white border-portal-ink'}`}
          >
            All · {vendors.length}
          </Link>
        </li>
        {counts.map(([category, count]) => {
          const current = selected === category;
          return (
            <li key={category}>
              <Link
                href={`/doctor/marketplace?category=${encodeURIComponent(category)}`}
                aria-current={current ? 'page' : undefined}
                className={`min-h-11 px-3 inline-flex items-center rounded-lg border text-sm font-bold ${current ? 'bg-portal-ink text-white border-portal-ink' : 'bg-white border-portal-border text-portal-ink'}`}
              >
                {category} · {count}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-portal-muted">Some vendors are in more than one category.</p>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3" data-marketplace-cards>
        {shown.map((vendor) => (
          <li key={vendor.id} className="bg-white border border-portal-border rounded-xl p-4">
            <h2 className="font-bold text-portal-ink">{vendor.name}</h2>
            <p className="text-sm text-portal-ink-2 mt-1">{vendor.short_description}</p>
            {vendor.slug ? (
              <Link href={`/marketplace/${vendor.slug}?from=portal`} className="mt-3 min-h-11 inline-flex items-center text-sm font-bold text-portal-accent">View vendor</Link>
            ) : null}
          </li>
        ))}
      </ul>
      {shown.length === 0 ? <p className="text-sm text-portal-ink-2">No vendors are listed yet.</p> : null}
    </div>
  );
}
