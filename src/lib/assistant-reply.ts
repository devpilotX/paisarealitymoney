/**
 * Reading a Gemini answer safely enough to show it to a stranger on a money site.
 *
 * Three facts drive this file. All three were measured against the live API on
 * 2026-07-28 with the key this site actually uses, not taken from documentation.
 *
 * 1. Pinned model ids rot, and they rot silently. `gemini-2.5-flash` and
 *    `gemini-2.5-flash-lite` now answer 404 "no longer available to new users",
 *    and every 2.0 model answers 429 on the free tier. The previous chain was
 *    ['gemini-2.5-flash', 'gemini-2.0-flash'], so both rungs were dead and the
 *    route fell through to the guided reply on every request. Nothing logged an
 *    error, because falling back is the designed behaviour. The `-latest`
 *    aliases were the only ids that still answered, so the chain uses those.
 *
 * 2. Thinking tokens are charged against maxOutputTokens. `gemini-flash-latest`
 *    spent 383 of a 400 token budget thinking and returned 13 tokens, giving
 *    the reply "At Paisa Reality, we are here to help you get clarity" and then
 *    nothing, with finishReason MAX_TOKENS. The old code returned any non-empty
 *    string, so it would have shipped that half sentence. A truncated answer on
 *    a money site is worse than a deterministic one, so non-STOP candidates are
 *    now rejected outright and the caller falls back.
 *
 * 3. The chat bubble renders the reply in a plain <p> with whitespace-pre-wrap,
 *    so markdown reaches the reader as literal characters. Observed from the
 *    live model: "our free **Money Health Score** tool".
 */

/**
 * Deliberately far larger than the visible answer needs, because thinking tokens
 * are drawn from the same budget. The models that do not think still return
 * about 120 output tokens, so this is headroom rather than a longer answer.
 */
export const MAX_OUTPUT_TOKENS = 1200;

/**
 * `gemini-flash-lite-latest` leads because it spends zero thinking tokens and
 * finished with STOP inside even the old 400 token budget, which makes it both
 * cheaper and faster for a short support answer. `gemini-flash-latest` is the
 * fallback and does think, which is exactly why MAX_OUTPUT_TOKENS is generous.
 *
 * GEMINI_MODEL still pins a model without a code change, and a pinned id is
 * never duplicated further down the chain.
 */
export function geminiModelChain(pinned?: string): string[] {
  const chain = ['gemini-flash-lite-latest', 'gemini-flash-latest'];
  const pin = pinned?.trim();
  if (!pin) return chain;
  return [pin, ...chain.filter((model) => model !== pin)];
}

/**
 * Converts the markdown a model emits into something a plain text bubble can
 * show. This is a conversion rather than a prompt instruction because a prompt
 * is a request and this needs to be a guarantee.
 *
 * Single asterisk emphasis is left alone on purpose: `2 * 3` and `Rs 5 * 12`
 * appear in financial answers, and stripping single asterisks would corrupt
 * arithmetic to fix a cosmetic problem.
 */
export function toPlainText(text: string): string {
  return text
    .replace(/\*\*([\s\S]+?)\*\*/g, '$1')
    .replace(/__([\s\S]+?)__/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}[-*+]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface GeminiCandidate {
  finishReason?: string;
  content?: { parts?: Array<{ text?: string }> };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

/**
 * Returns a reply only when the model finished its sentence. Anything else,
 * MAX_TOKENS, SAFETY, RECITATION or a shape we do not recognise, returns null so
 * the caller can try the next model and ultimately the guided reply.
 */
export function readGeminiReply(payload: unknown): string | null {
  const candidate = (payload as GeminiResponse | null | undefined)?.candidates?.[0];
  if (!candidate) return null;
  if (candidate.finishReason !== undefined && candidate.finishReason !== 'STOP') return null;

  const parts = candidate.content?.parts ?? [];
  if (!Array.isArray(parts)) return null;

  const joined = parts.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('');
  const text = toPlainText(joined);
  return text.length > 0 ? text : null;
}
