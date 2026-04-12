import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import { formatDate } from '@/lib/constants';
import Breadcrumb from '@/components/Breadcrumb';
import ShareButton from '@/components/ShareButton';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';

interface PageProps { params: { slug: string }; }

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: 'Post Not Found' };
  return { title: post.title, description: post.description, openGraph: { type: 'article', publishedTime: post.date } };
}

function mdToHtml(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h3 class="heading-3 mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="heading-2 mt-8 mb-4">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-body mb-4">');
}

export default function BlogPostPage({ params }: PageProps): React.ReactElement {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();
  const related = getAllPosts().filter((p) => p.slug !== post.slug).slice(0, 4);

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Blog', href: '/blog' }, { label: post.title }]} />
      <article className="max-w-3xl">
        <span className="text-xs font-medium text-primary bg-primary-50 px-2 py-1 rounded">{post.category}</span>
        <h1 className="heading-1 mt-3 mb-3">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-6">
          <span>{formatDate(post.date)}</span><span>{post.readTime}</span><span>By {post.author}</span>
        </div>
        <AdBanner format="horizontal" />
        <div className="prose max-w-none my-8 text-body" dangerouslySetInnerHTML={{ __html: `<p class="text-body mb-4">${mdToHtml(post.content)}</p>` }} />
        <InArticleAd />
        <ShareButton url={`/blog/${post.slug}`} title={post.title} />
      </article>
      {related.length > 0 && (
        <div className="my-8"><h2 className="heading-2 mb-4">More Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {related.map((rp) => (
              <a key={rp.slug} href={`/blog/${rp.slug}`} className="card no-underline group">
                <h3 className="text-base font-semibold group-hover:text-primary transition-colors">{rp.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{formatDate(rp.date)}</p>
              </a>
            ))}
          </div>
        </div>
      )}
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}