import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/dashboard/', '/login', '/signup'],
      },
    ],
    sitemap: 'https://paisareality.com/sitemap.xml',
    host: 'https://paisareality.com',
  };
}
