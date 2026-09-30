/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'paisareality.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
  async redirects() {
    // Duplicate scheme slugs point at their canonical record. See src/lib/scheme-redirects.json.
    const schemeAliases = Object.entries(require('./src/lib/scheme-redirects.json'))
      .filter(([from]) => !from.startsWith('_'))
      .map(([from, to]) => ({ source: `/schemes/${from}`, destination: `/schemes/${to}`, statusCode: 301 }))
    return [
      { source: '/blog', destination: '/newsletter', statusCode: 301 },
      { source: '/blog/:slug', destination: '/newsletter/:slug', statusCode: 301 },
      ...schemeAliases,
    ]
  },
}

module.exports = nextConfig