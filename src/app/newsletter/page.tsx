import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import { getAllPostsAsync } from '@/lib/blog';
import { formatDate } from '@/lib/constants';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Newsletter: Money Tips, Rate Updates, Tax Saving',
  description:
    'Read the Paisa Reality newsletter for gold and fuel price updates, government schemes, tax saving tips, and simple personal finance guides for India.',
  path: '/newsletter',
  keywords: ['paisa reality newsletter', 'personal finance newsletter india', 'money tips', 'tax saving tips'],
});

export const revalidate = 300;

export default async function NewsletterPage(): Promise<React.ReactElement> {
  const posts = await getAllPostsAsync(true).catch(() => []);

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Paisa Reality Newsletter',
    url: 'https://paisareality.com/newsletter',
    description: 'Money tips, price updates, and financial guides for every Indian.',
    blogPost: posts.slice(0, 20).map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `https://paisareality.com/newsletter/${post.slug}`,
      datePublished: post.date,
    })),
  };

  return (
    <div className="container-main section-spacing">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />
      <Breadcrumb items={[{ label: 'Newsletter' }]} />
      <h1 className="heading-1 mb-2">Paisa Reality Newsletter</h1>
      <p className="text-body mb-8">Money tips, price updates, and financial guides for every Indian.</p>

      {posts.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-xl text-gray-500 mb-2">Newsletter posts coming soon.</p>
          <p className="text-gray-400">
            We are working on helpful financial articles. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/newsletter/${post.slug}`}
              className="card hover:shadow-lg transition-shadow group"
            >
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
                {post.category}
              </span>
              <h2 className="text-lg font-semibold group-hover:text-primary transition-colors mb-2">
                {post.title}
              </h2>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{post.description}</p>
              <p className="text-xs text-gray-400">
                {formatDate(post.date)} - {post.readTime}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
