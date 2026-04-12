import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ email, role: 'admin' }, jwtSecret, { expiresIn: '7d' });
    const response = NextResponse.json({ success: true });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
