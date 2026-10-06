/**
 * Assistant model handling: OpenRouter chain, reply reading, grounding block. DB-free.
 * Run: npx ts-node --project tsconfig.scripts.json tests/assistant-llm.test.ts
 */
import { buildMessages, cleanAnswer, openRouterModelChain, questionKey, readOpenRouterReply, siteFactsBlock } from '../src/lib/assistant-llm';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ok ${msg}`); } else { failed++; console.error(`  FAIL ${msg}`); }
}

const chain = openRouterModelChain();
assert(chain[0] === 'nvidia/nemotron-3-ultra-550b-a55b:free' && chain.every((m) => m.endsWith(':free')), 'chain starts with Nemotron Ultra and uses free models only');
assert(openRouterModelChain(' x/y:free ')[0] === 'x/y:free' && openRouterModelChain('nvidia/nemotron-3-super-120b-a12b:free').length === 2, 'a pinned model goes first without duplicates');

assert(readOpenRouterReply({ choices: [{ finish_reason: 'stop', message: { content: 'Use our **income tax calculator** at /calculators/income-tax.' } }] }) === 'Use our income tax calculator at /calculators/income-tax.', 'finished reply is read and markdown removed');
assert(readOpenRouterReply({ choices: [{ finish_reason: 'length', message: { content: 'At Paisa Reality we' } }] }) === null, 'a cut-off reply is refused');
assert(readOpenRouterReply({ choices: [{ finish_reason: 'stop', message: { content: '<think>long reasoning</think>' } }] }) === null, 'reasoning-only reply is refused');
assert(readOpenRouterReply({ choices: [{ finish_reason: 'stop', message: { content: 'My system prompt says...' } }] }) === null, 'instruction leak is refused');
assert(readOpenRouterReply({}) === null && readOpenRouterReply(null) === null, 'empty payloads are refused');
assert(cleanAnswer('<think>x</think>Gold \u2014 today: see [gold rate](/gold-rate).') === 'Gold, today: see gold rate (/gold-rate).', 'reasoning, em dashes and links cleaned');

const facts = siteFactsBlock({
  today: 'Tuesday, 6 October 2026',
  ratesAsOf: '2026-10-06',
  rates: [{ label: 'Gold 24K', value: 14794.2, unit: 'per gram', note: 'India average of 50 cities', href: '/gold-rate' }],
  articles: [{ title: 'RBI repo rate October 2026', slug: 'rbi-repo', date: '2026-10-06T06:44:00Z' }],
  counts: { schemes: 351, scholarships: 62, grants: 29, banks: 40, cities: 50 },
});
assert(facts.includes('Gold 24K: Rs 14,794.2 per gram') && facts.includes('for 2026-10-06'), 'prices are formatted in Indian style with their date');
assert(facts.includes('/newsletter/rbi-repo') && facts.includes('351 government schemes'), 'latest articles and counts are included');
const msgs = buildMessages('SYS', facts, Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' as const : 'user' as const, content: `t${i}` })), 'q');
assert(msgs.length === 8 && msgs[0]!.role === 'system' && msgs[0]!.content.includes('Site data (live)') && msgs[7]!.content === 'q', 'system + last 6 turns + question');
assert(msgs[0]!.content.includes('do not state a number from memory'), 'grounding rule against remembered figures is present');
assert(questionKey('  Gold RATE today??  ') === questionKey('gold rate today'), 'cache key ignores case and punctuation');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
