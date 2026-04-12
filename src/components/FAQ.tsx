'use client';

import { useState, useCallback } from 'react';
import Script from 'next/script';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
  title?: string;
}

export default function FAQ({ items, title = 'Frequently Asked Questions' }: FAQProps): React.ReactElement {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = useCallback((index: number): void => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section className="py-8">
      <h2 className="heading-2 mb-6">{title}</h2>
      <div className="space-y-3">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={item.question}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleItem(index)}
                className="w-full flex items-center justify-between px-5 py-4 text-left
                           bg-white hover:bg-gray-50 transition-colors duration-200 ease-in-out
                           min-h-[44px]"
                aria-expanded={isOpen}
              >
                <span className="text-base font-medium text-gray-900 pr-4">
                  {item.question}
                </span>
                <span
                  className={`flex-shrink-0 w-5 h-5 text-gray-500 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-4">
                  <p className="text-body">{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ Schema JSON-LD */}
      <Script
        id="faq-schema-markup"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </section>
  );
}