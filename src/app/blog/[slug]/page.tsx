import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';
import Breadcrumb from '@/components/Breadcrumb';
import ShareButton from '@/components/ShareButton';
import { getAllPostsAsync, getPostBySlugAsync } from '@/lib/blog';
import { formatDate } from '@/lib/constants';
import { marked } from 'marked';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const posts = await getAllPostsAsync(true).catch(() => []);
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlugAsync(slug).catch(() => null);

  if (!post) {
    return { title: 'Post Not Found' };
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.description,
    openGraph: {
      type: 'article',
      publishedTime: post.date,
      title: post.title,
      description: post.description,
    },
    alternates: { canonical: `https://paisareality.com/blog/${post.slug}` },
  };
}

function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  });
}

export default async function BlogPostPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const post = await getPostBySlugAsync(slug).catch(() => null);

  if (!post) {
    notFound();
  }

  const rawHtml = await marked.parse(post.content, { breaks: true, gfm: true });
  const htmlContent = sanitizeBlogHtml(rawHtml);
  const related = (await getAllPostsAsync(true).catch(() => []))
    .filter((relatedPost) => relatedPost.slug !== post.slug)
    .slice(0, 4);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: { '@type': 'Organization', name: post.author },
    datePublished: post.date,
    dateModified: post.updatedAt,
    publisher: {
      '@type': 'Organization',
      name: 'Paisa Reality',
      url: 'https://paisareality.com',
    },
  };

  return (
    <div className="container-main section-spacing">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Breadcrumb items={[{ label: 'Blog', href: '/blog' }, { label: post.title }]} />
      <article className="max-w-3xl mx-auto">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">
          {post.category}
        </span>
        <h1 className="heading-1 mb-4">{post.title}</h1>
        <p className="text-sm text-gray-500 mb-8">
          {formatDate(post.date)} - {post.readTime} - By {post.author}
        </p>
        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
        <div className="mt-8 pt-6 border-t">
          <ShareButton url={`/blog/${post.slug}`} title={post.title} />
        </div>
      </article>

      {related.length > 0 && (
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="heading-3 mb-6">More Articles</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((relatedPost) => (
              <a key={relatedPost.slug} href={`/blog/${relatedPost.slug}`} className="card hover:shadow-md">
                <h3 className="font-medium text-primary">{relatedPost.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(relatedPost.date)} - {relatedPost.readTime}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
