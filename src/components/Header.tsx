'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import RateTicker from './RateTicker';

interface MenuLink {
  href: string;
  label: string;
  note?: string;
}

interface MenuGroup {
  title: string;
  links: MenuLink[];
}

interface NavItem {
  label: string;
  href: string;
  groups?: MenuGroup[];
  match?: string[];
}

const NAV: NavItem[] = [
  {
    label: 'Prices',
    href: '/gold-rate',
    match: ['/gold-rate', '/silver-rate', '/petrol-price', '/diesel-price', '/lpg-price', '/prices'],
    groups: [
      {
        title: 'Daily prices',
        links: [
          { href: '/gold-rate', label: 'Gold rate', note: '24K, 22K and 18K in 50 cities' },
          { href: '/silver-rate', label: 'Silver rate', note: 'Per gram and per kilo' },
          { href: '/petrol-price', label: 'Petrol price', note: 'City rates, revised at 6 AM' },
          { href: '/diesel-price', label: 'Diesel price', note: 'City rates, revised at 6 AM' },
          { href: '/lpg-price', label: 'LPG cylinder', note: 'Domestic and commercial by state' },
        ],
      },
    ],
  },
  {
    label: 'Schemes',
    href: '/schemes',
    match: ['/schemes', '/state', '/category'],
    groups: [
      {
        title: 'Government schemes',
        links: [
          { href: '/schemes', label: 'Find schemes for you', note: 'Answer a few questions, see what you qualify for' },
          { href: '/state', label: 'Schemes by state', note: 'All 36 states and union territories' },
          { href: '/category', label: 'Schemes by category', note: 'Farmers, women, housing, health and more' },
        ],
      },
    ],
  },
  { label: 'Scholarships', href: '/scholarships' },
  { label: 'Grants', href: '/grants' },
  {
    label: 'Tools',
    href: '/smart-tools',
    match: ['/smart-tools', '/calculators', '/score'],
    groups: [
      {
        title: 'Smart tools',
        links: [
          { href: '/calculators/real-return', label: 'Real Return Checker' },
          { href: '/calculators/retirement-optimizer', label: 'Retirement Optimizer' },
          { href: '/calculators/lifecycle-tax-optimizer', label: 'Tax Regime Optimizer' },
          { href: '/calculators/prepay-vs-invest', label: 'Prepay vs Invest' },
          { href: '/calculators/debt-optimizer', label: 'Debt Optimizer' },
          { href: '/smart-tools', label: 'All smart tools' },
        ],
      },
      {
        title: 'Calculators',
        links: [
          { href: '/calculators/emi', label: 'EMI' },
          { href: '/calculators/sip', label: 'SIP' },
          { href: '/calculators/income-tax', label: 'Income tax' },
          { href: '/calculators/fd', label: 'Fixed deposit' },
          { href: '/calculators/ppf', label: 'PPF' },
          { href: '/calculators', label: 'All calculators' },
        ],
      },
    ],
  },
  {
    label: 'Rates',
    href: '/bank-rates',
    match: ['/bank-rates', '/interest-rates'],
    groups: [
      {
        title: 'Rates',
        links: [
          { href: '/bank-rates/fd-rates', label: 'FD rates', note: 'Across 51 banks' },
          { href: '/bank-rates/savings-rates', label: 'Savings account rates' },
          { href: '/bank-rates/home-loan-rates', label: 'Home loan rates' },
          { href: '/bank-rates/personal-loan-rates', label: 'Personal loan rates' },
          { href: '/interest-rates', label: 'PPF, SSY and post office', note: 'Rates set by the government each quarter' },
        ],
      },
    ],
  },
  {
    label: 'Learn',
    href: '/newsletter',
    match: ['/newsletter', '/guides'],
    groups: [
      {
        title: 'Read',
        links: [
          { href: '/newsletter', label: 'Daily articles', note: 'Money news checked against official sources' },
          { href: '/guides', label: 'Guides', note: 'Old vs new regime, SIP vs FD and more' },
        ],
      },
    ],
  },
];

