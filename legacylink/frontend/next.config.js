const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['three'],
  },
  images: {
    unoptimized: true,
    domains: ['localhost', 'api.dicebear.com', 'ui-avatars.com'],
  },
};

module.exports = nextConfig;
