/**
 * /llms.txt: a plain-text map of the site for language-model crawlers and
 * answer engines, following the llmstxt.org layout (H1, summary, sections of
 * links). Counts come from the database so the file never claims more than
 * the site actually has. Revalidated hourly with the rest of the ISR pages.
 */
import { query } from '@/lib/db';
import { SITE_URL } from '@/lib/seo';
import { CITIES } from '@/lib/cities';
import type { QueryResultRow } from 'pg';

export const revalidate = 3600;

async function counts(): Promise<{ schemes: number | null; scholarships: number | null; banks: number | null }> {
  try {
    const rows = await query<QueryResultRow & { schemes: number; scholarships: number; banks: number }>(
      `SELECT (SELECT COUNT(*) FROM schemes WHERE is_active)::int AS schemes,
              (SELECT COUNT(*) FROM scholarships WHERE active)::int AS scholarships,
              (SELECT COUNT(*) FROM banks)::int AS banks`,
    );
    return rows[0] ?? { schemes: null, scholarships: null, banks: null };
  } catch {
    return { schemes: null, scholarships: null, banks: null };
  }
}

const u = (path: string): string => `${SITE_URL}${path}`;

export async function GET(): Promise<Response> {
  const c = await counts();
  const n = (v: number | null, noun: string): string => (v ? `${v} ${noun}` : noun);

  const body = `# Paisa Reality

> Free personal finance information for India: daily gold, silver, petrol, diesel and LPG prices for ${CITIES.length} cities, ${n(c.schemes, 'government schemes')} and ${n(c.scholarships, 'scholarships')} with eligibility and how to apply, bank rate comparisons across ${n(c.banks, 'banks')}, calculators, and a Money Health Score. Paisa Reality is an information site, not a financial adviser, and does not sell financial products.

How the data is produced:
- Prices carry a "data verified as of" date and a source on every page. Gold and silver are derived daily from international spot prices, the USD/INR rate, import duty and a calibrated dealer premium, and are checked against a published dealer benchmark. Fuel and LPG come from oil marketing company rates. Details: ${u('/methodology')}
- Scheme and scholarship pages link to the official portal and show when the record was last verified. Always confirm eligibility and dates on the official site before applying.
- Calculators run in the browser and use the tax rules and rates stated on each page.
- Editorial standards and corrections: ${u('/editorial-policy')}

## Prices
- [Gold rate today](${u('/gold-rate')}): 24K, 22K and 18K per gram by city, with 30-day history
- [Silver rate today](${u('/silver-rate')}): per gram and per kg by city
- [Petrol price today](${u('/petrol-price')}): by city, with history
- [Diesel price today](${u('/diesel-price')}): by city, with history
- [LPG cylinder price](${u('/lpg-price')}): domestic 14.2 kg and commercial 19 kg by state
- [Interest rates](${u('/interest-rates')}): current small savings rates (PPF, SSY, SCSS, NSC, KVP, post office deposits), RBI policy rates and the EPF rate

## Government schemes and scholarships
- [Scheme finder](${u('/schemes')}): match a profile to central and state schemes; each scheme page covers benefits, eligibility, documents and how to apply
- [Schemes by state](${u('/state')})
- [Schemes by category](${u('/category')})
- [Scholarships](${u('/scholarships')}): government and private scholarships with eligibility, amounts and deadlines
- [Startup grants](${u('/grants')}): government seed funds, state grants and international accelerators open to Indian founders, with amounts, equity terms and eligibility

## Tools
- [Money Health Score](${u('/score')}): a score out of 900 across eight areas of personal finance
- [Real Return Checker](${u('/calculators/real-return')}): the true annual return (XIRR) of endowment, money-back and "double your money" offers
- [Retirement Optimizer](${u('/calculators/retirement-optimizer')})
- [Prepay vs Invest](${u('/calculators/prepay-vs-invest')})
- [Debt Optimizer](${u('/calculators/debt-optimizer')})
- [Old vs New Tax Regime Optimizer](${u('/calculators/lifecycle-tax-optimizer')})
- [Budget Optimizer](${u('/calculators/budget-optimizer')})
- [Tax-Loss Harvesting](${u('/calculators/tax-harvesting')})
- [Gold Planner](${u('/calculators/gold-planner')})
- [Scheme Benefit Maximizer](${u('/calculators/scheme-maximizer')})
- [Salary Optimizer](${u('/calculators/salary-optimizer')})
- [All calculators](${u('/calculators')}): EMI, SIP, FD, PPF, income tax, home loan, NPS, gratuity, HRA and inflation

## Bank rates
- [Bank rate comparison](${u('/bank-rates')})
- [FD rates](${u('/bank-rates/fd-rates')})
- [Savings account rates](${u('/bank-rates/savings-rates')})
- [Home loan rates](${u('/bank-rates/home-loan-rates')})
- [Personal loan rates](${u('/bank-rates/personal-loan-rates')})

## Guides
- [Old vs new tax regime](${u('/guides/old-vs-new-tax-regime')})
- [SIP vs FD](${u('/guides/sip-vs-fd')})
- [PPF vs NPS](${u('/guides/ppf-vs-nps')})
- [FD vs RD](${u('/guides/fd-vs-rd')})
- [22K vs 24K gold](${u('/guides/22k-vs-24k-gold')})

## About
- [About Paisa Reality](${u('/about')})
- [Methodology](${u('/methodology')})
- [Editorial policy](${u('/editorial-policy')})
- [Disclaimer](${u('/disclaimer')})
- [Contact](${u('/contact')})

## Optional
- [Full reference with current prices, rates and every scheme](${u('/llms-full.txt')})
- [Newsletter](${u('/newsletter')})
- [Sitemap](${u('/sitemap.xml')})
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
