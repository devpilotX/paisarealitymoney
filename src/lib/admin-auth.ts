import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    const secret = process.env.JWT_SECRET;

    if (!token || !secret) {
      return false;
    }

    const decoded = jwt.verify(token, secret) as { role?: string };
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}
