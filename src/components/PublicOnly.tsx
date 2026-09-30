'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hides public-site furniture (header, footer, cookie banner, assistant) inside
 * the admin area, which is served on admin.paisareality.com and rewritten to /admin.
 */
export default function PublicOnly({ children }: { children: React.ReactNode }): React.ReactElement | null {
  const path = usePathname() ?? '/';
  // On admin.paisareality.com the address bar shows /, so check the host as well as the path.
  const [adminHost, setAdminHost] = useState(false);
  useEffect(() => { setAdminHost(window.location.hostname.startsWith('admin.')); }, []);
  if (adminHost || path === '/admin' || path.startsWith('/admin/')) return null;
  return <>{children}</>;
}
