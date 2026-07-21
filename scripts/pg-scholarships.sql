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

-- Optional per-page SEO overrides (additive, idempotent). When NULL, the page
-- falls back to its default generated title/description.
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS meta_description TEXT;

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


-- ============================================================================
-- Expansion batch (additive, idempotent). Real, currently-running Indian
-- scholarships across central, private, and major state portals.
-- Official portals verified. Amounts left NULL where they vary or cannot be
-- asserted precisely; the official portal is always the final word.
-- ============================================================================
INSERT INTO scholarships
  (slug, name, provider, level, state, categories, gender, class_levels, income_max, amount_min, amount_max,
   benefit_summary, eligibility_summary, documents, how_to_apply, official_url, deadline, last_verified)
VALUES
  -- Central (National Scholarship Portal and ministry portals)
  ('pre-matric-st', 'Pre-Matric Scholarship for ST Students', 'Ministry of Tribal Affairs', 'central', NULL,
   '{st}', 'all', '{class-9-10}', 250000, NULL, NULL,
   'Fee support and a monthly allowance for ST students in classes 9 and 10 from low-income families.',
   'ST category, studying in class 9 or 10, family income within the stated limit.',
   '{Income certificate, Caste certificate, Bank passbook, Aadhaar, Previous marksheet}',
   'Apply on the National Scholarship Portal during the annual window and get school verification.',
   'https://scholarships.gov.in', NULL, '2026-07-12'),

  ('post-matric-st', 'Post-Matric Scholarship for ST Students', 'Ministry of Tribal Affairs', 'central', NULL,
   '{st}', 'all', '{class-11-12,undergraduate,postgraduate}', 250000, NULL, NULL,
   'Maintenance allowance and fee reimbursement for ST students in class 11 and above.',
   'ST category, studying in class 11 or higher, family income within the stated limit.',
   '{Income certificate, Caste certificate, Bank passbook, Aadhaar, Admission proof}',
   'Apply on the National Scholarship Portal and complete institute verification.',
   'https://scholarships.gov.in', NULL, '2026-07-12'),

  ('top-class-sc', 'Top Class Education Scholarship for SC Students', 'Ministry of Social Justice and Empowerment', 'central', NULL,
   '{sc}', 'all', '{undergraduate,postgraduate}', 800000, NULL, NULL,
   'Full support for SC students admitted to notified top institutions, covering tuition, living and books.',
   'SC category, admitted to a notified institution, family income within the stated limit.',
   '{Income certificate, Caste certificate, Bank passbook, Aadhaar, Admission proof}',
   'Apply on the National Scholarship Portal in the Top Class Education section.',
   'https://scholarships.gov.in', NULL, '2026-07-12'),

  ('merit-cum-means-minority', 'Merit-cum-Means Scholarship for Professional and Technical Courses (Minorities)', 'Ministry of Minority Affairs', 'central', NULL,
   '{minority}', 'all', '{undergraduate,postgraduate}', 250000, NULL, NULL,
   'Course fee support and a monthly maintenance allowance for minority students in professional and technical courses.',
   'Notified minority community, enrolled in a professional or technical course, family income within the stated limit.',
   '{Income certificate, Community declaration, Bank passbook, Aadhaar, Admission proof}',
   'Apply on the National Scholarship Portal during the annual window.',
   'https://scholarships.gov.in', NULL, '2026-07-12'),

  ('saksham-aicte', 'AICTE Saksham Scholarship for Specially-Abled Students', 'AICTE', 'central', NULL,
   '{all}', 'all', '{diploma,undergraduate}', 800000, NULL, 50000,
   'Up to Rs 50,000 per year plus tuition support for specially-abled students in AICTE-approved courses.',
   'Student with 40 percent or more disability, admitted to an AICTE-approved diploma or degree course, family income within the limit.',
   '{Income certificate, Disability certificate, Admission proof, Bank passbook, Aadhaar}',
   'Apply on the National Scholarship Portal in the AICTE Saksham section.',
   'https://scholarships.gov.in', NULL, '2026-07-12'),

  ('post-matric-disability', 'Post-Matric Scholarship for Students with Disabilities', 'Department of Empowerment of Persons with Disabilities', 'central', NULL,
   '{all}', 'all', '{class-11-12,undergraduate,postgraduate}', 250000, NULL, NULL,
   'Maintenance allowance and fee support for students with benchmark disabilities in class 11 and above.',
   'Student with 40 percent or more disability, studying in class 11 or higher, family income within the stated limit.',
   '{Income certificate, Disability certificate, Bank passbook, Aadhaar, Admission proof}',
   'Apply on the National Scholarship Portal and complete institute verification.',
   'https://scholarships.gov.in', NULL, '2026-07-12'),

  ('cbse-single-girl-child', 'CBSE Merit Scholarship for Single Girl Child', 'Central Board of Secondary Education', 'central', NULL,
   '{all}', 'female', '{class-11-12}', NULL, NULL, NULL,
   'A monthly scholarship for single girl children who scored well in the CBSE class 10 board and continue in class 11 and 12.',
   'Single girl child of her parents, passed CBSE class 10 with the required marks, continuing studies in a CBSE school.',
   '{CBSE class 10 marksheet, Single girl child affidavit, Bank passbook, Aadhaar, School certificate}',
   'Apply through the CBSE scholarship portal linked from the official CBSE website.',
   'https://www.cbse.gov.in', NULL, '2026-07-12'),

  ('pmrf', 'Prime Minister''s Research Fellowship (PMRF)', 'Ministry of Education', 'central', NULL,
   '{all}', 'all', '{phd}', NULL, NULL, NULL,
   'A high-value monthly fellowship (about Rs 70,000 to Rs 80,000) plus a research grant for doctoral research at IITs, IISc, IISERs and NITs.',
   'Meritorious student entering or in a PhD programme at an eligible institution, meeting the direct or lateral entry criteria.',
   '{Academic transcripts, Research proposal, Recommendation letters, Institution admission proof, Aadhaar}',
   'Apply through the PMRF portal under the relevant entry mode during the notified cycle.',
   'https://www.pmrf.in', NULL, '2026-07-12'),

  -- Private and foundation scholarships (official portals verified)
  ('reliance-foundation-ug', 'Reliance Foundation Undergraduate Scholarships', 'Reliance Foundation', 'central', NULL,
   '{all}', 'all', '{undergraduate}', 1500000, NULL, 200000,
   'Financial support of up to about Rs 2 lakh over the degree for first-year undergraduate students in any stream, with mentoring.',
   'First-year undergraduate student, household income under Rs 15 lakh; applications from girls and specially-abled students are encouraged.',
   '{Class 12 marksheet, Admission proof, Income proof, Bank passbook, Aadhaar}',
   'Register and apply on the official Reliance Foundation Scholarships portal during the annual window.',
   'https://scholarships.reliancefoundation.org', NULL, '2026-07-12'),

  ('reliance-foundation-pg', 'Reliance Foundation Postgraduate Scholarships', 'Reliance Foundation', 'central', NULL,
   '{all}', 'all', '{postgraduate}', NULL, NULL, 600000,
   'Up to Rs 6 lakh over the degree for meritorious postgraduate students in selected science and technology disciplines.',
   'Student admitted to an eligible postgraduate programme in the specified disciplines; selection is merit-based.',
   '{Degree marksheets, Admission proof, Bank passbook, Aadhaar, Identity proof}',
   'Register and apply on the official Reliance Foundation Scholarships portal during the annual window.',
   'https://scholarships.reliancefoundation.org', NULL, '2026-07-12'),

  ('sitaram-jindal', 'Sitaram Jindal Foundation Scholarship', 'Sitaram Jindal Foundation', 'central', NULL,
   '{all}', 'all', '{class-11-12,diploma,undergraduate,postgraduate}', NULL, NULL, NULL,
   'A monthly scholarship (roughly Rs 500 to Rs 3,200 depending on your level and course) for students from class 11 up to postgraduate study.',
   'Studying in class 11 up to postgraduate level with the required marks; separate marks thresholds apply for boys and girls.',
   '{Previous marksheet, Income proof, Admission proof, Bank passbook, Aadhaar}',
   'Download and submit the application on the official Sitaram Jindal Foundation website. Agents are not used.',
   'https://www.sitaramjindalfoundation.org', NULL, '2026-07-12'),

  ('vidyasaarathi', 'Vidyasaarathi Scholarships', 'Protean (NSDL) e-Gov Foundation', 'central', NULL,
   '{all}', 'all', '{diploma,undergraduate,postgraduate}', NULL, NULL, NULL,
   'A platform hosting many corporate and institutional scholarships for school-leavers and college students across India.',
   'Eligibility varies by the specific scholarship listed on the platform; each has its own income and course criteria.',
   '{Marksheets, Admission proof, Income proof, Bank passbook, Aadhaar}',
   'Register on the Vidyasaarathi platform and apply to the scholarships you are eligible for.',
   'https://www.vidyasaarathi.co.in', NULL, '2026-07-12'),

  -- Major state scholarship portals (umbrella; the portal hosts schemes across categories)
  ('mahadbt-maharashtra', 'Maharashtra Post-Matric Scholarships (MahaDBT)', 'Government of Maharashtra', 'state', 'Maharashtra',
   '{all}', 'all', '{class-11-12,diploma,undergraduate,postgraduate}', NULL, NULL, NULL,
   'The state single-window portal for post-matric scholarships and freeships across SC, ST, OBC, VJNT, SBC, EWS and minority schemes.',
   'Domicile of Maharashtra, enrolled in an eligible course; each scheme has its own category and income criteria.',
   '{Domicile certificate, Income certificate, Caste certificate if applicable, Bank passbook, Aadhaar, Admission proof}',
   'Register on MahaDBT, complete your profile and apply to the schemes you are eligible for.',
   'https://mahadbt.maharashtra.gov.in', NULL, '2026-07-12'),

  ('up-scholarship', 'Uttar Pradesh Scholarship (Pre and Post Matric)', 'Government of Uttar Pradesh', 'state', 'Uttar Pradesh',
   '{all}', 'all', '{class-9-10,class-11-12,undergraduate,postgraduate}', NULL, NULL, NULL,
   'The UP state portal for pre-matric and post-matric scholarships across SC, ST, OBC, general and minority categories.',
   'Domicile of Uttar Pradesh, enrolled in an eligible class or course; each scheme has its own income criteria.',
   '{Domicile certificate, Income certificate, Caste certificate if applicable, Bank passbook, Aadhaar, Previous marksheet}',
   'Register and apply on the UP Scholarship portal, then submit the printout to your institution.',
   'https://scholarship.up.gov.in', NULL, '2026-07-12'),

  ('karnataka-ssp', 'Karnataka Post-Matric Scholarship (State Scholarship Portal)', 'Government of Karnataka', 'state', 'Karnataka',
   '{all}', 'all', '{class-11-12,diploma,undergraduate,postgraduate}', NULL, NULL, NULL,
   'The Karnataka State Scholarship Portal (SSP) for post-matric scholarships across multiple welfare departments.',
   'Domicile of Karnataka, enrolled in an eligible course; each scheme has its own category and income criteria.',
   '{Domicile certificate, Income certificate, Caste certificate if applicable, Bank passbook, Aadhaar, Admission proof}',
   'Complete one-time registration (OTR) on the SSP and apply to the relevant department scheme.',
   'https://ssp.postmatric.karnataka.gov.in', NULL, '2026-07-12'),

  ('kerala-egrantz', 'Kerala e-Grantz Scholarship', 'Government of Kerala', 'state', 'Kerala',
   '{all}', 'all', '{class-11-12,undergraduate,postgraduate}', NULL, NULL, NULL,
   'The Kerala e-Grantz portal for post-matric scholarships and educational assistance for eligible students.',
   'Domicile of Kerala, enrolled in an eligible course; each scheme has its own category and income criteria.',
   '{Income certificate, Caste certificate if applicable, Bank passbook, Aadhaar, Admission proof}',
   'Apply through your institution on the e-Grantz portal, which forwards it for sanction.',
   'https://egrantz.kerala.gov.in', NULL, '2026-07-12'),

  ('wb-svmcm', 'Swami Vivekananda Merit-cum-Means Scholarship (SVMCM)', 'Government of West Bengal', 'state', 'West Bengal',
   '{all}', 'all', '{class-11-12,undergraduate,postgraduate,phd}', 250000, NULL, NULL,
   'Monthly financial support (roughly Rs 1,000 to Rs 8,000 by level) for meritorious West Bengal students from class 11 to PhD.',
   'Domicile of West Bengal, good marks in the last qualifying exam, family income within the stated limit.',
   '{Income certificate, Last marksheet, Admission proof, Bank passbook, Aadhaar}',
   'Register and apply on the official SVMCM portal, then submit the printout to your institution.',
   'https://svmcm.wb.gov.in', NULL, '2026-07-12'),

  ('telangana-epass', 'Telangana Post-Matric Scholarship (ePASS)', 'Government of Telangana', 'state', 'Telangana',
   '{sc,st,obc,ebc,minority}', 'all', '{class-11-12,diploma,undergraduate,postgraduate}', NULL, NULL, NULL,
   'The Telangana ePASS portal for post-matric scholarships and fee reimbursement for SC, ST, BC, EBC and minority students.',
   'Domicile of Telangana, belonging to an eligible category, enrolled in a recognised course, family income within the scheme limit.',
   '{Income certificate, Caste certificate, Bank passbook, Aadhaar, Admission proof}',
   'Register and apply on the Telangana ePASS portal, then complete college verification.',
   'https://telanganaepass.cgg.gov.in', NULL, '2026-07-12'),

  ('ap-jnanabhumi', 'Andhra Pradesh Jnanabhumi Scholarship (Vidya Deevena)', 'Government of Andhra Pradesh', 'state', 'Andhra Pradesh',
   '{all}', 'all', '{class-11-12,diploma,undergraduate,postgraduate}', NULL, NULL, NULL,
   'The AP Jnanabhumi portal for fee reimbursement and maintenance scholarships for eligible students.',
   'Domicile of Andhra Pradesh, enrolled in an eligible course; each scheme has its own category and income criteria.',
   '{Income certificate, Caste certificate if applicable, Bank passbook, Aadhaar, Admission proof}',
   'Apply through your institution on the Jnanabhumi portal, which processes the sanction.',
   'https://jnanabhumi.ap.gov.in', NULL, '2026-07-12'),

  ('gujarat-digital', 'Digital Gujarat Scholarship', 'Government of Gujarat', 'state', 'Gujarat',
   '{all}', 'all', '{class-9-10,class-11-12,undergraduate,postgraduate}', NULL, NULL, NULL,
   'The Digital Gujarat portal for pre-matric and post-matric scholarships across SC, ST, OBC, EWS and other categories.',
   'Domicile of Gujarat, enrolled in an eligible class or course; each scheme has its own income criteria.',
   '{Income certificate, Caste certificate if applicable, Bank passbook, Aadhaar, Previous marksheet}',
   'Register on Digital Gujarat and apply to the scholarship schemes you are eligible for.',
   'https://www.digitalgujarat.gov.in', NULL, '2026-07-12'),

  ('mp-scholarship', 'Madhya Pradesh Scholarship Portal 2.0', 'Government of Madhya Pradesh', 'state', 'Madhya Pradesh',
   '{all}', 'all', '{class-9-10,class-11-12,undergraduate,postgraduate}', NULL, NULL, NULL,
   'The MP state scholarship portal for schemes such as post-matric scholarships and merit awards for eligible students.',
   'Domicile of Madhya Pradesh, enrolled in an eligible class or course; each scheme has its own income criteria.',
   '{Income certificate, Caste certificate if applicable, Bank passbook, Aadhaar, Previous marksheet}',
   'Register and apply on the MP Scholarship Portal 2.0 through your institution where required.',
   'https://scholarshipportal.mp.nic.in', NULL, '2026-07-12'),

  ('bihar-ekalyan', 'Bihar Post-Matric Scholarship (e-Kalyan)', 'Government of Bihar', 'state', 'Bihar',
   '{sc,st,obc,ebc}', 'all', '{class-11-12,undergraduate,postgraduate}', NULL, NULL, NULL,
   'The Bihar e-Kalyan portal for post-matric scholarships for SC, ST, BC and EBC students.',
   'Domicile of Bihar, belonging to an eligible category, enrolled in a recognised course, family income within the scheme limit.',
   '{Income certificate, Caste certificate, Bank passbook, Aadhaar, Admission proof}',
   'Register and apply on the Bihar e-Kalyan portal, then complete institution verification.',
   'https://www.ekalyan.bih.nic.in', NULL, '2026-07-12'),

  ('odisha-emedhabruti', 'Odisha e-Medhabruti Merit Scholarship', 'Higher Education Department, Government of Odisha', 'state', 'Odisha',
   '{all}', 'all', '{undergraduate,postgraduate}', 600000, NULL, NULL,
   'Merit-based financial assistance for Odisha students in undergraduate, postgraduate and professional courses.',
   'Permanent resident of Odisha, meeting the marks and family-income limits for the scheme.',
   '{Residence certificate, Income certificate, Last marksheet, Bank passbook, Aadhaar}',
   'Apply on the Odisha state scholarship portal and get your institution to validate the form.',
   'https://scholarship.odisha.gov.in', NULL, '2026-07-12'),

  ('rajasthan-sje', 'Rajasthan Post-Matric Scholarship (SSO)', 'Government of Rajasthan', 'state', 'Rajasthan',
   '{sc,st,obc,ebc,ews,minority}', 'all', '{class-11-12,undergraduate,postgraduate}', NULL, NULL, NULL,
   'Rajasthan post-matric scholarships for SC, ST, OBC, EBC, EWS and minority students, accessed through the SSO portal.',
   'Domicile of Rajasthan, belonging to an eligible category, enrolled in a recognised course, family income within the scheme limit.',
   '{Income certificate, Caste certificate, Bank passbook, Aadhaar, Admission proof}',
   'Log in through the Rajasthan SSO portal and apply under the Social Justice scholarship service.',
   'https://sso.rajasthan.gov.in', NULL, '2026-07-12')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, provider = EXCLUDED.provider, level = EXCLUDED.level, state = EXCLUDED.state,
  categories = EXCLUDED.categories, gender = EXCLUDED.gender, class_levels = EXCLUDED.class_levels,
  income_max = EXCLUDED.income_max, amount_min = EXCLUDED.amount_min, amount_max = EXCLUDED.amount_max,
  benefit_summary = EXCLUDED.benefit_summary, eligibility_summary = EXCLUDED.eligibility_summary,
  documents = EXCLUDED.documents, how_to_apply = EXCLUDED.how_to_apply, official_url = EXCLUDED.official_url,
  last_verified = EXCLUDED.last_verified, updated_at = NOW();



