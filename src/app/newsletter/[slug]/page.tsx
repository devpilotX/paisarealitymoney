import type { Metadata } from 'next';
import { brandMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';
import Breadcrumb from '@/components/Breadcrumb';
import ShareButton from '@/components/ShareButton';
import AdSlot from '@/components/AdSlot';
import ArticleCard from '@/components/ArticleCard';
import { articleImage, articleImageUrl, CATEGORY_LABELS } from '@/lib/article-image';
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

async function buildMetadata({ params }: PageProps): Promise<Metadata> {
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
      locale: 'en_IN',
      ...(post.tags.length ? { tags: post.tags } : {}),
      images: [{ url: articleImageUrl(post), width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.description,
      images: [articleImageUrl(post)],
    },
    ...(post.tags.length ? { keywords: post.tags } : {}),
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
  // Show "Updated" only for a real edit, not the seconds between insert and publish.
  const updated = Date.parse(post.updatedAt) - Date.parse(post.date) > 6 * 3600 * 1000;
  const related = (await getAllPostsAsync(true).catch(() => []))
    .filter((relatedPost) => relatedPost.slug !== post.slug)
    .slice(0, 4);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: [articleImageUrl(post)],
    inLanguage: 'en-IN',
    isAccessibleForFree: true,
    articleSection: post.category,
    ...(post.tags.length ? { keywords: post.tags.join(', ') } : {}),
    ...(post.sources.length ? { citation: post.sources.map((s) => ({ '@type': 'CreativeWork', name: s.title, url: s.url })) } : {}),
    author: { '@type': 'Organization', name: 'Paisa Reality', url: 'https://paisareality.com/about' },
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
          {CATEGORY_LABELS[post.category] ?? post.category}
        </span>
        <h1 className="heading-1 mb-4">{post.title}</h1>
        <p className="text-sm text-muted-2 mb-8">
          {formatDate(post.date)} - {post.readTime} - By {post.author}
          {updated && <> - Updated {formatDate(post.updatedAt)}</>}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={articleImage(post)}
          alt={post.coverImage ? post.title : ''}
          width={1200}
          height={630}
          fetchPriority="high"
          className="w-full h-auto aspect-[1200/630] object-cover rounded-[6px] border border-line mb-8 bg-[#0c4a47]"
        />
        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
        {post.sources.length > 0 && (
          <section className="mt-10 pt-6 border-t" aria-labelledby="sources-heading">
            <h2 id="sources-heading" className="heading-3 mb-3">Sources</h2>
            <ol className="list-decimal pl-6 space-y-1 text-sm text-body">
              {post.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-internal break-words">{s.title}</a>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[13px] text-muted-2">
              Figures and rules were checked against these sources on {formatDate(post.date)}. This article explains how
              things work and is not personal financial advice. See our <a href="/editorial-policy" className="link-internal">editorial policy</a>.
            </p>
          </section>
        )}
        <AdSlot placement="article-inline" format="horizontal" className="mt-8" />
        <div className="mt-8 pt-6 border-t">
          <ShareButton url={`/newsletter/${post.slug}`} title={post.title} />
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-14" aria-labelledby="more-heading">
          <h2 id="more-heading" className="heading-3 mb-6">More articles</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.slice(0, 3).map((relatedPost) => (
              <ArticleCard key={relatedPost.slug} post={relatedPost} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Adds " | Paisa Reality" to the title when it still fits 60 chars. */
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  return brandMetadata(await buildMetadata(props));
}
