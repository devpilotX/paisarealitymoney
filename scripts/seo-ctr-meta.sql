-- SEO CTR optimization: custom, query-matched meta titles/descriptions for
-- high-impression scheme/scholarship pages that were using the generic fallback.
-- Idempotent and transactional: safe to re-run. Applied 2026-07-24.
--
-- NOTE: the scheme/scholarship seeds do NOT overwrite meta_title/meta_description
-- on conflict, so re-running the additive seeds preserves these. On a from-scratch
-- DB rebuild, run this after the seeds.

BEGIN;

UPDATE schemes SET
  meta_title = 'Rajiv Aarogyasri Telangana 2026: Eligibility & Apply',
  meta_description = 'Rajiv Aarogyasri gives eligible Telangana families cashless treatment for serious illnesses. Check eligibility, hospitals, health card and how to apply.'
WHERE slug = 'aarogyasri-telangana';

UPDATE schemes SET
  meta_title = 'Tamil Nadu Health Insurance Scheme 2026: Eligibility',
  meta_description = 'The Tamil Nadu Chief Minister Comprehensive Health Insurance Scheme gives eligible families cashless hospital cover. Check eligibility and how to apply.'
WHERE slug = 'cm-health-insurance-tamil-nadu';

UPDATE schemes SET
  meta_title = 'National Career Service (NCS): Free Job Portal 2026',
  meta_description = 'National Career Service (NCS) offers free job matching, career counselling and training for job seekers in India. Register and search jobs on the NCS portal.'
WHERE slug = 'national-career-service';

UPDATE scholarships SET
  meta_title = 'OPJEMS Scholarship 2026: Eligibility & How to Apply',
  meta_description = 'OPJEMS (O.P. Jindal Engineering and Management Scholarship) rewards top engineering and management students. Check eligibility, amount and how to apply.'
WHERE slug = 'opjems';

UPDATE scholarships SET
  meta_title = 'AICTE Pragati Scholarship for Girls 2026: Rs 50,000',
  meta_description = 'AICTE Pragati Scholarship gives girl students up to Rs 50,000 a year for AICTE-approved technical courses. Check eligibility, documents and how to apply.'
WHERE slug = 'pragati-girls';

UPDATE scholarships SET
  meta_title = 'Telangana ePASS Scholarship 2026: Eligibility & Apply',
  meta_description = 'Telangana ePASS is the post-matric scholarship and fee reimbursement portal for SC, ST, BC and minority students. Check eligibility and how to apply.'
WHERE slug = 'telangana-epass';

UPDATE scholarships SET
  meta_title = 'TN Post-Matric Scholarship (ADW) 2026: Eligibility',
  meta_description = 'The Tamil Nadu Adi Dravidar and Tribal Welfare post-matric scholarship gives SC, SCA and ST students fee support. Check eligibility and how to apply.'
WHERE slug = 'tn-adw-post-matric';

UPDATE scholarships SET
  meta_title = 'Vidyasaarathi Scholarship 2026: Eligibility & Apply',
  meta_description = 'Vidyasaarathi hosts many corporate and institutional scholarships for school, college and diploma students in India. Check eligibility and how to apply.'
WHERE slug = 'vidyasaarathi';

COMMIT;
