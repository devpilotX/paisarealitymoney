/**
 * Resolve who is saving a score: a logged-in user and/or an anonymous visitor.
 * anon_id is ALWAYS produced (first-party cookie) so the signup-time merge can attribute history.
 */
import { type NextRequest } from 'next/server';
import { authenticateRequest } from '../auth';
import type { Identity } from './score-repo';

export const ANON_COOKIE = 'pr_anon';
const ONE_YEAR = 60 * 60 * 24 * 365;

/** The logged-in user's id as a string, or null. (Auth stores a numeric id; we stringify it.) */
export function getUserId(request: NextRequest): string | null {
  const auth = authenticateRequest(request);
  return auth.authenticated ? String(auth.user.userId) : null;
}

/** Read the anon cookie or mint a new one. `isNew` tells the caller to set it on the response. */
export function getOrCreateAnonId(request: NextRequest): { anonId: string; isNew: boolean } {
  const existing = request.cookies.get(ANON_COOKIE)?.value;
  if (existing) return { anonId: existing, isNew: false };
  return { anonId: crypto.randomUUID(), isNew: true };
}

/** Full identity for a save plus the cookie directive to persist a new anon id. */
export function resolveIdentity(request: NextRequest): { identity: Identity; setAnonCookie: boolean; anonId: string } {
  const userId = getUserId(request);
  const { anonId, isNew } = getOrCreateAnonId(request);
  return { identity: { userId, anonId }, setAnonCookie: isNew, anonId };
}

/** Cookie options for the anon id (first-party, httpOnly, 1 year). */
export function anonCookieOptions(): { name: string; httpOnly: boolean; sameSite: 'lax'; secure: boolean; path: string; maxAge: number } {
  return { name: ANON_COOKIE, httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: ONE_YEAR };
}
