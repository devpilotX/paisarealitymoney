import { query } from '@/lib/db';
import type { QueryResultRow } from 'pg';

export interface UserProfile {
  age?: number;
  gender?: 'male' | 'female' | 'transgender';
  state?: string;
  district?: string;
  area?: 'urban' | 'rural';
  category?: string;
  income?: number;
  occupation?: string;
  education?: string;
  bpl?: boolean;
  minority?: boolean;
  disability?: boolean;
}

export interface MatchedScheme {
  id: number;
  slug: string;
  name: string;
  nameHi: string | null;
  category: string;
  level: string;
  ministry: string | null;
  benefitSummary: string;
  benefitAmountMax: number | null;
  applyUrl: string | null;
  officialUrl: string | null;
  matchScore: number;
}

interface SchemeRow extends QueryResultRow {
  id: number;
  slug: string;
  name: string;
  name_hi: string | null;
  category: string;
  level: string;
  ministry: string | null;
  benefit_summary: string;
  benefit_amount_max: number | null;
  apply_url: string | null;
  official_url: string | null;
  min_age: number | null;
  max_age: number | null;
  gender: 'all' | 'male' | 'female' | 'transgender';
  states: string[] | null;
  categories: string[] | null;
  max_income: number | null;
  occupations: string[] | null;
  education_min: string | null;
  area: 'all' | 'urban' | 'rural';
  bpl_required: boolean;
  minority_only: boolean;
  disability_only: boolean;
}

const EDUCATION_LEVELS: Record<string, number> = {
  'none': 0, 'primary': 1, '8th': 2, '10th': 3, '12th': 4,
  'graduate': 5, 'postgraduate': 6, 'diploma': 4, 'iti': 3,
};

function getEducationLevel(edu: string | undefined): number {
  if (!edu) return 0;
  return EDUCATION_LEVELS[edu.toLowerCase()] ?? 0;
}

function toStringArray(val: string[] | unknown[] | unknown | null): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter((i): i is string => typeof i === 'string');
  return [];
}

function calculateMatchScore(scheme: SchemeRow, profile: UserProfile): number {
  let score = 50;
  let disqualified = false;

  if (profile.age !== undefined) {
    if (scheme.min_age !== null && profile.age < scheme.min_age) disqualified = true;
    if (scheme.max_age !== null && profile.age > scheme.max_age) disqualified = true;
    if (!disqualified && scheme.min_age !== null && scheme.max_age !== null) score += 10;
  }

  if (profile.gender && scheme.gender !== 'all') {
    if (scheme.gender !== profile.gender) disqualified = true;
    else score += 10;
  }

  if (profile.state) {
    const schemeStates = toStringArray(scheme.states);
    if (schemeStates.length > 0) {
      const stateMatch = schemeStates.some(
        (s) => s.toLowerCase() === 'all' || s.toLowerCase() === profile.state?.toLowerCase()
      );
      if (!stateMatch) disqualified = true;
      else score += 10;
    }
  }

  if (profile.category) {
    const schemeCats = toStringArray(scheme.categories);
    if (schemeCats.length > 0) {
      const catMatch = schemeCats.some(
        (c) => c.toLowerCase() === 'all' || c.toLowerCase() === profile.category?.toLowerCase()
      );
      if (!catMatch) disqualified = true;
      else score += 10;
    }
  }

  if (profile.income !== undefined && scheme.max_income !== null) {
    if (profile.income > scheme.max_income) disqualified = true;
    else score += 10;
  }

  if (profile.occupation) {
    const schemeOccs = toStringArray(scheme.occupations);
    if (schemeOccs.length > 0) {
      const occMatch = schemeOccs.some(
        (o) => o.toLowerCase() === 'all' || o.toLowerCase() === profile.occupation?.toLowerCase()
      );
      if (!occMatch) disqualified = true;
      else score += 5;
    }
  }

  if (profile.education && scheme.education_min) {
    const userLevel = getEducationLevel(profile.education);
    const requiredLevel = getEducationLevel(scheme.education_min);
    if (userLevel < requiredLevel) disqualified = true;
    else score += 5;
  }

  if (profile.area && scheme.area !== 'all') {
    if (scheme.area !== profile.area) disqualified = true;
    else score += 5;
  }

  if (scheme.bpl_required && !profile.bpl) disqualified = true;
  if (scheme.bpl_required && profile.bpl) score += 10;

  if (scheme.minority_only && !profile.minority) disqualified = true;
  if (scheme.minority_only && profile.minority) score += 5;

  if (scheme.disability_only && !profile.disability) disqualified = true;
  if (scheme.disability_only && profile.disability) score += 5;

  if (scheme.benefit_amount_max) {
    if (scheme.benefit_amount_max >= 500000) score += 5;
    else if (scheme.benefit_amount_max >= 100000) score += 3;
  }

  if (disqualified) return 0;
  return Math.min(score, 100);
}

function mapSchemeRow(s: SchemeRow, matchScore: number): MatchedScheme {
  return {
    id: s.id, slug: s.slug, name: s.name, nameHi: s.name_hi,
    category: s.category, level: s.level, ministry: s.ministry,
    benefitSummary: s.benefit_summary, benefitAmountMax: s.benefit_amount_max,
    applyUrl: s.apply_url, officialUrl: s.official_url, matchScore,
  };
}

export async function matchSchemes(profile: UserProfile): Promise<MatchedScheme[]> {
  const schemes = await query<SchemeRow>(
    `SELECT id, slug, name, name_hi, category, level, ministry, benefit_summary,
            benefit_amount_max, apply_url, official_url, min_age, max_age, gender,
            states, categories, max_income, occupations, education_min, area,
            bpl_required, minority_only, disability_only
     FROM schemes WHERE is_active = true ORDER BY name`
  );

  const matched: MatchedScheme[] = [];
  for (const scheme of schemes) {
    const score = calculateMatchScore(scheme, profile);
    if (score > 0) matched.push(mapSchemeRow(scheme, score));
  }
  matched.sort((a, b) => b.matchScore - a.matchScore);
  return matched;
}

export async function getSchemesByCategory(category: string): Promise<MatchedScheme[]> {
  const schemes = await query<SchemeRow>(
    `SELECT id, slug, name, name_hi, category, level, ministry, benefit_summary,
            benefit_amount_max, apply_url, official_url, min_age, max_age, gender,
            states, categories, max_income, occupations, education_min, area,
            bpl_required, minority_only, disability_only
     FROM schemes WHERE is_active = true AND category = $1
     ORDER BY benefit_amount_max DESC NULLS LAST, name`,
    [category]
  );
  return schemes.map((s) => mapSchemeRow(s, 50));
}

export async function getSchemesByState(state: string): Promise<MatchedScheme[]> {
  const schemes = await query<SchemeRow>(
    `SELECT id, slug, name, name_hi, category, level, ministry, benefit_summary,
            benefit_amount_max, apply_url, official_url, min_age, max_age, gender,
            states, categories, max_income, occupations, education_min, area,
            bpl_required, minority_only, disability_only
     FROM schemes
     WHERE is_active = true AND (states IS NULL OR states @> $1::jsonb OR states @> '"all"'::jsonb)
     ORDER BY benefit_amount_max DESC NULLS LAST, name`,
    [JSON.stringify([state])]
  );
  return schemes.map((s) => mapSchemeRow(s, 50));
}

export default { matchSchemes, getSchemesByCategory, getSchemesByState };
