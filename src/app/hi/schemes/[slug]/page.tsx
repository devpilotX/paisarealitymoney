import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import { formatNumber } from '@/lib/constants';
import Breadcrumb from '@/components/Breadcrumb';
import AdBanner from '@/components/AdBanner';
import ShareButton from '@/components/ShareButton';

interface PageProps { params: Promise<{ slug: string }>; }

interface SchemeRow extends RowDataPacket {
  slug: string; name: string; name_hi: string | null; category: string;
  ministry: string | null; description: string; description_hi: string | null;
  benefit_summary: string; benefit_amount_max: number | null;
  apply_url: string | null; official_url: string | null;
  how_to_apply: string | null; documents_required: string | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const rows = await query<SchemeRow[]>('SELECT name, name_hi, benefit_summary, slug FROM schemes WHERE slug = ? LIMIT 1', [slug]);
    const s = rows[0];
    if (!s) return { title: 'योजना नहीं मिली' };
    return {
      title: `${s.name_hi ?? s.name} - पात्रता, लाभ, आवेदन कैसे करें`,
      description: s.benefit_summary,
      alternates: { canonical: `https://paisareality.com/hi/schemes/${s.slug}`, languages: { 'en-IN': `https://paisareality.com/schemes/${s.slug}` } },
    };
  } catch { return { title: 'सरकारी योजना' }; }
}

export const revalidate = 3600;

export default async function HindiSchemeDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  let scheme: SchemeRow | undefined;
  try {
    const rows = await query<SchemeRow[]>('SELECT * FROM schemes WHERE slug = ? AND is_active = TRUE LIMIT 1', [slug]);
    scheme = rows[0];
  } catch (error) { console.error('Hindi scheme error:', error); }
  if (!scheme) notFound();

  const docs = (() => { try { const p = JSON.parse(scheme.documents_required ?? '[]'); return Array.isArray(p) ? p : []; } catch { return []; } })();

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'हिंदी', href: '/hi' }, { label: 'योजनाएं', href: '/schemes' }, { label: scheme.name_hi ?? scheme.name }]} />
      <article className="max-w-4xl">
        <h1 className="heading-1 mb-2">{scheme.name_hi ?? scheme.name}</h1>
        {scheme.name_hi && <p className="text-lg text-gray-500 mb-4">{scheme.name}</p>}
        <AdBanner format="horizontal" />
        <div className="bg-primary-50 rounded-lg p-6 my-6">
          <h2 className="text-lg font-semibold mb-2">प्रमुख लाभ</h2>
          <p className="text-base text-gray-800">{scheme.benefit_summary}</p>
          {scheme.benefit_amount_max && <p className="text-xl font-bold text-primary mt-2">₹{formatNumber(scheme.benefit_amount_max)} तक</p>}
        </div>
        <section className="my-8">
          <h2 className="heading-2 mb-4">योजना के बारे में</h2>
          <div className="text-body whitespace-pre-line">{scheme.description_hi ?? scheme.description}</div>
        </section>
        {scheme.how_to_apply && (
          <section className="my-8">
            <h2 className="heading-2 mb-4">आवेदन कैसे करें</h2>
            <div className="text-body whitespace-pre-line">{scheme.how_to_apply}</div>
          </section>
        )}
        {docs.length > 0 && (
          <section className="my-8">
            <h2 className="heading-2 mb-4">आवश्यक दस्तावेज</h2>
            <ul className="list-disc list-inside space-y-2 text-body">{docs.map((d: string) => <li key={d}>{d}</li>)}</ul>
          </section>
        )}
        <div className="flex flex-wrap gap-4 my-6">
          {scheme.apply_url && <a href={scheme.apply_url} target="_blank" rel="noopener noreferrer" className="btn-primary no-underline">ऑनलाइन आवेदन करें</a>}
          {scheme.official_url && <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" className="btn-secondary no-underline">आधिकारिक वेबसाइट</a>}
        </div>
        <ShareButton url={`/hi/schemes/${scheme.slug}`} title={scheme.name_hi ?? scheme.name} />
      </article>
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
