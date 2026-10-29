import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH ?? '',
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],

  // Staff tool — keep the dev overlay/devtools indicator out of the UI.
  devIndicators: false,
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/dashboard/orders',
        permanent: true
      },
      {
        source: '/apps/users',
        destination: '/apps/users/list',
        permanent: true
      }
    ]
  }
}

export default nextConfig
