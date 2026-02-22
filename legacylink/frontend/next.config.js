const nextConfig = {
  output: 'export',
  basePath: '/Legacy-Link',
  assetPrefix: '/Legacy-Link',
  experimental: {
    serverComponentsExternalPackages: ['three'],
  },
  images: {
    unoptimized: true,
    domains: ['localhost', 'api.dicebear.com', 'ui-avatars.com'],
  },
};

module.exports = nextConfig;
