'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { OPEN_ASSISTANT_EVENT } from '@/lib/events';

export interface HeroSlide {
  id: string;
  title: string;
  text: string;
  /** `action: 'open-assistant'` renders a button that opens Yojana Mitra instead of a link. */
  cta: { href: string; label: string; action?: 'open-assistant' };
  /** Artwork is 1376x768 with the subject on the right and a dark left side for the text. */
  image: string;
  stats: Array<{ value: string; label: string }>;
  note?: string;
}

const INTERVAL_MS = 7000;

function ArrowIcon(): React.ReactElement {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

const CTA_CLASS =
  'mt-7 inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-white text-navy-deep font-semibold no-underline ' +
  'hover:bg-white/90 hover:text-navy-deep transition-colors focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-white';

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }): React.ReactElement {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const hover = useRef(false);
  const n = slides.length;

  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPaused(true);
  }, []);

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setInterval(() => { if (!hover.current) setI((v) => (v + 1) % n); }, INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, n]);

  return (
    <section
      className="container-main pt-6 sm:pt-8 pb-12 sm:pb-16"
      aria-roledescription="carousel"
      aria-label="What Paisa Reality does"
      onMouseEnter={() => { hover.current = true; }}
      onMouseLeave={() => { hover.current = false; }}
      onFocusCapture={() => { hover.current = true; }}
      onBlurCapture={() => { hover.current = false; }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-navy-deep text-white">
        {/*
          Artwork. On phones it is a 3:2 banner above the text, cropped toward the
          subject on the right; from lg up it fills the card behind the text.
          All slides are stacked and cross-faded, so switching never reflows.
        */}
        <div className="relative aspect-[3/2] sm:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto" aria-hidden="true">
          {slides.map((x, k) => (
            <Image
              key={x.id}
              src={x.image}
              alt=""
              fill
              priority={k === 0}
              sizes="(min-width: 1280px) 1232px, 100vw"
              className={`object-cover object-[88%_50%] lg:object-right transition-opacity duration-700 ease-out ${k === i ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/10 to-transparent lg:bg-gradient-to-r lg:from-navy-deep lg:via-navy-deep/70 lg:to-transparent" />
        </div>

        {/* Every slide's text shares one grid cell, so the card is always as tall as the longest slide. */}
        <div className="relative grid px-6 pt-2 pb-8 sm:px-12 sm:pt-4 lg:py-16 lg:min-h-[500px] lg:items-center">
          {slides.map((x, k) => {
            const active = k === i;
            const Heading = active ? 'h1' : 'p';
            return (
              <div
                key={x.id}
                className={`[grid-area:1/1] lg:max-w-[48%] transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0 invisible'}`}
                aria-hidden={!active}
                role="group"
                aria-roledescription="slide"
                aria-label={`${k + 1} of ${n}`}
              >
                <Heading className="text-white font-semibold tracking-[-0.03em] leading-[1.08] text-balance" style={{ fontSize: 'clamp(30px, 4vw, 50px)' }}>
                  {x.title}
                </Heading>
                <p className="mt-4 text-base sm:text-lg text-white/75 leading-relaxed text-pretty">{x.text}</p>

                {x.cta.action === 'open-assistant' ? (
                  <button type="button" className={CTA_CLASS} tabIndex={active ? 0 : -1}
                    onClick={() => window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT))}>
                    {x.cta.label} <ArrowIcon />
                  </button>
                ) : (
                  <Link href={x.cta.href} className={CTA_CLASS} tabIndex={active ? 0 : -1}>
                    {x.cta.label} <ArrowIcon />
                  </Link>
                )}

                {x.stats.length > 0 && (
                  <dl className="mt-8 grid grid-cols-3 gap-4 max-w-lg border-t border-white/15 pt-5">
                    {x.stats.map((st) => (
                      <div key={st.label}>
                        <dt className="sr-only">{st.label}</dt>
                        <dd className="text-lg sm:text-xl font-semibold tabular leading-tight">{st.value}</dd>
                        <dd className="mt-1 text-[13px] leading-snug text-white/60">{st.label}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {x.note && <p className="mt-4 text-[13px] text-white/50">{x.note}</p>}
              </div>
            );
          })}
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
            <div className="flex items-center gap-1" role="group" aria-label="Choose a slide">
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
