import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import ArticleCard from '@/components/ArticleCard';
import { getAllPostsAsync } from '@/lib/blog';
import { pageMetadata } from '@/lib/seo';
import { articleImageUrl } from '@/lib/article-image';

const BASE_META: Metadata = pageMetadata({
  title: 'Newsletter: Money Tips, Rate Updates, Tax Saving',
  description:
    'Read the Paisa Reality newsletter for gold and fuel price updates, government schemes, tax saving tips, and simple personal finance guides for India.',
  path: '/newsletter',
  keywords: ['paisa reality newsletter', 'personal finance newsletter india', 'money tips', 'tax saving tips'],
});

/** Kept out of search while there is nothing to read; it indexes itself once a post is published. */
export async function generateMetadata(): Promise<Metadata> {
  const posts = await getAllPostsAsync(true).catch(() => []);
  return posts.length > 0 ? BASE_META : { ...BASE_META, robots: { index: false, follow: true } };
}

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
      image: articleImageUrl(post),
      datePublished: post.date,
    })),
  };

  return (
    <div className="container-main section-spacing">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />
      <Breadcrumb items={[{ label: 'Newsletter' }]} />
      <h1 className="heading-1 mb-2">Paisa Reality Newsletter</h1>
      <p className="text-body mb-4 max-w-3xl">
        One money story for Indian households every morning, plus a price round-up every Sunday. Each daily article
        covers a change that affects your tax, loans, deposits, savings schemes, fuel or gold: who decided it, from
        when it applies, who it affects, and what you can do about it.
      </p>
      <details className="mb-10 max-w-3xl rounded-lg border border-line bg-paper-2 p-4 text-[15px] text-body">
        <summary className="cursor-pointer font-medium">How these articles are checked</summary>
        <ul className="mt-3 list-disc pl-5 space-y-1.5">
          <li>Every number, date and rule comes from the official source itself: the RBI, SEBI, CBDT, EPFO, the finance ministry or the scheme portal. News reports are used only to spot the story.</li>
          <li>Each fact is matched word for word against the page it cites before publishing, and an independent reviewer checks the facts and any worked example again.</li>
          <li>Articles explain how things work. They do not recommend products, and nobody pays to be mentioned.</li>
          <li>Every article lists its sources at the end. If something is wrong, tell us on the <Link href="/contact" className="link-internal">contact page</Link> and we correct it. Our full standards are in the <Link href="/editorial-policy" className="link-internal">editorial policy</Link>.</li>
        </ul>
      </details>

      {posts.length === 0 ? (
        <div className="bg-paper-2 rounded-lg p-12 text-center">
          <p className="text-xl text-muted-2 mb-2">Newsletter posts coming soon.</p>
          <p className="text-muted-2">
            We are working on helpful financial articles. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <ArticleCard key={post.slug} post={post} headingLevel="h2" />
          ))}
        </div>
      )}
    </div>
  );
}
