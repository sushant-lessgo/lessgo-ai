// src/lib/staticExport/__tests__/realProofPublishedOutput.test.ts
// proof-truth phase 4 — end-to-end published-output guard for the section-level
// `realProof` provenance flag.
//
// The flag rides `section.aiMetadata.realProof` (set by injectRealTestimonials,
// carried by multiPageAssembly). It is persisted and, per the plan's corrected
// invariant, `sanitizeContentForPublish` does NOT strip aiMetadata — it survives
// into published block props via extractContentFields' `...systemProps` spread.
// The safety guarantee is instead that NO block/published-path code READS
// `aiMetadata.realProof`, so React drops the unread object prop and it never
// reaches DOM/HTML.
//
// This test proves that guarantee at the EXPORTER level on REAL rendered HTML
// (generateStaticHTML → published renderer → renderToStaticMarkup):
//   • the real quote text IS in the HTML (real quotes render, unflagged),
//   • the string "realProof" is NOWHERE in the HTML (flag never leaks),
//   • no `[object Object]` (no object-shaped value reached a slot),
//   • no needs-review marker artifacts,
//   • excludedElements are still honored alongside realProof (a sibling
//     aiMetadata key already read by the block hooks).
//
// Do NOT assert on sanitizeContentForPublish's return value — it does not strip
// aiMetadata; the rendered-HTML assertions below are the real gate.

import { vi, describe, it, expect } from 'vitest';
// htmlGenerator/renderPublishedExport are `import 'server-only'`; neutralize it
// so the exporter's real HTML producer runs under vitest (jsdom).
vi.mock('server-only', () => ({}));

import { generateStaticHTML } from '../htmlGenerator';
import { sanitizeContentForPublish } from '@/modules/sections/layoutElementSchema';

const SECTION_ID = 'testimonials-abc12345';

// Distinctive markers so substring assertions can't false-positive on template
// boilerplate.
const QUOTE_ALPHA = 'REALPROOFQUOTEALPHA shipped in two days flat';
const QUOTE_BETA = 'REALPROOFQUOTEBETA saved our launch weekend';
const EXCLUDED_EYEBROW = 'REALPROOFEXCLUDEDEYEBROW';

function buildContent() {
  return {
    [SECTION_ID]: {
      id: SECTION_ID,
      type: 'testimonials',
      layout: 'ProofWithLogoRail',
      elements: {
        // eyebrow is excluded below → must NOT appear in rendered HTML.
        eyebrow: EXCLUDED_EYEBROW,
        headline: 'What real customers say',
        testimonials: [
          { id: 't1', quote: QUOTE_ALPHA, author_name: 'Jane Real', author_role: 'CTO, Northwind' },
          { id: 't2', quote: QUOTE_BETA, author_name: 'Bob Real', author_role: 'Founder' },
        ],
      },
      backgroundType: 'neutral',
      // The phase-4 provenance flag rides here, next to the already-consumed
      // excludedElements sibling. realProof is read by NO block/published code.
      aiMetadata: {
        aiGenerated: true,
        isCustomized: false,
        realProof: true,
        excludedElements: ['eyebrow'],
      },
    },
  } as Record<string, any>;
}

async function render(content: Record<string, any>) {
  // Mirror the real publish path: the publish route runs sanitizeContentForPublish
  // (strips excludedElements) BEFORE generateStaticHTML. Crucially, sanitize does
  // NOT strip aiMetadata — realProof survives it — so this is the honest end-to-end
  // shape. (We assert on rendered HTML, never on sanitize's return, per the plan.)
  const page: Record<string, any> = { layout: { sections: [SECTION_ID] }, ...content };
  sanitizeContentForPublish(page);
  // Provenance survives sanitize (it rebuilds only section.elements).
  expect(page[SECTION_ID].aiMetadata?.realProof).toBe(true);

  const res = await generateStaticHTML({
    sections: [SECTION_ID],
    content: page,
    theme: {},
    publishedPageId: 'p',
    pageOwnerId: 'u',
    slug: 'proof',
    title: 'Proof',
    audienceType: 'product',
    templateId: 'meridian',
    paletteId: null,
    variantId: null,
    goal: null,
  });
  return res.html;
}

describe('proof-truth phase 4 — realProof never reaches published HTML', () => {
  it('renders the real quotes, drops the realProof flag, applies exclusions, no artifacts', async () => {
    const html = await render(buildContent());

    // Real quotes render (unflagged, verbatim).
    expect(html).toContain(QUOTE_ALPHA);
    expect(html).toContain(QUOTE_BETA);

    // The provenance flag never leaks into DOM/HTML.
    expect(html).not.toContain('realProof');

    // No object-shaped value reached a slot; no marker artifacts.
    expect(html).not.toContain('[object Object]');
    expect(html).not.toContain('needs_review');
    expect(html).not.toContain('needsReview');
    expect(html).not.toContain('data-needs-review');

    // excludedElements still honored alongside realProof.
    expect(html).not.toContain(EXCLUDED_EYEBROW);
  });
});
