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

const PILLARS = [
  { title: 'दैनिक कीमतें', desc: 'सोना, चांदी, पेट्रोल, डीजल, LPG - 50+ शहरों के लिए', href: '/gold-rate', icon: '📊' },
  { title: 'सरकारी योजनाएं', desc: 'केंद्र और राज्य सरकार की योजनाएं खोजें', href: '/schemes', icon: '🏛️' },
  { title: 'वित्तीय कैलकुलेटर', desc: 'EMI, SIP, FD, PPF, आयकर, होम लोन कैलकुलेटर', href: '/calculators', icon: '🧮' },
  { title: 'बैंक दरें', desc: '50+ बैंकों की FD, सेविंग्स, लोन दरें की तुलना', href: '/bank-rates', icon: '🏦' },
];

export default function HindiHomePage(): React.ReactElement {
  return (
    <>
      <section className="bg-white py-12 sm:py-16">
        <div className="container-main text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">भारत का नंबर 1 मनी हब</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">लाइव कीमतें, सरकारी योजनाएं, वित्तीय कैलकुलेटर, और बैंक दर तुलना। सब मुफ्त। सब सही। सब एक जगह।</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/schemes" className="btn-primary no-underline">सरकारी योजनाएं खोजें</Link>
            <Link href="/gold-rate" className="btn-secondary no-underline">आज की कीमतें देखें</Link>
          </div>
          <p className="mt-4 text-sm text-gray-500"><Link href="/" className="link-internal">Switch to English</Link></p>
        </div>
      </section>
      <AdBanner format="horizontal" className="container-main" />
      <section className="section-spacing bg-gray-50">
        <div className="container-main">
          <h2 className="heading-2 text-center mb-8">Paisa Reality पर क्या करें</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((p) => (
              <Link key={p.href} href={p.href} className="card text-center no-underline group">
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">{p.title}</h3>
                <p className="text-sm text-gray-600">{p.desc}</p>
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
