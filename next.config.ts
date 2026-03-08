import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {},
  experimental: {
  },
  webpack: (config) => {
    // This is for some specialized PDF loading if needed
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
