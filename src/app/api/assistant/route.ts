import { NextResponse, type NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';
import { SYSTEM_PROMPT, guidedReply } from '@/lib/assistant-knowledge';
import { MAX_OUTPUT_TOKENS, geminiModelChain, readGeminiReply } from '@/lib/assistant-reply';

export const runtime = 'nodejs';

interface ChatTurn { role: 'user' | 'assistant'; content: string; }

const rateLimiter = new LRUCache<string, number>({ max: 5000, ttl: 60_000 });
const LIMIT_PER_MINUTE = 20;

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Model fallback chain. Pinned ids rot, and the previous pair
 * ['gemini-2.5-flash', 'gemini-2.0-flash'] is now entirely dead: 404 and 429
 * respectively. See src/lib/assistant-reply.ts for the measurements.
 */
function geminiModels(): string[] {
  return geminiModelChain(process.env.GEMINI_MODEL);
}

async function callGemini(message: string, history: ChatTurn[], apiKey: string): Promise<string | null> {
  const contents = [
    ...history.slice(-8).map((t) => ({
      role: t.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(t.content).slice(0, 1000) }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  for (const model of geminiModels()) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: { temperature: 0.4, maxOutputTokens: MAX_OUTPUT_TOKENS },
          }),
        },
      );
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
  const ip = clientIp(req);
  const count = (rateLimiter.get(ip) ?? 0) + 1;
  rateLimiter.set(ip, count);
  if (count > LIMIT_PER_MINUTE) {
    return NextResponse.json(
      { reply: 'You are sending messages too fast. Please wait a minute and try again.', links: [] },
      { status: 429 },
    );
  }

  let body: { message?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ reply: 'Sorry, that did not come through. Please try again.', links: [] }, { status: 400 });
  }

  const message = String(body.message ?? '').slice(0, 500).trim();
  if (!message) {
    return NextResponse.json({ reply: 'Please type a question and we will help.', links: [] });
  }

  const history: ChatTurn[] = Array.isArray(body.history)
    ? (body.history as ChatTurn[]).filter((t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string').slice(-8)
    : [];

  const guided = guidedReply(message);
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    const ai = await callGemini(message, history, apiKey);
    if (ai) return NextResponse.json({ reply: ai, links: guided.links });
  }

  return NextResponse.json({ reply: guided.reply, links: guided.links });
}
