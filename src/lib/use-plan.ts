'use client';

import { useEffect, useState } from 'react';

type Plan = 'unknown' | 'anon' | 'free' | 'premium';
let cached: Promise<Plan> | null = null;

/** One /api/auth/session request per page load, shared by every caller. */
export function loadPlan(): Promise<Plan> {
  if (!cached) {
    cached = fetch('/api/auth/session', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { signedIn?: boolean; plan?: string }) => (!d.signedIn ? 'anon' : d.plan === 'premium' ? 'premium' : 'free'))
      .catch(() => 'anon' as Plan);
  }
  return cached;
}

export function usePlan(): Plan {
  const [plan, setPlan] = useState<Plan>('unknown');
  useEffect(() => { let alive = true; void loadPlan().then((p) => alive && setPlan(p)); return () => { alive = false; }; }, []);
  return plan;
}
