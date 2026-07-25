/**
 * Free source-level metadata audit (Phase 1.4 replacement).
 * READ-ONLY. Computes RENDERED title/description lengths for every
 * DB-driven page family using the real template strings from the routes,
 * then reports over-length and duplicate metadata.
 *
 * Run: npx tsx -r dotenv/config seo/tools/metadata-audit.ts
 */
import { query } from '../../src/lib/db';

const TITLE_MAX = 60;
const DESC_MAX = 155;

interface Row {
  [k: string]: unknown;
}

function len(s: string): number {
  return s.length;
}

function truncDesc(raw: string): string {
  // mirrors src/app/schemes/[slug]/page.tsx exactly
  return raw.length > 160 ? `${raw.slice(0, 157).trimEnd()}...` : raw;
}

function dupes(values: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return new Map([...m.entries()].filter(([, n]) => n > 1));
}

function summarise(
  family: string,
  rows: { key: string; title: string; desc: string }[]
): void {
  const overT = rows.filter((r) => len(r.title) > TITLE_MAX);
  const overD = rows.filter((r) => len(r.desc) > DESC_MAX);
  const dupT = dupes(rows.map((r) => r.title));
  const dupD = dupes(rows.map((r) => r.desc));
  const lens = rows.map((r) => len(r.title));
  const avg = lens.length ? Math.round(lens.reduce((a, b) => a + b, 0) / lens.length) : 0;

  console.log(`\n=== ${family} (${rows.length} pages) ===`);
  console.log(
    `titles >${TITLE_MAX}: ${overT.length}/${rows.length} (${rows.length ? Math.round((overT.length / rows.length) * 100) : 0}%)  avg=${avg}  max=${lens.length ? Math.max(...lens) : 0}`
  );
  console.log(
    `descs  >${DESC_MAX}: ${overD.length}/${rows.length} (${rows.length ? Math.round((overD.length / rows.length) * 100) : 0}%)`
  );
  console.log(`duplicate titles: ${dupT.size} groups   duplicate descs: ${dupD.size} groups`);

  const worst = [...rows].sort((a, b) => len(b.title) - len(a.title)).slice(0, 10);
  console.log(`-- 10 longest rendered titles --`);
  for (const r of worst) {
    console.log(`  ${String(len(r.title)).padStart(3)}  ${r.key}`);
    console.log(`       "${r.title}"`);
  }
  if (dupT.size) {
    console.log(`-- duplicate title groups (top 5) --`);
    for (const [t, n] of [...dupT.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      console.log(`  x${n}  "${t.slice(0, 90)}"`);
    }
  }
  if (dupD.size) {
    console.log(`-- duplicate desc groups (top 5) --`);
    for (const [d, n] of [...dupD.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      console.log(`  x${n}  "${d.slice(0, 90)}"`);
    }
  }
}

async function main(): Promise<void> {
  // ---------- schemes ----------
  const schemes = await query<Row>(
    `SELECT slug, name, benefit_summary, meta_title, meta_description
     FROM schemes WHERE is_active = TRUE ORDER BY slug`
  );
  summarise(
    'schemes/[slug]',
    schemes.map((s) => {
      const name = String(s.name ?? '');
      const title = (s.meta_title as string) || `${name} - Eligibility, Benefits & Apply Online 2026`;
      const raw =
        (s.meta_description as string) ||
        `${String(s.benefit_summary ?? '')} Check eligibility, required documents, and how to apply for ${name}.`;
      return { key: String(s.slug), title, desc: truncDesc(raw) };
    })
  );

  // how many actually have a DB override?
  const withT = schemes.filter((s) => s.meta_title).length;
  const withD = schemes.filter((s) => s.meta_description).length;
  console.log(
    `\n[schemes] DB overrides present: meta_title ${withT}/${schemes.length}, meta_description ${withD}/${schemes.length}`
  );

  // deadline coverage — data we hold but never surface
  const dl = await query<Row>(
    `SELECT COUNT(*)::int AS n FROM schemes WHERE is_active = TRUE AND deadline IS NOT NULL`
  );
  console.log(`[schemes] rows with a non-null deadline: ${dl[0]?.n} / ${schemes.length}`);

  // ---------- scholarships ----------
  const cols = await query<Row>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'scholarships'`
  );
  console.log(`\n[scholarships] columns: ${cols.map((c) => c.column_name).join(', ')}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('AUDIT FAILED:', e instanceof Error ? e.message : e);
    process.exit(1);
  });
