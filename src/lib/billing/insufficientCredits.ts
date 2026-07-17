/**
 * Insufficient-credits normalizer (presentation layer, client-safe — no prisma).
 *
 * Blocked AI ops answer with THREE mutually incompatible 402 body shapes today.
 * Changing the routes' shapes is out of scope for the billing-beta slice, so the
 * client normalizes instead. All shapes below are transcribed from route source
 * (verified 2026-07-17 — the scout doc's original "Pattern A is nested" claim was
 * FALSE and had propagated into this module; see docs/task/billing-beta.audit.md):
 *
 *   1. Pattern A — FLAT. `error` is the CODE, `message` is TOP-LEVEL, and the
 *      numbers are on the body:
 *        { success: false,
 *          error: 'insufficient_credits',
 *          message: 'Insufficient credits. Required: 1, Available: 0',
 *          creditsRequired: 1, creditsRemaining: 0 }
 *      (v2/scrape-website:239,:360 · v2/understand:174,:274 ·
 *       audience/{product,service,work}/{strategy,generate-copy} ·
 *       generate-privacy-policy:192). ~15 emitters — the whole wizard lane.
 *      **Variant:** outreach/[token]/route.ts:384 is identical EXCEPT it names the
 *      numbers `required`/`remaining` instead of `creditsRequired`/`creditsRemaining`.
 *      Note generate-privacy-policy:195 may send a message that does NOT match
 *      MESSAGE_RE (`consumption.error`) — only its structured numbers save it.
 *   2. Pattern B — `{ error: 'Insufficient credits. Required: N, Available: M',
 *      code: 'INSUFFICIENT_CREDITS' }` (`requireAICredits` / `createErrorResponse`,
 *      src/lib/middleware/planCheck.ts:100,:268). No structured numbers — the regex
 *      fallback exists for THIS shape only.
 *   3. `checkAIAccess` (planCheck.ts:243) — Pattern B PLUS
 *      `details: { required, available }`.
 *
 * Precedence for the numbers: structured fields (`details` > `creditsRequired`/
 * `creditsRemaining` > `required`/`remaining`) BEAT the message regex.
 *
 * NOT handled on purpose: `api/social/[token]/posts/route.ts:233` answers **403**
 * with `error: 'limit_reached'` for its upgrade wall. That is a deliberately
 * separate convention (a plan limit, not a credit balance) — this normalizer must
 * return `null` for it, and its UI keys off `error === 'limit_reached'`.
 */

/** Numbers recovered from a blocked-op response. Either may be absent. */
export interface InsufficientCreditsInfo {
  required?: number;
  available?: number;
}

/** Typed throw for call sites that surface the block as an error. */
export class InsufficientCreditsError extends Error {
  readonly required?: number;
  readonly available?: number;

  constructor(info: InsufficientCreditsInfo = {}, message?: string) {
    super(message ?? 'Insufficient credits');
    this.name = 'InsufficientCreditsError';
    this.required = info.required;
    this.available = info.available;
  }
}

/** Case-insensitive: the codes the three shapes use. */
const INSUFFICIENT_CODES = new Set(['insufficient_credits']);

/**
 * LAST-RESORT fallback for Pattern B, the only shape with no structured numbers.
 * Every other known emitter is read structurally, so regex exposure is now scoped
 * to planCheck.ts:100/:268.
 */
const MESSAGE_RE = /Insufficient credits\.\s*Required:\s*(\d+)\s*,\s*Available:\s*(-?\d+)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Only finite numbers survive; strings/null/NaN are treated as absent. */
function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function matchesCode(value: unknown): boolean {
  return typeof value === 'string' && INSUFFICIENT_CODES.has(value.toLowerCase());
}

/**
 * Normalize a blocked-op response into `{ required?, available? }`, or `null`
 * when the response is not an insufficient-credits block.
 *
 * Claim rules (belt-and-braces): a 402 is claimed when the body looks like any of
 * the three shapes; a non-402 status is claimed ONLY when the body carries the
 * explicit `insufficient_credits` code (so the social 403 wall, 500s, and empty
 * or non-JSON bodies all fall through to `null`).
 *
 * A 402 with a malformed/empty/non-JSON body still returns `{}` — the caller gets
 * a usable "you're out of credits" signal with no numbers, never a crash. That `{}`
 * is a LAST RESORT for genuinely unknown bodies: no *known* emitter should reach it.
 * (It previously swallowed the entire Pattern A lane while looking like a graceful
 * degrade — a silent `{}` here means a shape drifted, not that all is well.)
 */
export function parseInsufficientCredits(
  status: number,
  body: unknown,
): InsufficientCreditsInfo | null {
  const is402 = status === 402;

  if (!isRecord(body)) {
    // Empty / non-JSON / string / array body: a 402 is still a credit block.
    return is402 ? {} : null;
  }

  // `body.error` is dual-purpose: Pattern A puts the CODE there
  // ('insufficient_credits'); Pattern B/3 put the human MESSAGE there.
  const errorStr = typeof body.error === 'string' ? body.error : undefined;
  const errorIsCode = matchesCode(errorStr);

  // Pattern A carries the code in `error`; Patterns B/3 use a top-level `code`.
  const hasCode = matchesCode(body.code) || errorIsCode;

  // The human message: top-level `message` (Pattern A) or the `error` string (B/3,
  // but only when it isn't the code).
  const message =
    (typeof body.message === 'string' ? body.message : undefined) ??
    (errorIsCode ? undefined : errorStr);

  const looksInsufficient = hasCode || (message !== undefined && MESSAGE_RE.test(message));

  if (!looksInsufficient) {
    // A 402 whose body we don't recognize is still a credit block (never crash,
    // always usable); any other status without the code is not ours to claim.
    return is402 ? {} : null;
  }
  if (!is402 && !hasCode) return null;

  // Structured numbers beat the regex. `details` = checkAIAccess;
  // `creditsRequired`/`creditsRemaining` = Pattern A; `required`/`remaining` =
  // Pattern A's outreach variant (outreach/[token]/route.ts:384).
  const details = isRecord(body.details) ? body.details : undefined;
  let required =
    toNumber(details?.required) ?? toNumber(body.creditsRequired) ?? toNumber(body.required);
  let available =
    toNumber(details?.available) ?? toNumber(body.creditsRemaining) ?? toNumber(body.remaining);

  if (required === undefined || available === undefined) {
    // Pattern B only — no known structured-number emitter reaches this.
    const match = message ? MESSAGE_RE.exec(message) : null;
    if (match) {
      required = required ?? Number(match[1]);
      available = available ?? Number(match[2]);
    }
  }

  const info: InsufficientCreditsInfo = {};
  if (required !== undefined) info.required = required;
  if (available !== undefined) info.available = available;
  return info;
}
