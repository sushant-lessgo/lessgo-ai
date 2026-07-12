// src/modules/generation/spread.ts
// template-factory phase 10 — DETERMINISTIC generation spread.
//
// Same-niche new sites should not all start identical. This module supplies a
// SEEDED, REPRODUCIBLE picker: the seed derives from the project token (stable
// for the life of the project), so a re-run for the SAME project yields the SAME
// starting selection, while DIFFERENT tokens spread across the option space.
//
// Three pick points consume it (all render-side only — copy NEVER changes):
//   (a) block-variant choice among eligible  (blockEligibility.pickFromSet, seeded)
//   (b) starting palette                      (thing.ts / trust.ts at creation)
//   (c) starting look for look-bearing tmpls  (trust.ts / hearth)
//
// ── FIREWALL (load-bearing) ─────────────────────────────────────────────────
// PURE DATA. No template-component imports, no `.tsx`, no `'use client'` module,
// no resolver — so server-side / generation-path callers can use it freely. It
// deliberately imports NOTHING (self-contained hashing + RNG). `Math.random()`
// is FORBIDDEN here: spread must be reproducible from the token alone.

/**
 * FNV-1a 32-bit hash of a string → an unsigned 32-bit integer. Stable across
 * runs/platforms (no locale, no Math.random). Used to derive an RNG seed from
 * the project token (optionally namespaced by a salt so independent pick points
 * do not correlate).
 */
export function hashToken(str: string): number {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  return h >>> 0;
}

/**
 * mulberry32 — a tiny, fast, well-distributed seeded PRNG. Given a 32-bit seed it
 * returns a generator producing floats in [0, 1). Deterministic: same seed →
 * same sequence.
 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Derive a seed for a given (token, salt). The salt namespaces the pick point
 * (e.g. `'palette'`, `'look'`, `'block:<default>'`) so palette / look / block
 * choices are independent draws from the SAME token.
 */
export function seedFor(token: string, salt = ''): number {
  return hashToken(salt ? `${token}::${salt}` : token);
}

/**
 * The seeded index into a list of `length` items for (token, salt). Returns -1
 * for an empty list. Deterministic + uniform-ish (single mulberry32 draw).
 */
export function seededIndex(length: number, token: string, salt = ''): number {
  if (length <= 0) return -1;
  const rng = makeRng(seedFor(token, salt));
  return Math.floor(rng() * length);
}

/**
 * Pick one item from `items` deterministically for (token, salt). Returns
 * `undefined` for an empty/absent list. Same (items, token, salt) → same item;
 * different tokens spread across the list.
 */
export function pickSeeded<T>(
  items: readonly T[] | null | undefined,
  token: string,
  salt = ''
): T | undefined {
  if (!items || items.length === 0) return undefined;
  return items[seededIndex(items.length, token, salt)];
}