-- ============================================================================
-- Expansion batch 3 (additive, idempotent). More real, currently-running
-- Indian scholarships. Official portals verified or canonical. Amounts left
-- NULL where they vary; the official portal is always the final word.
-- ============================================================================
INSERT INTO scholarships
  (slug, name, provider, level, state, categories, gender, class_levels, income_max, amount_min, amount_max,
   benefit_summary, eligibility_summary, documents, how_to_apply, official_url, deadline, last_verified)
VALUES
  ('pmss-exservicemen', 'Prime Minister''s Scholarship Scheme (PMSS)', 'Kendriya Sainik Board, Ministry of Defence', 'central', NULL,
   '{all}', 'all', '{undergraduate}', NULL, NULL, NULL,
   'A monthly scholarship for the wards and widows of ex-servicemen and ex-Coast-Guard personnel pursuing professional degree courses.',
   'Ward or widow of an ex-serviceman or ex-Coast-Guard person, enrolled in a recognised professional degree course, meeting the merit cut-off.',
   '{Ex-serviceman dependant certificate, Class 12 and degree marksheets, Admission proof, Bank passbook, Aadhaar}',
   'Apply on the Kendriya Sainik Board portal during the annual window.',
   'https://ksb.gov.in', NULL, '2026-07-12'),

  ('national-overseas-sc', 'National Overseas Scholarship (SC and others)', 'Ministry of Social Justice and Empowerment', 'central', NULL,
   '{sc}', 'all', '{postgraduate,phd}', 800000, NULL, NULL,
   'Financial support for SC and other eligible students to pursue a masters or PhD at top-ranked foreign universities.',
   'SC (or other notified) category, admitted to an eligible foreign university for PG or PhD, family income within the stated limit.',
   '{Admission proof, Caste certificate, Income certificate, Passport, Academic transcripts}',
   'Apply on the National Overseas Scholarship portal during the annual window.',
   'https://nosmsje.gov.in', NULL, '2026-07-12'),

  ('aicte-swanath', 'AICTE Swanath Scholarship', 'AICTE', 'central', NULL,
   '{all}', 'all', '{diploma,undergraduate}', 800000, NULL, NULL,
   'Support for orphans and wards of parents who died of COVID-19 or were armed-forces or Central Armed Police martyrs, studying in AICTE-approved courses.',
   'Orphan, or ward of a COVID-19 or armed-forces or CAPF martyr, admitted to an AICTE-approved diploma or degree course, family income within the limit.',
   '{Supporting certificate, Admission proof, Income certificate, Bank passbook, Aadhaar}',
   'Apply on the National Scholarship Portal in the AICTE Swanath section.',
   'https://scholarships.gov.in', NULL, '2026-07-12'),

  ('ugc-pg-single-girl', 'UGC Post-Graduate Scholarship for Single Girl Child', 'University Grants Commission', 'central', NULL,
   '{all}', 'female', '{postgraduate}', NULL, NULL, NULL,
   'A scholarship for single girl children pursuing postgraduate study, to encourage families to educate a single girl child.',
   'A single girl child of her parents, enrolled in a recognised postgraduate programme, within the age limit set by UGC.',
   '{Single girl child affidavit, PG admission proof, Marksheets, Bank passbook, Aadhaar}',
   'Apply on the UGC scholarship portal or the National Scholarship Portal during the annual window.',
   'https://www.ugc.gov.in', NULL, '2026-07-12'),

  ('aditya-birla-scholarship', 'Aditya Birla Scholarship', 'Aditya Birla Group', 'central', NULL,
   '{all}', 'all', '{undergraduate,postgraduate}', NULL, NULL, NULL,
   'A prestigious merit scholarship for top-performing students at select premier engineering, management and law institutions in India.',
   'Studying at a partner premier institution (such as top IITs, IIMs, BITS, law schools) and ranking among the top of your class.',
   '{Institute and rank proof, Marksheets, Admission proof, Bank passbook, Aadhaar}',
   'Selected candidates are shortlisted from partner institutes; details and forms are on the official Aditya Birla Scholars site.',
   'https://www.adityabirlascholars.net', NULL, '2026-07-12'),

  ('glow-lovely-careers', 'Glow and Lovely Careers Foundation Scholarship', 'Glow and Lovely Careers Foundation (HUL)', 'central', NULL,
   '{all}', 'female', '{undergraduate,postgraduate}', NULL, NULL, 50000,
   'Financial assistance for women aged 15 to 30 pursuing undergraduate or postgraduate education, along with career resources.',
   'Woman aged 15 to 30, enrolled in or seeking admission to a recognised UG or PG course, from a financially weaker background.',
   '{Marksheets, Admission proof, Income proof, Bank passbook, Aadhaar}',
   'Register and apply on the Glow and Lovely Careers platform during the scholarship window.',
   'https://www.glowandlovelycareers.in', NULL, '2026-07-12'),

  ('vidyadhan', 'Vidyadhan Scholarship', 'Sarojini Damodaran Foundation', 'central', NULL,
   '{all}', 'all', '{class-11-12,undergraduate}', NULL, NULL, NULL,
   'Merit-cum-means scholarships that support students from economically weaker families from class 11 through their undergraduate degree.',
   'Strong marks in the qualifying exam and a low family income; specific criteria vary by the state programme you apply under.',
   '{Marksheet, Income proof, Admission proof, Bank passbook, Aadhaar}',
   'Apply on the Vidyadhan portal under your state programme during the annual window.',
   'https://www.vidyadhan.org', NULL, '2026-07-12'),

  ('hp-hpepass', 'Himachal Pradesh Post-Matric Scholarship (HP ePASS)', 'Government of Himachal Pradesh', 'state', 'Himachal Pradesh',
   '{all}', 'all', '{class-11-12,undergraduate,postgraduate}', NULL, NULL, NULL,
   'The Himachal Pradesh ePASS portal for post-matric scholarships across SC, ST, OBC, minority and other categories.',
   'Domicile of Himachal Pradesh, enrolled in an eligible course; each scheme has its own category and income criteria.',
   '{Domicile certificate, Income certificate, Caste certificate if applicable, Bank passbook, Aadhaar, Admission proof}',
   'Register and apply on the HP ePASS portal, then complete institution verification.',
   'https://hpepass.cgg.gov.in', NULL, '2026-07-12'),

  ('jharkhand-ekalyan', 'Jharkhand Post-Matric Scholarship (e-Kalyan)', 'Government of Jharkhand', 'state', 'Jharkhand',
   '{sc,st,obc,minority}', 'all', '{class-11-12,undergraduate,postgraduate}', NULL, NULL, NULL,
   'The Jharkhand e-Kalyan portal for post-matric scholarships for SC, ST, OBC and minority students.',
   'Domicile of Jharkhand, belonging to an eligible category, enrolled in a recognised course, family income within the scheme limit.',
   '{Income certificate, Caste certificate, Bank passbook, Aadhaar, Admission proof}',
   'Register and apply on the Jharkhand e-Kalyan portal, then complete college verification.',
   'https://www.ekalyan.cgg.gov.in', NULL, '2026-07-12'),

  ('delhi-post-matric', 'Delhi Post-Matric Scholarship', 'Government of NCT of Delhi', 'state', 'Delhi',
   '{sc,st,obc,minority}', 'all', '{class-11-12,undergraduate,postgraduate}', NULL, NULL, NULL,
   'Post-matric scholarships for eligible Delhi students, accessed through the Delhi e-District portal.',
   'Resident of Delhi, belonging to an eligible category, enrolled in a recognised course, family income within the scheme limit.',
   '{Income certificate, Caste certificate, Bank passbook, Aadhaar, Admission proof}',
   'Apply through the Delhi e-District portal under the relevant department service.',
   'https://edistrict.delhigovt.nic.in', NULL, '2026-07-12'),

  ('haryana-post-matric', 'Haryana Post-Matric Scholarship', 'Government of Haryana', 'state', 'Haryana',
   '{sc,obc,ebc,minority}', 'all', '{class-11-12,undergraduate,postgraduate}', NULL, NULL, NULL,
   'Post-matric scholarships for eligible Haryana students, accessed through the Haryana scholarship portal.',
   'Domicile of Haryana, belonging to an eligible category, enrolled in a recognised course, family income within the scheme limit.',
   '{Domicile certificate, Income certificate, Caste certificate, Bank passbook, Aadhaar, Admission proof}',
   'Register and apply on the Haryana scholarship portal, then complete institution verification.',
   'https://harchhatravratti.highereduhry.ac.in', NULL, '2026-07-12')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, provider = EXCLUDED.provider, level = EXCLUDED.level, state = EXCLUDED.state,
  categories = EXCLUDED.categories, gender = EXCLUDED.gender, class_levels = EXCLUDED.class_levels,
  income_max = EXCLUDED.income_max, amount_min = EXCLUDED.amount_min, amount_max = EXCLUDED.amount_max,
  benefit_summary = EXCLUDED.benefit_summary, eligibility_summary = EXCLUDED.eligibility_summary,
  documents = EXCLUDED.documents, how_to_apply = EXCLUDED.how_to_apply, official_url = EXCLUDED.official_url,
  last_verified = EXCLUDED.last_verified, updated_at = NOW();



