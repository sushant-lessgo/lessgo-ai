// src/lib/email/sendBlogPostNotification.ts
// Blog (P2): emails every subscribed reader of a site when a post is published
// for the FIRST time. Same discipline as sendLeadNotification: Resend REST
// direct (no SDK), env-gated (silent no-op when unset), NEVER throws — a
// publish must never fail or slow down because of email.
//
// Env:
//   RESEND_API_KEY         — Resend API key (required to send)
//   BLOG_NOTIFICATION_FROM — sender address; default 'onboarding@resend.dev'
//                            (test-grade — verify a real domain before pilot)
//
// Sends sequentially per subscriber (each mail carries a personal unsubscribe
// token link — CAN-SPAM/GDPR basics). Cap guards a runaway list; batch API is
// a post-pilot upgrade.

import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const MAX_RECIPIENTS = 500;

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface BlogPostNotificationArgs {
  publishedPageId: string;
  siteTitle: string;
  /** Host readers should land on (custom domain when live, else subdomain). */
  canonicalHost: string;
  post: { slug: string; title: string; excerpt?: string | null };
}

export async function sendBlogPostNotification(args: BlogPostNotificationArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.BLOG_NOTIFICATION_FROM || 'onboarding@resend.dev';

  if (!apiKey) {
    logger.dev('sendBlogPostNotification: skipped (RESEND_API_KEY not set)');
    return;
  }

  try {
    const subscribers = await prisma.blogSubscriber.findMany({
      where: { publishedPageId: args.publishedPageId, status: 'subscribed' },
      select: { email: true, token: true },
      take: MAX_RECIPIENTS + 1,
    });
    if (subscribers.length === 0) return;
    if (subscribers.length > MAX_RECIPIENTS) {
      logger.warn(
        `sendBlogPostNotification: subscriber list exceeds cap (${MAX_RECIPIENTS}); truncating`
      );
      subscribers.length = MAX_RECIPIENTS;
    }

    const postUrl = `https://${args.canonicalHost}/blog/${args.post.slug}`;
    const from = `${args.siteTitle.replace(/[<>"]/g, '')} <${fromAddress}>`;
    const subject = args.post.title;

    for (const sub of subscribers) {
      const unsubscribeUrl = `https://${args.canonicalHost}/api/blog/unsubscribe?token=${encodeURIComponent(sub.token)}`;

      const text = [
        args.post.title,
        '',
        args.post.excerpt || '',
        '',
        `Read the article: ${postUrl}`,
        '',
        `—`,
        `You are receiving this because you subscribed to ${args.siteTitle}.`,
        `Unsubscribe: ${unsubscribeUrl}`,
      ]
        .filter((l, i, arr) => l !== '' || arr[i - 1] !== '')
        .join('\n');

      const html =
        `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;color:#111;max-width:560px;margin:0 auto">` +
        `<h2 style="margin:0 0 12px;font-size:20px;line-height:1.3">${escapeHtml(args.post.title)}</h2>` +
        (args.post.excerpt
          ? `<p style="margin:0 0 16px;color:#444;line-height:1.6">${escapeHtml(args.post.excerpt)}</p>`
          : '') +
        `<p style="margin:0 0 24px"><a href="${escapeHtml(postUrl)}" style="display:inline-block;padding:10px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Read the article</a></p>` +
        `<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;color:#888;font-size:12px;line-height:1.6">` +
        `You are receiving this because you subscribed to ${escapeHtml(args.siteTitle)}. ` +
        `<a href="${escapeHtml(unsubscribeUrl)}" style="color:#888">Unsubscribe</a></p>` +
        `</div>`;

      const res = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: sub.email, subject, text, html }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        logger.warn(`sendBlogPostNotification: Resend responded ${res.status}`, () => body.slice(0, 300));
        // Surface a dropped subscriber notification to Sentry (F30). Recipient
        // email is PII — omitted; publishedPageId + post slug are enough to trace.
        Sentry.captureException(new Error(`sendBlogPostNotification: Resend responded ${res.status}`), {
          level: 'warning',
          tags: { area: 'email', op: 'sendBlogPostNotification' },
          extra: {
            status: res.status,
            body: body.slice(0, 300),
            publishedPageId: args.publishedPageId,
            postSlug: args.post.slug,
          },
        });
      }
    }
  } catch (err) {
    // Never let email failures affect the publish.
    logger.warn('sendBlogPostNotification: failed', () => (err instanceof Error ? err.message : String(err)));
  }
}
