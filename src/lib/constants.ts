export const SITE_NAME = 'Paisa Reality';
export const SITE_URL = 'https://paisareality.com';
export const SITE_TAGLINE = "India's one-stop money hub. Latest available prices, government schemes, financial calculators, and bank rate comparisons.";
export const SITE_DESCRIPTION = 'Check today\'s gold rate, silver rate, petrol price, diesel price. Find government schemes you qualify for. Use free EMI, SIP, FD, and tax calculators. Compare bank rates across 50+ banks. All free. Updated daily.';

export const ADSENSE_PUB_ID = 'pub-6484525483464374';

export const ACCENT_COLOR = '#007A78';

export const NAV_LINKS = [
  { href: '/score', label: 'Money Health Score', labelHi: 'वित्तीय सेहत स्कोर' },
  { href: '/gold-rate', label: 'Gold Rate', labelHi: 'सोने का भाव' },
  { href: '/silver-rate', label: 'Silver Rate', labelHi: 'चांदी का भाव' },
  { href: '/petrol-price', label: 'Petrol Price', labelHi: 'पेट्रोल कीमत' },
  { href: '/diesel-price', label: 'Diesel Price', labelHi: 'डीजल कीमत' },
  { href: '/schemes', label: 'Schemes', labelHi: 'सरकारी योजनाएं' },
  { href: '/calculators', label: 'Calculators', labelHi: 'कैलकुलेटर' },
  { href: '/bank-rates', label: 'Bank Rates', labelHi: 'बैंक दरें' },
] as const;

export const CALCULATOR_LINKS = [
  { href: '/calculators/real-return', label: 'Real Return Checker', labelHi: 'असली रिटर्न चेकर' },
  { href: '/calculators/retirement-optimizer', label: 'Retirement Optimizer', labelHi: 'रिटायरमेंट ऑप्टिमाइज़र' },
  { href: '/calculators/prepay-vs-invest', label: 'Prepay vs Invest', labelHi: 'प्रीपे बनाम निवेश' },
  { href: '/calculators/debt-optimizer', label: 'Debt Optimizer', labelHi: 'ऋण ऑप्टिमाइज़र' },
  { href: '/calculators/lifecycle-tax-optimizer', label: 'Lifecycle Tax Optimizer', labelHi: 'लाइफसाइकल टैक्स ऑप्टिमाइज़र' },
  { href: '/calculators/budget-optimizer', label: 'Budget Optimizer', labelHi: 'बजट ऑप्टिमाइज़र' },
  { href: '/calculators/tax-harvesting', label: 'Tax-Loss Harvesting', labelHi: 'टैक्स हार्वेस्टिंग' },
  { href: '/calculators/gold-planner', label: 'Gold Planner', labelHi: 'गोल्ड प्लानर' },
  { href: '/calculators/scheme-maximizer', label: 'Scheme Benefit Maximizer', labelHi: 'योजना लाभ मैक्सिमाइज़र' },
  { href: '/calculators/salary-optimizer', label: 'Salary Optimizer', labelHi: 'सैलरी ऑप्टिमाइज़र' },
  { href: '/calculators/emi', label: 'EMI Calculator', labelHi: 'EMI कैलकुलेटर' },
  { href: '/calculators/sip', label: 'SIP Calculator', labelHi: 'SIP कैलकुलेटर' },
  { href: '/calculators/fd', label: 'FD Calculator', labelHi: 'FD कैलकुलेटर' },
  { href: '/calculators/ppf', label: 'PPF Calculator', labelHi: 'PPF कैलकुलेटर' },
  { href: '/calculators/income-tax', label: 'Income Tax Calculator', labelHi: 'आयकर कैलकुलेटर' },
  { href: '/calculators/home-loan', label: 'Home Loan Calculator', labelHi: 'होम लोन कैलकुलेटर' },
  { href: '/calculators/nps', label: 'NPS Calculator', labelHi: 'NPS कैलकुलेटर' },
  { href: '/calculators/gratuity', label: 'Gratuity Calculator', labelHi: 'ग्रैच्युटी कैलकुलेटर' },
  { href: '/calculators/hra', label: 'HRA Calculator', labelHi: 'HRA कैलकुलेटर' },
  { href: '/calculators/inflation', label: 'Inflation Calculator', labelHi: 'महंगाई कैलकुलेटर' },
] as const;

export const SCHEME_CATEGORIES = [
  { slug: 'education', label: 'Education', labelHi: 'शिक्षा' },
  { slug: 'housing', label: 'Housing', labelHi: 'आवास' },
  { slug: 'business', label: 'Business', labelHi: 'व्यापार' },
  { slug: 'agriculture', label: 'Agriculture', labelHi: 'कृषि' },
  { slug: 'healthcare', label: 'Healthcare', labelHi: 'स्वास्थ्य' },
  { slug: 'women', label: 'Women', labelHi: 'महिला' },
  { slug: 'senior-citizen', label: 'Senior Citizen', labelHi: 'वरिष्ठ नागरिक' },
  { slug: 'disability', label: 'Disability', labelHi: 'विकलांग' },
  { slug: 'skill-training', label: 'Skill Training', labelHi: 'कौशल प्रशिक्षण' },
  { slug: 'employment', label: 'Employment', labelHi: 'रोजगार' },
  { slug: 'pension', label: 'Pension', labelHi: 'पेंशन' },
  { slug: 'insurance', label: 'Insurance', labelHi: 'बीमा' },
  { slug: 'finance', label: 'Finance and Savings', labelHi: 'वित्त और बचत' },
  { slug: 'social', label: 'Social Welfare', labelHi: 'सामाजिक कल्याण' },
] as const;

export const GA_EVENTS = {
  SCHEME_SEARCH: 'scheme_search',
  CALCULATOR_USE: 'calculator_use',
  PREMIUM_SIGNUP: 'premium_signup',
  PRICE_CHECK: 'price_check',
} as const;

export const INDIAN_RUPEE = '\u20B9';

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Compact Indian-format currency for charts / summary cards.
 * Examples: 152000000 -> "₹15.2 Cr", 4500000 -> "₹45.0 L", 80000 -> "₹80,000", 0 -> "₹0".
 */
export function formatCompactINR(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  if (abs >= 10000000) return `${sign}\u20B9${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `${sign}\u20B9${(abs / 100000).toFixed(2)} L`;
  if (abs >= 1000) return `${sign}\u20B9${Math.round(abs).toLocaleString('en-IN')}`;
  return `${sign}\u20B9${Math.round(abs)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
