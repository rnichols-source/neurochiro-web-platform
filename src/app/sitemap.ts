import { MetadataRoute } from 'next';
import { createServerSupabase } from '@/lib/supabase-server';

const BASE_URL = 'https://neurochiro.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerSupabase();

  // 1. Fetch all verified doctors for dynamic routes
  const { data: doctors } = await supabase
    .from('doctors')
    .select('slug, updated_at')
    .eq('verification_status', 'verified');

  // 2. Fetch all active seminars
  const { data: seminars } = await supabase
    .from('seminars')
    .select('id, updated_at')
    .eq('is_approved', true)
    .eq('is_past', false);

  // Static routes
  const routes = [
    '',
    '/directory',
    '/seminars',
    '/marketplace',
    '/programs/mastermind',
    '/nervous-system',
    '/learn',
    '/pricing',
    '/login',
    '/register',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic doctor routes
  const doctorRoutes = (doctors || []).map((doctor: { slug: string; updated_at: string | null }) => ({
    url: `${BASE_URL}/directory/${doctor.slug}`,
    lastModified: doctor.updated_at || new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Dynamic seminar routes
  const seminarRoutes = (seminars || []).map((seminar: { id: string; updated_at: string | null }) => ({
    url: `${BASE_URL}/seminars/${seminar.id}`,
    lastModified: seminar.updated_at || new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...routes, ...doctorRoutes, ...seminarRoutes];
}
