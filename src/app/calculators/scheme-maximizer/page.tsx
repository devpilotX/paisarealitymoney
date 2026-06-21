import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import ShareButton from '@/components/ShareButton';
import SchemeMaximizerClient from './SchemeMaximizerClient';

export const metadata: Metadata = {
  title: 'Government Scheme Benefit Maximizer. Total ₹ You Can Claim',
  description:
    'Find every central government scheme you qualify for AND the total rupee benefit per year. not just a list. Quantifies cash, subsidy, pension and insurance value, resolves overlaps, and shows how to claim. Free, 100% private.',
  keywords: [
    'government scheme eligibility', 'government scheme benefit calculator', 'schemes i am eligible for',
    'pm kisan ayushman eligibility', 'total government benefit india', 'sarkari yojana calculator',
  ],
  alternates: { canonical: 'https://paisareality.com/calculators/scheme-maximizer' },
  openGraph: {
    title: 'Government Scheme Benefit Maximizer',
    description:
      'Not just a list. the total rupee benefit of every central scheme you qualify for, conflict-resolved, with how to claim each. Free and private.',
    url: 'https://paisareality.com/calculators/scheme-maximizer',
    type: 'website',
  },
};

const FAQS = [
  {
    question: 'How is this different from a normal government scheme finder?',
    answer:
      'Most finders (including the official myScheme portal) only LIST the schemes you might be eligible for. This tool goes further: it QUANTIFIES the rupee benefit of each scheme, sums them into a single total you can claim per year, and resolves overlaps. because some schemes are mutually exclusive (you can draw only one social-security pension, for example). It also separates one-time benefits from recurring ones and treats loans honestly (a ₹10 lakh MUDRA loan is access to credit, not free money, so it counts as ₹0).',
  },
  {
    question: 'How do you put a rupee value on each scheme?',
    answer:
      'On a consistent basis. Cash transfers (PM-KISAN ₹6,000/yr), pensions and subsidies are counted at face value. Insurance is valued at the equivalent private premium you would otherwise pay (so a ₹2 lakh accident cover for a ₹20 premium is worth roughly the ₹500/yr you would spend privately, not ₹2 lakh). Interest-subvention schemes (Kisan Credit Card, PM SVANidhi) are counted at the interest you save. Loans are counted at ₹0 because the principal is repaid. Each card explains exactly how its value was derived.',
  },
  {
    question: 'What does "conflict-resolved optimal set" mean?',
    answer:
      'Some benefits cannot be combined. For instance, the three NSAP social-security pensions (old-age, widow, disability) are mutually exclusive. you can draw only one. A naive tool would add them all up and overstate your benefit. This tool builds a conflict graph and computes the maximum-weight combination of non-conflicting schemes, so the total it shows is one you can actually receive together.',
  },
  {
    question: 'Which schemes are covered?',
    answer:
      'The dataset focuses on the highest-impact CENTRAL government schemes. PM-KISAN, Ayushman Bharat, the Jan Suraksha insurance schemes, MGNREGA, Kisan Credit Card, PM Fasal Bima, National Scholarships, the NSAP pensions, PMAY (urban and rural), PM Vishwakarma, PMKVY, Ujjwala, PM Matru Vandana, and more. State-specific schemes are being added; until your state is covered, the tool shows central schemes and flags that state portals may have more.',
  },
  {
    question: 'What are "near-misses"?',
    answer:
      'These are schemes you just barely miss. by a single criterion. For example, if your income is a little over the Ayushman Bharat ceiling, or you are a couple of years below a pension\'s minimum age, the tool flags it and tells you exactly what would need to change. It turns a flat "not eligible" into actionable information.',
  },
  {
    question: 'Is my personal information safe?',
    answer:
      'Completely. The entire eligibility check runs inside your browser using a bundled dataset. your age, income, caste category and other details are never sent to any server, and the tool works offline once loaded. There is no login and nothing is stored.',
  },
  {
    question: 'Can I rely on these amounts when applying?',
    answer:
      'Treat them as a well-reasoned estimate, not a guarantee. Eligibility rules and benefit amounts are set by the implementing ministries and can change, and final approval is always at the authority\'s discretion. Every scheme card carries the official link and a "last verified" date. confirm there before you apply.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Government Scheme Benefit Maximizer',
  url: 'https://paisareality.com/calculators/scheme-maximizer',
  applicationCategory: 'GovernmentApplication',
  operatingSystem: 'Any (web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  description:
    'A free, 100% client-side tool that finds the central government schemes you qualify for, quantifies the total rupee benefit per year, resolves conflicts to the optimal combination, and shows how to claim each.',
  featureList: [
    'Eligibility across age, income, occupation, category, area, BPL, disability',
    'Quantified annual rupee benefit per scheme',
    'Conflict-resolved optimal benefit total',
    'One-time vs recurring benefit separation',
    'Near-miss diagnostics',
    'Official link + last-verified date per scheme',
  ],
};

export default function SchemeMaximizerPage(): React.ReactElement {
  const links = [
    { href: '/schemes', label: 'Browse all schemes' },
    { href: '/calculators/budget-optimizer', label: 'Budget Optimizer' },
    { href: '/calculators/lifecycle-tax-optimizer', label: 'Tax Regime Optimizer' },
    { href: '/calculators', label: 'All calculators' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'Scheme Benefit Maximizer' }]} />

      <div className="inline-flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">★ Smart Tool</span>
        <span className="text-xs text-gray-500">Quantified · Conflict-resolved · 100% in-browser</span>
      </div>
      <h1 className="heading-1 mb-3">Government Scheme Benefit Maximizer</h1>
      <p className="text-body mb-6 max-w-3xl">
        Listing sites tell you <em>which</em> government schemes you might qualify for. This tool tells you the part that
        actually matters: the <strong>total rupee benefit you can claim</strong>. It quantifies the annual value of every
        eligible central scheme, <strong>resolves overlaps</strong> to the best combination you can legally receive
        together, separates one-time from recurring benefits, and shows you exactly <strong>how to claim each</strong>.
      </p>

      <AdBanner format="horizontal" />

      <div className="my-8">
        <SchemeMaximizerClient />
      </div>

      <article className="prose max-w-3xl my-10">
        <h2>Stop leaving government money on the table</h2>
        <p>
          India runs hundreds of welfare and support schemes worth lakhs of crores, yet most eligible citizens claim only
          a fraction of what they are entitled to. partly because no one tells them the <strong>total</strong> they could
          receive. The official portals and finder sites are good at listing schemes, but they stop there. They never add
          up the money, never tell you which benefits cancel each other out, and never put an honest rupee value on a
          health-insurance cover or an interest-subvented loan. This tool exists to fill exactly that gap.
        </p>

        <h2>From a list to a number</h2>
        <p>
          Enter your profile. age, gender, income, occupation, category, area and a few flags like BPL status, land
          ownership or disability. and the tool evaluates each scheme's eligibility rules against it. For every scheme you
          qualify for, it computes a <strong>quantified annual benefit</strong> and adds them into one headline number: the
          total you can claim per year, plus any one-time benefits like a housing subsidy or a free toolkit. Suddenly the
          decision to spend an afternoon on paperwork has a concrete payoff attached to it.
        </p>

        <h2>Honest valuation is the hard part</h2>
        <p>
          The reason no one sums benefits is that schemes are not comparable at face value, and adding them naively is
          misleading. A ₹10 lakh MUDRA loan is not ₹10 lakh of benefit. it is access to credit you repay, so we count it
          as ₹0 and label it clearly. A ₹2 lakh accident-insurance cover that costs ₹20 is worth roughly what you would pay
          privately for the same cover, not ₹2 lakh. Interest-subvention schemes are worth the interest you save. Cash
          transfers and pensions are counted at face value. Every card explains how its number was derived, so the total is
          something you can actually trust.
        </p>

        <h2>Resolving conflicts: the optimal set</h2>
        <p>
          Some benefits are mutually exclusive. The three National Social Assistance pensions. old-age, widow and
          disability. cannot be drawn together; you receive one. A naive calculator would stack them and overstate your
          entitlement. This tool builds a conflict graph and computes the <strong>maximum-weight independent set</strong> , 
          the combination of non-conflicting schemes with the highest total value. That is a genuinely better answer than a
          greedy "take the biggest first" rule, which can block two smaller benefits that together are worth more.
        </p>

        <h2>Near-misses turn "no" into "how"</h2>
        <p>
          A flat "not eligible" is unhelpful. So when you miss a scheme by a single criterion. income just over a ceiling,
          age just under a threshold, missing a BPL card. the tool flags it as a near-miss and tells you precisely what
          would change the outcome. Combined with the official link and a "last verified" date on every scheme, you get not
          just a number but a clear, actionable plan. As always, eligibility and amounts are decided by the implementing
          authority, so confirm on the official portal before you apply.
        </p>
      </article>

      <ShareButton url="/calculators/scheme-maximizer" title="Government Scheme Benefit Maximizer - Paisa Reality" />
      <InternalLinks title="Related" links={links} columns={2} />
      <FAQ items={FAQS} />
      <AdBanner format="horizontal" className="mt-8" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
