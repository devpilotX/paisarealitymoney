import Link from 'next/link';
import SubscribeForm from './SubscribeForm';

interface FooterLink {
  href: string;
  label: string;
}

const ABOUT_LINKS: FooterLink[] = [
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
  { href: '/newsletter', label: 'Newsletter' },
  { href: '/methodology', label: 'Data Methodology' },
  { href: '/editorial-policy', label: 'Editorial Policy' },
];

const QUICK_LINKS: FooterLink[] = [
  { href: '/score', label: 'Money Health Score' },
  { href: '/smart-tools', label: 'Smart Tools' },
  { href: '/gold-rate', label: 'Gold Rate Today' },
  { href: '/silver-rate', label: 'Silver Rate Today' },
  { href: '/petrol-price', label: 'Petrol Price Today' },
  { href: '/diesel-price', label: 'Diesel Price Today' },
  { href: '/lpg-price', label: 'LPG Price Today' },
  { href: '/schemes', label: 'Government Schemes' },
  { href: '/scholarships', label: 'Scholarships' },
  { href: '/bank-rates', label: 'Bank Rates' },
  { href: '/interest-rates', label: 'Interest Rates' },
];

const CALCULATOR_LINKS: FooterLink[] = [
  { href: '/calculators/emi', label: 'EMI Calculator' },
  { href: '/calculators/sip', label: 'SIP Calculator' },
  { href: '/calculators/fd', label: 'FD Calculator' },
  { href: '/calculators/ppf', label: 'PPF Calculator' },
  { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
  { href: '/calculators/home-loan', label: 'Home Loan Calculator' },
];

const LEGAL_LINKS: FooterLink[] = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/disclaimer', label: 'Disclaimer' },
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }): React.ReactElement {
  return (
    <div>
      <h3 className="font-sans text-xs font-semibold text-paper uppercase tracking-[0.13em] mb-4">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-paper/60 no-underline transition-colors duration-200 hover:text-brand-yellow"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer(): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy-deep text-paper/70">
      <div className="container-main py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <FooterColumn title="About" links={ABOUT_LINKS} />
          <FooterColumn title="Quick Links" links={QUICK_LINKS} />
          <FooterColumn title="Calculators" links={CALCULATOR_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <div className="mt-10 pt-6 border-t border-paper/15 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div>
            <h3 className="font-sans text-sm font-semibold text-paper mb-2">Subscribe to our newsletter</h3>
            <p className="text-xs text-paper/50 mb-3">Get weekly updates on prices, tools, and financial tips.</p>
            <SubscribeForm />
          </div>
          <p className="text-xs text-paper/45 leading-relaxed">
            Disclaimer: Paisa Reality is an informational website. We are not financial advisors.
            Prices shown are indicative and sourced from public data. Government scheme details are
            sourced from official websites. Always verify information with official sources before
            making any financial decisions.
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-paper/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif text-lg font-bold text-paper">
            Paisa<span className="text-brand-yellow">Reality</span>
          </span>
          <p className="text-xs text-paper/45">
            &copy; {currentYear} Paisa Reality. Built in India, for Indian families.
          </p>
        </div>
      </div>
    </footer>
  );
}