-- ============================================================================
-- Expansion batch 4 (additive, idempotent). More real scholarships with
-- verified or well-established official portals. Amounts NULL where they vary.
-- ============================================================================
INSERT INTO scholarships
  (slug, name, provider, level, state, categories, gender, class_levels, income_max, amount_min, amount_max,
   benefit_summary, eligibility_summary, documents, how_to_apply, official_url, deadline, last_verified)
VALUES
  ('hdfc-parivartan-ecss', 'HDFC Bank Parivartan Educational Crisis Scholarship (ECSS)', 'HDFC Bank Parivartan', 'central', NULL,
   '{all}', 'all', '{class-1-8,class-9-10,class-11-12,iti,diploma,undergraduate,postgraduate}', NULL, NULL, 75000,
   'Merit-cum-need support of up to Rs 75,000 for students at risk of dropping out due to a family or financial crisis, from class 1 to postgraduate.',
   'Faced a recent personal, family or financial crisis, consistent past academic performance, enrolled from class 1 up to postgraduate.',
   '{Marksheets, Crisis or income proof, Admission proof, Bank passbook, Aadhaar}',
   'Register and apply on the HDFC Bank Parivartan ECSS portal during the annual window.',
   'https://www.hdfcbankecss.com', NULL, '2026-07-12'),

  ('kc-mahindra-pg-abroad', 'K.C. Mahindra Scholarship for Post-Graduate Studies Abroad', 'K.C. Mahindra Education Trust', 'central', NULL,
   '{all}', 'all', '{postgraduate}', NULL, NULL, NULL,
   'An interest-free loan scholarship for outstanding Indian students admitted to reputed foreign universities for postgraduate study.',
   'Indian graduate with strong academics, admitted or applying to a recognised foreign university for a postgraduate course.',
   '{Degree marksheets, Admission proof, Passport, Recommendation letters, Bank details}',
   'Apply on the K.C. Mahindra Education Trust portal during the annual window.',
   'https://www.kcmet.org', NULL, '2026-07-12'),

  ('mahindra-all-india-talent', 'Mahindra All India Talent Scholarship (MAITS)', 'K.C. Mahindra Education Trust', 'central', NULL,
   '{all}', 'all', '{diploma,undergraduate}', NULL, NULL, 10000,
   'A scholarship of about Rs 10,000 per year for students from lower-income families pursuing job-oriented diploma or graduate courses.',
   'From an economically weaker family, enrolled in a recognised job-oriented diploma or graduate course, meeting the merit criteria.',
   '{Income certificate, Marksheets, Admission proof, Bank passbook, Aadhaar}',
   'Apply on the MAITS portal linked from the K.C. Mahindra Education Trust site.',
   'https://www.kcmet.org', NULL, '2026-07-12'),

  ('pm-cares-children', 'PM CARES for Children Scheme', 'Ministry of Women and Child Development', 'central', NULL,
   '{all}', 'all', '{class-1-8,class-9-10,class-11-12,undergraduate}', NULL, NULL, NULL,
   'Comprehensive support for children who lost both parents (or the surviving or legal guardian) to COVID-19, including education assistance and a corpus.',
   'A child who lost both parents, or the surviving parent or legal guardian or adoptive parent, to COVID-19, and was under 18 on the date of loss.',
   '{Death certificate of parents, Age proof of child, Guardian details, Bank details, Aadhaar}',
   'Apply through the PM CARES for Children portal with district authority verification.',
   'https://www.pmcaresforchildren.in', NULL, '2026-07-12'),

  ('dr-ambedkar-ebc-post-matric', 'Dr. Ambedkar Post-Matric Scholarship for EBC Students', 'Ministry of Social Justice and Empowerment', 'central', NULL,
   '{ebc}', 'all', '{class-11-12,undergraduate,postgraduate}', NULL, NULL, NULL,
   'Fee support and allowance for Economically Backward Class students in class 11 and above.',
   'EBC category, studying in class 11 or higher, family income within the scheme limit.',
   '{Income certificate, EBC certificate, Bank passbook, Aadhaar, Admission proof}',
   'Apply on the National Scholarship Portal during the annual window.',
   'https://scholarships.gov.in', NULL, '2026-07-12'),

  ('ugc-national-fellowship-sc', 'National Fellowship for Scheduled Caste Students (UGC)', 'University Grants Commission', 'central', NULL,
   '{sc}', 'all', '{phd}', NULL, NULL, NULL,
   'A research fellowship for SC students pursuing MPhil or PhD, covering a monthly stipend and contingency grant.',
   'SC category, admitted to a recognised MPhil or PhD programme, meeting the UGC selection criteria.',
   '{Caste certificate, PhD admission proof, Academic transcripts, Bank details, Aadhaar}',
   'Apply through the UGC fellowship portal during the notified cycle.',
   'https://www.ugc.gov.in', NULL, '2026-07-12'),

  ('opjems', 'O.P. Jindal Engineering and Management Scholarship (OPJEMS)', 'O.P. Jindal Foundation', 'central', NULL,
   '{all}', 'all', '{undergraduate,postgraduate}', NULL, NULL, NULL,
   'A merit scholarship for high-performing engineering and management students at select recognised institutions in India.',
   'Studying engineering or management at a participating institution with strong academics and leadership potential.',
   '{Institute proof, Marksheets, Admission proof, Bank passbook, Aadhaar}',
   'Apply on the OPJEMS portal during the annual window.',
   'https://www.opjems.com', NULL, '2026-07-12'),

  ('jn-tata-endowment', 'J.N. Tata Endowment Loan Scholarship', 'J.N. Tata Endowment', 'central', NULL,
   '{all}', 'all', '{postgraduate,phd}', NULL, NULL, NULL,
   'A loan scholarship for Indian graduates pursuing higher studies abroad, awarded on merit across disciplines.',
   'Indian graduate with a good academic record, planning or admitted to a recognised higher-study programme abroad.',
   '{Degree marksheets, Admission or application proof, Passport, Recommendation letters, Bank details}',
   'Apply on the J.N. Tata Endowment portal during the annual application window.',
   'https://www.jntataendowment.org', NULL, '2026-07-12'),

  ('narotam-sekhsaria', 'Narotam Sekhsaria Foundation Scholarship', 'Narotam Sekhsaria Foundation', 'central', NULL,
   '{all}', 'all', '{postgraduate}', NULL, NULL, NULL,
   'An interest-free loan scholarship for meritorious Indian students pursuing postgraduate studies in India or abroad.',
   'Indian graduate with an excellent academic record, admitted or applying to a recognised postgraduate programme.',
   '{Degree marksheets, Admission proof, Recommendation letters, Bank details, Aadhaar}',
   'Apply on the Narotam Sekhsaria Foundation portal during the annual window (usually via a common entrance test).',
   'https://www.nsfoundation.co.in', NULL, '2026-07-12')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, provider = EXCLUDED.provider, level = EXCLUDED.level, state = EXCLUDED.state,
  categories = EXCLUDED.categories, gender = EXCLUDED.gender, class_levels = EXCLUDED.class_levels,
  income_max = EXCLUDED.income_max, amount_min = EXCLUDED.amount_min, amount_max = EXCLUDED.amount_max,
  benefit_summary = EXCLUDED.benefit_summary, eligibility_summary = EXCLUDED.eligibility_summary,
  documents = EXCLUDED.documents, how_to_apply = EXCLUDED.how_to_apply, official_url = EXCLUDED.official_url,
  last_verified = EXCLUDED.last_verified, updated_at = NOW();



