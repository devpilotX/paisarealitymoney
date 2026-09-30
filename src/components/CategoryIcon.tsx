/** Line icons for scheme categories, in the same style as CommodityIcon. */
const PATHS: Record<string, string> = {
  agriculture: 'M12 21V10M12 10c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6zM12 13c0-3-2.2-5-5-5 0 3 2.2 5 5 5zM6 21h12',
  women: 'M12 13a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 13v8M9 18h6',
  education: 'M3 9l9-4 9 4-9 4-9-4zM7 11v4.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V11M21 9v5',
  'senior-citizen': 'M11 4.5a1.5 1.5 0 1 0 0-.01M9 21l1.5-6.5L8 12l1-5 3 1.5 2.5 3M14 21l-1.5-5M16 11v10',
  business: 'M4 8h16v11H4zM9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8M4 13h16',
  housing: 'M4 11l8-6 8 6M6 9.5V20h12V9.5M10 20v-5h4v5',
  healthcare: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10zM9.5 11h5M12 8.5v5',
  disability: 'M12 5.5a1.5 1.5 0 1 0 0-.01M10.5 8.5V14h5l2 5M10.5 11h4M8 11.5a5 5 0 1 0 6.5 6.5',
  employment: 'M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M4 7h16v12H4zM10 12h4',
  pension: 'M12 3v18M17 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H7',
  'skill-training': 'M14.5 6.5l3 3M4 20l4-1 10.5-10.5a2.1 2.1 0 0 0-3-3L5 16l-1 4z',
  social: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16.5 11a2.5 2.5 0 1 0 0-5M3 20c0-3 2.2-5 5-5s5 2 5 5M15 15c3 0 5 2 5 5',
  insurance: 'M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z M9 12l2 2 4-4',
  finance: 'M4 20h16M6 17V10M10 17V10M14 17V10M18 17V10M3 9l9-5 9 5z',
};

const TONES: Record<string, string> = {
  agriculture: 'bg-[#EAF5EC] text-[#2F7A3E]',
  women: 'bg-[#FCEDEF] text-[#B23A55]',
  education: 'bg-[#EAF1FB] text-[#2A5DA8]',
  'senior-citizen': 'bg-[#F4EEFB] text-[#6A45A6]',
  business: 'bg-[#FBF3DC] text-[#94670A]',
  housing: 'bg-[#EDF4F4] text-[#2C6E6E]',
  healthcare: 'bg-[#FDEEEA] text-[#B4462C]',
  disability: 'bg-[#EAF1FB] text-[#2A5DA8]',
  employment: 'bg-navy-soft text-navy',
  pension: 'bg-[#FBF3DC] text-[#94670A]',
  'skill-training': 'bg-[#EDF4F4] text-[#2C6E6E]',
  social: 'bg-[#F4EEFB] text-[#6A45A6]',
  insurance: 'bg-[#EAF5EC] text-[#2F7A3E]',
  finance: 'bg-navy-soft text-navy',
};

export default function CategoryIcon({ category, className = 'w-11 h-11' }: { category: string; className?: string }): React.ReactElement {
  const d = PATHS[category] ?? PATHS.finance!;
  return (
    <span className={`inline-flex items-center justify-center rounded-xl shrink-0 ${TONES[category] ?? 'bg-navy-soft text-navy'} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </span>
  );
}
