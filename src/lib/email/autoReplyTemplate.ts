// src/lib/email/autoReplyTemplate.ts
// Visitor auto-reply template constants + rendering helpers.
//
// ⚠️ PURE MODULE — ZERO IMPORTS ON PURPOSE.
// The FormBuilder (a 'use client' component, lead-emails phase 3) imports the
// defaults from here. Adding an import of Sentry / logger / fetch / prisma / any
// server module would drag server code into the client bundle. Keep it dependency
// free; the send path lives in sendVisitorAutoReply.ts.
//
// ANTI-SPAM-RELAY (spec Decision 7): the auto-reply is sent to an address the
// visitor typed, so it is an outbound-mail primitive an attacker could try to use
// as a relay. Therefore visitor-typed content NEVER reaches the body except the
// {name} token, which goes through sanitizeNameToken(): no markup, no links, no
// newlines, hard length cap.

export const DEFAULT_AUTO_REPLY_SUBJECT = 'We received your message';

export const DEFAULT_AUTO_REPLY_BODY =
  'Thanks {name} — {business} received your message and will reply soon.';

/** Hard cap for the visitor-typed {name} token (characters). */
export const AUTO_REPLY_NAME_MAX_LENGTH = 80;

/**
 * Escape text for safe interpolation into an HTML email body.
 * Used when building the HTML part; the text part uses the raw rendered string.
 */
export function escapeHtml(raw: unknown): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitize the visitor-typed {name} token.
 *
 * Order matters: strip line breaks / control chars → strip anything link-shaped →
 * delete markup characters → collapse whitespace → cap length.
 *
 * Markup characters are DELETED rather than entity-escaped. That is strictly
 * stronger (nothing tag-shaped can exist in EITHER the text or the HTML part,
 * even if a future caller forgets to escape) and it keeps the length cap from
 * ever slicing an HTML entity in half. The HTML part still runs escapeHtml() on
 * the whole rendered body for defence in depth.
 *
 * Link stripping is deliberately over-eager (it also eats things like
 * "j.smith"): a mangled first name in a courtesy email is a far cheaper failure
 * than our verified sending domain relaying a spam link to a stranger.
 */
export function sanitizeNameToken(raw: unknown): string {
  if (typeof raw !== 'string') return '';

  let s = raw
    // control characters + newlines (header injection, log spoofing)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    // explicit URLs and scheme-ish tokens (http://, https://, mailto:, javascript:)
    .replace(/\S*(?:[a-z][a-z0-9+.-]*:\/\/|mailto:|javascript:|data:)\S*/gi, ' ')
    // protocol-less links: www.foo, foo.com/bar, evil.xyz
    .replace(/\S*\b[a-z0-9-]+\.[a-z]{2,}\S*/gi, ' ')
    // markup / quoting characters — deleted outright (see doc comment)
    .replace(/[<>"'`\\]/g, '')
    // template tokens typed by the visitor must not become substitutable
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (s.length > AUTO_REPLY_NAME_MAX_LENGTH) {
    s = s.slice(0, AUTO_REPLY_NAME_MAX_LENGTH).trim();
  }
  return s;
}

export interface AutoReplyTokens {
  /** Already sanitized via sanitizeNameToken(); empty/absent ⇒ token collapses. */
  name?: string;
  /** Business/site name (owner-derived, not visitor-typed). */
  business: string;
}

/**
 * Substitute ONLY {name} and {business} in a template string.
 *
 * - No eval, no dynamic key lookup, no other token is touched: unknown tokens
 *   like {email} are left LITERAL on purpose (owner typo ⇒ visible, not a data leak).
 * - Missing name collapses gracefully: the token and one leading space are removed,
 *   so "Thanks {name} — X" becomes "Thanks — X" (never "Thanks  — X").
 * - Replacements use a FUNCTION, never a string. A string replacement makes
 *   String.replace interpret `$&`, "$`", `$'`, `$1`, `$$` inside the SUBSTITUTED
 *   value — so a visitor named "$&" would re-emit the literal "{name}" (and, but
 *   for the sanitizer stripping backticks/quotes, could splice in surrounding
 *   template text). A replacer function kills that whole class outright.
 */
export function renderAutoReply(template: string, tokens: AutoReplyTokens): string {
  const source = typeof template === 'string' && template.trim() ? template : '';
  const name = typeof tokens?.name === 'string' ? tokens.name.trim() : '';
  const business = typeof tokens?.business === 'string' ? tokens.business.trim() : '';

  let out = source;
  out = name
    ? out.replace(/\{name\}/g, () => name)
    : out.replace(/[ \t]*\{name\}/g, () => '');
  out = out.replace(/\{business\}/g, () => business);

  // Tidy up spacing left behind by a collapsed token (never touches newlines).
  return out.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+$/gm, '');
}
