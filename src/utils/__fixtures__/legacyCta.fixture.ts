// src/utils/__fixtures__/legacyCta.fixture.ts
// goal-ref-cta phase 2 — FROZEN pre-feature content blob.
//
// This fixture models a realistic PRE-goal-ref-cta project: legacy ad-hoc
// `buttonConfig` shapes, a raw section-anchor link, a legacy form connection, a
// legacy page link, a raw external url, AND a genuinely metadata-less button
// (no elementMetadata entry — the F5 fallthrough case). It carries NO `cta` key
// and NO `dest:'GOAL_REF'` anywhere — it is what a project saved before this
// feature looks like. The regression test asserts `normalizeCtas` leaves it
// byte-identical (the no-migration contract) and `resolveCtaHref` reproduces the
// exact pre-feature hrefs.
//
// The object is DEEP-FROZEN so any accidental mutation by the pre-pass/resolver
// throws instead of silently passing.

/** Recursively freeze so any mutation throws in the regression test. */
function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === 'object') {
    for (const v of Object.values(obj as Record<string, unknown>)) deepFreeze(v);
    Object.freeze(obj);
  }
  return obj;
}

/**
 * Pre-feature content tree (`Record<sectionId, Section>` + sibling `forms` map),
 * exactly the shape `normalizeCtas` / the published readers consume.
 */
export const LEGACY_CTA_CONTENT = deepFreeze({
  // Legacy raw section-anchor link.
  'hero-abc12345': {
    layout: 'hero-centered',
    elements: { headline: 'Old headline', cta_text: 'Get started' },
    elementMetadata: {
      cta_text: { buttonConfig: { type: 'link', url: '#pricing' } },
    },
  },
  // Legacy form connection (buttonConfig type:'form', form exists in `forms`).
  'cta-def67890': {
    layout: 'cta-centered',
    elements: { cta_text: 'Contact us' },
    elementMetadata: {
      cta_text: { buttonConfig: { type: 'form', formId: 'form-legacy-1' } },
    },
  },
  // Metadata-less button — NO elementMetadata at all (the F5 fallthrough: the
  // reader falls to its own hardcoded fallback). Must stay untouched.
  'header-11112222': {
    layout: 'header-standard',
    elements: { cta_text: 'Sign up' },
  },
  // Legacy cross-page link.
  'features-33334444': {
    layout: 'features-grid',
    elements: { secondary_cta_text: 'See pricing' },
    elementMetadata: {
      secondary_cta_text: { buttonConfig: { type: 'page', pathSlug: '/contact' } },
    },
  },
  // Legacy raw external url.
  'footer-55556666': {
    layout: 'footer-standard',
    elements: { cta_text: 'Book a call' },
    elementMetadata: {
      cta_text: { buttonConfig: { type: 'link', url: 'https://calendly.com/x' } },
    },
  },
  forms: {
    'form-legacy-1': { id: 'form-legacy-1', name: 'Contact', fields: [] },
  },
} as Record<string, any>);

/** The `forms` map passed to `resolveCtaHref` (its form-existence check). */
export const LEGACY_CTA_FORMS: Record<string, any> = LEGACY_CTA_CONTENT.forms;

/**
 * The exact pre-feature hrefs `resolveCtaHref(buttonConfig, forms)` MUST still
 * produce for each button (default fallback '#cta'). Frozen expected snapshot.
 */
export const LEGACY_CTA_EXPECTED_HREFS = deepFreeze({
  'hero-abc12345.cta_text': '#pricing',
  'cta-def67890.cta_text': '#form-section',
  'header-11112222.cta_text': '#cta', // no buttonConfig → fallback
  'features-33334444.secondary_cta_text': '/contact',
  'footer-55556666.cta_text': 'https://calendly.com/x',
} as Record<string, string>);
