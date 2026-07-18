// src/modules/generatedLanding/uiFoundationIsolation.test.tsx
// ui-foundation PHASE 1 — template/published ISOLATION baseline guards (published
// surface). Laid down BEFORE any styling/token/font change so every later phase
// mechanically proves "generated pages render byte-identical".
//
// Two independent guards live here:
//   1. HTML snapshot + negative-trace of the PUBLISHED renderer output for a
//      product (meridian) and a service (hearth) page shape, built from the SAME
//      frozen block-mock fixtures the /dev galleries + renderParity tests use
//      (src/modules/templates/blockMocks/*). No new fixture is introduced.
//   2. sha256 of the freshly-built public/published.css against a committed
//      baseline (__fixtures__/published-css.sha256). This pins the PUBLISHED CSS
//      surface against forbidden-file edits + new-token/font leakage. It is
//      INVARIANT to root tailwind.config.js (published.css is compiled from the
//      standalone embedded config in scripts/buildPublishedCSS.js) — the
//      root-config existing-key mutation vector is covered separately by
//      tailwindConfigFreeze.test.ts (unit) + e2e/ui-isolation.spec.ts (browser).

import { vi, describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// htmlGenerator is `import 'server-only'`; neutralize so it runs under vitest
// (same shim the sibling htmlGenerator.test.ts uses).
vi.mock('server-only', () => ({}));

import { generateStaticHTML } from '@/lib/staticExport/htmlGenerator';
import { MERIDIAN_BLOCK_MOCKS } from '@/modules/templates/blockMocks/meridian';
import { HEARTH_BLOCK_MOCKS } from '@/modules/templates/blockMocks/hearth';

type MockEntry = { sectionType: string; layout: string; content: Record<string, any> };

/** Build a generateStaticHTML content map from a template's block-mock list.
 *  Section id follows the platform `${type}-${uuid}` convention; each entry is a
 *  `{ id, type, layout, elements }` record — the exact shape the published
 *  renderer's extractContentFields() consumes. */
function buildPage(mocks: MockEntry[]) {
  const sections = mocks.map((m, i) => `${m.sectionType}-iso${i}`);
  const content: Record<string, any> = { layout: { sections } };
  mocks.forEach((m, i) => {
    const id = sections[i];
    content[id] = { id, type: m.sectionType, layout: m.layout, elements: { ...m.content } };
  });
  return { sections, content };
}

async function renderPublished(
  mocks: MockEntry[],
  templateId: string,
  audienceType: 'product' | 'service'
): Promise<string> {
  const { sections, content } = buildPage(mocks);
  const res = await generateStaticHTML({
    sections,
    content,
    theme: {},
    publishedPageId: 'iso',
    pageOwnerId: 'iso-owner',
    slug: 'iso',
    title: 'Isolation Baseline',
    audienceType,
    templateId,
    paletteId: null,
    variantId: null,
    goal: null,
  });
  return res.html;
}

// Class/text tokens that MUST NOT appear in any published-page HTML. `app-` is
// checked as a CLASS token specifically (see negativeTrace) to avoid matching
// unrelated substrings; the font-family names are checked as plain substrings.
const FORBIDDEN_FONTS = ['Onest', 'Caveat', 'Material Symbols', 'fonts-app-chrome'];

/** Assert the app-chrome layer left no trace in published HTML. */
function negativeTrace(html: string) {
  // No class attribute contains an `app-` token (word-boundary before `app-`).
  const appClassMatches = html.match(/class="[^"]*(?:^|\s|")app-[^"]*"/g);
  expect(appClassMatches, `app-* class token leaked: ${appClassMatches?.[0]}`).toBeNull();
  // Belt-and-suspenders: no bare ` app-` class fragment inside any class attr.
  const classAttrs = html.match(/class="[^"]*"/g) ?? [];
  for (const c of classAttrs) {
    expect(/\bapp-[a-z]/.test(c.slice('class="'.length)), `app-* class leaked: ${c}`).toBe(false);
  }
  for (const token of FORBIDDEN_FONTS) {
    expect(html.includes(token), `forbidden app-chrome token "${token}" leaked into published HTML`).toBe(false);
  }
}

describe('ui-foundation isolation — published HTML baseline (product: meridian)', () => {
  it('renders + matches the frozen snapshot', async () => {
    const html = await renderPublished(MERIDIAN_BLOCK_MOCKS, 'meridian', 'product');
    expect(html.length).toBeGreaterThan(500);
    expect(html).toMatchSnapshot();
  });

  it('carries no app-chrome font/class trace', async () => {
    const html = await renderPublished(MERIDIAN_BLOCK_MOCKS, 'meridian', 'product');
    negativeTrace(html);
  });
});

describe('ui-foundation isolation — published HTML baseline (service: hearth)', () => {
  it('renders + matches the frozen snapshot', async () => {
    const html = await renderPublished(HEARTH_BLOCK_MOCKS, 'hearth', 'service');
    expect(html.length).toBeGreaterThan(500);
    expect(html).toMatchSnapshot();
  });

  it('carries no app-chrome font/class trace', async () => {
    const html = await renderPublished(HEARTH_BLOCK_MOCKS, 'hearth', 'service');
    negativeTrace(html);
  });
});

// ---------------------------------------------------------------------------
// Published-CSS hash baseline (published-surface guard).
// public/published.css is a BUILD ARTIFACT — every phase's verification runs
// `npm run build:published-css` (or `npm run build`) BEFORE test:run, so this
// guard never compares against a stale file. If the artifact is missing we FAIL
// LOUDLY rather than skip, so the guard can never pass vacuously.
// ---------------------------------------------------------------------------
describe('ui-foundation isolation — published.css sha256 baseline', () => {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const cssPath = path.join(repoRoot, 'public', 'published.css');
  const baselinePath = path.join(__dirname, '__fixtures__', 'published-css.sha256');

  it('matches the committed baseline hash of the freshly-built artifact', () => {
    if (!fs.existsSync(cssPath)) {
      throw new Error(
        `public/published.css is missing — run \`npm run build:published-css\` first ` +
          `(this guard compares a FRESH artifact against the committed baseline).`
      );
    }
    const actual = crypto.createHash('sha256').update(fs.readFileSync(cssPath)).digest('hex');
    const baseline = fs.readFileSync(baselinePath, 'utf8').trim();
    expect(
      actual,
      `published.css sha256 drifted from the phase-1 baseline.\n` +
        `  baseline: ${baseline}\n  actual:   ${actual}\n` +
        `If this change is intentional, rebuild (\`npm run build:published-css\`) and update ` +
        `${path.relative(repoRoot, baselinePath)}.`
    ).toBe(baseline);
  });
});
