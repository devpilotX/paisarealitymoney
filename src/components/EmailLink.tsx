import { CONTACT_EMAIL } from '@/lib/contact';

/**
 * A mailto link that Cloudflare's Email Address Obfuscation leaves alone.
 * Without the email_off markers Cloudflare rewrites it to
 * /cdn-cgi/l/email-protection#..., which crawlers and link checkers see as a
 * 404 and which shows nothing without JavaScript. React cannot emit HTML
 * comments, hence the raw HTML; the address is a constant, never user input.
 */
export default function EmailLink({ className = '', email = CONTACT_EMAIL }: { className?: string; email?: string }): React.ReactElement {
  const safe = email.replace(/[^a-zA-Z0-9@._+-]/g, '');
  const cls = className.replace(/[^a-zA-Z0-9 _:\-/[\]]/g, '');
  return (
    <span
      dangerouslySetInnerHTML={{ __html: `<!--email_off--><a href="mailto:${safe}" class="${cls}">${safe}</a><!--email_on-->` }}
    />
  );
}
