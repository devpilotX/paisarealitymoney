/**
 * Additive, idempotent bank and rate seed for Paisa Reality.
 *
 * Expands the bank comparison to 50+ real Indian banks (public sector, private,
 * and small finance) with indicative current rates. Safe to run on the live
 * database: banks are upserted by slug, and each bank's rate rows are replaced
 * with a fresh set inside a single transaction. No other tables are touched.
 *
 * Rates are indicative and rounded. They move often, so the site shows an
 * "as of" date and asks users to verify with the bank before deciding.
 *
 * Run:
 *   npx ts-node -r dotenv/config --project tsconfig.scripts.json scripts/seed-banks-expansion.ts
 * or:
 *   npm run db:seed-banks-expansion
 */
import { Pool } from 'pg';

type BankType = 'public' | 'private' | 'small_finance' | 'cooperative';
type RateType = 'fd' | 'savings' | 'home_loan' | 'personal_loan' | 'car_loan' | 'education_loan';

interface Rate { type: RateType; tenure: string; general: number; senior: number | null; }
interface Bank { slug: string; name: string; type: BankType; website: string; rates: Rate[]; }

function fd(tenure: string, general: number, senior: number): Rate { return { type: 'fd', tenure, general, senior }; }
function sav(general: number): Rate { return { type: 'savings', tenure: 'Regular', general, senior: null }; }
function home(general: number): Rate { return { type: 'home_loan', tenure: 'Up to 30 years', general, senior: null }; }
function pers(general: number): Rate { return { type: 'personal_loan', tenure: 'Up to 5 years', general, senior: null }; }

