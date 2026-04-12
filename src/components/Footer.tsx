import Link from 'next/link';

interface FooterLink {
  href: string;
  label: string;
}

const ABOUT_LINKS: FooterLink[] = [
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
  { href: '/blog', label: 'Blog' },
];

const QUICK_LINKS: FooterLink[] = [
  { href: '/gold-rate', label: 'Gold Rate Today' },
  { href: '/silver-rate', label: 'Silver Rate Today' },
  { href: '/petrol-price', label: 'Petrol Price Today' },
  { href: '/diesel-price', label: 'Diesel Price Today' },
  { href: '/lpg-price', label: 'LPG Price Today' },
  { href: '/schemes', label: 'Government Schemes' },
  { href: '/bank-rates', label: 'Bank Rates' },
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
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
        {title}
      </h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-gray-600 no-underline transition-colors duration-200 ease-in-out
                         hover:text-primary"
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
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container-main py-12">
        {/* Footer columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <FooterColumn title="About" links={ABOUT_LINKS} />
          <FooterColumn title="Quick Links" links={QUICK_LINKS} />
          <FooterColumn title="Calculators" links={CALCULATOR_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Disclaimer */}
        <div className="mt-10 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 leading-relaxed">
            Disclaimer: Paisa Reality is an informational website. We are not financial advisors.
            Prices shown are indicative and sourced from public data. Government scheme details are
            sourced from official websites. Always verify information with official sources before
            making any financial decisions.
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">Paisa</span>
            <span className="text-lg font-bold text-gray-900">Reality</span>
          </div>
          <p className="text-sm text-gray-500">
            &copy; {currentYear} Paisa Reality. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}