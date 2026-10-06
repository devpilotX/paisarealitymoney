/**
 * Admin image uploads: content sniffing, size limit and public name parsing. DB-free.
 * Run: npx ts-node --project tsconfig.scripts.json tests/uploads.test.ts
 */
import { checkUpload, MAX_UPLOAD_BYTES, parseMediaName, sniffImage } from '../src/lib/upload-core';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ok ${msg}`); } else { failed++; console.error(`  FAIL ${msg}`); }
}

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const jpg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const gif = Uint8Array.from(Buffer.from('GIF89a....'));
const webp = Uint8Array.from(Buffer.from('RIFF\0\0\0\0WEBPVP8 '));
const svg = Uint8Array.from(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'));
const html = Uint8Array.from(Buffer.from('<html><body>hi</body></html>'));

assert(sniffImage(png)?.ext === 'png', 'PNG detected');
assert(sniffImage(jpg)?.ext === 'jpg', 'JPEG detected');
assert(sniffImage(gif)?.ext === 'gif', 'GIF detected');
assert(sniffImage(webp)?.mime === 'image/webp', 'WebP detected');
assert(sniffImage(svg) === null, 'SVG refused (can carry script)');
assert(sniffImage(html) === null, 'HTML refused');
assert(!checkUpload(new Uint8Array(0)).ok, 'empty file refused');
const big = new Uint8Array(MAX_UPLOAD_BYTES + 1); big.set(png);
assert(!checkUpload(big).ok, 'file over 4 MB refused');
assert(checkUpload(png).ok, 'small PNG accepted');

assert(JSON.stringify(parseMediaName('12-0123456789abcdef.png')) === '{"id":12,"token":"0123456789abcdef"}', 'valid name parsed');
assert(parseMediaName('12.png') === null, 'name without token refused');
assert(parseMediaName('12-0123456789abcdef.svg') === null, 'svg extension refused');
assert(parseMediaName('../12-0123456789abcdef.png') === null, 'path tricks refused');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
