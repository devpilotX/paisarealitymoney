'use client';

import { useState, useCallback } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import ProfileForm from '@/components/ProfileForm';
import SchemeResults from '@/components/SchemeResults';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import type { MatchedScheme } from '@/lib/matcher';
import { SCHEME_CATEGORIES } from '@/lib/constants';

const SCHEME_FAQS = [
  { question: 'How does the scheme finder work?', answer: 'You fill a simple 6-step form with your basic details like age, gender, state, income, and education. Our system checks your profile against all active central and state government schemes in our database and shows you the ones you may be eligible for, sorted by match score.' },
  { question: 'Is my data stored or shared?', answer: 'No. Your profile data is only used to find matching schemes. We do not store your personal details or share them with anyone. The matching happens in real-time and your data is discarded after showing results.' },
  { question: 'How accurate is the eligibility check?', answer: 'Our eligibility matching covers the main criteria like age, gender, state, income, category, and education. However, some schemes have additional detailed requirements that we may not cover. Always verify your eligibility on the official scheme website before applying.' },
  { question: 'Can I apply for schemes through Paisa Reality?', answer: 'No. Paisa Reality only helps you find schemes you may be eligible for. To apply, you need to visit the official government website or the nearest Common Service Centre (CSC). We provide links to official application portals where available.' },
  { question: 'How many schemes are in your database?', answer: 'We currently have 100+ central government schemes in our database, covering education, housing, business, agriculture, healthcare, women, senior citizens, skill training, and more. We keep adding new schemes and updating existing ones regularly.' },
];

const POPULAR_SCHEME_LINKS = [
  { href: '/schemes/pm-kisan', label: 'PM Kisan Samman Nidhi', description: 'Rs 6,000 per year support for landholding farmers.' },
  { href: '/schemes/ayushman-bharat', label: 'Ayushman Bharat', description: 'Health cover up to Rs 5 lakh per family for eligible households.' },
  { href: '/schemes/sukanya-samriddhi', label: 'Sukanya Samriddhi Yojana', description: 'High-interest savings scheme for the girl child.' },
  { href: '/schemes/pm-awas-yojana', label: 'PM Awas Yojana', description: 'Housing support and subsidy for eligible beneficiaries.' },
  { href: '/schemes/mudra-loan', label: 'MUDRA Loan', description: 'Business loans for micro and small enterprises.' },
  { href: '/schemes/atal-pension', label: 'Atal Pension Yojana', description: 'Guaranteed monthly pension after age 60.' },
  { href: '/schemes/pmuy', label: 'PM Ujjwala Yojana', description: 'Free LPG connection support for eligible women.' },
  { href: '/schemes/national-scholarship-portal', label: 'National Scholarship Portal', description: 'Apply for central and state student scholarships.' },
];

export default function SchemesPage(): React.ReactElement {
  const [schemes, setSchemes] = useState<MatchedScheme[]>([]);
  const [totalBenefit, setTotalBenefit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const handleResults = useCallback((results: MatchedScheme[], benefit: number): void => {
    setSchemes(results);
    setTotalBenefit(benefit);
    setHasSearched(true);
  }, []);

  const handleLoading = useCallback((loading: boolean): void => {
    setIsLoading(loading);
  }, []);

  const categoryLinks = SCHEME_CATEGORIES.map((cat) => ({
    href: `/category/${cat.slug}`,
    label: cat.label,
    description: `Government ${cat.label.toLowerCase()} schemes`,
  }));

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Government Schemes' }]} />

      <div className="text-center mb-8">
        <h1 className="heading-1 mb-3">Government Scheme Finder</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Fill a simple form and find out which central and state government schemes you may be eligible for. Covers active schemes in the database across education, housing, business, healthcare, and more.
        </p>
        <p className="text-sm text-gray-500 max-w-2xl mx-auto mt-3">
          For the official national catalogue, cross-check results on{' '}
          <a href="https://www.myscheme.gov.in/" target="_blank" rel="noopener noreferrer" className="link-internal">
            myScheme.gov.in
          </a>
          .
        </p>
      </div>

      <AdBanner format="horizontal" />

      {/* Profile Form */}
      <div className="my-8">
        <ProfileForm onResults={handleResults} onLoading={handleLoading} />
      </div>

      {/* Results */}
      {(hasSearched || isLoading) && (
        <div id="results">
          <SchemeResults schemes={schemes} totalBenefit={totalBenefit} isLoading={isLoading} />
        </div>
      )}

      <InArticleAd />

      {/* Browse by Category */}
      <InternalLinks title="Browse Schemes by Category" links={categoryLinks} columns={3} />

      <InternalLinks title="Popular Scheme Pages" links={POPULAR_SCHEME_LINKS} columns={2} />

      {/* Content */}
      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">About Government Schemes in India</h2>
        <p className="text-body mb-4">
          The Indian government runs thousands of welfare schemes at the central and state level. These schemes provide financial assistance, subsidies, free services, and support to citizens in areas like education, housing, healthcare, agriculture, skill development, and business.
        </p>
        <p className="text-body mb-4">
          Many Indians miss out on benefits they are entitled to simply because they do not know about these schemes or find it difficult to check their eligibility. Paisa Reality's Scheme Finder solves this problem by letting you check your eligibility for multiple schemes at once with a simple form.
        </p>
        <p className="text-body mb-4">
          Our database includes major central government schemes like PM Awas Yojana (housing), Ayushman Bharat (healthcare), PM Kisan (agriculture), MUDRA Loan (business), Sukanya Samriddhi (girl child savings), and many more. Each scheme page has detailed information about eligibility, benefits, how to apply, and required documents.
        </p>
      </article>

      <FAQ items={SCHEME_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