const BANKS: Bank[] = [

  // Public sector banks
  { slug: 'sbi', name: 'State Bank of India (SBI)', type: 'public', website: 'https://www.sbi.co.in', rates: [fd('1 year', 6.80, 7.30), fd('2-3 years', 6.75, 7.25), fd('5 years', 6.50, 7.50), sav(2.70), home(8.50), pers(11.15)] },
  { slug: 'pnb', name: 'Punjab National Bank', type: 'public', website: 'https://www.pnbindia.in', rates: [fd('1 year', 6.80, 7.30), fd('2-3 years', 7.00, 7.50), sav(2.70), home(8.45), pers(11.40)] },
  { slug: 'bank-of-baroda', name: 'Bank of Baroda', type: 'public', website: 'https://www.bankofbaroda.in', rates: [fd('1 year', 6.85, 7.35), fd('2-3 years', 7.15, 7.65), sav(2.75), home(8.40), pers(11.05)] },
  { slug: 'canara-bank', name: 'Canara Bank', type: 'public', website: 'https://www.canarabank.com', rates: [fd('1 year', 6.85, 7.35), fd('2-3 years', 6.80, 7.30), sav(2.90), home(8.45), pers(10.95)] },
  { slug: 'union-bank', name: 'Union Bank of India', type: 'public', website: 'https://www.unionbankofindia.co.in', rates: [fd('1 year', 6.90, 7.40), fd('2-3 years', 6.70, 7.20), sav(2.75), home(8.35), pers(11.40)] },
  { slug: 'bank-of-india', name: 'Bank of India', type: 'public', website: 'https://www.bankofindia.co.in', rates: [fd('1 year', 6.80, 7.30), fd('2-3 years', 6.50, 7.00), sav(2.90), home(8.40), pers(10.85)] },
  { slug: 'indian-bank', name: 'Indian Bank', type: 'public', website: 'https://www.indianbank.in', rates: [fd('1 year', 6.80, 7.30), fd('2-3 years', 6.25, 6.75), sav(2.75), home(8.45), pers(10.50)] },
  { slug: 'central-bank-of-india', name: 'Central Bank of India', type: 'public', website: 'https://www.centralbankofindia.co.in', rates: [fd('1 year', 6.75, 7.25), fd('2-3 years', 6.50, 7.00), sav(2.90), home(8.45), pers(11.25)] },
  { slug: 'indian-overseas-bank', name: 'Indian Overseas Bank', type: 'public', website: 'https://www.iob.in', rates: [fd('1 year', 6.90, 7.40), fd('2-3 years', 6.50, 7.00), sav(2.75), home(8.40), pers(11.05)] },
  { slug: 'uco-bank', name: 'UCO Bank', type: 'public', website: 'https://www.ucobank.com', rates: [fd('1 year', 6.50, 7.00), fd('2-3 years', 6.30, 6.80), sav(2.90), home(8.45), pers(11.25)] },
  { slug: 'bank-of-maharashtra', name: 'Bank of Maharashtra', type: 'public', website: 'https://bankofmaharashtra.in', rates: [fd('1 year', 6.75, 7.25), fd('2-3 years', 6.50, 7.00), sav(2.75), home(8.35), pers(10.50)] },
  { slug: 'punjab-sind-bank', name: 'Punjab and Sind Bank', type: 'public', website: 'https://punjabandsindbank.co.in', rates: [fd('1 year', 6.30, 6.80), fd('2-3 years', 6.00, 6.50), sav(2.80), home(8.50), pers(11.50)] },
  // Private sector banks
  { slug: 'hdfc-bank', name: 'HDFC Bank', type: 'private', website: 'https://www.hdfcbank.com', rates: [fd('1 year', 6.60, 7.10), fd('2-3 years', 7.00, 7.50), fd('5 years', 7.00, 7.50), sav(3.00), home(8.70), pers(10.75)] },
  { slug: 'icici-bank', name: 'ICICI Bank', type: 'private', website: 'https://www.icicibank.com', rates: [fd('1 year', 6.70, 7.20), fd('2-3 years', 7.00, 7.50), fd('5 years', 7.00, 7.50), sav(3.00), home(8.75), pers(10.85)] },
  { slug: 'axis-bank', name: 'Axis Bank', type: 'private', website: 'https://www.axisbank.com', rates: [fd('1 year', 6.70, 7.20), fd('2-3 years', 7.10, 7.60), sav(3.00), home(8.75), pers(10.99)] },
  { slug: 'kotak-mahindra', name: 'Kotak Mahindra Bank', type: 'private', website: 'https://www.kotak.com', rates: [fd('1 year', 6.80, 7.30), fd('2-3 years', 6.90, 7.40), sav(3.00), home(8.75), pers(10.99)] },
  { slug: 'indusind-bank', name: 'IndusInd Bank', type: 'private', website: 'https://www.indusind.com', rates: [fd('1 year', 7.25, 7.85), fd('2-3 years', 7.25, 7.85), sav(3.50), home(8.85), pers(10.49)] },
  { slug: 'yes-bank', name: 'YES Bank', type: 'private', website: 'https://www.yesbank.in', rates: [fd('1 year', 7.25, 7.75), fd('2-3 years', 7.25, 7.75), sav(3.25), home(9.00), pers(10.99)] },
  { slug: 'idfc-first', name: 'IDFC FIRST Bank', type: 'private', website: 'https://www.idfcfirstbank.com', rates: [fd('1 year', 6.50, 7.00), fd('2-3 years', 7.25, 7.75), sav(3.00), home(8.85), pers(10.75)] },
  { slug: 'federal-bank', name: 'Federal Bank', type: 'private', website: 'https://www.federalbank.co.in', rates: [fd('1 year', 6.80, 7.30), fd('2-3 years', 6.60, 7.10), sav(3.00), home(8.80), pers(11.49)] },
  { slug: 'south-indian-bank', name: 'South Indian Bank', type: 'private', website: 'https://www.southindianbank.com', rates: [fd('1 year', 6.70, 7.20), fd('2-3 years', 6.50, 7.00), sav(2.90), home(9.35), pers(12.65)] },
  { slug: 'karur-vysya-bank', name: 'Karur Vysya Bank', type: 'private', website: 'https://www.kvb.co.in', rates: [fd('1 year', 7.00, 7.40), fd('2-3 years', 6.75, 7.15), sav(3.00), home(9.00), pers(11.50)] },
  { slug: 'city-union-bank', name: 'City Union Bank', type: 'private', website: 'https://www.cityunionbank.com', rates: [fd('1 year', 7.00, 7.50), fd('2-3 years', 6.25, 6.75), sav(3.00), home(9.25), pers(12.00)] },
  { slug: 'rbl-bank', name: 'RBL Bank', type: 'private', website: 'https://www.rblbank.com', rates: [fd('1 year', 7.50, 8.00), fd('2-3 years', 7.10, 7.60), sav(3.50), home(9.10), pers(14.00)] },
  { slug: 'bandhan-bank', name: 'Bandhan Bank', type: 'private', website: 'https://www.bandhanbank.com', rates: [fd('1 year', 7.25, 7.75), fd('2-3 years', 7.25, 7.75), sav(3.00), home(9.16), pers(11.55)] },
  { slug: 'dcb-bank', name: 'DCB Bank', type: 'private', website: 'https://www.dcbbank.com', rates: [fd('1 year', 7.10, 7.60), fd('2-3 years', 7.40, 7.90), sav(3.75), home(9.25), pers(13.00)] },
  { slug: 'dhanlaxmi-bank', name: 'Dhanlaxmi Bank', type: 'private', website: 'https://www.dhanbank.com', rates: [fd('1 year', 6.75, 7.25), fd('2-3 years', 6.50, 7.00), sav(3.00), home(9.35), pers(12.90)] },
  { slug: 'jammu-kashmir-bank', name: 'Jammu and Kashmir Bank', type: 'private', website: 'https://www.jkbank.com', rates: [fd('1 year', 6.75, 7.25), fd('2-3 years', 6.50, 7.00), sav(2.90), home(8.75), pers(11.74)] },
  { slug: 'karnataka-bank', name: 'Karnataka Bank', type: 'private', website: 'https://karnatakabank.com', rates: [fd('1 year', 6.85, 7.25), fd('2-3 years', 6.50, 6.90), sav(2.75), home(8.85), pers(12.46)] },
  { slug: 'tamilnad-mercantile-bank', name: 'Tamilnad Mercantile Bank', type: 'private', website: 'https://www.tmb.in', rates: [fd('1 year', 7.00, 7.50), fd('2-3 years', 6.50, 7.00), sav(2.75), home(9.00), pers(11.50)] },
  { slug: 'csb-bank', name: 'CSB Bank', type: 'private', website: 'https://www.csb.co.in', rates: [fd('1 year', 6.75, 7.25), fd('2-3 years', 5.75, 6.25), sav(3.00), home(9.49), pers(12.00)] },
  { slug: 'idbi-bank', name: 'IDBI Bank', type: 'private', website: 'https://www.idbibank.in', rates: [fd('1 year', 6.80, 7.30), fd('2-3 years', 6.50, 7.00), sav(2.90), home(8.50), pers(11.00)] },

  // Small finance banks
  { slug: 'au-small-finance', name: 'AU Small Finance Bank', type: 'small_finance', website: 'https://www.aubank.in', rates: [fd('1 year', 7.25, 7.75), fd('2-3 years', 7.50, 8.00), sav(5.00), home(8.99), pers(11.49)] },
  { slug: 'equitas-small-finance', name: 'Equitas Small Finance Bank', type: 'small_finance', website: 'https://www.equitasbank.com', rates: [fd('1 year', 7.25, 7.75), fd('2-3 years', 7.25, 7.75), sav(4.00), home(9.50), pers(11.99)] },
  { slug: 'ujjivan-small-finance', name: 'Ujjivan Small Finance Bank', type: 'small_finance', website: 'https://www.ujjivansfb.in', rates: [fd('1 year', 7.50, 8.00), fd('2-3 years', 7.20, 7.70), sav(4.00), pers(12.00)] },
  { slug: 'jana-small-finance', name: 'Jana Small Finance Bank', type: 'small_finance', website: 'https://www.janabank.com', rates: [fd('1 year', 7.25, 7.75), fd('2-3 years', 7.25, 7.75), sav(4.50), pers(12.50)] },
  { slug: 'suryoday-small-finance', name: 'Suryoday Small Finance Bank', type: 'small_finance', website: 'https://www.suryodaybank.com', rates: [fd('1 year', 8.25, 8.75), fd('2-3 years', 8.60, 9.10), sav(4.00), pers(13.00)] },
  { slug: 'esaf-small-finance', name: 'ESAF Small Finance Bank', type: 'small_finance', website: 'https://www.esafbank.com', rates: [fd('1 year', 6.50, 7.00), fd('2-3 years', 6.75, 7.25), sav(4.00), pers(12.50)] },
  { slug: 'utkarsh-small-finance', name: 'Utkarsh Small Finance Bank', type: 'small_finance', website: 'https://www.utkarsh.bank', rates: [fd('1 year', 8.00, 8.60), fd('2-3 years', 8.50, 9.10), sav(5.00), pers(11.99)] },
  { slug: 'unity-small-finance', name: 'Unity Small Finance Bank', type: 'small_finance', website: 'https://www.theunitybank.com', rates: [fd('1 year', 7.85, 8.35), fd('2-3 years', 8.15, 8.65), sav(6.00), pers(13.00)] },
  { slug: 'capital-small-finance', name: 'Capital Small Finance Bank', type: 'small_finance', website: 'https://www.capitalbank.co.in', rates: [fd('1 year', 7.25, 7.75), fd('2-3 years', 7.10, 7.60), sav(3.50), home(9.50), pers(12.00)] },
  { slug: 'north-east-small-finance', name: 'North East Small Finance Bank', type: 'small_finance', website: 'https://nesfb.com', rates: [fd('1 year', 7.50, 8.00), fd('2-3 years', 7.50, 8.00), sav(4.00), pers(13.50)] },
  { slug: 'shivalik-small-finance', name: 'Shivalik Small Finance Bank', type: 'small_finance', website: 'https://www.shivalikbank.com', rates: [fd('1 year', 7.50, 8.00), fd('2-3 years', 7.25, 7.75), sav(6.00), pers(12.50)] },
  // Foreign banks operating in India
  { slug: 'hsbc-india', name: 'HSBC India', type: 'private', website: 'https://www.hsbc.co.in', rates: [fd('1 year', 7.00, 7.50), fd('2-3 years', 7.00, 7.50), sav(2.75), home(8.50), pers(9.99)] },
  { slug: 'standard-chartered-india', name: 'Standard Chartered Bank India', type: 'private', website: 'https://www.sc.com/in', rates: [fd('1 year', 7.00, 7.50), fd('2-3 years', 6.75, 7.25), sav(2.75), home(8.65), pers(10.50)] },
  { slug: 'dbs-bank-india', name: 'DBS Bank India', type: 'private', website: 'https://www.dbs.com/in', rates: [fd('1 year', 7.00, 7.50), fd('2-3 years', 6.50, 7.00), sav(3.00), home(8.75), pers(10.99)] },
  { slug: 'deutsche-bank-india', name: 'Deutsche Bank India', type: 'private', website: 'https://www.deutschebank.co.in', rates: [fd('1 year', 7.00, 7.50), fd('2-3 years', 7.00, 7.50), sav(3.00), pers(10.90)] },
  { slug: 'nainital-bank', name: 'Nainital Bank', type: 'private', website: 'https://www.nainitalbank.co.in', rates: [fd('1 year', 6.70, 7.20), fd('2-3 years', 6.50, 7.00), sav(3.00), home(9.00), pers(12.00)] },
  // Cooperative banks
  { slug: 'saraswat-bank', name: 'Saraswat Cooperative Bank', type: 'cooperative', website: 'https://www.saraswatbank.com', rates: [fd('1 year', 7.10, 7.60), fd('2-3 years', 6.75, 7.25), sav(3.00), home(8.60), pers(11.50)] },
  { slug: 'cosmos-bank', name: 'Cosmos Cooperative Bank', type: 'cooperative', website: 'https://www.cosmosbank.com', rates: [fd('1 year', 7.25, 7.75), fd('2-3 years', 6.75, 7.25), sav(3.00), home(9.00), pers(12.00)] },
  // India Post
  { slug: 'post-office', name: 'India Post Office', type: 'public', website: 'https://www.indiapost.gov.in', rates: [fd('1 year', 6.90, 6.90), fd('2-3 years', 7.10, 7.10), fd('5 years', 7.50, 7.50), sav(4.00)] },
];