-- ============================================================================
-- Expansion batch 5 (additive, idempotent). Remaining verified state portals
-- plus Kotak Kanya. Official URLs verified via search.
-- ============================================================================
INSERT INTO scholarships
  (slug, name, provider, level, state, categories, gender, class_levels, income_max, amount_min, amount_max,
   benefit_summary, eligibility_summary, documents, how_to_apply, official_url, deadline, last_verified)
VALUES
  ('tn-adw-post-matric', 'Tamil Nadu Post-Matric Scholarship (Adi Dravidar and Tribal Welfare)', 'Government of Tamil Nadu', 'state', 'Tamil Nadu',
   '{sc,st}', 'all', '{class-11-12,diploma,undergraduate,postgraduate}', NULL, NULL, NULL,
   'Post-matric scholarships and fee support for SC, SCA and ST students of Tamil Nadu through the Adi Dravidar and Tribal Welfare Department.',
   'Domicile of Tamil Nadu, belonging to SC, SCA or ST, enrolled in a recognised post-matric course, family income within the scheme limit.',
   '{Community certificate, Income certificate, Bank passbook, Aadhaar, Admission proof}',
   'Apply on the Tamil Nadu Adi Dravidar and Tribal Welfare portal, then complete institution verification.',
   'https://www.tnadw.tn.gov.in', NULL, '2026-07-12'),

  ('uttarakhand-post-matric', 'Uttarakhand Post-Matric Scholarship', 'Government of Uttarakhand', 'state', 'Uttarakhand',
   '{sc,st,obc,minority}', 'all', '{class-11-12,undergraduate,postgraduate}', NULL, NULL, NULL,
   'Post-matric scholarships for eligible Uttarakhand students through the state Social Welfare Department.',
   'Domicile of Uttarakhand, belonging to an eligible category, enrolled in a recognised course, family income within the scheme limit.',
   '{Domicile certificate, Income certificate, Caste certificate if applicable, Bank passbook, Aadhaar, Admission proof}',
   'Register and apply on the Uttarakhand Social Welfare scholarship portal.',
   'https://socialwelfare.uk.gov.in', NULL, '2026-07-12'),

  ('assam-post-matric', 'Assam Pre and Post-Matric Scholarship', 'Government of Assam', 'state', 'Assam',
   '{sc,st,obc,minority}', 'all', '{class-9-10,class-11-12,undergraduate,postgraduate}', NULL, NULL, NULL,
   'Pre-matric and post-matric scholarships for eligible Assam students, applied through the National Scholarship Portal.',
   'Domicile of Assam, belonging to an eligible category, studying in a government or recognised institution, family income within the scheme limit.',
   '{Income certificate, Caste certificate if applicable, Bank passbook, Aadhaar, Previous marksheet}',
   'Apply on the National Scholarship Portal and complete institution verification.',
   'https://scholarships.gov.in', NULL, '2026-07-12'),

  ('punjab-post-matric', 'Punjab Post-Matric Scholarship', 'Government of Punjab', 'state', 'Punjab',
   '{sc,obc}', 'all', '{class-11-12,undergraduate,postgraduate}', NULL, NULL, NULL,
   'Post-matric scholarships and freeship for SC and OBC students of Punjab through the state scholarship portal.',
   'Domicile of Punjab, belonging to SC or OBC, enrolled in a recognised post-matric course, family income within the scheme limit.',
   '{Domicile certificate, Income certificate, Caste certificate, Bank passbook, Aadhaar, Admission proof}',
   'Register and apply on the Punjab scholarship portal (SC students may also apply via the National Scholarship Portal).',
   'https://scholarships.punjab.gov.in', NULL, '2026-07-12'),

  ('kotak-kanya', 'Kotak Kanya Scholarship', 'Kotak Education Foundation', 'central', NULL,
   '{all}', 'female', '{undergraduate}', 600000, NULL, 150000,
   'Rs 1.5 lakh per year for girl students in the first year of a professional degree, until they complete the course.',
   'Girl student in the first year of a professional degree at a reputed (NIRF or NAAC) institute, strong class 12 marks, family income up to Rs 6 lakh.',
   '{Class 12 marksheet, Admission proof, Income proof, Bank passbook, Aadhaar}',
   'Register and apply on the official Kotak Kanya Scholarship page on Buddy4Study during the annual window.',
   'https://www.buddy4study.com/page/kotak-kanya-scholarship', NULL, '2026-07-12')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, provider = EXCLUDED.provider, level = EXCLUDED.level, state = EXCLUDED.state,
  categories = EXCLUDED.categories, gender = EXCLUDED.gender, class_levels = EXCLUDED.class_levels,
  income_max = EXCLUDED.income_max, amount_min = EXCLUDED.amount_min, amount_max = EXCLUDED.amount_max,
  benefit_summary = EXCLUDED.benefit_summary, eligibility_summary = EXCLUDED.eligibility_summary,
  documents = EXCLUDED.documents, how_to_apply = EXCLUDED.how_to_apply, official_url = EXCLUDED.official_url,
  last_verified = EXCLUDED.last_verified, updated_at = NOW();


