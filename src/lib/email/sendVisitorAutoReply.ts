// src/lib/email/sendVisitorAutoReply.ts
// Visitor auto-reply: the confirmation email the person who filled the form gets.
// Called from /api/forms/submit AFTER the FormSubmission row is saved and AFTER
// the owner notification. Never throws — a lead is always saved even if the email
// fails, and a failed auto-reply never affects the owner notification.
//
// Routing:
//   To       — the visitor's validated email (first `type: 'email'` field of the
//              form, else the conventional `data.email`)
//   From     — `"{Business Name}" <LEAD_NOTIFICATION_FROM>` (same builder as the
//              owner notification — buildFromHeader, header-injection sanitized)
//   Reply-To — the OWNER's email, so a reply reaches the business, not our
//              black-hole sending address. No owner email ⇒ the caller skips.
//
// ANTI-SPAM-RELAY (spec Decision 7): this sends mail to a visitor-typed address,
// so the body must never carry visitor-typed content. The ONLY visitor-derived
// value that reaches it is the {name} token, sanitized by sanitizeNameToken().
// Do NOT add "their message" / "here is what you sent" to this email without
// re-opening that decision.

import { sendEmail, type EmailSendOutcome } from './sendEmail';
import { buildFromHeader } from './sendLeadNotification';
import {
  DEFAULT_AUTO_REPLY_BODY,
  DEFAULT_AUTO_REPLY_SUBJECT,
  escapeHtml,
  renderAutoReply,
  sanitizeNameToken,
} from './autoReplyTemplate';
import type { MVPFormAutoReply, MVPFormField } from '@/types/core/forms';

/**
 * Loose shape of the stored form definition. Deliberately NOT `MVPForm`: this is
 * read out of a JSON column written by older app versions, so every field is
 * treated as possibly-missing.
 */
export interface AutoReplyFormConfig {
  fields?: MVPFormField[];
  autoReply?: MVPFormAutoReply;
}

export interface SendVisitorAutoReplyArgs {
  /** Stored form definition, if one was found. Absent ⇒ defaults + data.email. */
  form?: AutoReplyFormConfig | null;
  /** Raw submitted values, keyed by field id. */
  data: Record<string, unknown>;
  /** Business/site name for the From display name and the {business} token. */
  businessName: string;
  /** Owner's email — used as Reply-To. Required (caller skips when unresolved). */
  ownerEmail: string;
  /** Sender ADDRESS override; default comes from LEAD_NOTIFICATION_FROM. */
  fromAddress?: string;
}

// Same predicate as sendLeadNotification's (not exported there; duplicated as a
// 3-line pure regex rather than editing an out-of-scope file).
function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/**
 * Recipient pick (spec Decision 3): the FIRST field declared `type: 'email'`, by
 * `fields` order. No typed email field (or no stored form config at all — e.g. a
 * page published from a frozen form.v1 blob) ⇒ the conventional `data.email`.
 */
export function pickVisitorEmail(
  form: AutoReplyFormConfig | null | undefined,
  data: Record<string, unknown>
): string | null {
  const fields = Array.isArray(form?.fields) ? (form!.fields as MVPFormField[]) : [];
  const emailField = fields.find((f) => f && f.type === 'email' && typeof f.id === 'string');
  const candidate = emailField ? data?.[emailField.id] : data?.email;
  return isValidEmail(candidate) ? candidate : null;
}

/**
 * {name} source: the first field whose LABEL looks like a name, else the
 * conventional `data.name`. Always sanitized — this is visitor-typed.
 */
export function pickVisitorName(
  form: AutoReplyFormConfig | null | undefined,
  data: Record<string, unknown>
): string {
  const fields = Array.isArray(form?.fields) ? (form!.fields as MVPFormField[]) : [];
  const nameField = fields.find(
    (f) => f && typeof f.id === 'string' && f.type !== 'email' && /name/i.test(f.label || '')
  );
  const raw = nameField ? data?.[nameField.id] : data?.name;
  return sanitizeNameToken(raw);
}

export async function sendVisitorAutoReply(
  args: SendVisitorAutoReplyArgs
): Promise<EmailSendOutcome> {
  try {
    const { form, data, businessName, ownerEmail, fromAddress } = args;

    // ON by default: only an explicit `enabled: false` disables it. An absent
    // config (old form, never opened in the builder) still auto-replies.
    if (form?.autoReply?.enabled === false) {
      return { status: 'skipped' };
    }

    const to = pickVisitorEmail(form, data || {});
    if (!to) {
      // No email field / invalid address ⇒ silently nothing (spec: skip, not fail).
      return { status: 'skipped' };
    }

    const name = pickVisitorName(form, data || {});
    const business = (businessName || '').trim();

    const subjectTemplate = asString(form?.autoReply?.subject).trim() || DEFAULT_AUTO_REPLY_SUBJECT;
    const bodyTemplate = asString(form?.autoReply?.body).trim() || DEFAULT_AUTO_REPLY_BODY;

    const subject = renderAutoReply(subjectTemplate, { name, business });
    const text = renderAutoReply(bodyTemplate, { name, business });

    // Plain, tasteful markup only (spec Scope OUT: no rich template editor).
    // escapeHtml on every paragraph = defence in depth; the {name} token is
    // already stripped of markup by sanitizeNameToken.
    const paragraphs = text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map(
        (p) =>
          `<p style="margin:0 0 12px">${escapeHtml(p).replace(/\n/g, '<br />')}</p>`
      )
      .join('');
    const html =
      `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.5;color:#111">` +
      paragraphs +
      `</div>`;

    return await sendEmail({
      to,
      from: buildFromHeader(business, fromAddress),
      // Replies go to the business, never to our sending address.
      replyTo: isValidEmail(ownerEmail) ? ownerEmail : undefined,
      subject,
      text,
      html,
      op: 'sendVisitorAutoReply',
      extra: { hasCustomTemplate: Boolean(form?.autoReply?.body) },
    });
  } catch (err) {
    // Belt-and-braces: assembly must never throw into the submit path.
    const msg = err instanceof Error ? err.message : String(err);
    return { status: 'failed', error: `auto-reply failed: ${msg}`.slice(0, 300) };
  }
}
