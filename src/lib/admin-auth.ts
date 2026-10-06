import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

/** Admin tokens carry their own audience, so a user token signed with the same secret can never pass. */
export const ADMIN_JWT_AUDIENCE = 'paisareality-admin';
export const ADMIN_JWT_ISSUER = 'paisareality';
export const ADMIN_SESSION_SECONDS = 60 * 60 * 12;

/** True when the admin login requires an authenticator code (ADMIN_TOTP_SECRET is set). */
export function adminTotpRequired(): boolean {
  return Boolean(process.env.ADMIN_TOTP_SECRET && process.env.ADMIN_TOTP_SECRET.trim());
}

/**
 * Pure check of a decoded admin token, for tests. Once two-factor login is on, a token
 * issued without the second factor (for example one minted before 2FA was enabled) is refused.
 */
export function adminClaimsValid(decoded: { role?: string; mfa?: boolean }, totpRequired: boolean): boolean {
  if (decoded.role !== 'admin') return false;
  if (totpRequired && decoded.mfa !== true) return false;
  return true;
}

export async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    const secret = process.env.JWT_SECRET;

    if (!token || !secret) {
      return false;
    }

    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      audience: ADMIN_JWT_AUDIENCE,
      issuer: ADMIN_JWT_ISSUER,
    }) as { role?: string; mfa?: boolean };
    return adminClaimsValid(decoded, adminTotpRequired());
  } catch {
    return false;
  }
}
