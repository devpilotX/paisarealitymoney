import { ImageResponse } from 'next/og';
import { getPostBySlugAsync } from '@/lib/blog';
import { CATEGORY_LABELS, CATEGORY_STYLE } from '@/lib/article-image';

export const alt = 'Paisa Reality article';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 86400;

/**
 * Thumbnail and social card for an article (1200x630). Drawn by the site from the title and
 * category, so it is original artwork with no licence to track. An editor can override it
 * with a cover image URL in the admin dashboard.
 */
export default async function ArticleImage({ params }: { params: Promise<{ slug: string }> }): Promise<ImageResponse> {
  const { slug } = await params;
  const post = await getPostBySlugAsync(slug).catch(() => null);
  const title = post?.title ?? 'Paisa Reality';
  const style = CATEGORY_STYLE[post?.category ?? ''] ?? CATEGORY_STYLE.finance!;
  const label = CATEGORY_LABELS[post?.category ?? ''] ?? 'Money';
  const date = post ? new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '';
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%', width: '100%', display: 'flex', position: 'relative', overflow: 'hidden',
          backgroundImage: `linear-gradient(135deg, ${style.from} 0%, ${style.to} 100%)`, padding: '64px 72px',
        }}
      >
        {/* Large category mark and rings in the corner: decoration only. */}
        <div style={{ position: 'absolute', right: -120, bottom: -160, width: 620, height: 620, borderRadius: 620, border: '2px solid rgba(255,255,255,0.12)', display: 'flex' }} />
        <div style={{ position: 'absolute', right: -40, bottom: -80, width: 460, height: 460, borderRadius: 460, border: '2px solid rgba(255,255,255,0.10)', display: 'flex' }} />
        <div style={{ position: 'absolute', right: 70, bottom: 40, fontSize: 190, fontWeight: 800, color: 'rgba(255,255,255,0.16)', display: 'flex' }}>{style.mark}</div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: '#ffffff' }}>Paisa</div>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: '#ffb4ae', marginLeft: -12 }}>Reality</div>
            <div style={{ display: 'flex', marginLeft: 18, padding: '6px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', color: '#ffffff', fontSize: 24 }}>{label}</div>
          </div>
          <div style={{ display: 'flex', fontSize: title.length > 70 ? 54 : 64, fontWeight: 800, color: '#ffffff', lineHeight: 1.12, maxWidth: 900 }}>
            {title}
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: 'rgba(255,255,255,0.82)' }}>
            {date ? `${date}  ·  Checked against official sources` : 'paisareality.com'}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
