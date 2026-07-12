'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DropdownItem {
  href: string;
  label: string;
}

const PRICE_LINKS: DropdownItem[] = [
  { href: '/gold-rate', label: 'Gold Rate' },
  { href: '/silver-rate', label: 'Silver Rate' },
  { href: '/petrol-price', label: 'Petrol Price' },
  { href: '/diesel-price', label: 'Diesel Price' },
  { href: '/lpg-price', label: 'LPG Price' },
];

const CALCULATOR_LINKS: DropdownItem[] = [
  { href: '/calculators', label: 'All Calculators' },
  { href: '/calculators/emi', label: 'EMI Calculator' },
  { href: '/calculators/sip', label: 'SIP Calculator' },
  { href: '/calculators/fd', label: 'FD Calculator' },
  { href: '/calculators/ppf', label: 'PPF Calculator' },
  { href: '/calculators/income-tax', label: 'Income Tax' },
  { href: '/calculators/home-loan', label: 'Home Loan' },
];

const SMART_TOOLS_LINKS: DropdownItem[] = [
  { href: '/smart-tools', label: 'All Smart Tools' },
  { href: '/calculators/real-return', label: 'Real Return Checker' },
  { href: '/calculators/retirement-optimizer', label: 'Retirement Optimizer' },
  { href: '/calculators/prepay-vs-invest', label: 'Prepay vs Invest' },
  { href: '/calculators/debt-optimizer', label: 'Debt Optimizer' },
  { href: '/calculators/budget-optimizer', label: 'Budget Optimizer' },
  { href: '/calculators/lifecycle-tax-optimizer', label: 'Tax Regime Optimizer' },
  { href: '/calculators/tax-harvesting', label: 'Tax Harvesting' },
  { href: '/calculators/gold-planner', label: 'Gold Planner' },
  { href: '/calculators/scheme-maximizer', label: 'Scheme Maximizer' },
  { href: '/calculators/salary-optimizer', label: 'Salary Optimizer' },
];

interface NavItemConfig {
  label: string;
  href?: string;
  dropdown?: DropdownItem[];
}

const NAV_ITEMS: NavItemConfig[] = [
  { label: 'Schemes', href: '/schemes' },
  { label: 'Scholarships', href: '/scholarships' },
  { label: 'Prices', dropdown: PRICE_LINKS },
  { label: 'Smart Tools', href: '/smart-tools', dropdown: SMART_TOOLS_LINKS },
  { label: 'Calculators', href: '/calculators', dropdown: CALCULATOR_LINKS },
  { label: 'Bank Rates', href: '/bank-rates' },
];

const NAV_LINK_BASE =
  'relative px-0 py-1 text-[14.5px] font-semibold no-underline transition-colors duration-200 ' +
  'after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:transition-all after:duration-300';

function navLinkClass(active: boolean): string {
  // Yellow underline marks the active section (yellow = highlight); red on hover elsewhere.
  return active
    ? `${NAV_LINK_BASE} text-navy after:w-full after:bg-brand-yellow`
    : `${NAV_LINK_BASE} text-ink hover:text-navy after:w-0 after:bg-brand-red hover:after:w-full`;
}

