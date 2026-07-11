// src/modules/wizard/generation/errorMessage.ts
// scale 1-10 F27b — presentation guard for generation failures.
//
// The copy/strategy routes surface an AI-response failure by forwarding the
// thrown error's `.message`. When the AI emits an off-schema shape, that thrown
// error is a ZodError whose `.message` is a ~1.2 kB JSON blob of internal schema
// paths (`[{ "code": "invalid_union", "path": ["footer","elements",...] }]`).
// The wizard's "Generation hit a snag" panel would print it verbatim.
//
// `humanizeGenerationError` is the single treatment the customer-facing failure
// states run every error string through: a raw ZodError / JSON blob is mapped to
// ONE human sentence; already-human siblings ("Too many requests. Please try
// again later.", "Could not read that website.", "Out of credits.") pass through
// unchanged. The full error is still captured server-side (logger/Sentry) — this
// module never logs, it only decides what the user sees.
//
// FIREWALL: PLAIN module (no `'use client'`) — pure string→string, unit-testable
// in isolation and safe for either renderer to import.

/** Shown when the AI response fails schema validation (the F27 case). */
export const GENERIC_SCHEMA_ERROR =
  'The AI response came back in an unexpected shape. Try again — this usually resolves on a retry.';

/** Shown when we have no usable message at all. */
export const GENERIC_GENERATION_ERROR =
  'Something went wrong while building your page. Please try again.';

/**
 * True when `s` looks like a raw ZodError / JSON blob rather than a human
 * sentence — a serialized issue array/object, or one carrying Zod issue markers
 * even when truncated. Deliberately conservative: only strings that clearly are
 * machine output are rewritten, so hand-written sibling errors survive verbatim.
 */
function looksLikeRawSchemaError(s: string): boolean {
  // A serialized array/object payload (ZodError.message is stringified issues).
  if (s.startsWith('[') || s.startsWith('{')) return true;
  if (/zoderror/i.test(s)) return true;
  // Zod issue field markers — present even in a mid-string / truncated blob.
  if (/"(code|path|expected|received|unionErrors)"\s*:/.test(s)) return true;
  if (/invalid_union|invalid_type|invalid_enum_value|too_small|too_big/.test(s)) return true;
  return false;
}

/**
 * Map a raw generation error string to what the customer should see. Never
 * returns a ZodError / JSON blob. Preserves already-human messages.
 */
export function humanizeGenerationError(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return GENERIC_GENERATION_ERROR;
  const s = raw.trim();
  if (looksLikeRawSchemaError(s)) return GENERIC_SCHEMA_ERROR;
  return s;
}
