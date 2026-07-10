-- Scholarships wedge: eligibility-matched scholarships + deadline reminders.
-- Idempotent and additive. Safe to run multiple times. Touches no existing table.

CREATE TABLE IF NOT EXISTS scholarships (
  id                  SERIAL PRIMARY KEY,
  slug                TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  provider            TEXT,
  level               TEXT NOT NULL DEFAULT 'central',   -- 'central' | 'state'
  state               TEXT,                              -- NULL = all-India
  categories          TEXT[] NOT NULL DEFAULT '{all}',   -- {'all'} or e.g. {'sc','st','obc'}
  gender              TEXT NOT NULL DEFAULT 'all',        -- 'all' | 'female' | 'male'
  class_levels        TEXT[] NOT NULL DEFAULT '{}',       -- e.g. {'class-9-10','undergraduate'}
  income_max          INTEGER,                            -- annual family income cap (INR); NULL = none
  amount_min          INTEGER,
  amount_max          INTEGER,
  benefit_summary     TEXT,
  eligibility_summary TEXT,
  documents           TEXT[] NOT NULL DEFAULT '{}',
  how_to_apply        TEXT,
  official_url        TEXT,
  opens_on            DATE,
  deadline            DATE,                               -- NULL = dates announced on the portal
  last_verified       DATE,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scholarships_active ON scholarships (active, deadline);
CREATE INDEX IF NOT EXISTS idx_scholarships_level ON scholarships (level, state);

CREATE TABLE IF NOT EXISTS scholarship_reminders (
  id             SERIAL PRIMARY KEY,
  email          TEXT NOT NULL,
  scholarship_id INTEGER NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  days_before    INTEGER NOT NULL DEFAULT 7,
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email, scholarship_id, days_before)
);

CREATE INDEX IF NOT EXISTS idx_scholarship_reminders_pending ON scholarship_reminders (sent_at);

-- Curated starter set. Deadlines are indicative; the official portal is always the final word.
-- INSERT ... ON CONFLICT keeps this additive and safe to re-run (only refreshes existing rows).
INSERT INTO scholarships
  (slug, name, provider, level, state, categories, gender, class_levels, income_max, amount_min, amount_max,
   benefit_summary, eligibility_summary, documents, how_to_apply, official_url, deadline, last_verified)
