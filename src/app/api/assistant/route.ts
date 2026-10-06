import { NextResponse, type NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';
import { SYSTEM_PROMPT, guidedReply } from '@/lib/assistant-knowledge';
import { getClientIp } from '@/lib/rate-limit';
import { MAX_OUTPUT_TOKENS, geminiModelChain, readGeminiReply } from '@/lib/assistant-reply';
import {
  ASSISTANT_MAX_TOKENS, OPENROUTER_URL, buildMessages, openRouterModelChain, questionKey, readOpenRouterReply, siteFactsBlock,
} from '@/lib/assistant-llm';
import { getHomeCounts, getHomeRates } from '@/lib/home-data';
import { getAllPostsAsync } from '@/lib/blog';

export const runtime = 'nodejs';

interface ChatTurn { role: 'user' | 'assistant'; content: string; }

const rateLimiter = new LRUCache<string, number>({ max: 5000, ttl: 60_000 });
const LIMIT_PER_MINUTE = 20;
/** Same first question within six hours gets the same answer, which saves the free quota. */
const answerCache = new LRUCache<string, string>({ max: 2000, ttl: 6 * 3600_000 });
/** When OpenRouter says the daily free quota is used up, stop asking until the reset. */
let openRouterPausedUntil = 0;

let factsCache: { at: number; text: string } | null = null;
async function siteFacts(): Promise<string> {
  if (factsCache && Date.now() - factsCache.at < 10 * 60_000) return factsCache.text;
  const [rates, counts, posts] = await Promise.all([
    getHomeRates(),
    getHomeCounts().catch(() => undefined),
    getAllPostsAsync(true).catch(() => []),
  ]);
  const text = siteFactsBlock({
    today: new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    ratesAsOf: rates.asOf,
    rates: rates.rates,
    counts,
    articles: posts.slice(0, 6).map((p) => ({ title: p.title, slug: p.slug, date: p.date })),
  });
  factsCache = { at: Date.now(), text };
  return text;
}

async function callOpenRouter(message: string, history: ChatTurn[], apiKey: string): Promise<string | null> {
  if (Date.now() < openRouterPausedUntil) return null;
  const messages = buildMessages(SYSTEM_PROMPT, await siteFacts(), history, message);
  for (const model of openRouterModelChain(process.env.OPENROUTER_ASSISTANT_MODEL)) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://paisareality.com',
          'X-Title': 'Paisa Reality assistant',
        },
        body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: ASSISTANT_MAX_TOKENS }),
        signal: AbortSignal.timeout(25_000),
      });
      if (res.status === 429) {
        const body = await res.text();
        // "free-models-per-day": the account quota, which resets at 00:00 UTC.
        if (/per-day|per day|daily/i.test(body)) {
          const reset = new Date(); reset.setUTCHours(24, 0, 0, 0);
          openRouterPausedUntil = reset.getTime();
          console.warn('[assistant] OpenRouter free daily quota used up; guided replies until 00:00 UTC');
          return null;
        }
        continue;
      }
      if (!res.ok) continue;
      const reply = readOpenRouterReply(await res.json());
      if (reply) return reply;
    } catch {
      // timeout or network error: try the next model
    }
  }
  return null;
}

async function callGemini(message: string, history: ChatTurn[], apiKey: string): Promise<string | null> {
  const contents = [
    ...history.slice(-8).map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(t.content).slice(0, 1000) }] })),
    { role: 'user', parts: [{ text: message }] },
  ];
  for (const model of geminiModelChain(process.env.GEMINI_MODEL)) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: MAX_OUTPUT_TOKENS },
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) continue;
      const reply = readGeminiReply(await res.json());
      if (reply) return reply;
    } catch {
      // try the next model in the chain
    }
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req);
  const count = (rateLimiter.get(ip) ?? 0) + 1;
  rateLimiter.set(ip, count);
  if (count > LIMIT_PER_MINUTE) {
    return NextResponse.json({ reply: 'You are sending messages too fast. Please wait a minute and try again.', links: [] }, { status: 429 });
  }

  let body: { message?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ reply: 'Sorry, that did not come through. Please try again.', links: [] }, { status: 400 });
  }

  const message = String(body.message ?? '').slice(0, 500).trim();
  if (!message) return NextResponse.json({ reply: 'Please type a question and we will help.', links: [] });

  const history: ChatTurn[] = Array.isArray(body.history)
    ? (body.history as ChatTurn[]).filter((t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string').slice(-8)
    : [];

  const guided = guidedReply(message);
  const key = history.length === 0 ? questionKey(message) : '';
  const cached = key ? answerCache.get(key) : undefined;
  if (cached) return NextResponse.json({ reply: cached, links: guided.links });

  let ai: string | null = null;
  if (process.env.OPENROUTER_API_KEY) ai = await callOpenRouter(message, history, process.env.OPENROUTER_API_KEY);
  if (!ai && process.env.GEMINI_API_KEY) ai = await callGemini(message, history, process.env.GEMINI_API_KEY);
  if (ai) {
    if (key) answerCache.set(key, ai);
    return NextResponse.json({ reply: ai, links: guided.links });
  }
  return NextResponse.json({ reply: guided.reply, links: guided.links });
}
