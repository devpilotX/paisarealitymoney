/**
 * Admin two-factor login: RFC 6238 vectors, drift window, replay inputs, base32 and
 * the session-claim rule. DB-free.
 * Run: npx ts-node --project tsconfig.scripts.json tests/totp.test.ts
 */
import { base32Decode, base32Encode, generateTotpSecret, hotp, otpauthUri, totpAt, verifyTotp } from '../src/lib/totp';
import { adminClaimsValid } from '../src/lib/admin-auth';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ok ${msg}`); } else { failed++; console.error(`  FAIL ${msg}`); }
}

// RFC 6238 appendix B, SHA1 seed "12345678901234567890", 8 digits.
const seed = Buffer.from('12345678901234567890', 'ascii');
const seed32 = base32Encode(seed);
assert(seed32 === 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', `base32 of the RFC seed (${seed32})`);
assert(base32Decode(seed32).equals(seed), 'base32 round trip');
assert(base32Decode('gezd gnbv-gy3t qojq gezd gnbv gy3t qojq====').equals(seed), 'decode ignores case, spaces, dashes, padding');

const vectors: Array<[number, string]> = [
  [59, '94287082'],
  [1111111109, '07081804'],
  [1111111111, '14050471'],
  [1234567890, '89005924'],
  [2000000000, '69279037'],
  [20000000000, '65353130'],
];
for (const [t, expected] of vectors) {
  assert(totpAt(seed32, t * 1000, 8) === expected, `RFC 6238 T=${t} -> ${expected}`);
}
// RFC 4226 appendix D HOTP values, 6 digits.
assert(hotp(seed, 0) === '755224' && hotp(seed, 9) === '520489', 'RFC 4226 HOTP counters 0 and 9');

const t0 = 1_790_000_000_000;
const now = totpAt(seed32, t0);
assert(verifyTotp(seed32, now, t0).ok, 'current code accepted');
assert(verifyTotp(seed32, totpAt(seed32, t0 - 30_000), t0).ok, 'previous step accepted (clock drift)');
assert(verifyTotp(seed32, totpAt(seed32, t0 + 30_000), t0).ok, 'next step accepted (clock drift)');
assert(!verifyTotp(seed32, totpAt(seed32, t0 - 90_000), t0).ok, 'code three steps old refused');
assert(verifyTotp(seed32, now, t0).counter === Math.floor(t0 / 30_000), 'matched counter is reported for replay protection');
assert(!verifyTotp(seed32, '', t0).ok && !verifyTotp(seed32, '12345', t0).ok && !verifyTotp(seed32, 'abcdef', t0).ok, 'malformed codes refused');
assert(verifyTotp(seed32, `${now.slice(0, 3)} ${now.slice(3)}`, t0).ok, 'a space in the middle of the code is tolerated');
assert(!verifyTotp('not base32 !!', now, t0).ok, 'bad secret never verifies');
assert(!verifyTotp('GEZDGNBV', '000000', t0).ok, 'secret shorter than 80 bits is refused');

const fresh = generateTotpSecret();
assert(/^[A-Z2-7]{32}$/.test(fresh), `generated secret is 32 base32 chars (${fresh.length})`);
assert(base32Decode(fresh).length === 20, 'generated secret is 160 bits');
const uri = otpauthUri(fresh, 'admin@example.com');
assert(uri.startsWith('otpauth://totp/Paisa%20Reality%3Aadmin%40example.com?') && uri.includes(`secret=${fresh}`) && uri.includes('issuer=Paisa+Reality'), 'otpauth URI has label, secret and issuer');

assert(adminClaimsValid({ role: 'admin', mfa: true }, true), 'token with 2FA passes when 2FA is on');
assert(!adminClaimsValid({ role: 'admin' }, true), 'token minted before 2FA is refused once 2FA is on');
assert(adminClaimsValid({ role: 'admin' }, false), 'password-only token passes while 2FA is off');
assert(!adminClaimsValid({ role: 'user', mfa: true }, true), 'non-admin role refused');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
