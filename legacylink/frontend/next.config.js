const nextConfig = {
  output: process.env.GITHUB_ACTIONS ? 'export' : 'standalone',
  // When using static export, images cannot be optimized by Next.js server
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['three'],
  },
};

module.exports = nextConfig;
