'use client';

import { useState, useCallback } from 'react';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
}

interface ShareOption {
  name: string;
  icon: string;
  getUrl: (url: string, title: string, description: string) => string;
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    name: 'WhatsApp',
    icon: 'M',
    getUrl: (url, title) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    name: 'Facebook',
    icon: 'F',
    getUrl: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'Twitter',
    icon: 'T',
    getUrl: (url, title) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
];

export default function ShareButton({
  url,
  title,
  description = '',
}: ShareButtonProps): React.ReactElement {
  const [copied, setCopied] = useState<boolean>(false);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://paisareality.com';
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;

  const handleCopyLink = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }, [fullUrl]);

  const handleShareClick = useCallback(
    (option: ShareOption): void => {
      const shareUrl = option.getUrl(fullUrl, title, description);
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    },
    [fullUrl, title, description]
  );

  return (
    <div className="flex items-center gap-2 py-4">
      <span className="text-sm font-medium text-gray-600 mr-1">Share:</span>
      {SHARE_OPTIONS.map((option) => (
        <button
          key={option.name}
          type="button"
          onClick={() => handleShareClick(option)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full
                     bg-gray-100 text-gray-700 text-sm font-bold
                     transition-colors duration-200 ease-in-out
                     hover:bg-primary hover:text-white
                     min-w-[44px] min-h-[44px]"
          title={`Share on ${option.name}`}
          aria-label={`Share on ${option.name}`}
        >
          {option.icon}
        </button>
      ))}
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center justify-center px-4 h-10 rounded-full
                   bg-gray-100 text-gray-700 text-sm font-medium
                   transition-colors duration-200 ease-in-out
                   hover:bg-primary hover:text-white
                   min-h-[44px]"
        title="Copy link to clipboard"
        aria-label="Copy link to clipboard"
      >
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  );
}
