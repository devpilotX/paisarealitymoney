import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { secretMatches } from '@/lib/secret-compare';
import { verifyTotp } from '@/lib/totp';
import {
  ADMIN_JWT_AUDIENCE,
  ADMIN_JWT_ISSUER,
  ADMIN_SESSION_SECONDS,
  adminTotpRequired,
} from '@/lib/admin-auth';

/**
 * The newest authenticator time step accepted. A code is valid for about 90 seconds
 * (the window allows one step of clock drift), so without this someone who saw a code
 * could reuse it. Kept in memory: PM2 runs a single process.
 */
let lastAcceptedCounter = -1;

/** GET: tells the login form whether to ask for an authenticator code. */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ totpRequired: adminTotpRequired() });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rateCheck = checkRateLimit(request, 'admin-auth', RATE_LIMITS.auth);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.resetIn);

  try {
    const { email, password, code } = (await request.json()) as {
      email?: string;
      password?: string;
      code?: string;
    };
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;
    const totpSecret = (process.env.ADMIN_TOTP_SECRET || '').trim();

    if (!adminEmail || !adminPassword || !jwtSecret) {
      return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });
    }

    // Evaluate every factor so a wrong email, password or code all take the same path
    // and the response never says which one was wrong.
    const emailOk = secretMatches((email || '').trim().toLowerCase(), adminEmail.trim().toLowerCase());
    const passwordOk = secretMatches(password || '', adminPassword);
    const totp = totpSecret ? verifyTotp(totpSecret, code || '') : { ok: true, counter: undefined };
    const fresh = !totpSecret || (totp.counter !== undefined && totp.counter > lastAcceptedCounter);

    if (!emailOk || !passwordOk || !totp.ok || !fresh) {
      return NextResponse.json(
        { error: totpSecret ? 'Invalid email, password or authenticator code' : 'Invalid credentials' },
        { status: 401 },
      );
    }
    if (totpSecret && totp.counter !== undefined) lastAcceptedCounter = totp.counter;

    const token = jwt.sign({ email: adminEmail, role: 'admin', mfa: Boolean(totpSecret) }, jwtSecret, {
      algorithm: 'HS256',
      audience: ADMIN_JWT_AUDIENCE,
      issuer: ADMIN_JWT_ISSUER,
      expiresIn: ADMIN_SESSION_SECONDS,
    });
    const response = NextResponse.json({ success: true });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: ADMIN_SESSION_SECONDS,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Sign out: clear the admin cookie. */
export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}
