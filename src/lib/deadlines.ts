/**
 * Answers "what is the last date to apply" honestly, whether or not a deadline
 * is recorded.
 *
 * Why this exists: "last date", "deadline" and "apply by" is a large, high-intent
 * query class, and the site was invisible for all of it. On 2026-07-26 the
 * database held a deadline for 0 of 351 schemes and 0 of 62 scholarships, and
 * neither page type mentioned dates at all. Search Console shows the demand
 * plainly: the site ranks #1 for "e grantz scholarship 2026 last date" and gets
 * zero clicks from it, because the page never answers the question.
 *
 * The fix is not to invent dates. On a YMYL money site a wrong deadline is worse
 * than no deadline: someone can miss a real cycle because of it. So when a date
 * is recorded we state it and tell the reader to confirm, and when it is not we
 * say exactly that, explain the two patterns these schemes actually follow, and
 * send them to the official portal. That is a real answer to the query and every
 * word of it is true.
 *
 * Populating real verified dates remains a separate data task.
 */

export type RecordKind = 'scheme' | 'scholarship';

export interface DeadlineInput {
  name: string;
  /** ISO date string, or null when nothing is recorded. */
  deadline?: string | null;
  /** ISO date the record was last checked, if known. */
  lastVerified?: string | null;
  kind: RecordKind;
}

/** Format an ISO date as "31 October 2026". Returns null when unparseable. */
export function formatDeadlineDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** True when a usable deadline is recorded. */
export function hasDeadline(input: DeadlineInput): boolean {
  return formatDeadlineDate(input.deadline) !== null;
}

/**
 * The FAQ answer. Long form, suitable for FAQPage structured data and for a
 * reader who arrived from a "last date" search.
 */
export function deadlineAnswer(input: DeadlineInput): string {
  const formatted = formatDeadlineDate(input.deadline);
  const noun = input.kind === 'scholarship' ? 'scholarship' : 'scheme';

  if (formatted) {
    return (
      `The last date recorded for ${input.name} is ${formatted}. ` +
      `Deadlines for this kind of ${noun} are often extended, and occasionally brought forward, ` +
      `so confirm the current date on the official portal linked on this page before you apply.`
    );
  }

  const verified = formatDeadlineDate(input.lastVerified);
  return (
    `There is no fixed last date on record for ${input.name}. ` +
    `Two patterns are common: many welfare ${noun}s of this type accept applications all year and ` +
    `process them in batches, while others run an annual cycle that opens and closes on dates the ` +
    `department announces each year. Because a wrong date can cost you a cycle, we do not publish a ` +
    `date we have not verified. Check the official portal linked on this page for the current cycle` +
    (verified ? `, and note these details were last verified on ${verified}.` : '.')
  );
}

/**
 * The short on-page line. Deliberately plain, because it sits next to the apply
 * buttons where a reader is deciding whether to act now.
 */
export function deadlineLine(input: DeadlineInput): string {
  const formatted = formatDeadlineDate(input.deadline);
  if (formatted) {
    return `Last date: ${formatted}. Confirm on the official portal, as dates are often extended.`;
  }
  return 'Last date: not published here. This scheme has no fixed date on record, so check the official portal for the current cycle.';
}

/** The question wording, matched to how people actually search. */
export function deadlineQuestion(name: string): string {
  return `What is the last date to apply for ${name}?`;
}
