import type { NextConfig } from "next";
import { LEGACY_STORE_PRODUCT_IDS } from "./src/lib/legacy-store-ids";

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
      ...LEGACY_STORE_PRODUCT_IDS.map((id) => ({
        source: `/store/${id}`,
        destination: '/store',
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