async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set. Aborting without any database change.');
    process.exit(1);
  }

  // Guard against duplicate slugs in the dataset.
  const seen = new Set<string>();
  for (const b of BANKS) {
    if (seen.has(b.slug)) throw new Error(`Duplicate bank slug: ${b.slug}`);
    seen.add(b.slug);
  }

  const pool = new Pool({ connectionString, max: 4 });
  const client = await pool.connect();
  let banksUpserted = 0;
  let ratesInserted = 0;
  try {
    await client.query('BEGIN');
    for (const b of BANKS) {
      const res = await client.query(
        `INSERT INTO banks (slug, name, type, website) VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, website = EXCLUDED.website
         RETURNING id`,
        [b.slug, b.name, b.type, b.website],
      );
      const bankId = (res.rows[0] as { id: number }).id;
      banksUpserted += 1;
      // Replace this bank's rate rows with a fresh, current set.
      await client.query('DELETE FROM bank_rates WHERE bank_id = $1', [bankId]);
      for (const r of b.rates) {
        await client.query(
          `INSERT INTO bank_rates (bank_id, rate_type, tenure, general_rate, senior_citizen_rate, effective_date)
           VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)`,
          [bankId, r.type, r.tenure, r.general, r.senior],
        );
        ratesInserted += 1;
      }
    }
    await client.query('COMMIT');
    const totals = await client.query('SELECT count(*)::int AS banks FROM banks');
    console.log(`Banks upserted: ${banksUpserted}. Rate rows written: ${ratesInserted}.`);
    console.log(`Banks table now: ${(totals.rows[0] as { banks: number }).banks}.`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e: unknown) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
