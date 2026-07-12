import sanitizeHtml from 'sanitize-html';
import { getActiveAdForPlacement } from '@/lib/ads';
import AdBanner from '@/components/AdBanner';
import AdImpression from '@/components/AdImpression';

interface AdSlotProps {
  placement: string;
  /** Fallback AdSense format when no self-hosted creative is active. */
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
}

function cleanAdHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: ['a', 'img', 'video', 'source', 'div', 'span', 'p', 'br', 'strong', 'em', 'h3', 'picture'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      video: ['src', 'width', 'height', 'poster', 'controls', 'autoplay', 'muted', 'loop', 'playsinline'],
      source: ['src', 'type'],
      '*': ['class', 'style'],
    },
    allowedSchemes: ['http', 'https'],
  });
}

/**
 * Renders the highest-priority active ad creative for a placement.
 * Falls back to Google AdSense (AdBanner) when no creative is configured,
 * so pages always have a working ad slot. Server component (reads the DB).
 */
export default async function AdSlot({
  placement,
  format = 'horizontal',
  className = '',
}: AdSlotProps): Promise<React.ReactElement> {
  const ad = await getActiveAdForPlacement(placement);

  if (!ad) {
    return <AdBanner format={format} className={className} />;
  }

  const label = ad.altText || ad.name;
  let creative: React.ReactElement | null = null;

  if (ad.type === 'video' && ad.videoUrl) {
    creative = (
      <video
        src={ad.videoUrl}
        className="w-full h-auto rounded-[5px]"
        autoPlay
        muted
        loop
        playsInline
        aria-label={label}
      />
    );
  } else if (ad.type === 'html' && ad.html) {
    return (
      <div className={className}>
        <span className="block text-[10px] uppercase tracking-[0.12em] text-muted-2 mb-1">Advertisement</span>
        <div dangerouslySetInnerHTML={{ __html: cleanAdHtml(ad.html) }} />
        <AdImpression id={ad.id} />
      </div>
    );
  } else if (ad.imageUrl) {
    creative = (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={ad.imageUrl} alt={label} className="w-full h-auto rounded-[5px]" loading="lazy" />
    );
  }

  if (!creative) {
    return <AdBanner format={format} className={className} />;
  }

  const wrapped = ad.linkUrl ? (
    <a href={`/api/ads/click?id=${ad.id}`} target="_blank" rel="nofollow sponsored noopener" aria-label={label}>
      {creative}
    </a>
  ) : (
    creative
  );

  return (
    <div className={className}>
      <span className="block text-[10px] uppercase tracking-[0.12em] text-muted-2 mb-1">Advertisement</span>
      {wrapped}
      <AdImpression id={ad.id} />
    </div>
  );
}
