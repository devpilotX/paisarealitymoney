/**
 * Icons for the things we price. Drawn for this site on a 24px grid with a 1.6
 * stroke so they sit together as one set. Each comes with its own tile colour:
 * warm gold for gold, cool grey for silver, navy for fuel, blue for LPG.
 */
type Kind = 'gold24' | 'gold22' | 'silver' | 'petrol' | 'diesel' | 'lpg' | 'rate';

const TILE: Record<Kind, string> = {
  gold24: 'bg-[#FBF3DC] text-[#9A6B00]',
  gold22: 'bg-[#FBF3DC] text-[#9A6B00]',
  silver: 'bg-[#EEF1F4] text-[#5B6675]',
  petrol: 'bg-navy-soft text-navy',
  diesel: 'bg-navy-soft text-navy',
  lpg: 'bg-[#EAF2FB] text-[#1D5FA8]',
  rate: 'bg-navy-soft text-navy',
};

function Glyph({ kind }: { kind: Kind }): React.ReactElement {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (kind) {
    case 'gold24':
      // A stamped bullion bar.
      return (
        <g {...common}>
          <path d="M4.5 17.5 7 9.5h10l2.5 8z" />
          <path d="M8.2 11.5h7.6" />
          <path d="M3 17.5h18" />
          <path d="M12 5v2M8.5 6l1 1.5M15.5 6l-1 1.5" />
        </g>
      );
    case 'gold22':
      // A ring: 22K is jewellery gold.
      return (
        <g {...common}>
          <circle cx="12" cy="14.5" r="5.5" />
          <path d="M9.5 6.5 12 4l2.5 2.5L12 9z" />
        </g>
      );
    case 'silver':
      // A stack of coins.
      return (
        <g {...common}>
          <ellipse cx="12" cy="7" rx="6.5" ry="2.5" />
          <path d="M5.5 7v4c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V7" />
          <path d="M5.5 11v4c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-4" />
        </g>
      );
    case 'petrol':
      return (
        <g {...common}>
          <path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h6A1.5 1.5 0 0 1 14 5.5V20" />
          <path d="M3.5 20h12" />
          <path d="M7 7.5h5v3.5H7z" />
          <path d="M14 9h2a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V9l-2.5-2.5" />
        </g>
      );
    case 'diesel':
      // Pump with a drop, so petrol and diesel can be told apart at a glance.
      return (
        <g {...common}>
          <path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h6A1.5 1.5 0 0 1 14 5.5V20" />
          <path d="M3.5 20h12" />
          <path d="M9.5 7.2c1 1.4 1.7 2.3 1.7 3.1a1.7 1.7 0 0 1-3.4 0c0-.8.7-1.7 1.7-3.1z" />
          <path d="M14 9h2a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V9l-2.5-2.5" />
        </g>
      );
    case 'lpg':
      return (
        <g {...common}>
          <path d="M9 3.5h6M10 3.5V6M14 3.5V6" />
          <path d="M7 9a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v9.5A2.5 2.5 0 0 1 14.5 21h-5A2.5 2.5 0 0 1 7 18.5z" />
          <path d="M7 12h10M7 16h10" />
        </g>
      );
    default:
      return (
        <g {...common}>
          <path d="M4 19h16M6 16l4-4 3 3 5-6" />
        </g>
      );
  }
}

export default function CommodityIcon({ kind, size = 'md' }: { kind: Kind; size?: 'sm' | 'md' }): React.ReactElement {
  const box = size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl';
  const svg = size === 'sm' ? 'w-[18px] h-[18px]' : 'w-[22px] h-[22px]';
  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${box} ${TILE[kind]}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className={svg}><Glyph kind={kind} /></svg>
    </span>
  );
}

export type { Kind as CommodityKind };
