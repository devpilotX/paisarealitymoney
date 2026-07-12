import type { Metadata } from 'next';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import FAQ from '@/components/FAQ';

export const metadata: Metadata = {
  title: 'Paisa Reality - सोने का भाव, सरकारी योजनाएं, कैलकुलेटर, बैंक दरें',
  description: 'सोने का भाव, चांदी का रेट, पेट्रोल कीमत देखें। सरकारी योजनाएं खोजें। मुफ्त EMI, SIP, FD कैलकुलेटर।',
  alternates: { canonical: 'https://paisareality.com/hi', languages: { 'en-IN': 'https://paisareality.com' } },
};

const HI_FAQS = [
  { question: 'Paisa Reality क्या है?', answer: 'Paisa Reality एक मुफ्त वेबसाइट है जहां आप सोने-चांदी के भाव, पेट्रोल-डीजल की कीमत, सरकारी योजनाएं, वित्तीय कैलकुलेटर और बैंक दरें देख सकते हैं।' },
  { question: 'क्या यह मुफ्त है?', answer: 'हां, Paisa Reality पूरी तरह से मुफ्त है। सभी कीमतें, कैलकुलेटर और जानकारी बिना किसी शुल्क के उपलब्ध हैं।' },
  { question: 'कीमतें कितनी बार अपडेट होती हैं?', answer: 'सोने-चांदी और पेट्रोल-डीजल की कीमतें रोजाना अपडेट होती हैं। LPG कीमत हर महीने की 1 तारीख को अपडेट होती है।' },
];

type IconKey = 'chart' | 'bank2' | 'calc' | 'bank';

const ICONS: Record<IconKey, React.ReactElement> = {
  chart: <><path d="M3 3v18h18" /><path d="m7 14 3-3 3 3 5-6" /></>,
  bank2: <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" />,
  calc: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h8M8 15h5" /></>,
  bank: <path d="M3 21h18M4 21V10h16v11M9 21v-6h6v6M4 10l8-6 8 6" />,
};

interface Pillar { title: string; desc: string; href: string; icon: IconKey; }

const PILLARS: Pillar[] = [
  { title: 'दैनिक कीमतें', desc: 'सोना, चांदी, पेट्रोल, डीजल, LPG - 50+ शहरों के लिए', href: '/gold-rate', icon: 'chart' },
  { title: 'सरकारी योजनाएं', desc: 'केंद्र और राज्य सरकार की योजनाएं खोजें', href: '/schemes', icon: 'bank2' },
  { title: 'वित्तीय कैलकुलेटर', desc: 'EMI, SIP, FD, PPF, आयकर, होम लोन कैलकुलेटर', href: '/calculators', icon: 'calc' },
  { title: 'बैंक दरें', desc: '50+ बैंकों की FD, सेविंग्स, लोन दरें की तुलना', href: '/bank-rates', icon: 'bank' },
];

export default function HindiHomePage(): React.ReactElement {
  return (
    <>
      <section className="relative overflow-hidden bg-paper border-b border-line">
        <div className="bg-paper-dots absolute inset-0" aria-hidden="true" />
        <div className="container-main relative py-12 sm:py-16 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy mb-4">भारत का नंबर 1 मनी हब</h1>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-8">लाइव कीमतें, सरकारी योजनाएं, वित्तीय कैलकुलेटर, और बैंक दर तुलना। सब मुफ्त। सब सही। सब <span className="mark">एक जगह</span>।</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/schemes" className="btn-primary no-underline">सरकारी योजनाएं खोजें</Link>
            <Link href="/gold-rate" className="btn-secondary no-underline">आज की कीमतें देखें</Link>
          </div>
          <p className="mt-4 text-sm text-muted-2"><Link href="/" className="link-internal">Switch to English</Link></p>
        </div>
      </section>
      <AdBanner format="horizontal" className="container-main" />
      <section className="section-spacing bg-paper-2 border-y border-line">
        <div className="container-main">
          <h2 className="heading-2 text-center mb-8">Paisa Reality पर क्या करें</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((p) => (
              <Link key={p.href} href={p.href} className="card text-center no-underline group flex flex-col items-center">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-[5px] border border-line bg-paper text-navy mb-4">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {ICONS[p.icon]}
                  </svg>
                </span>
                <h3 className="font-serif text-lg font-bold text-navy mb-2 group-hover:text-brand-red transition-colors">{p.title}</h3>
                <p className="text-sm text-muted">{p.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section-spacing"><div className="container-main max-w-3xl"><FAQ items={HI_FAQS} title="अक्सर पूछे जाने वाले सवाल" /></div></section>
      <AdBanner format="horizontal" className="container-main mb-8" />
    </>
  );
}