-- ============================================================================
-- Per-page SEO metadata for high-impression pages (idempotent; safe to re-run).
-- These override the default generated title/description on scholarship pages.
-- Titles render verbatim (root layout title template is '%s'), so no brand
-- suffix. Query-matched from Search Console. NULL rows keep the default.
-- Not part of the INSERT ON CONFLICT set, so re-running the seeds preserves them.
-- ============================================================================
UPDATE scholarships SET
  meta_title = 'SVMCM Scholarship 2026: Eligibility & Apply Online',
  meta_description = 'SVMCM (Swami Vivekananda Merit-cum-Means Scholarship) gives monthly aid to West Bengal students from class 11 to PhD. Check eligibility and how to apply.'
  WHERE slug = 'wb-svmcm';

UPDATE scholarships SET
  meta_title = 'e-Grantz Scholarship 2026: Last Date & Apply Online',
  meta_description = 'Kerala e-Grantz is the state portal for post-matric scholarships. Check the 2026 last date, eligibility and how to apply online through your institution.'
  WHERE slug = 'kerala-egrantz';

UPDATE scholarships SET
  meta_title = 'NMMS Scholarship 2026: Eligibility & Apply Online',
  meta_description = 'NMMS gives Rs 12,000 a year to meritorious students from low-income families in classes 9 to 12. Check eligibility, the exam and how to apply on the NSP portal.'
  WHERE slug = 'nmms';

