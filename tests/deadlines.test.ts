/**
 * Deadline answer tests.
 * Run: npx ts-node --project tsconfig.scripts.json tests/deadlines.test.ts
 *
 * The important assertions here are the negative ones. With a deadline recorded
 * for 0 of 351 schemes and 0 of 62 scholarships, almost every page takes the
 * "no date on record" path, and that path must never state or imply a date.
 */

import {
  formatDeadlineDate,
  hasDeadline,
  deadlineAnswer,
  deadlineLine,
  deadlineQuestion,
} from '../src/lib/deadlines';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ok ${msg}`); }
  else { failed++; console.error(`  FAIL ${msg}`); }
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

const SCHEME = { name: 'Palanhar Yojana Rajasthan', kind: 'scheme' as const };
const SCHOLARSHIP = { name: 'Kerala e-Grantz', kind: 'scholarship' as const };

test('formatDeadlineDate handles real, missing and malformed values', () => {
  assert(formatDeadlineDate('2026-10-31') === '31 October 2026', `formats ISO (got ${formatDeadlineDate('2026-10-31')})`);
  assert(formatDeadlineDate(null) === null, 'null stays null');
  assert(formatDeadlineDate(undefined) === null, 'undefined stays null');
  assert(formatDeadlineDate('') === null, 'empty string stays null');
  assert(formatDeadlineDate('not a date') === null, 'garbage stays null rather than becoming Invalid Date');
});

test('a recorded deadline is stated, with a warning to confirm', () => {
  const a = deadlineAnswer({ ...SCHOLARSHIP, deadline: '2026-10-31' });
  assert(a.includes('31 October 2026'), 'the date appears');
  assert(/confirm/i.test(a), 'the reader is told to confirm it');
  assert(hasDeadline({ ...SCHOLARSHIP, deadline: '2026-10-31' }), 'hasDeadline is true');
});

test('with no deadline on record, no date is stated or implied', () => {
  const a = deadlineAnswer(SCHEME);
  assert(/no fixed last date on record/i.test(a), 'it says plainly that no date is on record');
  assert(!/\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)/.test(a),
    'no formatted date appears anywhere in the answer');
  assert(!/\b(20\d\d)\b/.test(a), `no year is stated (got "${a.slice(0, 80)}...")`);
  assert(/official portal/i.test(a), 'it points to the official portal');
  assert(hasDeadline(SCHEME) === false, 'hasDeadline is false');
});

test('the no-date answer explains why, so it reads as an answer and not an omission', () => {
  const a = deadlineAnswer(SCHEME);
  assert(/all year|annual cycle/i.test(a), 'it explains the two real patterns');
  assert(a.length > 300, `it is substantial enough to be a real answer (${a.length} chars)`);
});

test('a last-verified date is surfaced when present, and never invented', () => {
  const withVerified = deadlineAnswer({ ...SCHEME, lastVerified: '2026-07-21' });
  assert(withVerified.includes('21 July 2026'), 'the verified date appears');
  const without = deadlineAnswer(SCHEME);
  assert(!/last verified/i.test(without), 'no verified date is mentioned when there is none');
});

test('malformed dates fall back to the no-date answer rather than printing junk', () => {
  const a = deadlineAnswer({ ...SCHEME, deadline: 'soon' });
  assert(/no fixed last date on record/i.test(a), 'unparseable deadline is treated as absent');
  assert(!/soon/i.test(a), 'the raw junk value is never echoed to the reader');
});

test('the short line matches the answer on whether a date exists', () => {
  assert(deadlineLine({ ...SCHOLARSHIP, deadline: '2026-10-31' }).includes('31 October 2026'), 'date shown when known');
  const none = deadlineLine(SCHEME);
  assert(/not published here/i.test(none), 'absence stated plainly when unknown');
  assert(!/\b20\d\d\b/.test(none), 'no year invented in the short line');
});

test('the question is worded the way people search', () => {
  assert(deadlineQuestion('Palanhar Yojana') === 'What is the last date to apply for Palanhar Yojana?',
    'uses "last date to apply", which is the phrasing in Search Console');
});

test('scholarship and scheme wording differ correctly', () => {
  assert(/scholarships/.test(deadlineAnswer(SCHOLARSHIP)), 'scholarship pages say scholarships');
  assert(/schemes/.test(deadlineAnswer(SCHEME)), 'scheme pages say schemes');
});

console.log(`\n================================================`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
