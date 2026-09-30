import type { MetadataRoute } from 'next';

const PRIVATE_PATHS = ['/admin/', '/api/', '/dashboard/', '/login', '/signup'];

/**
 * Answer engines and AI search crawlers, named explicitly so the intent is
 * unambiguous: they may read every public page, same as search engines.
 * A crawler that matches a named group ignores the '*' group, so each group
 * repeats the private paths.
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
  'CCBot',
  'meta-externalagent',
  'DuckAssistBot',
  'cohere-ai',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: ['/', '/llms.txt', '/llms-full.txt'], disallow: PRIVATE_PATHS },
    ],
    sitemap: 'https://paisareality.com/sitemap.xml',
    host: 'https://paisareality.com',
  };
}