UPDATE scholarships SET
  meta_title = 'PMRF 2026: Eligibility, Stipend & How to Apply',
  meta_description = 'PMRF gives PhD scholars at IITs, IISc, IISERs and NITs about Rs 70,000-80,000 a month plus a research grant. Check eligibility, entry modes and how to apply.'
  WHERE slug = 'pmrf';

UPDATE scholarships SET
  meta_title = 'Punjab Post-Matric Scholarship 2026: Apply Online',
  meta_description = 'Punjab post-matric scholarship gives fee support and freeship to SC and OBC students in class 11 and above. Check eligibility, income limit and how to apply.'
  WHERE slug = 'punjab-post-matric';

UPDATE scholarships SET
  meta_title = 'HP ePASS Scholarship 2026: Eligibility & Apply',
  meta_description = 'HP ePASS is the Himachal Pradesh portal for post-matric scholarships across SC, ST, OBC and minority students. Check eligibility, documents and how to apply.'
  WHERE slug = 'hp-hpepass';

UPDATE scholarships SET
  meta_title = 'Rajasthan Post-Matric Scholarship 2026: Apply',
  meta_description = 'Rajasthan post-matric scholarships for SC, ST, OBC, EBC, EWS and minority students via the SSO portal. Check eligibility, income limit and how to apply online.'
  WHERE slug = 'rajasthan-sje';

