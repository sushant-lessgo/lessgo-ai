// src/lib/editDelta/capture.ts
//
// data-capture Phase 2 — server-side baseline freeze + edit-delta capture.
// PLAIN server module (no 'use client'): consumed only by /api/saveDraft.
//
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ ELEMENT-SHAPE PARITY INVARIANT (the whole ballgame — a mismatch silently
//    corrupts every captured row).
//
// The baseline is frozen from ONE serialization of an element and later diffed
// against a DIFFERENT one. `extractElementText` MUST normalize BOTH to the
// IDENTICAL string, else an UNEDITED element diffs non-zero and we write a bogus
// "AI wrote X, user changed to X'" row. Verified shapes (2026-07-12):
//
//   FREEZE side — wizard `finalContent.content[id].elements` (finalize.ts ~L76:
//     `elements = copy[type].elements`). After parseAiResponse, each value is a
//     plain `string` (headline/subheadline/…) or `string[]` (pipe/collection
//     fields like feature_titles). The `SectionCopy.elements` *type* also admits
//     `{ value, needsReview }` and `Record<string,unknown>[]`, but the parser
//     output that actually reaches finalContent is string | string[] (parseAi
//     writes `result.content[key] = processedElement.value`). `form_id` etc. are
//     plain strings and diff to 0 (present identically on both sides).
//
//   DIFF side — editor store `export()` (persistenceActions.ts ~L569 →
//     autoSaveDraft.ts:155). `SectionData.elements` is the V2 DIRECT format:
//     contentActions writes `elements[key] = <string>` / `<string[]>` verbatim
//     (no wrapper). So the common path is ALSO string | string[] — parity holds
//     trivially. The legacy flattened→legacy rebuild (flattenedState.ts ~L256)
//     can emit `{ content, type, isEditable }` wrappers, so the extractor also
//     unwraps `.content`. Defensively it unwraps `.value` too (the freeze-side
//     `{ value }` union member).
//
// Because the SAME extractor runs on both the frozen baseline text and the
// current export text, differing wrapper shapes are harmless AS LONG AS both
// normalize to the same inner string — which is exactly what unwrapping guarantees.
// ─────────────────────────────────────────────────────────────────────────────

import { editDistance } from '@/lib/editDelta/editDistance';

/** Flat baseline map: `{ [sectionId]: { [elementKey]: normalizedText } }`. */
export type Baseline = Record<string, Record<string, string>>;

export interface CollectedElement {
  sectionId: string;
  sectionType: string;
  elementKey: string;
  /** Normalized element text (never null — null-normalizing elements are skipped). */
  text: string;
}

const MAX_TEXT = 20000; // aiText / userText column truncation cap

/**
 * Normalize ANY element serialization (freeze side OR diff side) to a single
 * comparable string. See the parity invariant above.
 *   - string            → as-is
 *   - `{ content }`      → recurse on `.content` (legacy editor wrapper)
 *   - `{ value }`        → recurse on `.value`   (freeze-side review wrapper)
 *   - string[]           → join with '\n'
 *   - anything else/empty → null (element is skipped — no baseline, no delta)
 */
export function extractElementText(el: unknown): string | null {
  if (typeof el === 'string') return el;

  if (Array.isArray(el)) {
    // Only string arrays produce text; object arrays (card structures) → null.
    if (el.every((x) => typeof x === 'string')) {
      return el.join('\n');
    }
    return null;
  }

  if (el && typeof el === 'object') {
    const obj = el as Record<string, unknown>;
    if ('content' in obj) return extractElementText(obj.content);
    if ('value' in obj) return extractElementText(obj.value);
    return null;
  }

  return null; // number | boolean | null | undefined
}

const META_KEYS = new Set([
  // top-level finalContent keys that are NOT section maps — never walked, but
  // guarded defensively in case a caller passes a flattened blob.
  'layout',
  'meta',
  'forms',
  'onboardingData',
  'localeContent',
  'localeConfig',
  'chrome',
  'navigationConfig',
  'socialMediaConfig',
  'legalPages',
  'theme',
  'globalSettings',
  'generationProgress',
  'baseline',
]);

function collectFromSectionMap(
  sections: unknown,
  out: CollectedElement[],
): void {
  if (!sections || typeof sections !== 'object') return;
  for (const [sectionId, section] of Object.entries(sections as Record<string, unknown>)) {
    if (META_KEYS.has(sectionId)) continue;
    if (!section || typeof section !== 'object') continue;
    const elements = (section as Record<string, unknown>).elements;
    if (!elements || typeof elements !== 'object') continue;
    const sectionType = sectionId.split('-')[0];
    for (const [elementKey, rawValue] of Object.entries(elements as Record<string, unknown>)) {
      const text = extractElementText(rawValue);
      if (text === null) continue; // non-text / empty → skip
      out.push({ sectionId, sectionType, elementKey, text });
    }
  }
}

/**
 * Walk a finalContent payload into a flat list of normalized text elements.
 *
 * Single-walk rule: on multi-page exports the top-level `content` equals
 * `pages[homeId].content`, so we walk `pages[*].content` when `pages` is present
 * and non-empty, ELSE the top-level `content` — never both (double-processing).
 * Section IDs are globally unique (`${type}-${uuid}`) so no page nesting needed.
 * Tolerates empty-skeleton pages (`content: {}` → no entries). `localeContent`
 * (i18n overlay) is top-level and never walked.
 */
export function collectElements(finalContent: unknown): CollectedElement[] {
  const out: CollectedElement[] = [];
  if (!finalContent || typeof finalContent !== 'object') return out;
  const fc = finalContent as Record<string, unknown>;

  const pages = fc.pages;
  if (pages && typeof pages === 'object' && Object.keys(pages).length > 0) {
    for (const page of Object.values(pages as Record<string, unknown>)) {
      if (page && typeof page === 'object') {
        collectFromSectionMap((page as Record<string, unknown>).content, out);
      }
    }
  } else {
    collectFromSectionMap(fc.content, out);
  }

  return out;
}

/**
 * Compute the next `aiBaseline` from the stored baseline, the freshly collected
 * elements, and an optional client `aiBaselinePatch`.
 *   - Additive first-sight freeze: a `(sectionId, elementKey)` present in
 *     `collected` but ABSENT from `stored` is frozen with its current normalized
 *     text. Existing entries are NEVER re-frozen (an already-seen AI element must
 *     keep its original baseline so later user edits diff against it).
 *   - Patch deep-merge: `aiBaselinePatch` (regen re-freeze) is layered LAST and
 *     WINS over the additive freeze (section/element regen replaces the baseline).
 * Returns `{ next, changed }`; `changed` is false when `next` deep-equals `stored`
 * (lets the caller skip rewriting a large JSON column on every autosave).
 */
export function computeNextBaseline(
  stored: Baseline | null | undefined,
  collected: CollectedElement[],
  patch?: Record<string, Record<string, string>> | null,
): { next: Baseline; changed: boolean } {
  const next: Baseline = {};
  // Deep-clone stored (preserve every existing frozen entry).
  if (stored && typeof stored === 'object') {
    for (const [sid, elems] of Object.entries(stored)) {
      if (elems && typeof elems === 'object') {
        next[sid] = { ...(elems as Record<string, string>) };
      }
    }
  }

  let changed = false;

  // Additive first-sight freeze.
  for (const { sectionId, elementKey, text } of collected) {
    if (next[sectionId]?.[elementKey] === undefined) {
      if (!next[sectionId]) next[sectionId] = {};
      next[sectionId][elementKey] = text;
      changed = true;
    }
  }

  // Patch merge (wins).
  if (patch && typeof patch === 'object') {
    for (const [sid, elems] of Object.entries(patch)) {
      if (!elems || typeof elems !== 'object') continue;
      for (const [ek, val] of Object.entries(elems)) {
        if (typeof val !== 'string') continue;
        if (!next[sid]) next[sid] = {};
        if (next[sid][ek] !== val) {
          next[sid][ek] = val;
          changed = true;
        }
      }
    }
  }

  return { next, changed };
}

/** Minimal prisma surface used here — keeps the module unit-testable with a mock. */
export interface EditDeltaPrisma {
  editDelta: {
    // `any` (not `unknown`) so the real Prisma client's precisely-typed methods
    // remain assignable to this minimal surface (arg contravariance).
    upsert: (args: any) => Promise<any>;
    deleteMany: (args: any) => Promise<any>;
  };
}

export interface CaptureEditDeltasParams {
  prisma: EditDeltaPrisma;
  tokenId: string;
  /** The NEXT baseline (normalized text) to diff against. */
  baseline: Baseline;
  collected: CollectedElement[];
  templateId: string | null;
  audienceType: string | null;
  isFounderEdit: boolean;
}

const cap = (s: string): string => (s.length > MAX_TEXT ? s.slice(0, MAX_TEXT) : s);

/**
 * Diff `collected` against `baseline` and persist the divergence:
 *   - element WITH a baseline entry, current text ≠ baseline → UPSERT its row
 *     (unique key `(projectToken, sectionId, elementKey)`), with editDistance and
 *     aiText/userText truncated to 20k;
 *   - element WITH a baseline entry, current text == baseline → REVERT: delete any
 *     existing row (one deleteMany over the reverted keys, only when non-empty);
 *   - element with NO baseline entry (user-added, or non-text) → skipped.
 * The table therefore always equals "current divergence from the latest baseline".
 */
export async function captureEditDeltas(params: CaptureEditDeltasParams): Promise<void> {
  const { prisma, tokenId, baseline, collected, templateId, audienceType, isFounderEdit } = params;

  const changedUpserts: Promise<unknown>[] = [];
  const revertedKeys: Array<{ sectionId: string; elementKey: string }> = [];

  for (const { sectionId, sectionType, elementKey, text } of collected) {
    const baseText = baseline[sectionId]?.[elementKey];
    if (baseText === undefined) continue; // no baseline → not an AI element we track

    if (text === baseText) {
      revertedKeys.push({ sectionId, elementKey });
      continue;
    }

    const dist = editDistance(baseText, text);
    changedUpserts.push(
      prisma.editDelta.upsert({
        where: {
          projectToken_sectionId_elementKey: {
            projectToken: tokenId,
            sectionId,
            elementKey,
          },
        },
        create: {
          projectToken: tokenId,
          sectionId,
          sectionType,
          elementKey,
          aiText: cap(baseText),
          userText: cap(text),
          editDistance: dist,
          templateId,
          audienceType,
          isFounderEdit,
        },
        update: {
          sectionType,
          aiText: cap(baseText),
          userText: cap(text),
          editDistance: dist,
          templateId,
          audienceType,
          isFounderEdit,
        },
      }),
    );
  }

  if (changedUpserts.length > 0) {
    await Promise.all(changedUpserts);
  }

  // Revert cleanup: drop rows for elements back at baseline (idempotent — deletes
  // 0 when no row exists). Only fire when there are candidates.
  if (revertedKeys.length > 0) {
    await prisma.editDelta.deleteMany({
      where: {
        projectToken: tokenId,
        OR: revertedKeys.map((k) => ({ sectionId: k.sectionId, elementKey: k.elementKey })),
      },
    });
  }
}
