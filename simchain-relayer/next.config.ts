import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['simchain-k5v5.vercel.app', 'simchain.app'],
    unoptimized: true,
  },
};

export default nextConfig;