UPDATE scholarships SET
  meta_title = 'Sitaram Jindal Scholarship 2026: Eligibility & Apply',
  meta_description = 'Sitaram Jindal Foundation gives a monthly scholarship of about Rs 500 to Rs 3,200 to students from class 11 to postgraduate. Check eligibility and how to apply.'
  WHERE slug = 'sitaram-jindal';

UPDATE scholarships SET
  meta_title = 'PMSS Scholarship 2026: Ex-Servicemen Wards, Apply',
  meta_description = 'PMSS gives a monthly scholarship to wards and widows of ex-servicemen in professional degree courses. Check eligibility, the last date and how to apply.'
  WHERE slug = 'pmss-exservicemen';

UPDATE scholarships SET
  meta_title = 'Jnanabhumi Scholarship AP 2026: Eligibility & Apply',
  meta_description = 'AP Jnanabhumi (Vidya Deevena) gives fee reimbursement and maintenance scholarships to Andhra Pradesh students. Check eligibility, documents and how to apply.'
  WHERE slug = 'ap-jnanabhumi';


-- Next-tier scholarship SEO metadata (idempotent; impressions >= ~30 in GSC 90d).
UPDATE scholarships SET
  meta_title = 'MahaDBT Scholarship 2026: Maharashtra Post-Matric',
  meta_description = 'MahaDBT is the Maharashtra single-window portal for post-matric scholarships across SC, ST, OBC, EWS and minority schemes. Check eligibility and how to apply.'
  WHERE slug = 'mahadbt-maharashtra';

UPDATE scholarships SET
  meta_title = 'Glow and Lovely Scholarship 2026: Apply Online',
  meta_description = 'Glow and Lovely Careers gives financial help to women aged 15 to 30 in undergraduate or postgraduate study, up to about Rs 50,000. Check eligibility and apply.'
  WHERE slug = 'glow-lovely-careers';

UPDATE scholarships SET
  meta_title = 'Post-Matric Scholarship for OBC 2026: Apply',
  meta_description = 'The post-matric scholarship for OBC students gives fee support and an allowance in class 11 and above. Check eligibility, income limit and how to apply.'
  WHERE slug = 'post-matric-obc';

UPDATE scholarships SET
  meta_title = 'Digital Gujarat Scholarship 2026: Apply Online',
  meta_description = 'Digital Gujarat is the state portal for pre-matric and post-matric scholarships across SC, ST, OBC and EWS categories. Check eligibility and how to apply.'
  WHERE slug = 'gujarat-digital';

UPDATE scholarships SET
  meta_title = 'Uttarakhand Post-Matric Scholarship 2026',
  meta_description = 'Uttarakhand post-matric scholarships for SC, ST, OBC and minority students via the Social Welfare portal. Check eligibility, income limit and how to apply.'
  WHERE slug = 'uttarakhand-post-matric';

UPDATE scholarships SET
  meta_title = 'Dr Ambedkar Post-Matric EBC Scholarship 2026',
  meta_description = 'The Dr Ambedkar post-matric scholarship gives fee support and an allowance to EBC students in class 11 and above. Check eligibility and how to apply.'
  WHERE slug = 'dr-ambedkar-ebc-post-matric';

