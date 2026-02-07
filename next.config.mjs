/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Set timeout for static generation
  staticPageGenerationTimeout: 120,
  experimental: {
    instrumentationHook: true,
    serverActions: {
      allowedOrigins: ["*"]
    },
    // Performance optimizations
    optimizePackageImports: ['@trpc/react-query', '@trpc/client', 'react-icons', 'framer-motion'],
    // Faster refresh
    turbotrace: {
      logLevel: 'error'
    },
  },
  // Faster webpack builds
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next', '**/backups', '**/logs', '**/test-results'],
      };
    }
    return config;
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
