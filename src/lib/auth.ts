import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';

interface TokenPayload {
  userId: number;
  email: string;
  plan: 'free' | 'premium';
}

interface AuthResult {
  authenticated: true;
  user: TokenPayload;
}

interface AuthError {
  authenticated: false;
  error: string;
}

type AuthCheck = AuthResult | AuthError;

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'generate_a_64_char_random_string_here') {
    throw new Error('JWT_SECRET is not configured. Set a secure random string in .env.local.');
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown hashing error';
    throw new Error(`Password hashing failed: ${message}`);
  }
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(password, hash);
    return isValid;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown verification error';
    throw new Error(`Password verification failed: ${message}`);
  }
}

export function signToken(payload: TokenPayload): string {
  const secret = getJwtSecret();
  const options: SignOptions = {
    expiresIn: TOKEN_EXPIRY,
    issuer: 'paisareality.com',
    audience: 'paisareality-users',
  };
  try {
    const token = jwt.sign(payload, secret, options);
    return token;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown signing error';
    throw new Error(`Token signing failed: ${message}`);
  }
}

export function signRefreshToken(payload: TokenPayload): string {
  const secret = getJwtSecret();
  const options: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'paisareality.com',
    audience: 'paisareality-refresh',
  };
  try {
    const token = jwt.sign(payload, secret, options);
    return token;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown signing error';
    throw new Error(`Refresh token signing failed: ${message}`);
  }
}

export function verifyToken(token: string): TokenPayload {
  const secret = getJwtSecret();
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'paisareality.com',
      audience: 'paisareality-users',
    }) as JwtPayload & TokenPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
      plan: decoded.plan,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired. Please log in again.');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token. Please log in again.');
    }
    throw new Error('Token verification failed.');
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  const secret = getJwtSecret();
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'paisareality.com',
      audience: 'paisareality-refresh',
    }) as JwtPayload & TokenPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
      plan: decoded.plan,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired. Please log in again.');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token.');
    }
    throw new Error('Refresh token verification failed.');
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

export function authenticateRequest(request: NextRequest): AuthCheck {
  const token = getTokenFromRequest(request);
  if (!token) {
    return { authenticated: false, error: 'No authentication token provided.' };
  }

  try {
    const user = verifyToken(token);
    return { authenticated: true, user };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed.';
    return { authenticated: false, error: message };
  }
}

export function unauthorizedResponse(message: string): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function validateCsrfToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) {
    return false;
  }
  return token === storedToken;
}

export default {
  hashPassword,
  verifyPassword,
  signToken,
  signRefreshToken,
  verifyToken,
  verifyRefreshToken,
  getTokenFromRequest,
  authenticateRequest,
  unauthorizedResponse,
  generateCsrfToken,
  validateCsrfToken,
};