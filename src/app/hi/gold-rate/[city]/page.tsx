import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import { getCityBySlug, METRO_CITIES } from '@/lib/cities';
import { formatDate } from '@/lib/constants';
import PriceCard from '@/components/PriceCard';
import Breadcrumb from '@/components/Breadcrumb';
import AdBanner from '@/components/AdBanner';

interface PageProps { params: Promise<{ city: string }>; }

interface GoldRow extends RowDataPacket {
  price_date: string; gold_24k_per_gram: number; gold_22k_per_gram: number;
  gold_18k_per_gram: number; gold_24k_per_10gram: number; change_amount: number; change_percent: number;
}

export async function generateStaticParams(): Promise<Array<{ city: string }>> {
  return METRO_CITIES.concat(METRO_CITIES).slice(0, 20).map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return { title: 'शहर नहीं मिला' };
  return {
    title: `${city.nameHi} में आज सोने का भाव - 22K और 24K कीमत`,
    description: `${city.nameHi} में आज का सोने का रेट। 22 कैरेट और 24 कैरेट सोने की कीमत प्रति ग्राम। रोजाना अपडेट।`,
    alternates: { canonical: `https://paisareality.com/hi/gold-rate/${citySlug}`, languages: { 'en-IN': `https://paisareality.com/gold-rate/${citySlug}` } },
  };
}

export const revalidate = 900;

export default async function HindiGoldCityPage({ params }: PageProps): Promise<React.ReactElement> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  let today: GoldRow | undefined;
  try {
    const rows = await query<GoldRow[]>(
      `SELECT gp.price_date, gp.gold_24k_per_gram, gp.gold_22k_per_gram, gp.gold_18k_per_gram, gp.gold_24k_per_10gram, gp.change_amount, gp.change_percent
       FROM gold_prices gp JOIN cities c ON gp.city_id = c.id WHERE c.slug = ? ORDER BY gp.price_date DESC LIMIT 1`, [city.slug]
    );
    today = rows[0];
  } catch (error) { console.error('Hindi gold price error:', error); }

  const otherCities = METRO_CITIES.filter((c) => c.slug !== city.slug).slice(0, 8);

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'हिंदी', href: '/hi' }, { label: 'सोने का भाव', href: '/gold-rate' }, { label: city.nameHi }]} />
      <h1 className="heading-1 mb-2">{city.nameHi} में आज सोने का भाव</h1>
      <p className="text-body mb-6">{city.nameHi}, {city.state} में 22K और 24K सोने की लाइव कीमत।{today ? ` अपडेट: ${formatDate(today.price_date)}` : ''}</p>
      <AdBanner format="horizontal" />
      {today && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
          <PriceCard label="24K सोना (प्रति ग्राम)" price={today.gold_24k_per_gram} change={today.change_amount} changePercent={today.change_percent} size="large" />
          <PriceCard label="22K सोना (प्रति ग्राम)" price={today.gold_22k_per_gram} change={Math.round(today.change_amount * 0.9167 * 100) / 100} changePercent={today.change_percent} />
          <PriceCard label="18K सोना (प्रति ग्राम)" price={today.gold_18k_per_gram} change={Math.round(today.change_amount * 0.75 * 100) / 100} changePercent={today.change_percent} />
          <PriceCard label="24K सोना (10 ग्राम)" price={today.gold_24k_per_10gram} change={today.change_amount * 10} changePercent={today.change_percent} unit="प्रति 10 ग्राम" />
        </div>
      )}
      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">{city.nameHi} में सोने की कीमत के बारे में</h2>
        <p className="text-body mb-4">{city.nameHi} भारत के प्रमुख शहरों में से एक है जहां सोने का बाजार सक्रिय है। यहां सोने की कीमत अंतरराष्ट्रीय बाजार दर, रुपये की कीमत, आयात शुल्क और स्थानीय मांग पर निर्भर करती है।</p>
        <p className="text-body mb-4">{city.nameHi} में सोने की ज्वेलरी खरीदते समय याद रखें कि अंतिम कीमत में मेकिंग चार्ज (5% से 25%), GST (3%) और हॉलमार्किंग शुल्क शामिल होते हैं। हमेशा विस्तृत बिल मांगें।</p>
        <p className="text-body mb-4"><Link href={`/gold-rate/${city.slug}`} className="link-internal">View in English</Link> | <Link href={`/hi/schemes/pm-awas-yojana`} className="link-internal">पीएम आवास योजना</Link></p>
      </article>
      <div className="my-8">
        <h2 className="heading-3 mb-4">अन्य शहरों में सोने का भाव</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {otherCities.map((c) => (
            <Link key={c.slug} href={`/hi/gold-rate/${c.slug}`} className="p-3 rounded-lg border border-gray-200 text-center no-underline hover:border-primary transition-colors">
              <span className="text-sm font-medium text-primary">{c.nameHi}</span>
            </Link>
          ))}
        </div>
      </div>
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
