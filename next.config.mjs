/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["*"]
    },
    // Performance optimizations
    optimizePackageImports: ['@trpc/react-query', '@trpc/client', 'react-icons', 'framer-motion'],
  },
  // Compile only necessary pages in dev
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Reduce bundle size
  swcMinify: true,
  // Faster builds
  productionBrowserSourceMaps: false,
};
export default nextConfig;
