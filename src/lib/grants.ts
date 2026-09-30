/**
 * Read access for the grants pages. Only active programmes are ever returned, and a
 * programme whose deadline has passed is filtered out even before the daily upkeep
 * marks it inactive, so a page can never list something that has closed.
 */
import { query } from '@/lib/db';
import type { QueryResultRow } from 'pg';

export interface Grant {
  slug: string;
  name: string;
  provider: string;
  region: 'india' | 'international';
  level: 'central' | 'state' | 'private' | 'international';
  state: string | null;
  kind: string;
  fundingType: string;
  amountMinInr: number | null;
  amountMaxInr: number | null;
  amountNote: string | null;
  equityTaken: string | null;
  stage: string[];
  sectors: string[];
  summary: string;
  eligibility: string[];
  documents: string[];
  howToApply: string | null;
  applyUrl: string;
  officialUrl: string;
  status: 'rolling' | 'open' | 'closed-recurring' | 'cohort';
  opensOn: string | null;
  deadline: string | null;
  cycleNote: string | null;
  verifiedOn: string;
  linkCheckedAt: string | null;
}

interface Row extends QueryResultRow {
  slug: string; name: string; provider: string; region: Grant['region']; level: Grant['level']; state: string | null;
  kind: string; funding_type: string; amount_min_inr: string | null; amount_max_inr: string | null;
  amount_note: string | null; equity_taken: string | null; stage: string[]; sectors: string[]; summary: string;
  eligibility: string[]; documents: string[]; how_to_apply: string | null; apply_url: string; official_url: string;
  application_status: Grant['status']; opens_on: string | null; deadline: string | null; cycle_note: string | null;
  verified_on: string; link_checked_at: string | null;
}

const COLUMNS = `slug, name, provider, region, level, state, kind, funding_type, amount_min_inr, amount_max_inr, amount_note,
  equity_taken, stage, sectors, summary, eligibility, documents, how_to_apply, apply_url, official_url, application_status,
  opens_on::text, deadline::text, cycle_note, verified_on::text, link_checked_at::text`;

const LIVE = `active AND (deadline IS NULL OR deadline >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date)`;

function map(r: Row): Grant {
  return {
    slug: r.slug, name: r.name, provider: r.provider, region: r.region, level: r.level, state: r.state,
    kind: r.kind, fundingType: r.funding_type,
    amountMinInr: r.amount_min_inr == null ? null : Number(r.amount_min_inr),
    amountMaxInr: r.amount_max_inr == null ? null : Number(r.amount_max_inr),
    amountNote: r.amount_note, equityTaken: r.equity_taken, stage: r.stage ?? [], sectors: r.sectors ?? [],
    summary: r.summary, eligibility: r.eligibility ?? [], documents: r.documents ?? [], howToApply: r.how_to_apply,
    applyUrl: r.apply_url, officialUrl: r.official_url, status: r.application_status, opensOn: r.opens_on,
    deadline: r.deadline, cycleNote: r.cycle_note, verifiedOn: r.verified_on, linkCheckedAt: r.link_checked_at,
  };
}

export async function getGrants(): Promise<Grant[]> {
  try {
    const rows = await query<Row>(
      `SELECT ${COLUMNS} FROM grants WHERE ${LIVE}
        ORDER BY CASE application_status WHEN 'open' THEN 0 WHEN 'rolling' THEN 1 WHEN 'cohort' THEN 2 ELSE 3 END,
                 region, amount_max_inr DESC NULLS LAST, name`,
    );
    return rows.map(map);
  } catch {
    return [];
  }
}

export async function getGrantBySlug(slug: string): Promise<Grant | null> {
  try {
    const rows = await query<Row>(`SELECT ${COLUMNS} FROM grants WHERE slug = $1 AND ${LIVE} LIMIT 1`, [slug]);
    return rows[0] ? map(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function getGrantSlugs(): Promise<string[]> {
  try {
    return (await query<QueryResultRow & { slug: string }>(`SELECT slug FROM grants WHERE ${LIVE}`)).map((r) => r.slug);
  } catch {
    return [];
  }
}

// ---------- presentation helpers (pure) ----------

export const KIND_LABEL: Record<string, string> = {
  grant: 'Grant', 'seed-fund': 'Seed fund', accelerator: 'Accelerator', credits: 'Cloud credits',
  prize: 'Prize', fellowship: 'Fellowship', incubation: 'Incubation',
};

export const FUNDING_LABEL: Record<string, string> = {
  'non-dilutive': 'No equity taken', equity: 'Takes equity', debt: 'Loan', convertible: 'Convertible',
  mixed: 'Grant plus debt or equity', 'in-kind': 'Credits and support, no cash',
};

export const STAGE_LABEL: Record<string, string> = {
  idea: 'Idea', prototype: 'Prototype', 'early-revenue': 'Early revenue', growth: 'Growth',
};

export const STATUS_LABEL: Record<Grant['status'], string> = {
  open: 'Applications open', rolling: 'Apply any time', cohort: 'Applies in cohorts', 'closed-recurring': 'Between rounds',
};

/** "Up to ₹50 lakh", "₹5 lakh to ₹20 lakh", or null when no amount is published. */
export function formatAmount(min: number | null, max: number | null): string | null {
  const fmt = (v: number): string => {
    if (v >= 1_00_00_000) return `\u20B9${trim(v / 1_00_00_000)} crore`;
    if (v >= 1_00_000) return `\u20B9${trim(v / 1_00_000)} lakh`;
    return `\u20B9${v.toLocaleString('en-IN')}`;
  };
  if (max == null && min == null) return null;
  if (min != null && max != null && min !== max) return `${fmt(min)} to ${fmt(max)}`;
  return `Up to ${fmt((max ?? min)!)}`;
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}

export function daysLeft(deadline: string | null, today = new Date()): number | null {
  if (!deadline) return null;
  const t = new Date(today.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) + 'T00:00:00Z').getTime();
  return Math.round((Date.parse(deadline + 'T00:00:00Z') - t) / 86_400_000);
}
