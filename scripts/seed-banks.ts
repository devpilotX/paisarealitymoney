import mysql from 'mysql2/promise';

interface BankData {
  slug: string; name: string; type: 'public' | 'private' | 'small_finance' | 'cooperative';
  website: string;
  rates: Array<{ type: string; tenure: string; general: number; senior: number | null }>;
}

const BANKS: BankData[] = [
  { slug: 'sbi', name: 'State Bank of India (SBI)', type: 'public', website: 'https://www.sbi.co.in', rates: [
    { type: 'fd', tenure: '1 year to less than 2 years', general: 6.80, senior: 7.30 },
    { type: 'fd', tenure: '2 years to less than 3 years', general: 7.00, senior: 7.50 },
    { type: 'fd', tenure: '3 years to less than 5 years', general: 6.75, senior: 7.25 },
    { type: 'fd', tenure: '5 years and above', general: 6.50, senior: 7.50 },
    { type: 'savings', tenure: 'Regular', general: 2.70, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.50, senior: null },
    { type: 'personal_loan', tenure: 'Up to 6 years', general: 11.15, senior: null },
  ]},
  { slug: 'hdfc-bank', name: 'HDFC Bank', type: 'private', website: 'https://www.hdfcbank.com', rates: [
    { type: 'fd', tenure: '1 year', general: 6.60, senior: 7.10 },
    { type: 'fd', tenure: '2 years to 3 years', general: 7.25, senior: 7.75 },
    { type: 'fd', tenure: '5 years', general: 7.00, senior: 7.50 },
    { type: 'savings', tenure: 'Regular', general: 3.00, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.70, senior: null },
    { type: 'personal_loan', tenure: 'Up to 5 years', general: 10.75, senior: null },
  ]},
  { slug: 'icici-bank', name: 'ICICI Bank', type: 'private', website: 'https://www.icicibank.com', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 6.70, senior: 7.20 },
    { type: 'fd', tenure: '2 years to 3 years', general: 7.25, senior: 7.75 },
    { type: 'fd', tenure: '5 years', general: 7.00, senior: 7.50 },
    { type: 'savings', tenure: 'Regular', general: 3.00, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.75, senior: null },
    { type: 'personal_loan', tenure: 'Up to 5 years', general: 10.85, senior: null },
  ]},
  { slug: 'pnb', name: 'Punjab National Bank (PNB)', type: 'public', website: 'https://www.pnbindia.in', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 6.80, senior: 7.30 },
    { type: 'fd', tenure: '2 years to 3 years', general: 7.05, senior: 7.55 },
    { type: 'savings', tenure: 'Regular', general: 2.70, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.45, senior: null },
    { type: 'personal_loan', tenure: 'Up to 5 years', general: 11.25, senior: null },
  ]},
  { slug: 'bank-of-baroda', name: 'Bank of Baroda', type: 'public', website: 'https://www.bankofbaroda.in', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 6.85, senior: 7.35 },
    { type: 'fd', tenure: '2 years to 3 years', general: 7.15, senior: 7.65 },
    { type: 'savings', tenure: 'Regular', general: 2.75, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.40, senior: null },
    { type: 'personal_loan', tenure: 'Up to 5 years', general: 11.40, senior: null },
  ]},
  { slug: 'canara-bank', name: 'Canara Bank', type: 'public', website: 'https://www.canarabank.com', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 6.85, senior: 7.35 },
    { type: 'fd', tenure: '3 years to 5 years', general: 6.70, senior: 7.20 },
    { type: 'savings', tenure: 'Regular', general: 2.90, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.45, senior: null },
  ]},
  { slug: 'union-bank', name: 'Union Bank of India', type: 'public', website: 'https://www.unionbankofindia.co.in', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 6.90, senior: 7.40 },
    { type: 'fd', tenure: '2 years to 3 years', general: 7.00, senior: 7.50 },
    { type: 'savings', tenure: 'Regular', general: 2.75, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.35, senior: null },
  ]},
  { slug: 'indian-bank', name: 'Indian Bank', type: 'public', website: 'https://www.indianbank.in', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 6.75, senior: 7.25 },
    { type: 'fd', tenure: '2 years to 5 years', general: 7.05, senior: 7.55 },
    { type: 'savings', tenure: 'Regular', general: 2.80, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.40, senior: null },
  ]},
  { slug: 'kotak-mahindra', name: 'Kotak Mahindra Bank', type: 'private', website: 'https://www.kotak.com', rates: [
    { type: 'fd', tenure: '1 year', general: 6.80, senior: 7.30 },
    { type: 'fd', tenure: '2 years to 3 years', general: 7.20, senior: 7.70 },
    { type: 'savings', tenure: 'Regular', general: 3.50, senior: null },
    { type: 'home_loan', tenure: 'Up to 20 years', general: 8.75, senior: null },
    { type: 'personal_loan', tenure: 'Up to 5 years', general: 10.99, senior: null },
  ]},
  { slug: 'axis-bank', name: 'Axis Bank', type: 'private', website: 'https://www.axisbank.com', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 6.70, senior: 7.20 },
    { type: 'fd', tenure: '2 years to 3 years', general: 7.20, senior: 7.70 },
    { type: 'savings', tenure: 'Regular', general: 3.00, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.75, senior: null },
    { type: 'personal_loan', tenure: 'Up to 5 years', general: 10.49, senior: null },
  ]},
  { slug: 'yes-bank', name: 'Yes Bank', type: 'private', website: 'https://www.yesbank.in', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 7.25, senior: 7.75 },
    { type: 'savings', tenure: 'Regular', general: 4.00, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 9.00, senior: null },
  ]},
  { slug: 'idbi-bank', name: 'IDBI Bank', type: 'public', website: 'https://www.idbibank.in', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 6.75, senior: 7.25 },
    { type: 'fd', tenure: '3 years to 5 years', general: 6.70, senior: 7.20 },
    { type: 'savings', tenure: 'Regular', general: 3.00, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.55, senior: null },
  ]},
  { slug: 'bank-of-india', name: 'Bank of India', type: 'public', website: 'https://www.bankofindia.co.in', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 6.80, senior: 7.30 },
    { type: 'savings', tenure: 'Regular', general: 2.75, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.40, senior: null },
  ]},
  { slug: 'central-bank', name: 'Central Bank of India', type: 'public', website: 'https://www.centralbankofindia.co.in', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 6.85, senior: 7.35 },
    { type: 'savings', tenure: 'Regular', general: 2.75, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.45, senior: null },
  ]},
  { slug: 'indian-overseas', name: 'Indian Overseas Bank', type: 'public', website: 'https://www.iob.in', rates: [
    { type: 'fd', tenure: '1 year', general: 6.90, senior: 7.40 },
    { type: 'savings', tenure: 'Regular', general: 2.70, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.40, senior: null },
  ]},
  { slug: 'uco-bank', name: 'UCO Bank', type: 'public', website: 'https://www.ucobank.com', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 6.90, senior: 7.40 },
    { type: 'savings', tenure: 'Regular', general: 2.75, senior: null },
  ]},
  { slug: 'indusind-bank', name: 'IndusInd Bank', type: 'private', website: 'https://www.indusind.com', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 7.25, senior: 7.75 },
    { type: 'savings', tenure: 'Regular', general: 4.00, senior: null },
    { type: 'home_loan', tenure: 'Up to 25 years', general: 8.65, senior: null },
    { type: 'personal_loan', tenure: 'Up to 5 years', general: 10.49, senior: null },
  ]},
  { slug: 'federal-bank', name: 'Federal Bank', type: 'private', website: 'https://www.federalbank.co.in', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 7.10, senior: 7.60 },
    { type: 'savings', tenure: 'Regular', general: 3.05, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.80, senior: null },
  ]},
  { slug: 'idfc-first', name: 'IDFC First Bank', type: 'private', website: 'https://www.idfcfirstbank.com', rates: [
    { type: 'fd', tenure: '1 year', general: 6.50, senior: 7.00 },
    { type: 'fd', tenure: '2 years to 3 years', general: 7.25, senior: 7.75 },
    { type: 'savings', tenure: 'Regular (up to Rs 1 lakh)', general: 7.00, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.85, senior: null },
  ]},
  { slug: 'bandhan-bank', name: 'Bandhan Bank', type: 'private', website: 'https://www.bandhanbank.com', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 7.15, senior: 7.65 },
    { type: 'savings', tenure: 'Regular', general: 3.00, senior: null },
  ]},
  { slug: 'rbl-bank', name: 'RBL Bank', type: 'private', website: 'https://www.rblbank.com', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 7.30, senior: 7.80 },
    { type: 'savings', tenure: 'Regular', general: 5.50, senior: null },
    { type: 'personal_loan', tenure: 'Up to 5 years', general: 13.00, senior: null },
  ]},
  { slug: 'au-small-finance', name: 'AU Small Finance Bank', type: 'small_finance', website: 'https://www.aubank.in', rates: [
    { type: 'fd', tenure: '1 year', general: 7.50, senior: 8.00 },
    { type: 'fd', tenure: '2 years to 3 years', general: 7.75, senior: 8.25 },
    { type: 'savings', tenure: 'Regular', general: 5.00, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 9.00, senior: null },
  ]},
  { slug: 'ujjivan-sfb', name: 'Ujjivan Small Finance Bank', type: 'small_finance', website: 'https://www.ujjivansfb.in', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 7.60, senior: 8.10 },
    { type: 'savings', tenure: 'Regular', general: 5.50, senior: null },
  ]},
  { slug: 'equitas-sfb', name: 'Equitas Small Finance Bank', type: 'small_finance', website: 'https://www.equitasbank.com', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 7.75, senior: 8.25 },
    { type: 'savings', tenure: 'Regular', general: 5.50, senior: null },
  ]},
  { slug: 'south-indian-bank', name: 'South Indian Bank', type: 'private', website: 'https://www.southindianbank.com', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 7.10, senior: 7.60 },
    { type: 'savings', tenure: 'Regular', general: 2.85, senior: null },
  ]},
  { slug: 'karnataka-bank', name: 'Karnataka Bank', type: 'private', website: 'https://www.karnatakabank.com', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 7.15, senior: 7.65 },
    { type: 'savings', tenure: 'Regular', general: 3.00, senior: null },
  ]},
  { slug: 'punjab-sind-bank', name: 'Punjab & Sind Bank', type: 'public', website: 'https://www.psbindia.com', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 6.80, senior: 7.30 },
    { type: 'savings', tenure: 'Regular', general: 2.70, senior: null },
  ]},
  { slug: 'bank-of-maharashtra', name: 'Bank of Maharashtra', type: 'public', website: 'https://www.bankofmaharashtra.in', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 6.75, senior: 7.25 },
    { type: 'savings', tenure: 'Regular', general: 2.75, senior: null },
    { type: 'home_loan', tenure: 'Up to 30 years', general: 8.35, senior: null },
  ]},
  { slug: 'post-office', name: 'India Post Office', type: 'public', website: 'https://www.indiapost.gov.in', rates: [
    { type: 'fd', tenure: '1 year', general: 6.90, senior: 6.90 },
    { type: 'fd', tenure: '2 years', general: 7.00, senior: 7.00 },
    { type: 'fd', tenure: '3 years', general: 7.10, senior: 7.10 },
    { type: 'fd', tenure: '5 years', general: 7.50, senior: 7.50 },
    { type: 'savings', tenure: 'Regular', general: 4.00, senior: null },
  ]},
  { slug: 'dhanlaxmi-bank', name: 'Dhanlaxmi Bank', type: 'private', website: 'https://www.dfrbank.com', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 7.00, senior: 7.50 },
    { type: 'savings', tenure: 'Regular', general: 2.90, senior: null },
  ]},
  { slug: 'j-k-bank', name: 'J&K Bank', type: 'private', website: 'https://www.jkbank.com', rates: [
    { type: 'fd', tenure: '1 year to 2 years', general: 6.90, senior: 7.40 },
    { type: 'savings', tenure: 'Regular', general: 3.00, senior: null },
  ]},
];

