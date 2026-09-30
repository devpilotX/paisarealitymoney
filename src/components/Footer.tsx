import Link from 'next/link';
import SubscribeForm from './SubscribeForm';

interface FooterLink {
  href: string;
  label: string;
}

const COLUMNS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: 'Prices',
    links: [
      { href: '/gold-rate', label: 'Gold rate today' },
      { href: '/silver-rate', label: 'Silver rate today' },
      { href: '/petrol-price', label: 'Petrol price' },
      { href: '/diesel-price', label: 'Diesel price' },
      { href: '/lpg-price', label: 'LPG cylinder price' },
      { href: '/interest-rates', label: 'PPF and small savings rates' },
      { href: '/bank-rates', label: 'Bank FD and loan rates' },
    ],
  },
  {
    title: 'Money for you',
    links: [
      { href: '/schemes', label: 'Government schemes' },
      { href: '/scholarships', label: 'Scholarships' },
      { href: '/grants', label: 'Startup grants' },
      { href: '/state', label: 'Schemes by state' },
      { href: '/score', label: 'Money Health Score' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { href: '/smart-tools', label: 'Smart tools' },
      { href: '/calculators/real-return', label: 'Real Return Checker' },
      { href: '/calculators/emi', label: 'EMI calculator' },
      { href: '/calculators/sip', label: 'SIP calculator' },
      { href: '/calculators/income-tax', label: 'Income tax calculator' },
      { href: '/calculators', label: 'All calculators' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/methodology', label: 'How we check our data' },
      { href: '/editorial-policy', label: 'Editorial policy' },
      { href: '/guides', label: 'Guides' },
      { href: '/contact', label: 'Contact' },
    ],
  },
];

const LEGAL: FooterLink[] = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/disclaimer', label: 'Disclaimer' },
  { href: '/contact', label: 'Report an error' },
];

export default function Footer(): React.ReactElement {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#0B1220] text-white/70 mt-auto">
      <div className="container-main pt-16 pb-10">
        <div className="text-center max-w-xl mx-auto">
          <span className="font-display font-bold text-[26px] text-white">
            Paisa<span className="text-[#E8615A]">Reality</span>
          </span>
          <p className="mt-3 text-[15px] text-white/60">
            Free, checked information on prices, schemes and money decisions for Indian families.
            No products to sell you.
          </p>
          <div className="mt-6 max-w-md mx-auto">
            <SubscribeForm />
            <p className="mt-2 text-xs text-white/65">One email a week. Unsubscribe with one click.</p>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 border-t border-white/10">
          {COLUMNS.map((col, i) => (
            <div key={col.title} className={`pt-8 pb-4 md:px-6 ${i > 0 ? 'md:border-l md:border-white/10' : ''}`}>
              <h2 className="text-sm font-semibold text-white tracking-normal mb-4">{col.title}</h2>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-sm text-white/60 no-underline hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 text-[13px] leading-relaxed text-white/65 max-w-4xl">
          <p>
            Paisa Reality is an information service, not a bank, broker or SEBI-registered investment adviser.
            Prices are computed or collected from public sources and dated on every page. Scheme, scholarship and
            grant details come from official portals, which remain the final word. Check with the source before
            you act.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-white/65">
          <p>&copy; {year} Paisa Reality. Made in India.</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {LEGAL.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-white/55 no-underline hover:text-white transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
