/**
 * The assistant's language model: OpenRouter free models, grounded in live site data.
 * Pure helpers only (no I/O), so tests/assistant-llm.test.ts covers them.
 *
 * Model choice, measured 2026-10-06 on a short Indian tax question with this key:
 *   nvidia/nemotron-3-ultra-550b-a55b:free   4.2 s, finished, 41 reasoning tokens   <- first
 *   nvidia/nemotron-3.5-lightning:free       27 s, ran out of tokens while "thinking"
 *   google/gemma-4-31b-it:free               upstream error
 * nemotron-3-super is the fallback rung. Free models on OpenRouter share one daily
 * request quota per account (50 a day with no credit, 1000 with $10 of credit), so
 * answers are cached and the guided reply covers the rest.
 */
import type { HomeRate } from '@/lib/home-data';

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const ASSISTANT_MAX_TOKENS = 900;

export function openRouterModelChain(pinned?: string): string[] {
  const chain = ['nvidia/nemotron-3-ultra-550b-a55b:free', 'nvidia/nemotron-3-super-120b-a12b:free'];
  const pin = (pinned || '').trim();
  return pin ? [pin, ...chain.filter((m) => m !== pin)] : chain;
}

/** Converts model markdown into plain text for a chat bubble, and removes leaked reasoning. */
export function cleanAnswer(text: string): string {
  return String(text)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^\s*<think>[\s\S]*$/i, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|\s)\*(\S.*?\S)\*(?=\s|$)/g, '$1$2')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[*-]\s+/gm, '- ')
    .replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, '$1 ($2)')
    .replace(/\s*\u2014\s*/g, ', ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface OpenRouterPayload {
  choices?: Array<{ finish_reason?: string | null; message?: { content?: string | null } }>;
}

/** A reply only when the model finished normally and said something; otherwise null, so the caller falls back. */
export function readOpenRouterReply(payload: unknown): string | null {
  const choice = (payload as OpenRouterPayload | null | undefined)?.choices?.[0];
  if (!choice) return null;
  if (choice.finish_reason && choice.finish_reason !== 'stop') return null;
  const text = typeof choice.message?.content === 'string' ? cleanAnswer(choice.message.content) : '';
  if (text.length < 2) return null;
  // A model that refuses its own instructions or leaks them is not worth showing.
  if (/system prompt|my instructions|as an ai language model/i.test(text)) return null;
  return text;
}

export interface SiteFacts {
  today: string;
  ratesAsOf: string | null;
  rates: Pick<HomeRate, 'label' | 'value' | 'unit' | 'note' | 'href'>[];
  articles: Array<{ title: string; slug: string; date: string }>;
  counts?: { schemes: number; scholarships: number; grants: number; banks: number; cities: number };
}

const inr = (v: number): string => `Rs ${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/** Today's figures and pages, given to the model as the only numbers it may quote. */
export function siteFactsBlock(f: SiteFacts): string {
  const lines = [`Today (India): ${f.today}.`];
  if (f.rates.length) {
    lines.push(`Prices on the site${f.ratesAsOf ? ` for ${f.ratesAsOf}` : ''}:`);
    for (const r of f.rates) lines.push(`- ${r.label}: ${inr(r.value)} ${r.unit} (${r.note}). Page: ${r.href}`);
  }
  if (f.counts) {
    lines.push(`The site lists ${f.counts.schemes} government schemes, ${f.counts.scholarships} scholarships, ${f.counts.grants} open startup grants and rates from ${f.counts.banks} banks, with prices for ${f.counts.cities} cities.`);
  }
  if (f.articles.length) {
    lines.push('Latest articles:');
    for (const a of f.articles) lines.push(`- ${a.title} (${a.date.slice(0, 10)}). Page: /newsletter/${a.slug}`);
  }
  return lines.join('\n');
}

export const SITE_PAGES = `Pages you can point to (use these exact paths):
/gold-rate, /silver-rate, /petrol-price, /diesel-price, /lpg-price (city pages: /gold-rate/<city>, e.g. /gold-rate/mumbai)
/interest-rates (PPF, SSY, SCSS, NSC, KVP, post office, RBI policy rates, EPF)
/bank-rates, /bank-rates/fd-rates, /bank-rates/savings-rates, /bank-rates/home-loan-rates, /bank-rates/personal-loan-rates
/schemes (finder), /state (schemes by state), /category, /scholarships, /grants
/score (Money Health Score)
/calculators/income-tax, /calculators/emi, /calculators/sip, /calculators/fd, /calculators/ppf, /calculators/home-loan, /calculators/nps, /calculators/gratuity, /calculators/hra, /calculators/inflation
/calculators/real-return, /calculators/retirement-optimizer, /calculators/prepay-vs-invest, /calculators/debt-optimizer, /calculators/lifecycle-tax-optimizer, /calculators/budget-optimizer, /calculators/tax-harvesting, /calculators/gold-planner, /calculators/scheme-maximizer, /calculators/salary-optimizer
/guides/old-vs-new-tax-regime, /guides/sip-vs-fd, /guides/ppf-vs-nps, /guides/fd-vs-rd, /guides/22k-vs-24k-gold
/newsletter (daily articles), /methodology, /editorial-policy, /contact`;

export const GROUNDING_RULES = `How to answer:
- Answer the question directly in the first sentence, then give the one or two facts that matter, then point to the page that helps (write the path, for example /calculators/income-tax).
- Quote a price or count only from "Site data" below, with its date. For any other figure (tax you will pay, a scheme amount, an interest rate, a deadline) do not state a number from memory: explain how it works and send the reader to the calculator or page that has the current figure.
- If a question is about a decision (which regime, prepay or invest, which FD), explain the trade-off in plain words and send them to the tool that works it out with their own numbers. Never tell someone what to buy.
- Under 120 words. Plain text, short paragraphs or a short list. No markdown headings, no bold, no em dashes, no emojis.
- Reply in the language the user wrote in (English, Hindi or Hinglish).
- If the question has nothing to do with money or this site, say in one sentence that you can help with prices, schemes, tax and money tools on Paisa Reality.`;

export function buildMessages(systemPrompt: string, facts: string, history: Array<{ role: 'user' | 'assistant'; content: string }>, message: string): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  return [
    { role: 'system', content: `${systemPrompt}\n\n${GROUNDING_RULES}\n\n${SITE_PAGES}\n\nSite data (live):\n${facts}` },
    ...history.slice(-6).map((t) => ({ role: t.role, content: String(t.content).slice(0, 800) })),
    { role: 'user', content: message },
  ];
}

/** Cache key for a first question (follow-ups depend on history and are not cached). */
export function questionKey(message: string): string {
  return message.toLowerCase().replace(/[^a-z0-9\u0900-\u097f ]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
}