async function seedBanks(): Promise<void> {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'paisareality',
  });

  console.log('Connected. Seeding banks and rates...');
  let bankCount = 0;
  let rateCount = 0;

  for (const bank of BANKS) {
    try {
      await conn.execute(
        `INSERT INTO banks (slug, name, type, website) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), type=VALUES(type), website=VALUES(website)`,
        [bank.slug, bank.name, bank.type, bank.website]
      );
      bankCount++;

      const [[bankRow]] = await conn.execute<(mysql.RowDataPacket & { id: number })[]>(
        'SELECT id FROM banks WHERE slug = ?', [bank.slug]
      );
      if (!bankRow) continue;

      for (const rate of bank.rates) {
        await conn.execute(
          `INSERT INTO bank_rates (bank_id, rate_type, tenure, general_rate, senior_citizen_rate, effective_date)
           VALUES (?, ?, ?, ?, ?, CURDATE())
           ON DUPLICATE KEY UPDATE general_rate=VALUES(general_rate), senior_citizen_rate=VALUES(senior_citizen_rate), effective_date=CURDATE()`,
          [bankRow.id, rate.type, rate.tenure, rate.general, rate.senior]
        );
        rateCount++;
      }
      console.log(`  [${bankCount}] ${bank.name} - ${bank.rates.length} rates`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      console.error(`  Error for ${bank.name}: ${msg}`);
    }
  }

  console.log(`\nDone. ${bankCount} banks, ${rateCount} rates seeded.`);
  await conn.end();
}

seedBanks().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});