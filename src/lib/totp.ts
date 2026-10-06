/**
 * Time-based one-time passwords (RFC 6238, HMAC-SHA1, 30 s, 6 digits), the scheme
 * Google Authenticator, Microsoft Authenticator, 1Password and Authy all use.
 *
 * No dependencies and no database access, so tests import it directly.
 * The admin secret lives in ADMIN_TOTP_SECRET (base32) in the server env file.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

/** Decodes base32, ignoring spaces, dashes, padding and case. Throws on any other character. */
export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32.indexOf(ch);
    if (idx === -1) throw new Error('invalid base32 character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** A new random secret: 20 bytes (160 bits, the RFC 4226 recommendation), base32. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** HOTP value for one counter (RFC 4226 dynamic truncation). */
export function hotp(secret: Buffer, counter: number, digits = TOTP_DIGITS): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac('sha1', secret).update(msg).digest();
  const offset = mac.readUInt8(mac.length - 1) & 0x0f;
  const code = mac.readUInt32BE(offset) & 0x7fffffff;
  return String(code % 10 ** digits).padStart(digits, '0');
}

export function totpCounter(unixMs: number): number {
  return Math.floor(unixMs / 1000 / TOTP_STEP_SECONDS);
}

export function totpAt(secretBase32: string, unixMs: number, digits = TOTP_DIGITS): string {
  return hotp(base32Decode(secretBase32), totpCounter(unixMs), digits);
}

export interface TotpCheck {
  ok: boolean;
  /** The time step the code matched, so a caller can refuse to accept it twice. */
  counter?: number;
}

/**
 * Checks a code against the current step and one step either side (about +-30 s of
 * clock drift between the phone and the server). Every candidate is compared in
 * constant time, and all three are always computed.
 */
export function verifyTotp(secretBase32: string, code: string, unixMs = Date.now(), window = 1): TotpCheck {
  const clean = String(code ?? '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean)) return { ok: false };
  let secret: Buffer;
  try {
    secret = base32Decode(secretBase32);
  } catch {
    return { ok: false };
  }
  if (secret.length < 10) return { ok: false };
  const now = totpCounter(unixMs);
  let matched: number | undefined;
  for (let d = -window; d <= window; d++) {
    const candidate = Buffer.from(hotp(secret, now + d));
    if (timingSafeEqual(candidate, Buffer.from(clean)) && matched === undefined) matched = now + d;
  }
  return matched === undefined ? { ok: false } : { ok: true, counter: matched };
}

/** The otpauth:// URI an authenticator app reads from a QR code. */
export function otpauthUri(secretBase32: string, account: string, issuer = 'Paisa Reality'): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
