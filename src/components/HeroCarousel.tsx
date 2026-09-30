'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export interface HeroSlide {
  id: string;
  title: string;
  text: string;
  cta: { href: string; label: string };
  panel: {
    caption: string;
    rows: Array<{ label: string; value: string; sub?: string }>;
    foot: string;
  };
}

const INTERVAL_MS = 7000;

/** Slow, drifting line art in the brand colours. Pure SVG, no images to load. */
function Lines(): React.ReactElement {
  const paths = Array.from({ length: 14 }, (_, i) => {
    const y = 40 + i * 22;
    return `M-50 ${y} C 200 ${y - 120 + i * 6}, 420 ${y + 140 - i * 8}, 900 ${y - 40}`;
  });
  const colours = ['#E0B84A', '#F28B82', '#7FA3CC', '#FFFFFF'];
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g className="hero-lines" fill="none" strokeWidth="1.4">
        {paths.map((d, i) => (
          <path key={d} d={d} stroke={colours[i % colours.length]} strokeOpacity={0.18 + (i % 4) * 0.06} />
        ))}
      </g>
    </svg>
  );
}

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }): React.ReactElement {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const hover = useRef(false);
  const n = slides.length;

  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) setPaused(true);
  }, []);

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setInterval(() => { if (!hover.current) setI((v) => (v + 1) % n); }, INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, n]);

  const s = slides[i]!;

  return (
    <section
      className="container-main pt-6 sm:pt-8 pb-12 sm:pb-16"
      aria-roledescription="carousel"
      aria-label="What Paisa Reality does"
      onMouseEnter={() => { hover.current = true; }}
      onMouseLeave={() => { hover.current = false; }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-navy-deep text-white">
        <Lines />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/85 to-navy-deep/20" aria-hidden="true" />
        <div className="relative grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center px-6 py-12 sm:px-12 sm:py-16 min-h-[460px]">
          <div key={s.id} className="hero-fade" aria-live={paused ? 'polite' : 'off'}>
            <h1 className="text-white font-semibold tracking-[-0.03em] leading-[1.06] text-balance" style={{ fontSize: 'clamp(34px, 4.6vw, 56px)' }}>
              {s.title}
            </h1>
            <p className="mt-5 text-lg text-white/75 leading-relaxed max-w-xl text-pretty">{s.text}</p>
            <Link href={s.cta.href} className="mt-8 inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-white text-navy-deep font-semibold no-underline hover:bg-white/90 hover:text-navy-deep transition-colors">
              {s.cta.label}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>

          <div key={`${s.id}-panel`} className="hero-fade rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-sm p-6 sm:p-7">
            <p className="text-sm text-white/60">{s.panel.caption}</p>
            <ul className="mt-4 divide-y divide-white/10">
              {s.panel.rows.map((r) => (
                <li key={r.label} className="py-3.5 flex items-baseline justify-between gap-4">
                  <span className="text-white/85">{r.label}</span>
                  <span className="text-right">
                    <span className="block text-lg font-semibold tabular">{r.value}</span>
                    {r.sub && <span className="block text-[13px] text-white/50">{r.sub}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] text-white/50">{s.panel.foot}</p>
          </div>
        </div>

        {n > 1 && (
          <div className="relative flex items-center gap-3 px-6 sm:px-12 pb-6">
            <button type="button" onClick={() => setPaused((p) => !p)}
              className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-white/25 text-white hover:bg-white/10"
              aria-label={paused ? 'Play slides' : 'Pause slides'}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                {paused ? <path d="M7 4.5v15l12-7.5z" /> : <path d="M6 4h4v16H6zM14 4h4v16h-4z" />}
              </svg>
            </button>
            <div className="flex items-center gap-2" role="group" aria-label="Choose a slide">
              {slides.map((x, k) => (
                <button key={x.id} type="button" onClick={() => go(k)} aria-label={`Slide ${k + 1} of ${n}`} aria-current={k === i}
                  className="group h-9 px-1 flex items-center">
                  <span className={`block h-1.5 rounded-full transition-all duration-300 ${k === i ? 'w-8 bg-white' : 'w-4 bg-white/35 group-hover:bg-white/60'}`} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
