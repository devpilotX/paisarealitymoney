import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { secretMatches } from '@/lib/secret-compare';
import { ADMIN_JWT_AUDIENCE, ADMIN_JWT_ISSUER, ADMIN_SESSION_SECONDS } from '@/lib/admin-auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rateCheck = checkRateLimit(request, 'admin-auth', RATE_LIMITS.auth);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.resetIn);

  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminEmail || !adminPassword || !jwtSecret) {
      return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });
    }

    // Evaluate both so a wrong email and a wrong password take the same time.
    const emailOk = secretMatches((email || '').trim().toLowerCase(), adminEmail.trim().toLowerCase());
    const passwordOk = secretMatches(password || '', adminPassword);
    if (!emailOk || !passwordOk) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ email: adminEmail, role: 'admin' }, jwtSecret, {
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
