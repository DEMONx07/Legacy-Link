const nextConfig = {
  output: process.env.GITHUB_ACTIONS ? 'export' : 'standalone',
  basePath: process.env.GITHUB_ACTIONS ? '/Legacy-Link' : '',
  assetPrefix: process.env.GITHUB_ACTIONS ? '/Legacy-Link' : '',
  // When using static export, images cannot be optimized by Next.js server
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['three'],
  },
};

module.exports = nextConfig;
