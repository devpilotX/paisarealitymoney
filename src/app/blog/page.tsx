import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { formatDate } from '@/lib/constants';
import Breadcrumb from '@/components/Breadcrumb';
import AdBanner from '@/components/AdBanner';

export const metadata: Metadata = {
  title: 'Blog - Money Tips, Gold Rate Updates, Tax Saving',
  description: 'Articles about gold prices, government schemes, tax saving tips, and personal finance in India.',
  alternates: { canonical: 'https://paisareality.com/blog' },
};

export default function BlogPage(): React.ReactElement {
  const posts = getAllPosts();
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Blog' }]} />
      <h1 className="heading-1 mb-3">Paisa Reality Blog</h1>
      <p className="text-body mb-8">Money tips, price updates, and financial guides for every Indian.</p>
      <AdBanner format="horizontal" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="card no-underline group">
            <span className="text-xs font-medium text-primary bg-primary-50 px-2 py-1 rounded">{post.category}</span>
            <h2 className="text-lg font-semibold text-gray-900 mt-3 mb-2 group-hover:text-primary transition-colors">{post.title}</h2>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.description}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{formatDate(post.date)}</span><span>{post.readTime}</span>
            </div>
          </Link>
        ))}
      </div>
      {posts.length === 0 && <p className="text-center py-12 text-gray-500">Blog posts coming soon.</p>}
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}