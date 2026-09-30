import Link from 'next/link';

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

const POPULAR = [
  { href: '/gold-rate', label: 'Gold rate today' },
  { href: '/petrol-price', label: 'Petrol price' },
  { href: '/schemes', label: 'Find government schemes' },
  { href: '/scholarships', label: 'Scholarships' },
  { href: '/grants', label: 'Startup grants' },
  { href: '/calculators/emi', label: 'EMI calculator' },
  { href: '/bank-rates/fd-rates', label: 'FD rates' },
  { href: '/interest-rates', label: 'PPF and small savings rates' },
];

export default function NotFound(): React.ReactElement {
  return (
    <div className="container-main py-20 sm:py-28 text-center">
      <p className="text-sm font-medium text-muted-2 tabular">Error 404</p>
      <h1 className="heading-1 mt-3">We could not find that page</h1>
      <p className="mt-4 text-lg text-muted max-w-xl mx-auto">
        The link may be old, or the page may have moved. A scheme or grant that has closed is also removed from the site.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/" className="btn-primary">Go to the homepage</Link>
        <Link href="/contact" className="btn-secondary">Tell us about a broken link</Link>
      </div>
      <div className="mt-14 max-w-2xl mx-auto">
        <h2 className="text-sm font-medium text-muted mb-4">Pages people often look for</h2>
        <ul className="flex flex-wrap justify-center gap-2">
          {POPULAR.map((p) => (
            <li key={p.href}><Link href={p.href} className="pill no-underline hover:border-navy hover:text-navy">{p.label}</Link></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
