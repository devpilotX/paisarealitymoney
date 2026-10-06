// End-to-end smoke test against a running server. Node 18+ (global fetch), no dependencies.
// Usage: node scripts/smoke.mjs http://localhost:3100 [--admin-host admin.localhost]
// Reads ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_TOTP_SECRET, CRON_SECRET, RAZORPAY_WEBHOOK_SECRET from the environment.
// Creates one throwaway user (smoke+<timestamp>@example.test) and deletes it at the end.
import crypto from 'crypto';
import http from 'http';
import https from 'https';

const BASE = (process.argv[2] || 'http://localhost:3100').replace(/\/$/, '');
const adminArg = process.argv.indexOf('--admin-host');
const ADMIN_HOST = adminArg > -1 ? process.argv[adminArg + 1] : null;
const env = process.env;
let pass = 0; let fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ok', m); } else { fail++; console.log('  FAIL', m); } };

// node:http rather than fetch, because fetch will not let a caller set the Host header,
// and the admin area is chosen by Host.
function req(path, { method = 'GET', body, headers = {}, cookie, host } = {}) {
  const url = new URL(BASE + path);
  const payload = body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body));
  const h = { ...headers };
  if (payload !== undefined) { h['content-type'] = 'application/json'; h['content-length'] = Buffer.byteLength(payload); }
  if (cookie) h.cookie = cookie;
  if (host) {
    // Over HTTPS the name must match SNI too, so point the URL at the host itself.
    if (url.protocol === 'https:') url.hostname = host; else h.host = host;
  }
  const lib = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const r = lib.request(url, { method, headers: h }, (res) => {
      let text = '';
      res.setEncoding('utf8');
      res.on('data', (d) => { text += d; });
      res.on('end', () => {
        let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
        const sc = res.headers['set-cookie'] || [];
        resolve({ status: res.statusCode, text, json, headers: { get: (k) => res.headers[k.toLowerCase()] ?? null }, setCookie: Array.isArray(sc) ? sc : [sc] });
      });
    });
    r.on('error', reject);
    if (payload !== undefined) r.write(payload);
    r.end();
  });
}
// RFC 6238 code for the admin login when ADMIN_TOTP_SECRET is set (same as src/lib/totp.ts).
function totpNow(secret) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = 0; let v = 0; const out = [];
  for (const ch of secret.toUpperCase().replace(/[\s=-]/g, '')) { v = (v << 5) | A.indexOf(ch); bits += 5; if (bits >= 8) { out.push((v >>> (bits - 8)) & 255); bits -= 8; } }
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const mac = crypto.createHmac('sha1', Buffer.from(out)).update(msg).digest(); const o = mac[19] & 15;
  return String((((mac[o] & 127) << 24) | (mac[o + 1] << 16) | (mac[o + 2] << 8) | mac[o + 3]) % 1e6).padStart(6, '0');
}
const cookieFrom = (sc) => sc.map((c) => c.split(';')[0]).filter((c) => !/=$/.test(c)).join('; ');

