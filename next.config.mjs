/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  staticPageGenerationTimeout: 120,
  // Prevent any CDN / reverse-proxy from caching authenticated API responses.
  // This is a defence-in-depth layer on top of the per-route Cache-Control
  // headers set in the tRPC route handler.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" },
          { key: "Pragma", value: "no-cache" },
          { key: "Surrogate-Control", value: "no-store" },
        ],
      },
      {
        source: "/dashboard",
        headers: [
          { key: "Cache-Control", value: "no-store, private" },
        ],
      },
    ];
  },
  experimental: {
    instrumentationHook: true,
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "beepagro.com",
        "www.beepagro.com",
      ]
    },
    optimizePackageImports: ['@trpc/react-query', '@trpc/client', 'react-icons', 'framer-motion'],
    // Limit parallel compilation workers to reduce memory usage on 8GB systems
    cpus: 2,
    workerThreads: false,
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
    // Reduce peak memory on low-RAM (8GB) machines: process fewer modules in parallel
    if (!dev) {
      config.parallelism = 1;
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


