// Shared Sentry config helpers used by sentry.{server,edge,client}.config.ts.
// Edge-safe: only reads process.env + plain logic (no Node APIs).
import type { ErrorEvent, EventHint } from '@sentry/nextjs';

// Sentry is fully DSN-gated: with no DSN, every Sentry.init() is skipped and
// captureException() becomes a no-op, so local dev / tests stay silent.
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export const SENTRY_ENVIRONMENT =
  process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';

// Errors-only to start (protects free-tier quota). Bump to 0.2 to turn on
// performance tracing once we want span data.
export const SENTRY_TRACES_SAMPLE_RATE = 0;

// logger.error messages that fire on EXPECTED, self-recovered AI-provider
// retries (callAIProvider runs once per provider; the primary's failure logs
// even when the secondary succeeds). The intermediate fallbacks themselves use
// logger.warn (not forwarded), and the TERMINAL "Both AI providers failed" log
// is intentionally NOT in this list — a real total outage still reports.
const AI_FALLBACK_NOISE = [
  'AI provider call failed',
  'OpenAI API Error',
  'Nebius API Error',
  'Error calling OpenAI',
  'Error calling Nebius',
];

function eventText(event: ErrorEvent): string {
  const msg = typeof event.message === 'string' ? event.message : '';
  const values = event.exception?.values?.map((v) => v.value || '').join(' ') || '';
  return `${msg} ${values}`;
}

export function sentryBeforeSend(event: ErrorEvent, _hint: EventHint): ErrorEvent | null {
  const text = eventText(event);

  // Drop expected, recovered AI-provider retry noise so it can't bury real
  // errors or eat the 5k/mo quota.
  if (AI_FALLBACK_NOISE.some((sig) => text.includes(sig))) {
    return null;
  }

  // Collapse genuine AI-provider / network failures into a single issue so
  // repeats group together instead of flooding the issue list.
  if (/providers failed|ai provider|ENOTFOUND|fetch failed/i.test(text)) {
    event.fingerprint = ['ai-provider'];
  }

  return event;
}