console.log('\npublic pages and machine files');
for (const p of ['/', '/gold-rate', '/gold-rate/mumbai', '/silver-rate', '/petrol-price/delhi', '/diesel-price', '/lpg-price', '/interest-rates', '/schemes', '/schemes/pm-kisan', '/scholarships', '/bank-rates', '/calculators/income-tax', '/score', '/guides', '/privacy', '/terms', '/methodology']) {
  const r = await req(p); ok(r.status === 200, `${p} -> ${r.status}`);
}
{ const r = await req('/schemes/pm-kaushal-vikas'); ok(r.status === 301 || r.status === 308, `duplicate slug redirects (${r.status} -> ${r.headers.get('location')})`); }
{ const r = await req('/robots.txt'); ok(r.status === 200 && /GPTBot/.test(r.text) && /Disallow: \/api\//.test(r.text), 'robots.txt names AI crawlers and keeps /api private'); }
{ const r = await req('/llms.txt'); ok(r.status === 200 && r.text.startsWith('# Paisa Reality'), 'llms.txt'); }
{ const r = await req('/llms-full.txt'); ok(r.status === 200 && /Gold, silver and fuel/.test(r.text) && /Rs \d/.test(r.text), `llms-full.txt carries live figures (${r.text.length} bytes)`); }
{ const r = await req('/sitemap.xml'); const n = (r.text.match(/<loc>/g) || []).length; ok(r.status === 200 && n > 700, `sitemap has ${n} URLs`); }
{ const r = await req('/admin'); ok(r.status === 404, `/admin on main host is 404 (${r.status})`); }
{ const r = await req('/api/prices/gold?city=mumbai'); ok(r.status === 200 && r.json?.success, 'gold price API'); }

console.log('\nCSRF and secrets');
{ const r = await req('/api/auth/login', { method: 'POST', body: { email: 'a@b.c', password: 'x' }, headers: { origin: 'https://evil.example' } }); ok(r.status === 403, `cross-site POST refused (${r.status})`); }
{ const r = await req('/api/cron/prices?secret=wrong'); ok(r.status === 401, 'cron rejects a wrong secret'); }
{ const r = await req('/api/cron/prices'); ok(r.status === 401, 'cron rejects a missing secret'); }

console.log('\nuser account lifecycle');
const email = `smoke+${Date.now()}@example.test`;
const password = 'Sm0ke-test-' + crypto.randomBytes(4).toString('hex');
let cookie = '';
{
  const r = await req('/api/auth/signup', { method: 'POST', body: { name: 'Smoke Test', email, password } });
  ok(r.status === 200 || r.status === 201, `signup (${r.status} ${r.json?.error || ''})`);
  cookie = cookieFrom(r.setCookie);
  ok(/auth-token=/.test(cookie), 'signup sets a session cookie');
}
{ const r = await req('/api/auth/me', { cookie }); ok(r.json?.success && r.json.user?.email === email, 'me returns the new user'); }
{ const r = await req('/api/auth/login', { method: 'POST', body: { email, password: 'wrong-password' } }); ok(r.status === 401, 'wrong password rejected'); }
{ const r = await req('/api/auth/login', { method: 'POST', body: { email, password } }); ok(r.status === 200, 'login'); cookie = cookieFrom(r.setCookie) || cookie; }
{ const r = await req('/api/alerts', { method: 'POST', cookie, body: { commodity: 'gold_24k', citySlug: 'mumbai', direction: 'below', targetPrice: 10000 } }); ok(r.status === 200 || r.status === 201, `create price alert (${r.status} ${r.json?.error || ''})`); }
{ const r = await req('/api/alerts', { cookie }); ok(r.status === 200 && Array.isArray(r.json?.alerts ?? r.json?.data), 'list alerts'); }
{ const r = await req('/api/account/profile', { method: 'PATCH', cookie, body: { full_name: 'Smoke Tester', city: 'Pune' } }); ok(r.json?.success, 'update profile'); }
{ const r = await req('/api/auth/logout', { method: 'POST', cookie }); ok(r.status === 200 && r.setCookie.some((c) => /auth-token=;/.test(c) && /Max-Age=0/i.test(c)), 'logout clears the httpOnly cookie'); }
{ const r = await req('/api/auth/forgot-password', { method: 'POST', body: { email } }); ok(r.json?.success, 'forgot password answers success'); }
{ const r = await req('/api/auth/reset-password', { method: 'POST', body: { token: 'f'.repeat(64), password: 'whatever123' } }); ok(r.status === 400, 'reset with a bogus token rejected'); }
{ const r = await req('/api/account/delete', { method: 'POST', cookie, body: { password: 'wrong' } }); ok(r.status === 403, 'delete needs the right password'); }
{ const r = await req('/api/account/delete', { method: 'POST', cookie, body: { password } }); ok(r.json?.success, 'delete account'); }
{ const r = await req('/api/auth/login', { method: 'POST', body: { email, password } }); ok(r.status === 401, 'deleted account can no longer log in'); }

console.log('\nnewsletter');
{
  const sub = `smoke-news+${Date.now()}@example.test`;
  const r = await req('/api/subscribe', { method: 'POST', body: { email: sub } }); ok(r.json?.success, 'subscribe');
  const u = await req('/api/unsubscribe?token=zz', { method: 'POST' }); ok(u.status === 400, 'one-click unsubscribe validates the token');
}

console.log('\npayment webhook');
if (env.RAZORPAY_WEBHOOK_SECRET) {
  const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_smoke', amount: 100, currency: 'INR', notes: { userId: '1', plan: 'yearly' } } } } });
  const sig = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
  const bad = await req('/api/payment/webhook', { method: 'POST', body, headers: { 'x-razorpay-signature': 'deadbeef' } });
  ok(bad.status === 400, 'webhook rejects a bad signature');
  const r = await req('/api/payment/webhook', { method: 'POST', body, headers: { 'x-razorpay-signature': sig } });
  ok(r.json?.status === 'amount_mismatch', `Rs 1 payment for a yearly plan is refused (${r.json?.status})`);
}

if (ADMIN_HOST && env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
  console.log('\nadmin');
  { const r = await req('/', { host: ADMIN_HOST }); ok(r.status === 200, `admin host serves the dashboard (${r.status})`); }
  { const r = await req('/api/admin/stats', { host: ADMIN_HOST }); ok(r.status === 401, 'admin API needs a session'); }
  { const r = await req('/api/admin/auth', { method: 'POST', host: ADMIN_HOST, body: { email: env.ADMIN_EMAIL, password: 'wrong' } }); ok(r.status === 401, 'wrong admin password rejected'); }
  { const r = await req('/api/admin/auth', { host: ADMIN_HOST }); ok(r.status === 200 && r.json?.totpRequired === Boolean(env.ADMIN_TOTP_SECRET), `login form knows whether 2FA is on (${r.json?.totpRequired})`); }
  if (env.ADMIN_TOTP_SECRET) {
    const x = await req('/api/admin/auth', { method: 'POST', host: ADMIN_HOST, body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, code: '000000' } });
    ok(x.status === 401, 'right password with a wrong authenticator code is refused');
  }
  const r = await req('/api/admin/auth', { method: 'POST', host: ADMIN_HOST, body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, code: env.ADMIN_TOTP_SECRET ? totpNow(env.ADMIN_TOTP_SECRET) : undefined } });
  ok(r.json?.success, 'admin login');
  const ac = cookieFrom(r.setCookie);
  for (const p of ['/api/admin/stats', '/api/admin/messages', '/api/admin/emails', '/api/admin/emails/templates', '/api/admin/blogs', '/api/admin/ads', '/api/admin/prices/overrides']) {
    const x = await req(p, { host: ADMIN_HOST, cookie: ac }); ok(x.status === 200, `${p} -> ${x.status}`);
  }
  { const x = await req('/api/admin/auth', { method: 'DELETE', host: ADMIN_HOST, cookie: ac }); ok(x.setCookie.some((c) => /admin_token=;/.test(c)), 'admin logout clears the cookie'); }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
