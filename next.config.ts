import type { NextConfig } from "next";
import { LEGACY_STORE_PRODUCT_IDS } from "./src/lib/legacy-store-ids";
import { JOB_REDIRECTS } from "./src/lib/jobs/redirects";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vpxuzoqsnshvgtukvsqy.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'gddapefwrmucimpdhjrz.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  transpilePackages: ["lucide-react", "framer-motion"],
  async redirects() {
    return [
      {
        source: '/directory/city/:path*',
        destination: '/chiropractor/:path*',
        permanent: true,
      },
      { source: '/student/career-pipeline', destination: '/student/dashboard', permanent: false },
      { source: '/student/mentors', destination: '/student/doctors', permanent: false },
      {
        source: '/admin/directory',
        has: [{ type: 'query', key: 'search', value: '(?<search>.*)' }],
        destination: '/admin/members?q=:search',
        permanent: false,
      },
      { source: '/admin/directory', destination: '/admin/members', permanent: false },
      { source: '/admin/moderation', destination: '/admin/members?status=pending', permanent: false },
      { source: '/admin/doctors/onboarding', destination: '/admin/members?status=onboarding', permanent: false },
      { source: '/admin/users', destination: '/admin/members', permanent: false },
      { source: '/admin/stats/doctors', destination: '/admin/members', permanent: false },
      { source: '/admin/dashboard', destination: '/admin', permanent: false },
      { source: '/admin/contact-requests', destination: '/admin/leads?tab=requests', permanent: false },
      { source: '/admin/list', destination: '/admin/leads?tab=waitlist', permanent: false },
      { source: '/admin/referrals', destination: '/admin/leads?tab=introductions', permanent: false },
      { source: '/admin/stats/recommendations', destination: '/admin/leads?tab=introductions&view=stats', permanent: false },
      { source: '/admin/match', destination: '/admin/leads?tab=matching', permanent: false },
      { source: '/admin/invisible-doctors', destination: '/admin/coverage?tab=pins', permanent: false },
      { source: '/admin/search', destination: '/admin/members', permanent: false },
      { source: '/admin/broadcast', destination: '/admin/leads?tab=waitlist', permanent: false },
      { source: '/admin/approvals/seminars', destination: '/admin/seminars', permanent: false },
      ...JOB_REDIRECTS,
      ...LEGACY_STORE_PRODUCT_IDS.map((id) => ({
        source: `/store/${id}`,
        destination: '/store',
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
