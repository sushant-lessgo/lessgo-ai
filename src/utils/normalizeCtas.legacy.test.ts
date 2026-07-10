// src/utils/normalizeCtas.legacy.test.ts
// goal-ref-cta phase 2 — frozen legacy-fixture regression.
//
// Locks the no-migration contract (spec Constraints; plan phase 2 steps 2 & 4):
// a project saved BEFORE this feature (legacy `buttonConfig`, raw hrefs, a
// metadata-less button; NO `cta` key, NO `dest:'GOAL_REF'`) must render
// byte-identically. `normalizeCtas`'s `if (!cta) continue;` guard must leave
// every legacy entry untouched, and `resolveCtaHref` must reproduce the exact
// pre-feature hrefs. If a future change "helpfully" upgrades legacy content to
// GOAL_REF, this test fails.

import { describe, it, expect } from 'vitest';
import { normalizeCtas } from './normalizeCtas';
import { resolveCtaHref } from './resolveCtaHref';
import type { Brief } from '@/types/brief';
import {
  LEGACY_CTA_CONTENT,
  LEGACY_CTA_FORMS,
  LEGACY_CTA_EXPECTED_HREFS,
} from './__fixtures__/legacyCta.fixture';

type Goal = NonNullable<Brief['goal']>;

// A live M1 goal — the feature is fully "on". Legacy content must be unaffected
// REGARDLESS of goal, because no legacy entry carries a `cta` key.
const M1_GOAL: Goal = { intent: 'enquiry', mechanism: 'M1' };

describe('normalizeCtas — frozen legacy fixture (no-migration contract)', () => {
  it('returns the SAME reference when goal is active (nothing to down-convert)', () => {
    // No `cta` keys anywhere → normalizeCtas never clones → identity.
    const out = normalizeCtas(LEGACY_CTA_CONTENT, {
      goal: M1_GOAL,
      forms: LEGACY_CTA_FORMS,
    });
    expect(out).toBe(LEGACY_CTA_CONTENT);
  });

  it('returns the SAME reference when goal is null', () => {
    const out = normalizeCtas(LEGACY_CTA_CONTENT, { goal: null, forms: LEGACY_CTA_FORMS });
    expect(out).toBe(LEGACY_CTA_CONTENT);
  });

  it('output is byte-identical (deep-equal) to the frozen input', () => {
    const out = normalizeCtas(LEGACY_CTA_CONTENT, {
      goal: M1_GOAL,
      forms: LEGACY_CTA_FORMS,
    });
    expect(JSON.stringify(out)).toBe(JSON.stringify(LEGACY_CTA_CONTENT));
  });

  it('never invents a GOAL_REF or cta on legacy content', () => {
    const serialized = JSON.stringify(
      normalizeCtas(LEGACY_CTA_CONTENT, { goal: M1_GOAL, forms: LEGACY_CTA_FORMS }),
    );
    expect(serialized).not.toContain('GOAL_REF');
    expect(serialized).not.toContain('"cta":');
  });
});

describe('resolveCtaHref — frozen legacy fixture hrefs', () => {
  // Walk every button in the fixture, resolve it exactly as a published reader
  // would (buttonConfig + forms + default '#cta' fallback), and assert the
  // frozen pre-feature href.
  const rows: Array<[string, string, string]> = [
    ['hero-abc12345', 'cta_text', LEGACY_CTA_EXPECTED_HREFS['hero-abc12345.cta_text']],
    ['cta-def67890', 'cta_text', LEGACY_CTA_EXPECTED_HREFS['cta-def67890.cta_text']],
    ['header-11112222', 'cta_text', LEGACY_CTA_EXPECTED_HREFS['header-11112222.cta_text']],
    [
      'features-33334444',
      'secondary_cta_text',
      LEGACY_CTA_EXPECTED_HREFS['features-33334444.secondary_cta_text'],
    ],
    ['footer-55556666', 'cta_text', LEGACY_CTA_EXPECTED_HREFS['footer-55556666.cta_text']],
  ];

  it.each(rows)('%s.%s resolves to the frozen href', (sectionId, elementKey, expected) => {
    const section = LEGACY_CTA_CONTENT[sectionId];
    const buttonConfig = section?.elementMetadata?.[elementKey]?.buttonConfig;
    expect(resolveCtaHref(buttonConfig, LEGACY_CTA_FORMS)).toBe(expected);
  });

  it('resolves identically after normalizeCtas (same content, feature on)', () => {
    const out = normalizeCtas(LEGACY_CTA_CONTENT, {
      goal: M1_GOAL,
      forms: LEGACY_CTA_FORMS,
    });
    for (const [sectionId, elementKey, expected] of rows) {
      const bc = out[sectionId]?.elementMetadata?.[elementKey]?.buttonConfig;
      expect(resolveCtaHref(bc, LEGACY_CTA_FORMS)).toBe(expected);
    }
  });
});
