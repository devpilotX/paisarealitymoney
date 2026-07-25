import Link from 'next/link';

interface NextStepLink {
  href: string;
  label: string;
  /** Render as the main button. The first primary link wins visually. */
  primary?: boolean;
}

interface NextStepProps {
  title: string;
  text: string;
  links: NextStepLink[];
  className?: string;
}

/**
 * A single "what to do next" block.
 *
 * Why: on 2026-07-26 the database showed two months of traffic against 1
 * registered user, 2 score computations and 0 price alerts. The pages that
 * receive the traffic were dead ends, so visitors read one number and left,
 * while the tools built to serve them sat unused. Only the gold city pages had
 * any next step at all.
 *
 * Deliberately plain and used sparingly. A page gets one of these only where
 * the suggested action genuinely follows from what the reader came for.
 */
export default function NextStep({ title, text, links, className = '' }: NextStepProps): React.ReactElement {
  return (
    <section className={`callout-navy my-8 ${className}`}>
      <h2 className="heading-3 mb-2">{title}</h2>
      <p className="text-body mb-4">{text}</p>
      <div className="flex flex-wrap gap-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={l.primary ? 'btn-primary no-underline' : 'btn-secondary no-underline'}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
