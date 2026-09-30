interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
  title?: string;
}

/**
 * Questions and answers as native <details> rows. The answers are in the HTML from
 * the start, so search engines and screen readers get them, and the open/close
 * works without JavaScript.
 */
export default function FAQ({ items, title = 'Common questions' }: FAQProps): React.ReactElement {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <section className="py-8">
      <h2 className="heading-2 mb-6">{title}</h2>
      <div className="border-t border-line">
        {items.map((item) => (
          <details key={item.question} className="group border-b border-line">
            <summary className="flex items-center justify-between gap-6 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden
                                text-left text-[17px] font-medium text-ink hover:text-navy transition-colors">
              <span>{item.question}</span>
              <span className="relative shrink-0 w-5 h-5 text-muted-2 group-hover:text-navy" aria-hidden="true">
                <span className="absolute left-1/2 top-1/2 w-3.5 h-[1.5px] -translate-x-1/2 -translate-y-1/2 bg-current rounded" />
                <span className="absolute left-1/2 top-1/2 w-[1.5px] h-3.5 -translate-x-1/2 -translate-y-1/2 bg-current rounded transition-transform duration-200 group-open:scale-y-0" />
              </span>
            </summary>
            <p className="pb-6 pr-10 text-muted leading-relaxed max-w-prose">{item.answer}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </section>
  );
}
