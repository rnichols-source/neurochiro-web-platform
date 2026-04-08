import { MetadataRoute } from 'next';
import { createServerSupabase } from '@/lib/supabase-server';
import { REGIONS } from '@/lib/regions';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://neurochiro.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerSupabase();

  const { data: doctors } = await supabase
    .from('doctors')
    .select('slug, updated_at')
    .eq('verification_status', 'verified');

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
    '/nervous-system',
    '/login',
    '/register',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const regionalRoutes = Object.keys(REGIONS).map((code) => ({
    url: `${BASE_URL}/directory/locations/${code.toLowerCase()}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  const doctorRoutes = (doctors || []).map((doctor) => ({
    url: `${BASE_URL}/directory/${doctor.slug}`,
    lastModified: doctor.updated_at || new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const seminarRoutes = (seminars || []).map((seminar) => ({
    url: `${BASE_URL}/seminars/${seminar.id}`,
    lastModified: seminar.created_at || new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...routes, ...regionalRoutes, ...doctorRoutes, ...seminarRoutes];
}