VALUES
  ('pre-matric-sc', 'Pre-Matric Scholarship for SC Students', 'Ministry of Social Justice and Empowerment', 'central', NULL,
   '{sc}', 'all', '{class-9-10}', 250000, 3500, 7000,
   'Support for SC students in classes 9 and 10, covering fees and a monthly allowance.',
   'SC category, studying in class 9 or 10, family income within the stated limit.',
   '{Income certificate, Caste certificate, Bank passbook, Aadhaar, Previous marksheet}',
   'Apply on the National Scholarship Portal during the annual window and get it verified by your school.',
   'https://scholarships.gov.in', NULL, '2026-07-10'),

  ('post-matric-sc', 'Post-Matric Scholarship for SC Students', 'Ministry of Social Justice and Empowerment', 'central', NULL,
   '{sc}', 'all', '{class-11-12,undergraduate,postgraduate}', 250000, 5000, 20000,
   'Maintenance allowance and fee reimbursement for SC students in class 11 and above.',
   'SC category, studying in class 11 or higher, family income within the stated limit.',
   '{Income certificate, Caste certificate, Bank passbook, Aadhaar, Admission proof}',
   'Apply on the National Scholarship Portal and complete institute verification.',
   'https://scholarships.gov.in', NULL, '2026-07-10'),

  ('post-matric-obc', 'Post-Matric Scholarship for OBC Students', 'Ministry of Social Justice and Empowerment', 'central', NULL,
   '{obc}', 'all', '{class-11-12,undergraduate,postgraduate}', 150000, 3000, 15000,
   'Fee support and allowance for OBC students in class 11 and above.',
   'OBC category, studying in class 11 or higher, family income within the stated limit.',
   '{Income certificate, Caste certificate, Bank passbook, Aadhaar, Admission proof}',
   'Apply on the National Scholarship Portal during the annual window.',
   'https://scholarships.gov.in', NULL, '2026-07-10'),

  ('pre-matric-minority', 'Pre-Matric Scholarship for Minorities', 'Ministry of Minority Affairs', 'central', NULL,
   '{minority}', 'all', '{class-9-10}', 100000, 1000, 10000,
   'Support for students from notified minority communities in classes 1 to 10.',
   'Notified minority community, family income within the stated limit, marks threshold in the previous class.',
   '{Income certificate, Community declaration, Bank passbook, Aadhaar, Previous marksheet}',
   'Apply on the National Scholarship Portal and get school verification.',
   'https://scholarships.gov.in', NULL, '2026-07-10'),

  ('nmms', 'National Means-cum-Merit Scholarship (NMMS)', 'Department of School Education', 'central', NULL,
   '{all}', 'all', '{class-9-10}', 350000, 12000, 12000,
   'Rs 12,000 per year for meritorious students of economically weaker families from class 9 to 12.',
   'Studying in class 9 in a government or aided school, cleared the NMMS test, family income within the limit.',
   '{Income certificate, Bank passbook, Aadhaar, NMMS result, School certificate}',
   'Clear the state NMMS examination, then apply and renew on the National Scholarship Portal.',
   'https://scholarships.gov.in', NULL, '2026-07-10'),

  ('pragati-girls', 'AICTE Pragati Scholarship for Girls', 'AICTE', 'central', NULL,
   '{all}', 'female', '{diploma,undergraduate}', 800000, 30000, 50000,
   'Up to Rs 50,000 per year for girl students in AICTE-approved technical courses.',
   'Girl student admitted to an AICTE-approved diploma or degree course, family income within the limit.',
   '{Income certificate, Admission proof, Bank passbook, Aadhaar, AICTE course proof}',
   'Apply on the National Scholarship Portal in the AICTE Pragati section.',
   'https://scholarships.gov.in', NULL, '2026-07-10'),

  ('pm-yasasvi', 'PM YASASVI Scholarship', 'Ministry of Social Justice and Empowerment', 'central', NULL,
   '{obc,ebc}', 'all', '{class-9-10,class-11-12}', 250000, 75000, 125000,
   'Top-class school education support for OBC, EBC and DNT students in classes 9 to 12.',
   'OBC, EBC or DNT category, cleared the YASASVI entrance test, family income within the limit.',
   '{Income certificate, Caste certificate, Bank passbook, Aadhaar, YASASVI result}',
   'Clear the YASASVI entrance test, then apply on the National Testing Agency and NSP portals.',
   'https://yet.nta.ac.in', NULL, '2026-07-10'),

  ('inspire-she', 'INSPIRE Scholarship (SHE)', 'Department of Science and Technology', 'central', NULL,
   '{all}', 'all', '{undergraduate,postgraduate}', NULL, 80000, 80000,
   'Rs 80,000 per year for top science students pursuing a degree in the natural and basic sciences.',
   'Top rank in class 12 board or a qualifying merit list, pursuing a BSc or integrated MSc in basic sciences.',
   '{Class 12 marksheet, Admission proof, Bank passbook, Aadhaar, Merit proof}',
   'Apply on the INSPIRE portal with your eligibility and admission proof.',
   'https://online-inspire.gov.in', NULL, '2026-07-10'),

  ('central-sector', 'Central Sector Scheme of Scholarship (College and University)', 'Department of Higher Education', 'central', NULL,
   '{all}', 'all', '{undergraduate,postgraduate}', 450000, 12000, 20000,
   'Scholarship for meritorious students from low-income families pursuing higher studies.',
   'Above the 80th percentile in the class 12 board, pursuing a regular degree, family income within the limit.',
   '{Class 12 marksheet, Income certificate, Bank passbook, Aadhaar, Admission proof}',
   'Apply on the National Scholarship Portal and complete institute verification.',
   'https://scholarships.gov.in', NULL, '2026-07-10'),

  ('pm-vidyalaxmi', 'PM Vidyalaxmi Education Loan Interest Support', 'Department of Higher Education', 'central', NULL,
   '{all}', 'all', '{undergraduate,postgraduate}', 800000, NULL, NULL,
   'Interest support on education loans for students admitted to quality higher-education institutions.',
   'Admission to a listed quality institution, family income within the stated limit, education loan availed.',
   '{Admission proof, Loan sanction letter, Income certificate, Aadhaar, Bank details}',
   'Apply through the PM Vidyalaxmi portal linked from the official education portal.',
   'https://www.pmvidyalaxmi.co.in', NULL, '2026-07-10')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, provider = EXCLUDED.provider, level = EXCLUDED.level, state = EXCLUDED.state,
  categories = EXCLUDED.categories, gender = EXCLUDED.gender, class_levels = EXCLUDED.class_levels,
  income_max = EXCLUDED.income_max, amount_min = EXCLUDED.amount_min, amount_max = EXCLUDED.amount_max,
  benefit_summary = EXCLUDED.benefit_summary, eligibility_summary = EXCLUDED.eligibility_summary,
  documents = EXCLUDED.documents, how_to_apply = EXCLUDED.how_to_apply, official_url = EXCLUDED.official_url,
  last_verified = EXCLUDED.last_verified, updated_at = NOW();
