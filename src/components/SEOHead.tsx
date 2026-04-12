import Script from 'next/script';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  breadcrumbs?: BreadcrumbItem[];
  faqs?: FAQItem[];
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  noindex?: boolean;
}

export default function SEOHead({
  title,
  description,
  canonicalUrl,
  ogImage = '/og-image.png',
  ogType = 'website',
  breadcrumbs,
  faqs,
  articlePublishedTime,
  articleModifiedTime,
  noindex = false,
}: SEOHeadProps): React.ReactElement {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://paisareality.com';
  const fullCanonical = canonicalUrl.startsWith('http') ? canonicalUrl : `${siteUrl}${canonicalUrl}`;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

  const breadcrumbSchema = breadcrumbs
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
        })),
      }
    : null;

  const faqSchema = faqs && faqs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : null;

  const articleSchema =
    ogType === 'article' && articlePublishedTime
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description: description,
          image: fullOgImage,
          datePublished: articlePublishedTime,
          dateModified: articleModifiedTime ?? articlePublishedTime,
          publisher: {
            '@type': 'Organization',
            name: 'Paisa Reality',
            url: siteUrl,
          },
        }
      : null;

  return (
    <>
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="Paisa Reality" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />

      {/* Hreflang */}
      <link rel="alternate" hrefLang="en" href={fullCanonical} />
      <link rel="alternate" hrefLang="hi" href={`${siteUrl}/hi${canonicalUrl}`} />
      <link rel="alternate" hrefLang="x-default" href={fullCanonical} />

      {/* Structured Data */}
      {breadcrumbSchema && (
        <Script
          id="breadcrumb-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      {faqSchema && (
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {articleSchema && (
        <Script
          id="article-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      )}
    </>
  );
}
