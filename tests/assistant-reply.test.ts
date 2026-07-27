/**
 * Assistant reply handling tests.
 * Run: npx ts-node --project tsconfig.scripts.json tests/assistant-reply.test.ts
 *
 * The truncation case is asserted hardest, because it is the one that would have
 * reached a reader. Measured on 2026-07-28: gemini-flash-latest spent 383 of a
 * 400 token budget thinking and returned 13 tokens, so the visible answer was
 * "At Paisa Reality, we are here to help you get clarity" and then nothing, with
 * finishReason MAX_TOKENS. The previous code returned any non-empty string.
 */

import { MAX_OUTPUT_TOKENS, geminiModelChain, readGeminiReply, toPlainText } from '../src/lib/assistant-reply';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ok ${msg}`); }
  else { failed++; console.error(`  FAIL ${msg}`); }
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

function candidate(text: string, finishReason = 'STOP'): unknown {
  return { candidates: [{ finishReason, content: { parts: [{ text }] } }] };
}

test('the model chain contains no retired or quota-dead id', () => {
  const chain = geminiModelChain();
  const dead = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
  for (const id of dead) {
    assert(!chain.includes(id), `${id} is not in the chain`);
  }
  assert(chain.length >= 2, `chain has a fallback (got ${chain.length})`);
  assert(chain[0] === 'gemini-flash-lite-latest', 'the model that does not spend thinking tokens leads');
});

test('GEMINI_MODEL pins a model without duplicating it', () => {
  const pinned = geminiModelChain('gemini-flash-latest');
  assert(pinned[0] === 'gemini-flash-latest', 'the pinned model is tried first');
  assert(pinned.filter((m) => m === 'gemini-flash-latest').length === 1, 'it appears exactly once');
  assert(geminiModelChain('   ')[0] === 'gemini-flash-lite-latest', 'whitespace is not a pin');
  assert(geminiModelChain(undefined).length === 2, 'an unset variable leaves the default chain');
});

test('a truncated answer is refused, never shown', () => {
  const cut = candidate('At Paisa Reality, we are here to help you get clarity', 'MAX_TOKENS');
  assert(readGeminiReply(cut) === null, 'MAX_TOKENS yields null even though the text is non-empty');
  for (const reason of ['SAFETY', 'RECITATION', 'OTHER']) {
    assert(readGeminiReply(candidate('half an answer', reason)) === null, `${reason} yields null`);
  }
  assert(readGeminiReply(candidate('A complete answer.')) === 'A complete answer.', 'STOP is accepted');
});

test('token budget leaves room for thinking tokens', () => {
  assert(MAX_OUTPUT_TOKENS > 400, `budget exceeds the old 400 (got ${MAX_OUTPUT_TOKENS})`);
  assert(MAX_OUTPUT_TOKENS >= 800, 'budget covers a 383 token thinking pass plus a full answer');
});

test('markdown never reaches the plain text bubble', () => {
  assert(
    toPlainText('our free **Money Health Score** tool') === 'our free Money Health Score tool',
    'bold markers are removed, wording kept',
  );
  assert(toPlainText('__Real Return Checker__') === 'Real Return Checker', 'underscore bold is removed');
  assert(toPlainText('## Heading\nbody') === 'Heading\nbody', 'headings lose the hashes');
  assert(toPlainText('- one\n- two') === '• one\n• two', 'list markers become bullets');
  assert(toPlainText('a\n\n\n\nb') === 'a\n\nb', 'runs of blank lines collapse');
});

test('arithmetic survives, because single asterisks are left alone', () => {
  assert(toPlainText('Rs 5000 * 12 months') === 'Rs 5000 * 12 months', 'a multiplication sign is not emphasis');
  assert(toPlainText('2 * 3 * 4') === '2 * 3 * 4', 'several asterisks are still not emphasis');
});

test('malformed and empty payloads return null rather than throwing', () => {
  for (const v of [null, undefined, {}, { candidates: [] }, { candidates: [{}] }, 'nonsense', 42]) {
    assert(readGeminiReply(v) === null, `${JSON.stringify(v) ?? 'undefined'} gives null`);
  }
  assert(readGeminiReply(candidate('   ')) === null, 'whitespace only is treated as no answer');
  assert(readGeminiReply({ candidates: [{ finishReason: 'STOP', content: { parts: [{}, { text: 'kept' }] } }] }) === 'kept',
    'a part with no text is skipped rather than rendered as undefined');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