function isActive(item: NavItem, pathname: string): boolean {
  const prefixes = item.match ?? [item.href];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function Chevron({ open }: { open?: boolean }): React.ReactElement {
  return (
    <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Menu({ item, onNavigate }: { item: NavItem; onNavigate: () => void }): React.ReactElement {
  const wide = (item.groups?.length ?? 0) > 1;
  return (
    <div className={`absolute top-full pt-3 z-50 ${wide ? 'left-1/2 -translate-x-1/2' : '-left-4'}`}>
      <div className={`bg-white border border-line rounded-xl shadow-lift p-2 ${wide ? 'grid grid-cols-2 gap-2 w-[520px]' : 'w-[320px]'}`}>
        {item.groups!.map((g) => (
          <div key={g.title} className="p-2">
            <p className="px-2 pb-2 text-[13px] font-medium text-muted-2">{g.title}</p>
            <ul>
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={onNavigate} className="block rounded-lg px-2 py-2 no-underline text-ink hover:bg-paper-2 hover:text-navy transition-colors">
                    <span className="block text-[14.5px] font-medium">{l.label}</span>
                    {l.note && <span className="block text-[13px] text-muted-2 mt-0.5">{l.note}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Header(): React.ReactElement {
  const pathname = usePathname() ?? '/';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Rechecked on every navigation, so the header flips straight after log in or log out.
    fetch('/api/auth/session', { cache: 'no-store' }).then((r) => r.json()).then((d: { signedIn?: boolean }) => setSignedIn(Boolean(d.signedIn))).catch(() => setSignedIn(false));
  }, [pathname]);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpen(null);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') { setOpen(null); setMobileOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const enter = useCallback((label: string) => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(label);
  }, []);
  const leave = useCallback(() => {
    timer.current = setTimeout(() => setOpen(null), 120);
  }, []);
  const close = useCallback(() => { setOpen(null); setMobileOpen(false); }, []);

  const account = signedIn
    ? { href: '/dashboard', label: 'Dashboard' }
    : { href: '/login', label: 'Log in' };

  return (
    <header className="sticky top-0 z-50">
      {/* The homepage shows these rates in full just below, so the strip would only repeat them. */}
      {pathname !== '/' && <RateTicker />}
      <div className={`bg-white/95 backdrop-blur border-b transition-shadow duration-200 ${scrolled ? 'border-line shadow-card' : 'border-line'}`}>
        <div className="container-main flex items-center justify-between h-16 gap-6">
          <Link href="/" className="flex items-center no-underline shrink-0" aria-label="Paisa Reality, home">
            <span className="font-display font-bold text-[23px] leading-none tracking-[0.2px] text-navy">
              Paisa<span className="text-brand-red">Reality</span>
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-1" aria-label="Main">
            {NAV.map((item) => {
              const active = isActive(item, pathname);
              const hasMenu = Boolean(item.groups);
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => hasMenu && enter(item.label)}
                  onMouseLeave={() => hasMenu && leave()}
                >
                  <Link
                    href={item.href}
                    className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[15px] font-medium no-underline transition-colors duration-150
                      ${active ? 'text-navy bg-navy-soft' : 'text-ink/80 hover:text-ink hover:bg-paper-2'}`}
                    aria-current={active ? 'page' : undefined}
                    onFocus={() => hasMenu && enter(item.label)}
                  >
                    {item.label}
                    {hasMenu && <Chevron open={open === item.label} />}
                  </Link>
                  {hasMenu && open === item.label && <Menu item={item} onNavigate={close} />}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={account.href} className="hidden sm:inline-flex items-center px-3 py-2 text-[15px] font-medium text-ink/80 no-underline rounded-lg hover:text-ink hover:bg-paper-2 transition-colors">
              {account.label}
            </Link>
            <Link href="/score" className="btn-primary !min-h-[40px] !py-2 !px-4 !text-[14.5px] hidden sm:inline-flex">
              Check your score
            </Link>
            <button
              type="button"
              className="xl:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-line text-ink hover:bg-paper-2 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                {mobileOpen
                  ? <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                  : <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav id="mobile-nav" className="xl:hidden border-t border-line bg-white max-h-[calc(100vh-100px)] overflow-y-auto" aria-label="Main">
            <div className="container-main py-3">
              {NAV.map((item) => {
                const active = isActive(item, pathname);
                if (!item.groups) {
                  return (
                    <Link key={item.label} href={item.href} onClick={close}
                      className={`flex items-center min-h-[48px] px-3 rounded-lg text-base font-medium no-underline ${active ? 'text-navy bg-navy-soft' : 'text-ink hover:bg-paper-2'}`}>
                      {item.label}
                    </Link>
                  );
                }
                const isExp = expanded === item.label;
                return (
                  <div key={item.label}>
                    <button type="button" onClick={() => setExpanded(isExp ? null : item.label)} aria-expanded={isExp}
                      className={`flex items-center justify-between w-full min-h-[48px] px-3 rounded-lg text-base font-medium ${active ? 'text-navy' : 'text-ink'} hover:bg-paper-2`}>
                      {item.label}
                      <Chevron open={isExp} />
                    </button>
                    {isExp && (
                      <div className="pb-2 pl-3">
                        {item.groups.flatMap((g) => g.links).map((l) => (
                          <Link key={l.href} href={l.href} onClick={close}
                            className="flex items-center min-h-[44px] px-3 rounded-lg text-[15px] text-muted no-underline hover:text-navy hover:bg-paper-2">
                            {l.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="grid grid-cols-2 gap-2 pt-3 mt-2 border-t border-line">
                <Link href={account.href} onClick={close} className="btn-secondary">{account.label}</Link>
                <Link href="/score" onClick={close} className="btn-primary">Check your score</Link>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
