'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { QUICK_PROMPTS } from '@/lib/assistant-knowledge';

interface ChatLink { label: string; href: string; }
interface Msg { role: 'user' | 'assistant'; content: string; links?: ChatLink[]; }

const WELCOME: Msg = {
  role: 'assistant',
  content:
    'Namaste! I am Yojana Mitra. I can help you check your Money Health Score, find government schemes, and pick the right tool. How can I help?',
};

export default function YojanaMitra(): React.ReactElement {
  const [open, setOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = useCallback(
    async (text: string): Promise<void> => {
      const message = text.trim();
      if (!message || loading) return;

      const history = messages
        .filter((m) => m !== WELCOME)
        .map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, { role: 'user', content: message }]);
      setInput('');
      setLoading(true);

      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, history }),
        });
        const data = (await res.json()) as { reply?: string; links?: ChatLink[] };
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply ?? 'Sorry, please try again.', links: data.links ?? [] },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', links: [] },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close Yojana Mitra assistant' : 'Open Yojana Mitra assistant'}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-navy text-paper shadow-lg
                   transition-colors hover:bg-navy-deep
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Yojana Mitra assistant"
          className="fixed bottom-24 right-5 z-50 flex flex-col w-[90vw] max-w-sm h-[70vh] max-h-[520px]
                     rounded-2xl border border-line bg-paper shadow-2xl overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-3 bg-navy text-paper">
            <span className="font-semibold">Yojana Mitra</span>
            <span className="text-xs text-paper/80">Paisa Reality guide</span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-paper-2">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === 'user' ? 'bg-navy text-paper' : 'bg-paper border border-line text-ink'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.links && m.links.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.links.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          onClick={() => setOpen(false)}
                          className="text-xs font-medium bg-navy/5 text-navy border border-navy/20 rounded-full px-2.5 py-1 no-underline
                                     hover:bg-navy hover:text-paper transition-colors"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void send(q)}
                    className="text-xs font-medium bg-paper border border-line rounded-full px-2.5 py-1 text-ink
                               hover:border-navy hover:text-navy transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-paper border border-line rounded-2xl px-3 py-2 text-sm text-muted-2">Typing...</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-line p-2 bg-paper"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about schemes, score, calculators..."
              aria-label="Message Yojana Mitra"
              className="flex-1 px-3 py-2 text-sm border border-line bg-paper text-ink rounded-[3px] focus:outline-none focus:ring-2 focus:ring-navy min-h-[40px]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 py-2 bg-navy text-paper text-sm rounded-[3px] hover:bg-navy-deep disabled:opacity-50 min-h-[40px]"
            >
              Send
            </button>
          </form>
          <p className="px-3 pb-2 text-[10px] text-muted-2 bg-paper">
            Educational only. Please verify prices and scheme details with official sources.
          </p>
        </div>
      )}
    </>
  );
}
