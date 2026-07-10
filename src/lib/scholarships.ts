import { query, execute } from '@/lib/db';
import type { QueryResultRow } from 'pg';

/** Form option constants for the eligibility flow. */
export const CLASS_LEVELS = [
  { value: 'class-1-8', label: 'Class 1 to 8' },
  { value: 'class-9-10', label: 'Class 9 to 10' },
  { value: 'class-11-12', label: 'Class 11 to 12' },
  { value: 'iti', label: 'ITI' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'undergraduate', label: 'Undergraduate (degree)' },
  { value: 'postgraduate', label: 'Postgraduate' },
  { value: 'phd', label: 'PhD / Research' },
] as const;

export const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'obc', label: 'OBC' },
  { value: 'sc', label: 'SC' },
  { value: 'st', label: 'ST' },
  { value: 'ebc', label: 'EBC' },
  { value: 'ews', label: 'EWS' },
  { value: 'minority', label: 'Minority' },
] as const;

export const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
] as const;

export interface ScholarshipRow extends QueryResultRow {
  id: number;
  slug: string;
  name: string;
  provider: string | null;
  level: string;
  state: string | null;
  categories: string[];
  gender: string;
  class_levels: string[];
  income_max: number | null;
  amount_min: number | null;
  amount_max: number | null;
  benefit_summary: string | null;
  eligibility_summary: string | null;
  documents: string[];
  how_to_apply: string | null;
  official_url: string | null;
  opens_on: string | null;
  deadline: string | null;
  last_verified: string | null;
}

export interface Scholarship {
  id: number;
  slug: string;
  name: string;
  provider: string | null;
  level: string;
  state: string | null;
  categories: string[];
  gender: string;
  classLevels: string[];
  incomeMax: number | null;
  amountMin: number | null;
  amountMax: number | null;
  benefitSummary: string | null;
  eligibilitySummary: string | null;
  documents: string[];
  howToApply: string | null;
  officialUrl: string | null;
  opensOn: string | null;
  deadline: string | null;
  lastVerified: string | null;
}

export interface EligibilityProfile {
  classLevel?: string;
  category?: string;
  state?: string;
  income?: number | null;
  gender?: string;
}

function toScholarship(r: ScholarshipRow): Scholarship {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    provider: r.provider,
    level: r.level,
    state: r.state,
    categories: r.categories ?? [],
    gender: r.gender,
    classLevels: r.class_levels ?? [],
    incomeMax: r.income_max,
    amountMin: r.amount_min,
    amountMax: r.amount_max,
    benefitSummary: r.benefit_summary,
    eligibilitySummary: r.eligibility_summary,
    documents: r.documents ?? [],
    howToApply: r.how_to_apply,
    officialUrl: r.official_url,
    opensOn: r.opens_on,
    deadline: r.deadline,
    lastVerified: r.last_verified,
  };
}

const SELECT_COLS = `id, slug, name, provider, level, state, categories, gender, class_levels,
  income_max, amount_min, amount_max, benefit_summary, eligibility_summary, documents,
  how_to_apply, official_url, opens_on::text AS opens_on, deadline::text AS deadline,
  last_verified::text AS last_verified`;

export async function getAllScholarships(): Promise<Scholarship[]> {
  const rows = await query<ScholarshipRow>(
    `SELECT ${SELECT_COLS} FROM scholarships WHERE active = TRUE
     ORDER BY (deadline IS NULL), deadline ASC, amount_max DESC NULLS LAST, name ASC`,
  );
  return rows.map(toScholarship);
}

export async function getScholarshipBySlug(slug: string): Promise<Scholarship | null> {
  const rows = await query<ScholarshipRow>(
    `SELECT ${SELECT_COLS} FROM scholarships WHERE slug = $1 AND active = TRUE LIMIT 1`,
    [slug],
  );
  return rows[0] ? toScholarship(rows[0]) : null;
}

/** True when the profile satisfies a scholarship's stated eligibility. */
export function isEligible(s: Scholarship, p: EligibilityProfile): boolean {
  if (s.classLevels.length > 0 && p.classLevel && !s.classLevels.includes(p.classLevel)) return false;
  if (!s.categories.includes('all') && p.category && !s.categories.includes(p.category)) return false;
  if (s.gender !== 'all' && p.gender && p.gender !== 'other' && s.gender !== p.gender) return false;
  if (s.state && p.state && s.state !== p.state) return false;
  if (s.incomeMax != null && p.income != null && p.income > s.incomeMax) return false;
  return true;
}

/** Return the scholarships a profile is eligible for (already deadline-sorted). */
export async function matchScholarships(p: EligibilityProfile): Promise<Scholarship[]> {
  const all = await getAllScholarships();
  return all.filter((s) => isEligible(s, p));
}

export async function addScholarshipReminder(
  email: string,
  scholarshipId: number,
  daysBefore: number,
): Promise<void> {
  await execute(
    `INSERT INTO scholarship_reminders (email, scholarship_id, days_before)
     VALUES ($1, $2, $3)
     ON CONFLICT (email, scholarship_id, days_before) DO UPDATE SET sent_at = NULL`,
    [email.toLowerCase().trim(), scholarshipId, daysBefore],
  );
}

export interface DueReminder extends QueryResultRow {
  id: number;
  email: string;
  days_before: number;
  name: string;
  slug: string;
  deadline: string;
  official_url: string | null;
}

/** Reminders whose scholarship deadline is now within `days_before` days and not yet sent. */
export async function getDueScholarshipReminders(): Promise<DueReminder[]> {
  return query<DueReminder>(
    `SELECT r.id, r.email, r.days_before, s.name, s.slug,
            s.deadline::text AS deadline, s.official_url
       FROM scholarship_reminders r
       JOIN scholarships s ON s.id = r.scholarship_id
      WHERE r.sent_at IS NULL
        AND s.active = TRUE
        AND s.deadline IS NOT NULL
        AND s.deadline >= CURRENT_DATE
        AND s.deadline <= CURRENT_DATE + (r.days_before || ' days')::interval`,
  );
}

export async function markReminderSent(id: number): Promise<void> {
  await execute('UPDATE scholarship_reminders SET sent_at = NOW() WHERE id = $1', [id]);
}
