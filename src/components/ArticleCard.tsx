import Link from 'next/link';
import type { BlogPost } from '@/lib/blog';
import { formatDate } from '@/lib/constants';
import { articleImage, CATEGORY_LABELS } from '@/lib/article-image';

/**
 * Article card with its thumbnail. The thumbnail is the article's cover image when an editor
 * has set one, otherwise the site's own generated card (/newsletter/<slug>/opengraph-image),
 * so every image is original and needs no licence.
 */
export default function ArticleCard({ post, headingLevel = 'h3' }: { post: BlogPost; headingLevel?: 'h2' | 'h3' }): React.ReactElement {
  const Heading = headingLevel;
  return (
    <Link
      href={`/newsletter/${post.slug}`}
      className="group flex flex-col rounded-xl border border-line bg-white overflow-hidden no-underline text-ink shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={articleImage(post)}
        alt=""
        width={1200}
        height={630}
        loading="lazy"
        decoding="async"
        className="w-full aspect-[1200/630] object-cover bg-[#0c4a47]"
      />
      <div className="p-5 flex flex-col flex-1">
        <span className="text-xs font-medium text-navy">{CATEGORY_LABELS[post.category] ?? 'Money'}</span>
        <Heading className="mt-1.5 font-semibold leading-snug group-hover:text-navy transition-colors">{post.title}</Heading>
        <p className="mt-2 text-[15px] text-muted leading-relaxed line-clamp-2">{post.description}</p>
        <p className="mt-auto pt-4 text-xs text-muted-2">
          <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readTime}
        </p>
      </div>
    </Link>
  );
}
