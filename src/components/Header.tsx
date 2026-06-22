'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
  { label: 'Prices', dropdown: PRICE_LINKS },
  { label: 'Smart Tools', href: '/smart-tools', dropdown: SMART_TOOLS_LINKS },
  { label: 'Calculators', href: '/calculators', dropdown: CALCULATOR_LINKS },
  { label: 'Schemes', href: '/schemes' },
  { label: 'Bank Rates', href: '/bank-rates' },
];

function DesktopDropdown({ items, isOpen }: { items: DropdownItem[]; isOpen: boolean }): React.ReactElement | null {
  if (!isOpen) return null;
  return (
    <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="block px-4 py-2.5 text-sm text-gray-700 no-underline hover:bg-primary-50 hover:text-primary transition-colors duration-150"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export default function Header(): React.ReactElement {
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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center no-underline" onClick={closeMobileMenu}>
            <Image
              src="/paisa_reality_logo.png"
              alt="Paisa Reality"
              width={160}
              height={36}
              className="h-[32px] w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.dropdown && handleMouseEnter(item.label)}
                onMouseLeave={() => item.dropdown && handleMouseLeave()}
              >
                {item.href && !item.dropdown ? (
                  <Link
                    href={item.href}
                    className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md no-underline
                               transition-colors duration-200 hover:text-primary hover:bg-primary-50"
                  >
                    {item.label}
                  </Link>
                ) : item.href && item.dropdown ? (
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700
                               rounded-md no-underline transition-colors duration-200 hover:text-primary hover:bg-primary-50"
                  >
                    {item.label}
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700
                               rounded-md transition-colors duration-200 hover:text-primary hover:bg-primary-50"
                  >
                    {item.label}
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
                {item.dropdown && (
                  <DesktopDropdown items={item.dropdown} isOpen={openDropdown === item.label} />
                )}
              </div>
            ))}
          </nav>

          {/* Right side: Score CTA + Mobile hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="/score"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold
                         border-2 border-primary bg-white text-primary rounded-lg no-underline
                         transition-all duration-200
                         hover:bg-primary hover:text-white hover:border-primary
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Health Score
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md
                         text-gray-700 hover:text-primary hover:bg-primary-50
                         transition-colors duration-200 min-w-[44px] min-h-[44px]"
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <nav className="container-main py-3">
            {NAV_ITEMS.map((item) => (
              <div key={item.label}>
                {item.dropdown ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleMobileExpanded(item.label)}
                      className="flex items-center justify-between w-full px-3 py-3 text-base font-medium
                                 text-gray-700 rounded-md transition-colors duration-200
                                 hover:text-primary hover:bg-primary-50 min-h-[44px]"
                      aria-expanded={mobileExpanded === item.label}
                    >
                      {item.label}
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          mobileExpanded === item.label ? 'rotate-180' : ''
                        }`}
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
                            className="block px-3 py-2.5 text-sm text-gray-600 rounded-md no-underline
                                       hover:text-primary hover:bg-primary-50 transition-colors duration-150"
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
                    className="block px-3 py-3 text-base font-medium text-gray-700 rounded-md no-underline
                               transition-colors duration-200 hover:text-primary hover:bg-primary-50 min-h-[44px]"
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
            <Link
              href="/score"
              className="block mx-3 mt-3 px-4 py-3 text-center text-base font-semibold text-white
                         bg-primary rounded-lg no-underline transition-colors duration-200
                         hover:bg-primary-600 sm:hidden"
              onClick={closeMobileMenu}
            >
              Health Score
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
