import { NextRequest, NextResponse } from 'next/server';
import { matchSchemes, type UserProfile } from '@/lib/matcher';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizeString, sanitizeInteger, sanitizeEnum } from '@/lib/sanitize';

const VALID_GENDERS = ['male', 'female', 'transgender'] as const;
const VALID_AREAS = ['urban', 'rural'] as const;
const VALID_CATEGORIES = ['general', 'obc', 'sc', 'st', 'ews'] as const;
const VALID_OCCUPATIONS = ['employed', 'self_employed', 'farmer', 'student', 'unemployed', 'retired', 'homemaker', 'daily_wage', 'business'] as const;
const VALID_EDUCATIONS = ['none', 'primary', '8th', '10th', '12th', 'diploma', 'iti', 'graduate', 'postgraduate'] as const;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rateCheck = checkRateLimit(request, 'search', RATE_LIMITS.search);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.resetIn);
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }

    const raw = body as Record<string, unknown>;
    const profile: UserProfile = {};

    const age = sanitizeInteger(raw.age, 0, 120);
    if (age !== null) profile.age = age;

    const gender = sanitizeEnum(raw.gender, VALID_GENDERS);
    if (gender) profile.gender = gender;

    const state = sanitizeString(raw.state);
    if (state) profile.state = state;

    const district = sanitizeString(raw.district);
    if (district) profile.district = district;

    const area = sanitizeEnum(raw.area, VALID_AREAS);
    if (area) profile.area = area;

    const category = sanitizeEnum(raw.category, VALID_CATEGORIES);
    if (category) profile.category = category;

    const income = sanitizeInteger(raw.income, 0, 100000000);
    if (income !== null) profile.income = income;

    const occupation = sanitizeEnum(raw.occupation, VALID_OCCUPATIONS);
    if (occupation) profile.occupation = occupation;

    const education = sanitizeEnum(raw.education, VALID_EDUCATIONS);
    if (education) profile.education = education;

    if (typeof raw.bpl === 'boolean') profile.bpl = raw.bpl;
    if (typeof raw.minority === 'boolean') profile.minority = raw.minority;
    if (typeof raw.disability === 'boolean') profile.disability = raw.disability;

    const matched = await matchSchemes(profile);

    const totalBenefitValue = matched.reduce(
      (sum, s) => sum + (s.benefitAmountMax ?? 0), 0
    );

    return NextResponse.json({
      success: true,
      count: matched.length,
      totalBenefitValue,
      schemes: matched,
    }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Match API error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}