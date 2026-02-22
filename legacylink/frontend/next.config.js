/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['three'],
  },
  images: {
    domains: ['localhost', 'api.dicebear.com', 'ui-avatars.com'],
  },
};

module.exports = nextConfig;
