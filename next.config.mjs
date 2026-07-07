/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // TradingView + news source images are loaded from remote hosts.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.tradingview.com' },
      { protocol: 'https', hostname: 'assets.coingecko.com' },
      { protocol: 'https', hostname: 'resources.cryptocompare.com' },
      { protocol: 'https', hostname: '**' }
    ]
  },
  async headers() {
    return [
      {
        // Allow the dashboard to be embedded in OBS Browser Source without frame issues.
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' }
        ]
      }
    ];
  }
};

export default nextConfig;
