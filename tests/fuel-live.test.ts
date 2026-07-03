/**
 * Live fuel feed — parser and sanity-filter tests (no network).
 * Run: npx ts-node --project tsconfig.scripts.json tests/fuel-live.test.ts
 *
 * Fixture rows copy the real CarDekho markup shape observed on 3 Jul 2026.
 */

import { parseStateFuelTable, filterSaneStates } from '../src/lib/fuel-live';
import { STATE_FUEL } from '../src/lib/fuel-data';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

const FIXTURE = `
<tr><td><a href="https://www.cardekho.com/petrol-price-in-andhra-pradesh-state" title="Petrol Price In Andhra Pradesh">Andhra Pradesh</a></td><td>₹117.95</td></tr>
<tr><td><a href="https://www.cardekho.com/petrol-price-in-delhi-state" title="Petrol Price In Delhi">Delhi</a></td><td>₹102.12</td></tr>
<tr><td><a href="https://www.cardekho.com/petrol-price-in-maharashtra-state" title="Petrol Price In Maharashtra">Maharashtra</a></td><td>&#8377;111.82</td></tr>
<tr><td><a href="https://www.cardekho.com/diesel-price-in-andhra-pradesh-state" title="Diesel Price In Andhra Pradesh">Andhra Pradesh</a></td><td>₹105.61</td></tr>
<tr><td><a href="https://www.cardekho.com/diesel-price-in-delhi-state" title="Diesel Price In Delhi">Delhi</a></td><td>₹95.2</td></tr>
<tr><td><a href="https://www.cardekho.com/cng-price-in-delhi-state" title="Cng Price In Delhi">Delhi</a></td><td>₹83.09</td></tr>
<tr><td><a href="https://www.cardekho.com/petrol-price-in-new-delhi-city" title="Petrol Price In New Delhi">New Delhi</a></td><td>₹102.12</td></tr>
`;

test('parseStateFuelTable: petrol rows', () => {
  const petrol = parseStateFuelTable(FIXTURE, 'petrol');
  assert(petrol['Andhra Pradesh'] === 117.95, 'Andhra Pradesh petrol parsed');
  assert(petrol['Delhi'] === 102.12, 'Delhi petrol parsed');
  assert(petrol['Maharashtra'] === 111.82, 'HTML-entity rupee sign (&#8377;) parsed');
  assert(Object.keys(petrol).length === 3, 'exactly 3 petrol states (city + CNG rows ignored)');
});

test('parseStateFuelTable: diesel rows and isolation', () => {
  const diesel = parseStateFuelTable(FIXTURE, 'diesel');
  assert(diesel['Andhra Pradesh'] === 105.61, 'Andhra Pradesh diesel parsed');
  assert(diesel['Delhi'] === 95.2, 'Delhi diesel parsed (no decimals padding needed)');
  assert(!('Maharashtra' in diesel), 'petrol rows not leaked into diesel');
  assert(Object.keys(diesel).length === 2, 'CNG rows ignored');
});

test('parseStateFuelTable: garbage in, nothing out', () => {
  assert(Object.keys(parseStateFuelTable('<html>maintenance page</html>', 'petrol')).length === 0, 'no rows on unrelated HTML');
  assert(Object.keys(parseStateFuelTable('', 'diesel')).length === 0, 'empty input');
});

test('filterSaneStates: tolerance guard', () => {
  const delhiBaseline = STATE_FUEL['Delhi']?.petrol ?? 0;
  const sane = filterSaneStates({ Delhi: delhiBaseline * 1.05, Narnia: 100 }, 'petrol');
  assert(sane['Delhi'] !== undefined, '+5% move accepted');
  assert(!('Narnia' in sane), 'unknown state dropped');
  const insane = filterSaneStates({ Delhi: delhiBaseline * 1.5 }, 'petrol');
  assert(!('Delhi' in insane), '+50% parse garbage rejected');
  const zero = filterSaneStates({ Delhi: 0.01 }, 'petrol');
  assert(!('Delhi' in zero), 'near-zero rejected');
});

console.log(`\n${'='.repeat(40)}\nPASSED: ${passed}  FAILED: ${failed}\n`);
if (failed > 0) process.exitCode = 1;
