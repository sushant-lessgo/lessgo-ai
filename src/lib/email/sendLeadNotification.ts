// src/lib/email/sendLeadNotification.ts
// Sends the lead-notification email whenever a contact/demo form is submitted.
// Called from /api/forms/submit AFTER the FormSubmission row is saved. Never
// throws — a lead is always saved even if the email fails. The actual HTTP send
// lives in `sendEmail` (shared with the visitor auto-reply).
//
// Recipient: the PAGE OWNER's email, resolved by the caller (`to`) via
// resolveOwnerEmail(). Multi-tenant as of the lead-emails feature.
//
// Env:
//   RESEND_API_KEY          — Resend API key (required to send; see sendEmail)
//   LEAD_NOTIFICATION_FROM  — sender ADDRESS; default 'onboarding@resend.dev'
//                             (prod/preview set this to the verified …@mail.lessgo.site)
//   LEAD_NOTIFICATION_EMAIL — DEPRECATED. Retired from the forms/submit owner path
//                             (owner email is passed in as `to`). Still honoured as
//                             the recipient for the legacy founder-notify caller
//                             (/api/demand-lead) which passes no `to`.

import { logger } from '@/lib/logger';
import { sendEmail, type EmailSendOutcome } from './sendEmail';
import type { MVPFormField } from '@/types/core/forms';

interface SendLeadNotificationArgs {
  formName: string;
  data: Record<string, string>;
  fields?: MVPFormField[];
  replyTo?: string;
  pageId?: string;
  /**
   * Recipient — the page owner's resolved email. Optional ONLY for the legacy
   * founder-notify caller (/api/demand-lead), which falls back to
   * LEAD_NOTIFICATION_EMAIL. The forms/submit path always passes it.
   */
  to?: string;
  /** From display name, e.g. the site/business title. Omitted ⇒ bare address. */
  businessName?: string;
}

// Re-exported under the historical name so existing callers keep compiling.
export type LeadNotifyOutcome = EmailSendOutcome;

function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// The business name is owner-typed and lands in the From header's display name.
// Strip anything that could break out of the quoted string or inject a header
// (quotes, backslashes, CR/LF) and cap the length.
export function sanitizeDisplayName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[\r\n]+/g, ' ')
    .replace(/["\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 78);
}

// Build the From header: `"Business Name" <address>`, or a bare address when no
// usable display name survives sanitization.
export function buildFromHeader(businessName?: string, address?: string): string {
  const addr = address || process.env.LEAD_NOTIFICATION_FROM || 'onboarding@resend.dev';
  const name = sanitizeDisplayName(businessName);
  return name ? `"${name}" <${addr}>` : addr;
}

// label for a submitted key — prefer the form field's label, fall back to the raw id.
function labelFor(key: string, fields?: MVPFormField[]): string {
  const f = fields?.find((x) => x.id === key);
  return f?.label || key;
}

export async function sendLeadNotification(args: SendLeadNotificationArgs): Promise<LeadNotifyOutcome> {
  try {
    const { formName, data, fields, replyTo, pageId, businessName } = args;

    // Owner email (passed in) is the recipient. LEAD_NOTIFICATION_EMAIL remains
    // only for the legacy founder-notify caller that passes no `to`.
    const to = args.to || process.env.LEAD_NOTIFICATION_EMAIL || '';
    if (!to) {
      logger.dev('sendLeadNotification: skipped (no recipient)');
      return { status: 'skipped' };
    }

    const from = buildFromHeader(businessName);

    const rows = Object.entries(data || {}).filter(([, v]) => v != null && String(v).trim() !== '');
    const textLines = rows.map(([k, v]) => `${labelFor(k, fields)}: ${v}`);
    const htmlRows = rows
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#555;white-space:nowrap"><strong>${escapeHtml(labelFor(k, fields))}</strong></td><td style="padding:4px 0">${escapeHtml(String(v))}</td></tr>`)
      .join('');

    const subject = `New ${formName || 'form'} submission`;
    const text = [
      `New ${formName || 'form'} submission`,
      '',
      ...textLines,
      '',
      `Submitted: ${new Date().toISOString()}`,
      pageId ? `Page: ${pageId}` : '',
    ].filter(Boolean).join('\n');
    const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;color:#111">`
      + `<h2 style="margin:0 0 12px;font-size:16px">New ${escapeHtml(formName || 'form')} submission</h2>`
      + `<table style="border-collapse:collapse">${htmlRows}</table>`
      + `<p style="margin:16px 0 0;color:#888;font-size:12px">Submitted ${escapeHtml(new Date().toISOString())}${pageId ? ` · Page ${escapeHtml(pageId)}` : ''}</p>`
      + `</div>`;

    return await sendEmail({
      to,
      from,
      replyTo: isValidEmail(replyTo) ? replyTo : undefined,
      subject,
      text,
      html,
      op: 'sendLeadNotification',
      extra: { pageId, formName },
    });
  } catch (err) {
    // Belt-and-braces: body assembly must never throw into the submit path.
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn('sendLeadNotification: send failed', () => msg);
    return { status: 'failed', error: `send failed: ${msg}`.slice(0, 300) };
  }
}