UPDATE scholarships SET
  meta_title = 'Reliance Foundation UG Scholarship 2026: Apply',
  meta_description = 'Reliance Foundation gives up to about Rs 2 lakh with mentoring to first-year undergraduate students with family income under Rs 15 lakh. Check how to apply.'
  WHERE slug = 'reliance-foundation-ug';

UPDATE scholarships SET
  meta_title = 'PM YASASVI Scholarship 2026: Eligibility & Apply',
  meta_description = 'PM YASASVI supports OBC, EBC and DNT students in classes 9 to 12 who clear the entrance test. Check eligibility, the exam and how to apply on NSP.'
  WHERE slug = 'pm-yasasvi';

UPDATE scholarships SET
  meta_title = 'CBSE Single Girl Child Scholarship 2026',
  meta_description = 'The CBSE Merit Scholarship for Single Girl Child supports girls who scored well in the class 10 board and continue in class 11 and 12. Check how to apply.'
  WHERE slug = 'cbse-single-girl-child';

UPDATE scholarships SET
  meta_title = 'Narotam Sekhsaria Scholarship 2026: Apply',
  meta_description = 'The Narotam Sekhsaria Foundation gives an interest-free loan scholarship for postgraduate study in India or abroad. Check eligibility and how to apply.'
  WHERE slug = 'narotam-sekhsaria';

UPDATE scholarships SET
  meta_title = 'Vidyadhan Scholarship 2026: Eligibility & Apply',
  meta_description = 'Vidyadhan gives merit-cum-means scholarships to students from low-income families from class 11 through their undergraduate degree. Check how to apply.'
  WHERE slug = 'vidyadhan';

UPDATE scholarships SET
  meta_title = 'Kotak Kanya Scholarship 2026: Eligibility & Apply',
  meta_description = 'Kotak Kanya gives Rs 1.5 lakh a year to girl students in the first year of a professional degree, with family income up to Rs 6 lakh. Check how to apply.'
  WHERE slug = 'kotak-kanya';

UPDATE scholarships SET
  meta_title = 'Haryana Post-Matric Scholarship 2026: Apply',
  meta_description = 'Haryana post-matric scholarships for SC, OBC, EBC and minority students via the state portal. Check eligibility, income limit and how to apply online.'
  WHERE slug = 'haryana-post-matric';



-- ============================================================================
-- Expansion batch 6 (additive, idempotent). Verified private/foundation
-- scholarships, official portals confirmed via search on 2026-07-21.
-- ============================================================================
INSERT INTO scholarships
  (slug, name, provider, level, state, categories, gender, class_levels, income_max, amount_min, amount_max,
   benefit_summary, eligibility_summary, documents, how_to_apply, official_url, deadline, last_verified)
VALUES
  ('santoor-womens', 'Santoor Women''s Scholarship', 'Wipro Consumer Care and Wipro Cares', 'central', NULL,
   '{all}', 'female', '{undergraduate}', NULL, 24000, 24000,
   'About Rs 24,000 per year for young women from underprivileged families to pursue graduation, covering fees and study costs.',
   'Young woman who passed Class 10 and Class 12 from a government school or junior college and is starting a full-time graduate degree; offered in Andhra Pradesh, Karnataka, Telangana and Chhattisgarh.',
   '{Class 10 and 12 marksheets, Admission proof, Income proof, Bank passbook, Aadhaar}',
   'Apply online with the required documents on the official Santoor Scholarships portal during the annual window.',
   'https://www.santoorscholarships.com', NULL, '2026-07-21'),

  ('tata-capital-pankh', 'Tata Capital Pankh Scholarship', 'Tata Capital', 'central', NULL,
   '{all}', 'all', '{class-11-12,diploma,undergraduate}', 250000, 10000, 100000,
   'Merit-cum-means scholarship of Rs 10,000 to Rs 1,00,000, covering up to 80 percent of tuition, for students from low-income families.',
   'Indian student from class 11 up to a professional degree with at least 60 percent marks and family income up to Rs 2.5 lakh a year.',
   '{Marksheets, Admission proof, Income proof, Fee receipt, Bank passbook, Aadhaar}',
   'Apply online on the Tata Capital Pankh scholarship portal when applications open, usually from September each year.',
   'https://www.tatacapital.com/sustainability/education.html', NULL, '2026-07-21'),

  ('colgate-keep-india-smiling', 'Colgate Keep India Smiling Foundation Scholarship', 'Colgate-Palmolive India', 'central', NULL,
   '{all}', 'all', '{undergraduate,postgraduate}', NULL, NULL, NULL,
   'Financial support for meritorious students from low-income families in higher education, including STEM, engineering and dental (BDS and MDS) courses, with skills and career guidance.',
   'Meritorious student from a financially weaker family pursuing an eligible higher-education course; specific marks and income criteria apply by category and year.',
   '{Marksheets, Admission proof, Income proof, Bank passbook, Aadhaar}',
   'Apply online through the Colgate Keep India Smiling Foundation Scholarship portal during the annual application window.',
   'https://www.colgate.com/en-in/smile-karo-aur-shuru-ho-jao/foundation-scholarship', NULL, '2026-07-21')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, provider = EXCLUDED.provider, level = EXCLUDED.level, state = EXCLUDED.state,
  categories = EXCLUDED.categories, gender = EXCLUDED.gender, class_levels = EXCLUDED.class_levels,
  income_max = EXCLUDED.income_max, amount_min = EXCLUDED.amount_min, amount_max = EXCLUDED.amount_max,
  benefit_summary = EXCLUDED.benefit_summary, eligibility_summary = EXCLUDED.eligibility_summary,
  documents = EXCLUDED.documents, how_to_apply = EXCLUDED.how_to_apply, official_url = EXCLUDED.official_url,
  last_verified = EXCLUDED.last_verified, updated_at = NOW();

-- SEO metadata for batch 6 (idempotent).
UPDATE scholarships SET
  meta_title = 'Santoor Women''s Scholarship 2026: Apply Online',
  meta_description = 'Santoor Women''s Scholarship gives about Rs 24,000 a year to young women from government schools to pursue graduation. Check eligibility and how to apply.'
  WHERE slug = 'santoor-womens';

UPDATE scholarships SET
  meta_title = 'Tata Capital Pankh Scholarship 2026: Apply',
  meta_description = 'Tata Capital Pankh gives Rs 10,000 to Rs 1,00,000, up to 80% of tuition, to students from low-income families. Check eligibility and how to apply online.'
  WHERE slug = 'tata-capital-pankh';

UPDATE scholarships SET
  meta_title = 'Colgate Keep India Smiling Scholarship 2026',
  meta_description = 'Colgate Keep India Smiling gives financial support to meritorious students from low-income families in STEM, engineering and dental courses. Check how to apply.'
  WHERE slug = 'colgate-keep-india-smiling';
