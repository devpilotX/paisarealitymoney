import { ImageResponse } from 'next/og';
import { getPostBySlugAsync } from '@/lib/blog';

export const alt = 'Paisa Reality article';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 86400;

const LABELS: Record<string, string> = {
  finance: 'Personal finance', gold: 'Gold', silver: 'Silver', fuel: 'Fuel prices', schemes: 'Government schemes',
  tax: 'Tax', investment: 'Investing', insurance: 'Insurance', banking: 'Banking', budgeting: 'Budgeting',
};

/** Social and Google Discover card for an article (1200x630), built from its title. */
export default async function ArticleImage({ params }: { params: Promise<{ slug: string }> }): Promise<ImageResponse> {
  const { slug } = await params;
  const post = await getPostBySlugAsync(slug).catch(() => null);
  const title = post?.title ?? 'Paisa Reality';
  const date = post ? new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '';
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          backgroundColor: '#0c4a47', backgroundImage: 'linear-gradient(135deg, #0c4a47 0%, #1C3A5E 100%)', padding: '72px',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: '#a7f3d0' }}>
          {`Paisa Reality  ·  ${LABELS[post?.category ?? ''] ?? 'Money'}`}
        </div>
        <div style={{ display: 'flex', fontSize: title.length > 70 ? 56 : 66, fontWeight: 800, color: '#ffffff', lineHeight: 1.12, maxWidth: 1040 }}>
          {title}
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#d1fae5' }}>{date ? `${date}  ·  paisareality.com` : 'paisareality.com'}</div>
      </div>
    ),
    { ...size },
  );
}
