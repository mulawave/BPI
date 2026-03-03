/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  staticPageGenerationTimeout: 120,
  experimental: {
    instrumentationHook: true,
    serverActions: {
      allowedOrigins: ["*"]
    },
    optimizePackageImports: ['@trpc/react-query', '@trpc/client', 'react-icons', 'framer-motion'],
  },
  // webpack config is silently ignored by Turbopack (--turbo flag) but used in normal dev/build
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
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  swcMinify: true,
  productionBrowserSourceMaps: false,
};
export default nextConfig;


