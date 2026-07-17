import { describe, it, expect } from 'vitest';
import {
  parseInsufficientCredits,
  InsufficientCreditsError,
} from './insufficientCredits';

/**
 * Fixtures TRANSCRIBED FROM ROUTE SOURCE, each citing its file + line. Do not
 * paraphrase a doc into this file: the first version of PATTERN_A was written from
 * the scout doc's prose, pinned a body no route has ever sent, and went green while
 * the module was broken. Read the route.
 * If a route's body ever changes, THESE are what must be updated first.
 */

/**
 * Pattern A — FLAT. src/app/api/v2/scrape-website/route.ts:239-247 (verbatim).
 * Same shape at scrape-website:360, v2/understand:174,:274,
 * audience/{product,service,work}/{strategy,generate-copy}, generate-privacy-policy:192.
 * Independently pinned by src/app/api/audience/product/strategy/route.test.ts:135-140.
 */
const PATTERN_A = {
  success: false,
  error: 'insufficient_credits',
  message: 'Insufficient credits. Required: 1, Available: 0',
  creditsRequired: 1,
  creditsRemaining: 0,
};

/**
 * Pattern A, outreach variant — `required`/`remaining`, not `credits*`.
 * src/app/api/outreach/[token]/route.ts:384-392 (verbatim).
 */
const PATTERN_A_OUTREACH = {
  success: false,
  error: 'insufficient_credits',
  message: 'Insufficient credits. Required: 3, Available: 1',
  required: 3,
  remaining: 1,
};

/** Pattern B — src/lib/middleware/planCheck.ts:100 (requireAICredits/createErrorResponse). */
const PATTERN_B = {
  error: 'Insufficient credits. Required: 2, Available: 0',
  code: 'INSUFFICIENT_CREDITS',
};

/** src/lib/middleware/planCheck.ts:243 — Pattern B plus structured `details`. */
const CHECK_AI_ACCESS = {
  error: 'Insufficient credits. Required: 1, Available: 0',
  code: 'INSUFFICIENT_CREDITS',
  details: { required: 1, available: 0 },
};

/** src/app/api/social/[token]/posts/route.ts:233 — 403, deliberately NOT a 402. */
const SOCIAL_403_WALL = {
  success: false,
  error: 'limit_reached',
  remaining: 0,
  tier: 'FREE',
  window: 'lifetime',
};

describe('parseInsufficientCredits', () => {
  it('parses Pattern A (flat: `error` is the code, numbers on the body)', () => {
    expect(parseInsufficientCredits(402, PATTERN_A)).toEqual({
      required: 1,
      available: 0,
    });
  });

  it('parses the outreach variant of Pattern A (`required`/`remaining`)', () => {
    expect(parseInsufficientCredits(402, PATTERN_A_OUTREACH)).toEqual({
      required: 3,
      available: 1,
    });
  });

  it('prefers Pattern A structured numbers over its message text', () => {
    expect(
      parseInsufficientCredits(402, {
        ...PATTERN_A,
        message: 'Insufficient credits. Required: 99, Available: 99',
      }),
    ).toEqual({ required: 1, available: 0 });
  });

  it('recovers Pattern A numbers even when the message does not match the regex', () => {
    // generate-privacy-policy/route.ts:195 sends `consumption.error` as the message.
    expect(
      parseInsufficientCredits(402, {
        success: false,
        error: 'insufficient_credits',
        message: 'Insufficient credits',
        creditsRequired: 5,
        creditsRemaining: 2,
      }),
    ).toEqual({ required: 5, available: 2 });
  });

  it('parses Pattern B (top-level error string + code)', () => {
    expect(parseInsufficientCredits(402, PATTERN_B)).toEqual({
      required: 2,
      available: 0,
    });
  });

  it('parses checkAIAccess details, preferring structured numbers over the message', () => {
    expect(parseInsufficientCredits(402, CHECK_AI_ACCESS)).toEqual({
      required: 1,
      available: 0,
    });

    // Structured details win when they disagree with the message text.
    expect(
      parseInsufficientCredits(402, {
        ...CHECK_AI_ACCESS,
        error: 'Insufficient credits. Required: 99, Available: 99',
      }),
    ).toEqual({ required: 1, available: 0 });
  });

  it('does NOT claim the social 403 upgrade wall', () => {
    expect(parseInsufficientCredits(403, SOCIAL_403_WALL)).toBeNull();
  });

  it('returns null for a 500 body', () => {
    expect(
      parseInsufficientCredits(500, { error: 'Internal server error' }),
    ).toBeNull();
  });

  it('returns null for unrelated success/4xx bodies', () => {
    expect(parseInsufficientCredits(200, { success: true })).toBeNull();
    expect(parseInsufficientCredits(401, { error: 'Unauthorized' })).toBeNull();
    expect(parseInsufficientCredits(404, null)).toBeNull();
  });

  it('still reports a block for a 402 with a malformed/empty/non-JSON body', () => {
    // A blocked op must always produce a usable message — never a crash.
    expect(parseInsufficientCredits(402, undefined)).toEqual({});
    expect(parseInsufficientCredits(402, null)).toEqual({});
    expect(parseInsufficientCredits(402, '')).toEqual({});
    expect(parseInsufficientCredits(402, '<html>502 Bad Gateway</html>')).toEqual({});
    expect(parseInsufficientCredits(402, {})).toEqual({});
    expect(parseInsufficientCredits(402, [])).toEqual({});
    expect(parseInsufficientCredits(402, { error: 'something else' })).toEqual({});
  });

  it('omits numbers it cannot recover rather than guessing', () => {
    // Code present, no structured numbers, message the regex can't read.
    expect(
      parseInsufficientCredits(402, {
        success: false,
        error: 'insufficient_credits',
        message: 'You are out of credits.',
      }),
    ).toEqual({});

    // Non-numeric details fall back to the message.
    expect(
      parseInsufficientCredits(402, {
        error: 'Insufficient credits. Required: 5, Available: 1',
        code: 'INSUFFICIENT_CREDITS',
        details: { required: 'five', available: null },
      }),
    ).toEqual({ required: 5, available: 1 });
  });

  it('claims a non-402 status only when the explicit code is present', () => {
    expect(parseInsufficientCredits(400, PATTERN_B)).toEqual({
      required: 2,
      available: 0,
    });
    expect(parseInsufficientCredits(400, PATTERN_A)).toEqual({
      required: 1,
      available: 0,
    });
    // Message alone, no code, wrong status → not ours.
    expect(
      parseInsufficientCredits(400, {
        error: 'Insufficient credits. Required: 2, Available: 0',
      }),
    ).toBeNull();
  });
});

describe('InsufficientCreditsError', () => {
  it('carries the parsed numbers and a default message', () => {
    const err = new InsufficientCreditsError({ required: 10, available: 3 });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('InsufficientCreditsError');
    expect(err.message).toBe('Insufficient credits');
    expect(err.required).toBe(10);
    expect(err.available).toBe(3);
  });

  it('accepts an override message and empty info', () => {
    const err = new InsufficientCreditsError({}, 'Out of credits');
    expect(err.message).toBe('Out of credits');
    expect(err.required).toBeUndefined();
    expect(err.available).toBeUndefined();
  });
});
