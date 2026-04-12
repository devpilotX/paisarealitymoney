import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

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

interface SchemeRow extends RowDataPacket {
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
  states: string | null;
  categories: string | null;
  max_income: number | null;
  occupations: string | null;
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

function parseJsonArray(jsonStr: string | null): string[] {
  if (!jsonStr) return [];
  try {
    const parsed: unknown = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
    return [];
  } catch {
    return [];
  }
}

function calculateMatchScore(scheme: SchemeRow, profile: UserProfile): number {
  let score = 50;
  let disqualified = false;

  // Age check
  if (profile.age !== undefined) {
    if (scheme.min_age !== null && profile.age < scheme.min_age) disqualified = true;
    if (scheme.max_age !== null && profile.age > scheme.max_age) disqualified = true;
    if (!disqualified && scheme.min_age !== null && scheme.max_age !== null) score += 10;
  }

  // Gender check
  if (profile.gender && scheme.gender !== 'all') {
    if (scheme.gender !== profile.gender) disqualified = true;
    else score += 10;
  }

  // State check
  if (profile.state) {
    const schemeStates = parseJsonArray(scheme.states);
    if (schemeStates.length > 0) {
      const stateMatch = schemeStates.some(
        (s) => s.toLowerCase() === 'all' || s.toLowerCase() === profile.state?.toLowerCase()
      );
      if (!stateMatch) disqualified = true;
      else score += 10;
    }
  }

  // Category check
  if (profile.category) {
    const schemeCats = parseJsonArray(scheme.categories);
    if (schemeCats.length > 0) {
      const catMatch = schemeCats.some(
        (c) => c.toLowerCase() === 'all' || c.toLowerCase() === profile.category?.toLowerCase()
      );
      if (!catMatch) disqualified = true;
      else score += 10;
    }
  }

  // Income check
  if (profile.income !== undefined && scheme.max_income !== null) {
    if (profile.income > scheme.max_income) disqualified = true;
    else score += 10;
  }

  // Occupation check
  if (profile.occupation) {
    const schemeOccs = parseJsonArray(scheme.occupations);
    if (schemeOccs.length > 0) {
      const occMatch = schemeOccs.some(
        (o) => o.toLowerCase() === 'all' || o.toLowerCase() === profile.occupation?.toLowerCase()
      );
      if (!occMatch) disqualified = true;
      else score += 5;
    }
  }

  // Education check
  if (profile.education && scheme.education_min) {
    const userLevel = getEducationLevel(profile.education);
    const requiredLevel = getEducationLevel(scheme.education_min);
    if (userLevel < requiredLevel) disqualified = true;
    else score += 5;
  }

  // Area check
  if (profile.area && scheme.area !== 'all') {
    if (scheme.area !== profile.area) disqualified = true;
    else score += 5;
  }

  // BPL check
  if (scheme.bpl_required && !profile.bpl) disqualified = true;
  if (scheme.bpl_required && profile.bpl) score += 10;

  // Minority check
  if (scheme.minority_only && !profile.minority) disqualified = true;
  if (scheme.minority_only && profile.minority) score += 5;

  // Disability check
  if (scheme.disability_only && !profile.disability) disqualified = true;
  if (scheme.disability_only && profile.disability) score += 5;

  // Bonus for benefit amount
  if (scheme.benefit_amount_max) {
    if (scheme.benefit_amount_max >= 500000) score += 5;
    else if (scheme.benefit_amount_max >= 100000) score += 3;
  }

  if (disqualified) return 0;
  return Math.min(score, 100);
}

export async function matchSchemes(profile: UserProfile): Promise<MatchedScheme[]> {
  try {
    const schemes = await query<SchemeRow[]>(
      `SELECT id, slug, name, name_hi, category, level, ministry, benefit_summary,
              benefit_amount_max, apply_url, official_url, min_age, max_age, gender,
              states, categories, max_income, occupations, education_min, area,
              bpl_required, minority_only, disability_only
       FROM schemes
       WHERE is_active = TRUE
       ORDER BY name`
    );

    const matched: MatchedScheme[] = [];

    for (const scheme of schemes) {
      const score = calculateMatchScore(scheme, profile);
      if (score > 0) {
        matched.push({
          id: scheme.id,
          slug: scheme.slug,
          name: scheme.name,
          nameHi: scheme.name_hi,
          category: scheme.category,
          level: scheme.level,
          ministry: scheme.ministry,
          benefitSummary: scheme.benefit_summary,
          benefitAmountMax: scheme.benefit_amount_max,
          applyUrl: scheme.apply_url,
          officialUrl: scheme.official_url,
          matchScore: score,
        });
      }
    }

    matched.sort((a, b) => b.matchScore - a.matchScore);
    return matched;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Scheme matching failed: ${message}`);
    throw new Error(`Failed to match schemes: ${message}`);
  }
}

export async function getSchemesByCategory(category: string): Promise<MatchedScheme[]> {
  try {
    const schemes = await query<SchemeRow[]>(
      `SELECT id, slug, name, name_hi, category, level, ministry, benefit_summary,
              benefit_amount_max, apply_url, official_url, min_age, max_age, gender,
              states, categories, max_income, occupations, education_min, area,
              bpl_required, minority_only, disability_only
       FROM schemes
       WHERE is_active = TRUE AND category = ?
       ORDER BY benefit_amount_max DESC, name`,
      [category]
    );
    return schemes.map((s) => ({
      id: s.id, slug: s.slug, name: s.name, nameHi: s.name_hi,
      category: s.category, level: s.level, ministry: s.ministry,
      benefitSummary: s.benefit_summary, benefitAmountMax: s.benefit_amount_max,
      applyUrl: s.apply_url, officialUrl: s.official_url, matchScore: 50,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get schemes by category: ${message}`);
  }
}

export async function getSchemesByState(state: string): Promise<MatchedScheme[]> {
  try {
    const schemes = await query<SchemeRow[]>(
      `SELECT id, slug, name, name_hi, category, level, ministry, benefit_summary,
              benefit_amount_max, apply_url, official_url, min_age, max_age, gender,
              states, categories, max_income, occupations, education_min, area,
              bpl_required, minority_only, disability_only
       FROM schemes
       WHERE is_active = TRUE AND (states IS NULL OR states LIKE ? OR states LIKE '%"all"%')
       ORDER BY benefit_amount_max DESC, name`,
      [`%${state}%`]
    );
    return schemes.map((s) => ({
      id: s.id, slug: s.slug, name: s.name, nameHi: s.name_hi,
      category: s.category, level: s.level, ministry: s.ministry,
      benefitSummary: s.benefit_summary, benefitAmountMax: s.benefit_amount_max,
      applyUrl: s.apply_url, officialUrl: s.official_url, matchScore: 50,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get schemes by state: ${message}`);
  }
}

export default { matchSchemes, getSchemesByCategory, getSchemesByState };