import posthog from 'posthog-js';
import { logger } from '@/lib/logger';

// data-capture phase 4 — failure telemetry (PostHog, client-side only).
// Same posthog-js pattern as `src/utils/trackEdit.ts` / the phase-3 `trackRegen`
// helper in `aiActions.ts`. Consumers (`thing.ts` / `trust.ts` generation
// adapters, `EntryInputStep.tsx`) all execute client-side and are never imported
// by a published renderer, so the client-only posthog import is boundary-safe.

/**
 * Fire-and-forget failure emit. Any missing/uninitialized posthog or a thrown
 * error is swallowed — an emit must NEVER alter the caller's control flow.
 */
export function trackFailure(event: string, props: Record<string, unknown>): void {
  try {
    posthog?.capture?.(event, props);
  } catch (e) {
    try {
      logger.warn(`[data-capture] posthog ${event} emit failed`, e);
    } catch {
      /* swallow — telemetry must never throw into the caller */
    }
  }
}

/**
 * silent-fallback — emit a `generation_degraded` event when a run SUCCEEDED but
 * came back MOCK or INCOMPLETE, so a too-fast/canned generation is no longer
 * invisible. Same fire-and-forget contract as `trackFailure` (never throws into
 * the caller). Called by the GeneratingSlot only when the degraded signal is set.
 */
export function trackGenerationDegraded(props: Record<string, unknown>): void {
  try {
    posthog?.capture?.('generation_degraded', props);
  } catch (e) {
    try {
      logger.warn('[data-capture] posthog generation_degraded emit failed', e);
    } catch {
      /* swallow — telemetry must never throw into the caller */
    }
  }
}

// Parse-failure signature. VERIFIED against the throw sites the audience routes'
// AI loop catches (`src/lib/aiClient.ts` generateRawJson): `'No JSON found in
// response'` (L234), native `JSON.parse` SyntaxErrors (`'Unexpected token …'`,
// `'Unexpected end of JSON input'`, `'… is not valid JSON'` — all contain
// "JSON"), and a zod `schema.parse` ZodError (message is a JSON issues array,
// i.e. starts with `[`). None of the generic generation fallbacks
// (`'AI generation failed'`, `'Failed to generate copy after multiple attempts'`,
// `'Empty response from Claude'`, `'OpenAI returned null parsed response'`)
// contain these markers, so the match is precise.
const PARSE_SIGNATURE = /no json found|json|unexpected token/i;

/**
 * Routes a generation/strategy failure to the right PostHog event NAME.
 *
 * The audience routes never return a literal `parse_failed` error CODE — a
 * parse/schema failure surfaces only in the `message`. generate-copy returns
 * code `generation_failed`, strategy returns `ai_error`; both carry the
 * underlying AI-loop message. So the parse-vs-generation split is decided by the
 * message signature above, defaulting to `generation_failed` when no parse
 * marker is present (network errors, empty responses, save failures, etc.).
 */
export function failureEventName(
  message: string | null | undefined
): 'parse_failed' | 'generation_failed' {
  const m = (message ?? '').trim();
  if (PARSE_SIGNATURE.test(m) || m.startsWith('[')) return 'parse_failed';
  return 'generation_failed';
}