function isItemActive(item: NavItemConfig, pathname: string): boolean {
  if (item.href) {
    if (item.href === '/') return pathname === '/';
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  if (item.dropdown) {
    return item.dropdown.some((d) => pathname === d.href || pathname.startsWith(`${d.href}/`));
  }
  return false;
}

function DesktopDropdown({ items, isOpen }: { items: DropdownItem[]; isOpen: boolean }): React.ReactElement | null {
  if (!isOpen) return null;
  return (
    <div className="absolute top-full left-0 mt-2 w-52 bg-paper border border-line rounded-[5px] shadow-lg py-1 z-50">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="block px-4 py-2.5 text-sm text-ink no-underline hover:bg-paper-2 hover:text-navy transition-colors duration-150"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export default function Header(): React.ReactElement {
  const pathname = usePathname() ?? '/';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
    setMobileExpanded(null);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    setMobileExpanded(null);
  }, []);

  const handleMouseEnter = useCallback((label: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(label);
  }, []);

  const handleMouseLeave = useCallback(() => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 150);
  }, []);

  useEffect(() => {
    return () => {
      if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    };
  }, []);

  const toggleMobileExpanded = useCallback((label: string) => {
    setMobileExpanded((prev) => (prev === label ? null : label));
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Utility bar */}
      <div className="bg-brown text-paper text-[12.5px]">
        <div className="container-main flex items-center justify-between h-[38px]">
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 text-paper/80">
              <svg className="w-3.5 h-3.5 text-brand-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6z" />
              </svg>
              Straight from official sources
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-paper/80">
              <svg className="w-3.5 h-3.5 text-brand-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Free to use, no sign up
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-paper/80">
              <svg className="w-3.5 h-3.5 text-brand-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              Checked every day
            </span>
          </div>
          <span className="hidden sm:inline text-paper/70">Made in India</span>
        </div>
      </div>

      {/* Main nav */}
      <div className="bg-paper border-b border-line">
        <div className="container-main">
          <div className="flex items-center justify-between h-[68px]">
            {/* Wordmark with custom seal */}
            <Link href="/" className="flex items-center no-underline" onClick={closeMobileMenu} aria-label="Paisa Reality home">
              <span className="font-serif font-bold text-[22px] leading-none tracking-[0.3px] text-navy">
                Paisa<span className="text-brand-red">Reality</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {NAV_ITEMS.map((item) => {
                const active = isItemActive(item, pathname);
                return (
                  <div
                    key={item.label}
                    className="relative flex items-center"
                    onMouseEnter={() => item.dropdown && handleMouseEnter(item.label)}
                    onMouseLeave={() => item.dropdown && handleMouseLeave()}
                  >
                    {item.href && !item.dropdown ? (
                      <Link href={item.href} className={navLinkClass(active)}>
                        {item.label}
                      </Link>
                    ) : item.href && item.dropdown ? (
                      <Link href={item.href} className={`${navLinkClass(active)} inline-flex items-center gap-1`}>
                        {item.label}
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </Link>
                    ) : (
                      <button type="button" className={`${navLinkClass(active)} inline-flex items-center gap-1`}>
                        {item.label}
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    {item.dropdown && <DesktopDropdown items={item.dropdown} isOpen={openDropdown === item.label} />}
                  </div>
                );
              })}
            </nav>

            {/* Right: Score CTA + hamburger */}
            <div className="flex items-center gap-3">
              <Link
                href="/score"
                className="hidden sm:inline-flex items-center px-4 py-2 text-[14px] font-bold rounded-[3px] no-underline
                           border border-navy bg-transparent text-navy transition-all duration-200
                           hover:bg-navy hover:text-paper
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Health Score
              </Link>

              <button
                type="button"
                className="lg:hidden inline-flex items-center justify-center rounded-[3px] border border-line
                           text-navy hover:bg-paper-2 transition-colors duration-200 w-[46px] h-[46px]"
                onClick={toggleMobileMenu}
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-line bg-paper">
            <nav className="container-main py-3">
              {NAV_ITEMS.map((item) => {
                const active = isItemActive(item, pathname);
                return (
                  <div key={item.label}>
                    {item.dropdown ? (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleMobileExpanded(item.label)}
                          className={`flex items-center justify-between w-full px-3 py-3 text-base font-semibold
                                     rounded-[3px] transition-colors duration-200 hover:bg-paper-2 min-h-[44px]
                                     ${active ? 'text-navy' : 'text-ink hover:text-navy'}`}
                          aria-expanded={mobileExpanded === item.label}
                        >
                          <span className="inline-flex items-center gap-2">
                            {active && <span className="w-1.5 h-4 rounded-full bg-brand-yellow" aria-hidden="true" />}
                            {item.label}
                          </span>
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${mobileExpanded === item.label ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {mobileExpanded === item.label && (
                          <div className="pl-4 pb-2">
                            {item.dropdown.map((sub) => (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                className="block px-3 py-2.5 text-sm text-muted rounded-[3px] no-underline
                                           hover:text-navy hover:bg-paper-2 transition-colors duration-150"
                                onClick={closeMobileMenu}
                              >
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href!}
                        className={`flex items-center gap-2 px-3 py-3 text-base font-semibold rounded-[3px] no-underline
                                   transition-colors duration-200 hover:bg-paper-2 min-h-[44px]
                                   ${active ? 'text-navy' : 'text-ink hover:text-navy'}`}
                        onClick={closeMobileMenu}
                      >
                        {active && <span className="w-1.5 h-4 rounded-full bg-brand-yellow" aria-hidden="true" />}
                        {item.label}
                      </Link>
                    )}
                  </div>
                );
              })}
              <Link
                href="/score"
                className="block mx-3 mt-3 px-4 py-3 text-center text-base font-bold text-paper
                           bg-navy rounded-[3px] no-underline transition-colors duration-200
                           hover:bg-navy-deep sm:hidden"
                onClick={closeMobileMenu}
              >
                Health Score
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
