// src/lib/email/sendLeadNotification.ts
// Sends an email to a configured inbox whenever a contact/demo form is submitted.
// Called from /api/forms/submit after the FormSubmission row is saved. Fully
// env-gated (no-op when unset) and never throws — a lead is always saved even if
// the email fails. Uses Resend's REST API directly (no SDK dependency).
//
// Env:
//   RESEND_API_KEY          — Resend API key (required to send)
//   LEAD_NOTIFICATION_EMAIL — recipient inbox (required to send)
//   LEAD_NOTIFICATION_FROM  — sender; default 'onboarding@resend.dev' (works pre-domain-verify)
//
// NOTE (before customer #2): recipient is a single fixed address — fine for the
// single-customer pilot. To go multi-tenant, pass an owner-scoped `to` here
// (resolve from the page owner) instead of reading LEAD_NOTIFICATION_EMAIL.

import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';
import type { MVPFormField } from '@/types/core/forms';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

interface SendLeadNotificationArgs {
  formName: string;
  data: Record<string, string>;
  fields?: MVPFormField[];
  replyTo?: string;
  pageId?: string;
}

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

// label for a submitted key — prefer the form field's label, fall back to the raw id.
function labelFor(key: string, fields?: MVPFormField[]): string {
  const f = fields?.find((x) => x.id === key);
  return f?.label || key;
}

export async function sendLeadNotification(args: SendLeadNotificationArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFICATION_EMAIL;
  const from = process.env.LEAD_NOTIFICATION_FROM || 'onboarding@resend.dev';

  // Gate: feature is opt-in per environment. Silent no-op when unconfigured.
  if (!apiKey || !to) {
    logger.dev('sendLeadNotification: skipped (RESEND_API_KEY / LEAD_NOTIFICATION_EMAIL not set)');
    return;
  }

  try {
    const { formName, data, fields, replyTo, pageId } = args;

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

    const payload: Record<string, unknown> = { from, to, subject, text, html };
    if (isValidEmail(replyTo)) payload.reply_to = replyTo;

    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.warn(`sendLeadNotification: Resend responded ${res.status}`, () => body.slice(0, 300));
      // A dropped lead notification is otherwise invisible (F30): surface it to
      // Sentry so a silently-failing inbox is observable. No-op when DSN unset.
      Sentry.captureException(new Error(`sendLeadNotification: Resend responded ${res.status}`), {
        level: 'warning',
        tags: { area: 'email', op: 'sendLeadNotification' },
        extra: { status: res.status, body: body.slice(0, 300), pageId: args.pageId, formName: args.formName },
      });
    }
  } catch (err) {
    // Never let an email failure affect the saved lead / response.
    logger.warn('sendLeadNotification: send failed', () => (err instanceof Error ? err.message : String(err)));
  }
}
