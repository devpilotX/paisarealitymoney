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

  const url = `https://paisareality.com/newsletter/${post.slug}`;
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updatedAt,
      title: post.title,
      description: post.description,
      url,
      siteName: 'Paisa Reality',
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

function sanitizePostHtml(html: string): string {
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

export default async function NewsletterPostPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const post = await getPostBySlugAsync(slug).catch(() => null);

  if (!post) {
    notFound();
  }

  const rawHtml = await marked.parse(post.content, { breaks: true, gfm: true });
  const htmlContent = sanitizePostHtml(rawHtml);
  const related = (await getAllPostsAsync(true).catch(() => []))
    .filter((relatedPost) => relatedPost.slug !== post.slug)
    .slice(0, 4);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    ...(post.coverImage ? { image: [post.coverImage] } : {}),
    author: { '@type': 'Organization', name: 'Paisa Reality', url: 'https://paisareality.com' },
    datePublished: post.date,
    dateModified: post.updatedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://paisareality.com/newsletter/${post.slug}` },
    publisher: {
      '@type': 'Organization',
      name: 'Paisa Reality',
      url: 'https://paisareality.com',
      logo: { '@type': 'ImageObject', url: 'https://paisareality.com/paisa_reality_logo.png' },
    },
  };

  return (
    <div className="container-main section-spacing">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Breadcrumb items={[{ label: 'Newsletter', href: '/newsletter' }, { label: post.title }]} />
      <article className="max-w-3xl mx-auto">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">
          {post.category}
        </span>
        <h1 className="heading-1 mb-4">{post.title}</h1>
        <p className="text-sm text-muted-2 mb-8">
          {formatDate(post.date)} - {post.readTime} - By {post.author}
        </p>
        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt={post.title} className="w-full h-auto rounded-[6px] border border-line mb-8" />
        )}
        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
        <div className="mt-8 pt-6 border-t">
          <ShareButton url={`/newsletter/${post.slug}`} title={post.title} />
        </div>
      </article>

      {related.length > 0 && (
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="heading-3 mb-6">More Articles</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((relatedPost) => (
              <a key={relatedPost.slug} href={`/newsletter/${relatedPost.slug}`} className="card hover:shadow-md">
                <h3 className="font-medium text-primary">{relatedPost.title}</h3>
                <p className="text-sm text-muted-2 mt-1">
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
