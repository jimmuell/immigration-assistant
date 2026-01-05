import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  experimental: {
    // Suppress hydration warnings in development
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
