// src/lib/email/sendEmail.ts
// Low-level Resend send helper — the ONE outbound email path for lead emails.
// Extracted from sendLeadNotification so the owner notification (phase 1) and the
// visitor auto-reply (phase 2) share identical gating, error handling and
// observability.
//
// Contract:
//   • NEVER throws. Callers get an outcome union instead.
//   • `skipped` when RESEND_API_KEY is absent (feature unconfigured per env).
//   • Non-OK response / thrown fetch → `failed` + Sentry captureException tagged
//     { area: 'email', op } so a silently-failing inbox stays observable (F30).
//   • Uses Resend's REST API directly — deliberately NO `resend` npm dependency.
//
// Env:
//   RESEND_API_KEY — Resend API key (required to send; absent ⇒ skipped)

import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

export const RESEND_ENDPOINT = 'https://api.resend.com/emails';

// Outcome so callers can flag rows / log:
//   'skipped' — feature unconfigured (no row flag)
//   'sent'    — Resend accepted
//   'failed'  — non-OK response / network error
export type EmailSendOutcome =
  | { status: 'skipped' }
  | { status: 'sent' }
  | { status: 'failed'; error: string };

export interface SendEmailArgs {
  /** Recipient address. */
  to: string;
  /** Full From header value (may include a display name). */
  from: string;
  /** Optional Reply-To; caller is responsible for validating it. */
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
  /** Operation name for logs + the Sentry `op` tag, e.g. 'sendLeadNotification'. */
  op: string;
  /** Extra context merged into the Sentry event (never into the email). */
  extra?: Record<string, unknown>;
}

export async function sendEmail(args: SendEmailArgs): Promise<EmailSendOutcome> {
  const { to, from, replyTo, subject, text, html, op, extra } = args;
  const apiKey = process.env.RESEND_API_KEY;

  // Gate: sending is opt-in per environment. Silent no-op when unconfigured.
  if (!apiKey) {
    logger.dev(`${op}: skipped (RESEND_API_KEY not set)`);
    return { status: 'skipped' };
  }
  if (!to) {
    logger.dev(`${op}: skipped (no recipient)`);
    return { status: 'skipped' };
  }

  try {
    const payload: Record<string, unknown> = { from, to, subject, text, html };
    if (replyTo) payload.reply_to = replyTo;

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
      logger.warn(`${op}: Resend responded ${res.status}`, () => body.slice(0, 300));
      // A dropped notification is otherwise invisible (F30): surface it to Sentry
      // so a silently-failing inbox is observable. No-op when DSN unset.
      Sentry.captureException(new Error(`${op}: Resend responded ${res.status}`), {
        level: 'warning',
        tags: { area: 'email', op },
        extra: { status: res.status, body: body.slice(0, 300), ...(extra || {}) },
      });
      return { status: 'failed', error: `Resend responded ${res.status}`.slice(0, 300) };
    }
    return { status: 'sent' };
  } catch (err) {
    // Never let an email failure affect the caller's primary work.
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(`${op}: send failed`, () => msg);
    Sentry.captureException(err instanceof Error ? err : new Error(`${op}: ${msg}`), {
      level: 'warning',
      tags: { area: 'email', op },
      extra: { ...(extra || {}) },
    });
    return { status: 'failed', error: `send failed: ${msg}`.slice(0, 300) };
  }
}
