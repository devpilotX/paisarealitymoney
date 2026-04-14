'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from "next/image";
interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/gold-rate', label: 'Gold Rate' },
  { href: '/silver-rate', label: 'Silver Rate' },
  { href: '/petrol-price', label: 'Petrol Price' },
  { href: '/schemes', label: 'Schemes' },
  { href: '/calculators', label: 'Calculators' },
  { href: '/bank-rates', label: 'Bank Rates' },
];

export default function Header(): React.ReactElement {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const toggleMobileMenu = useCallback((): void => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback((): void => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          

<Link
  href="/"
  className="flex items-center no-underline"
  onClick={closeMobileMenu}
>
  <Image
    src="/paisa_reality_logo.png"
    alt="Paisa Reality"
    width={140}
    height={40}
    className="h-8 w-auto"
    priority
  />
</Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md no-underline
                           transition-colors duration-200 ease-in-out hover:text-primary hover:bg-primary-50"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Language toggle + Mobile menu button */}
          <div className="flex items-center gap-3">
            <Link
              href="/hi"
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm font-medium
                         text-primary border border-primary rounded-md no-underline
                         transition-colors duration-200 ease-in-out hover:bg-primary hover:text-white"
              title="Switch to Hindi"
            >
              हिंदी
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md
                         text-gray-700 hover:text-primary hover:bg-primary-50
                         transition-colors duration-200 ease-in-out min-w-[44px] min-h-[44px]"
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
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-3 text-base font-medium text-gray-700 rounded-md no-underline
                           transition-colors duration-200 ease-in-out hover:text-primary hover:bg-primary-50"
                onClick={closeMobileMenu}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/hi"
              className="block px-3 py-3 text-base font-medium text-primary rounded-md no-underline
                         transition-colors duration-200 ease-in-out hover:bg-primary-50 sm:hidden"
              onClick={closeMobileMenu}
            >
              हिंदी में देखें
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}