export const SITE_NAME = 'Paisa Reality';
export const SITE_URL = 'https://paisareality.com';
export const SITE_TAGLINE = "India's one-stop money hub. Live prices, government schemes, financial calculators, and bank rate comparisons.";
export const SITE_DESCRIPTION = 'Check today\'s gold rate, silver rate, petrol price, diesel price. Find government schemes you qualify for. Use free EMI, SIP, FD, and tax calculators. Compare bank rates across 50+ banks. All free. Updated daily.';

export const GA_MEASUREMENT_ID = 'G-MT7980F7JH';
export const ADSENSE_PUB_ID = 'pub-6484525483464374';

export const ACCENT_COLOR = '#007A78';

export const NAV_LINKS = [
  { href: '/gold-rate', label: 'Gold Rate', labelHi: 'सोने का भाव' },
  { href: '/silver-rate', label: 'Silver Rate', labelHi: 'चांदी का भाव' },
  { href: '/petrol-price', label: 'Petrol Price', labelHi: 'पेट्रोल कीमत' },
  { href: '/diesel-price', label: 'Diesel Price', labelHi: 'डीजल कीमत' },
  { href: '/schemes', label: 'Schemes', labelHi: 'सरकारी योजनाएं' },
  { href: '/calculators', label: 'Calculators', labelHi: 'कैलकुलेटर' },
  { href: '/bank-rates', label: 'Bank Rates', labelHi: 'बैंक दरें' },
] as const;

export const CALCULATOR_LINKS = [
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