import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

/** Admin tokens carry their own audience, so a user token signed with the same secret can never pass. */
export const ADMIN_JWT_AUDIENCE = 'paisareality-admin';
export const ADMIN_JWT_ISSUER = 'paisareality';
export const ADMIN_SESSION_SECONDS = 60 * 60 * 12;

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
    }) as { role?: string };
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}
