import { MetadataRoute } from 'next';
import { createServerSupabase } from '@/lib/supabase-server';
import { REGIONS } from '@/lib/regions';
import { EMPTY_METROS, cityToSlug } from '@/lib/city-data';
import { getProducts } from '@/lib/shopify';
import { EUROPEAN_ISO, toDirectoryCountry } from '@/lib/directory-countries';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://www.neurochiro.co';

async function fetchPublishedDoctors(supabase: ReturnType<typeof createServerSupabase>) {
  const pageSize = 1000;
  const doctors: { slug: string; created_at: string | null }[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('doctors')
      .select('slug, created_at')
      .eq('verification_status', 'verified')
      .not('slug', 'is', null)
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('[sitemap] doctor query failed:', error.message);
      break;
    }
    if (!data?.length) break;

    for (const doctor of data) {
      if (doctor.slug) doctors.push({ slug: doctor.slug, created_at: doctor.created_at });
    }
    if (data.length < pageSize) break;
  }

  return doctors;
}

async function directoryRegionCounts(supabase: ReturnType<typeof createServerSupabase>) {
  const counts: Record<string, number> = {};
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('doctors')
      .select('country')
      .in('verification_status', ['verified', 'pending'])
      .range(from, from + pageSize - 1);

    if (error || !data?.length) break;
    for (const row of data) {
      const iso = String(row.country || 'US').toUpperCase();
      const code = toDirectoryCountry(iso);
      counts[code] = (counts[code] || 0) + 1;
      if (EUROPEAN_ISO.includes(iso)) counts.EU = (counts.EU || 0) + 1;
      counts.ALL = (counts.ALL || 0) + 1;
    }
    if (data.length < pageSize) break;
  }

  return counts;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerSupabase();
  const doctors = await fetchPublishedDoctors(supabase);

  const { data: seminars } = await supabase
    .from('seminars')
    .select('id, created_at')
    .eq('is_approved', true);

  const routes = [
    '',
    '/directory',
    '/seminars',
    '/marketplace',
    '/nervous-system',
    '/learn',
    '/pricing',
    '/about',
    '/contact',
    '/careers',
    '/login',
    '/register',
    '/store',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const regionCounts = await directoryRegionCounts(supabase);
  const regionalRoutes = Object.keys(REGIONS).filter((code) => (regionCounts[code.toUpperCase()] || 0) > 0).map((code) => ({
    url: `${BASE_URL}/directory/locations/${code.toLowerCase()}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  const doctorRoutes = (doctors || []).map((doctor) => ({
    url: `${BASE_URL}/directory/${doctor.slug}`,
    lastModified: doctor.created_at || new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const seminarRoutes = (seminars || []).map((seminar) => ({
    url: `${BASE_URL}/seminars/${seminar.id}`,
    lastModified: seminar.created_at || new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // City pages: every city with a doctor + empty metros
  const doctorCitySlugs = new Set<string>();
  const allDoctors = (await supabase
    .from('doctors')
    .select('city, state')
    .eq('verification_status', 'verified')).data || [];
  for (const d of allDoctors) {
    if (d.city && d.state && d.state.length === 2) {
      doctorCitySlugs.add(cityToSlug(d.city, d.state));
    }
  }
  // Add empty metros
  for (const m of EMPTY_METROS) {
    doctorCitySlugs.add(m.slug);
  }

  const cityRoutes = Array.from(doctorCitySlugs).map((slug) => ({
    url: `${BASE_URL}/chiropractor/${slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const catalog = await getProducts({ first: 100 });
    if (catalog.ok) {
      productRoutes = catalog.products.map((product) => ({
        url: `${BASE_URL}/store/${product.handle}`,
        lastModified: product.createdAt || new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch {
    console.error('[sitemap] shopify products skipped');
  }

  return [...routes, ...productRoutes, ...regionalRoutes, ...doctorRoutes, ...seminarRoutes, ...cityRoutes];
}
