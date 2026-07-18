// src/modules/skeletons/work/__tests__/kundiusPages.test.tsx
// PHASE 8 — Kundius end-to-end + parity QA (sign-off gate). The content-parity
// proof on REAL data: Kristina Kundius's actual multi-page content (the standard
// site archetype from workPages.ts — home · work · prices · about · contact),
// rendered through BOTH renderers, on the ACTUAL publish path.
//
// For every page we:
//   1. Render via the PUBLISHED path (`generateStaticHTML`, the exact code the
//      /api/publish route runs) and assert each section's REAL per-section markers
//      appear (hero headline · gallery group names · proof quotes · packages tiers ·
//      about text · contact method · footer) — and that NO placeholder markup leaks.
//   2. Render via the jsdom EDIT path (resolveWorkBlock 'edit', mounted so effects
//      run) and assert the SAME visible copy appears — editor == published on real
//      content (AC L127).
//   3. Assert CTA/nav hrefs are consistent across both (published emits real <a
//      href>; edit exposes a `wk-link-edit` affordance for the same links).
//
// Content is sourced from the shipped atelier block mocks (fixtures/kundiusBrief.ts
// -derived, already mapped onto the frozen work-core contracts) so the parity grid,
// dev stage, and this proof all reflect the SAME Kundius page. Each page reuses the
// DEFAULT layout mock per section type, given a page-scoped sectionId.
//
// NL/EN TWIN-FIELD NON-PRECLUSION (constraint L91): a dedicated block proves the
// skeleton's text path (E.Txt) renders nested markup verbatim (published =
// dangerouslySetInnerHTML for HTML values; edit = preserveHtml) — so a future lumen
// `data-en`/`data-nl` twin wrapper survives. We do NOT wire bilingual here (that is
// the concierge patch); we only prove the skeleton does not BLOCK it.

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi } from 'vitest';

// htmlGenerator is `import 'server-only'`; neutralize so the publish path runs under vitest.
vi.mock('server-only', () => ({}));

import { atelier2Sections } from '@/modules/templates/blockMocks/atelier2';
import { createHarnessStore } from '@/modules/templates/blockMocks/harness';
import { resolveWorkBlock } from '../resolveWorkBlock';
import { generateStaticHTML } from '@/lib/staticExport/htmlGenerator';

// The work EDIT `Txt` primitive paints imperatively in an effect, so we MOUNT edit
// blocks (createRoot + act) to let effects run, then read the painted DOM. The
// published wrapper has no effects (static render is equivalent). Same approach as
// renderParity.work.test.tsx.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// ── Store mock (edit path) — one vanilla store seeded from every page's sections;
// each edit block reads its own sectionId. Mirrors renderParity.work.test.tsx. ──
const h = vi.hoisted(() => ({ store: null as any }));

vi.mock('@/hooks/useEditStore', () => ({
  useEditStore: (selector?: (s: any) => any) =>
    selector ? selector(h.store.getState()) : h.store.getState(),
  useEditStoreApi: () => h.store,
}));

vi.mock('@/components/EditProvider', () => ({
  useEditStoreContext: () => ({ store: h.store, isReady: true, isInitialized: true, error: null }),
}));

// ── Helpers (cloned from renderParity.work.test.tsx) ─────────────────────────────

/** Mount a React element in jsdom (running effects) → { html, text }. */
function mount(el: React.ReactElement): { html: string; text: string } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(el); });
  const html = container.innerHTML;
  const text = visibleText(html);
  act(() => { root.unmount(); });
  container.remove();
  return { html, text };
}

/** Visible text of an HTML string: strips tags, aria-hidden subtrees, script/style. */
function visibleText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('[aria-hidden="true"], script, style, title, head').forEach((n) => n.remove());
  return (div.textContent || '').replace(/\s+/g, ' ').trim();
}

// Fixture keys that are NOT visible copy (attributes, media, icon names, flags).
const NON_VISIBLE_KEY =
  /(^id$|icon|href|image|video|placeholder|^featured$|is_featured|form_ref|form_id|^layout$|network|^price_mode$|^contact_method$|number$|^mode$|^platform$)/i;

/** Collect { key, text } pairs of visible copy from a fixture content object. */
function visibleFields(obj: Record<string, any>, prefix = ''): Array<{ key: string; text: string }> {
  const out: Array<{ key: string; text: string }> = [];
  for (const [key, value] of Object.entries(obj)) {
    if (NON_VISIBLE_KEY.test(key)) continue;
    const p = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      const text = visibleText(value);
      if (text) out.push({ key: p, text });
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === 'string') {
          const t = visibleText(item);
          if (t) out.push({ key: `${p}[${i}]`, text: t });
        } else if (item && typeof item === 'object') {
          out.push(...visibleFields(item, `${p}[${i}]`));
        }
      });
    }
  }
  return out;
}

/** Collect every href-like string in a fixture (scalar `*_href` + collection `href`). */
function collectHrefs(obj: Record<string, any>): string[] {
  const out: string[] = [];
  const walk = (o: any) => {
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && /href/i.test(k) && v) out.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(obj);
  return out;
}

// ── Assemble the 5 standard-archetype pages from the shipped Kundius mocks ────────

const MOCKS = atelier2Sections();

/** The DEFAULT-layout mock for a section type (first occurrence in the mock list). */
function pick(type: string) {
  const m = MOCKS.find((s) => s.sectionType === type);
  if (!m) throw new Error(`no atelier mock for section type "${type}"`);
  return m;
}

interface PageSection {
  sectionType: string;
  layout: string;
  sectionId: string;
  content: Record<string, any>;
}

// The standard whole-site archetype (workPages.ts): header/footer chrome is injected
// at page boundaries around each page's body sections (defaultSections per page).
const PAGE_DEFS: Record<string, string[]> = {
  home: ['header', 'hero', 'work', 'proof', 'contact', 'footer'],
  work: ['header', 'work', 'proof', 'footer'],
  prices: ['header', 'packages', 'footer'],
  about: ['header', 'about', 'proof', 'footer'],
  contact: ['header', 'contact', 'footer'],
};

const PAGES = Object.entries(PAGE_DEFS).map(([key, types]) => ({
  key,
  sections: types.map((t): PageSection => {
    const m = pick(t);
    // sectionId `${type}-${page}` — extractSectionType splits on '-' and takes the
    // first token, so the section type still resolves. Unique across pages.
    return { sectionType: t, layout: m.layout, sectionId: `${t}-${key}`, content: m.content };
  }),
}));

// Seed ONE store with every section across all 5 pages.
const ALL_SECTIONS = PAGES.flatMap((p) => p.sections);
h.store = createHarnessStore(
  ALL_SECTIONS.map((s) => ({ sectionId: s.sectionId, layout: s.layout, content: s.content })),
);

/** Render a page through the PUBLISHED publish path (generateStaticHTML). */
async function renderPublished(page: (typeof PAGES)[number]): Promise<string> {
  const content: Record<string, any> = {};
  for (const s of page.sections) {
    content[s.sectionId] = { id: s.sectionId, type: s.sectionType, layout: s.layout, elements: { ...s.content } };
  }
  const res = await generateStaticHTML({
    sections: page.sections.map((s) => s.sectionId),
    content,
    theme: {},
    publishedPageId: 'kundius',
    pageOwnerId: 'kundius-owner',
    slug: `kundius-${page.key}`,
    title: `Kristina Kundius — ${page.key}`,
    audienceType: 'service',
    templateId: 'atelier',
    paletteId: null,
    variantId: null,
    goal: null,
    styleTokens: null,
  });
  return res.html;
}

/** Render a page through the EDIT path (each block mounted so effects paint). */
function renderEdit(page: (typeof PAGES)[number]): { html: string; text: string } {
  let html = '';
  let text = '';
  for (const s of page.sections) {
    const Edit = resolveWorkBlock(s.sectionType, 'edit', s.layout)!;
    const r = mount(<Edit sectionId={s.sectionId} />);
    html += r.html;
    text += ' ' + r.text;
  }
  return { html, text };
}

/** Per-section-type REAL-content markers (the phase-8 "not placeholder" proof). */
function assertSectionMarkers(sectionType: string, content: Record<string, any>, html: string, text: string) {
  switch (sectionType) {
    case 'header':
      expect(text, 'header logo').toContain(visibleText(content.logo_text));
      break;
    case 'hero':
      expect(text, 'hero headline (name)').toContain(visibleText(content.name)); // 'Kristina Kundius'
      expect(text, 'hero role line').toContain(content.role_line);
      break;
    case 'work':
      for (const g of content.groups) expect(text, `gallery group "${g.name}"`).toContain(g.name);
      break;
    case 'proof':
      for (const q of content.quotes || []) expect(text, 'proof quote').toContain(visibleText(q.text));
      break;
    case 'packages':
      expect(text, 'packages heading').toContain(visibleText(content.heading));
      for (const p of content.packages) {
        expect(text, `package tier "${p.name}"`).toContain(p.name);
        expect(text, `package price "${p.price_line}"`).toContain(p.price_line);
      }
      break;
    case 'about':
      expect(text, 'about heading').toContain(visibleText(content.heading));
      expect(text, 'about body text').toContain(visibleText(content.bio).slice(0, 40));
      break;
    case 'contact':
      expect(text, 'contact heading').toContain(visibleText(content.heading));
      expect(html, 'contact mechanism (form)').toContain(`data-wk-contact-method="${content.contact_method}"`);
      break;
    case 'footer':
      expect(text, 'footer copyright').toContain(visibleText(content.copyright));
      break;
  }
}

// ── The proof ────────────────────────────────────────────────────────────────────

describe('Kundius pages fixture (standard archetype) is assembled', () => {
  it('covers the 5 standard-archetype pages (home/work/prices/about/contact)', () => {
    expect(PAGES.map((p) => p.key)).toEqual(['home', 'work', 'prices', 'about', 'contact']);
  });
  it('every page carries header + footer chrome and ≥1 body section', () => {
    for (const p of PAGES) {
      const types = p.sections.map((s) => s.sectionType);
      expect(types[0], `${p.key} leads with header`).toBe('header');
      expect(types[types.length - 1], `${p.key} ends with footer`).toBe('footer');
      expect(types.length, `${p.key} has body sections`).toBeGreaterThan(2);
    }
  });
});

describe.each(PAGES)('Kundius page "$key" — real-content dual-renderer parity', (page) => {
  it('PUBLISHED path renders every section with REAL content, no placeholder', async () => {
    const html = await renderPublished(page);
    const text = visibleText(html);

    // No unbuilt-section placeholder leaked (every section on the standard site is built).
    expect(html, 'no placeholder markup').not.toContain('Work block — coming soon');

    // Each section's key content markers are present (not lorem / not placeholder).
    for (const s of page.sections) assertSectionMarkers(s.sectionType, s.content, html, text);
  });

  it('EDITOR == PUBLISHED on real content (no field renders in one mode only)', async () => {
    const publishedText = visibleText(await renderPublished(page));
    const editText = renderEdit(page).text;

    const diverged: string[] = [];
    for (const s of page.sections) {
      for (const f of visibleFields(s.content)) {
        const inEdit = editText.includes(f.text);
        const inPublished = publishedText.includes(f.text);
        if (inEdit !== inPublished) {
          diverged.push(
            `${s.sectionType}.${f.key} "${f.text}" — edit: ${inEdit ? 'yes' : 'MISSING'}, published: ${inPublished ? 'yes' : 'MISSING'}`,
          );
        }
      }
    }
    expect(diverged, diverged.join('\n')).toEqual([]);
  });

  it('CTA/nav hrefs are consistent: published navigates, edit exposes a link affordance', async () => {
    const hrefs = page.sections
      .flatMap((s) => collectHrefs(s.content))
      .filter((x) => x && x !== '#');
    if (hrefs.length === 0) {
      expect(true).toBe(true);
      return;
    }
    const publishedHtml = await renderPublished(page);
    const editHtml = renderEdit(page).html;

    const missing = [...new Set(hrefs)].filter((x) => !publishedHtml.includes(`href="${x}"`));
    expect(missing, `published dropped navigable href(s): ${missing.join(', ')}`).toEqual([]);

    expect(
      editHtml.includes('wk-link-edit'),
      'edit render must expose a link-editing affordance for the page links',
    ).toBe(true);
  });
});

// ── NL/EN twin-field NON-PRECLUSION (constraint L91) ─────────────────────────────
// The skeleton must not BLOCK the lumen data-en/data-nl twin pattern. Proof: the
// text path (E.Txt) renders a value containing nested markup VERBATIM — so a future
// twin wrapper survives — in BOTH renderers, and there is no innerText/single-text-
// node assumption. We do NOT wire bilingual here (concierge patch), only prove the
// door is open.
describe('NL/EN twin-field non-preclusion (does not block lumen data-en/data-nl)', () => {
  // A twin-field value as lumen would emit it: EN + NL variants side by side.
  const TWIN = '<span data-en="">Portrait sessions</span><span data-nl="">Portretsessies</span>';

  it('PUBLISHED text path preserves nested data-en/data-nl wrappers verbatim', () => {
    const Hero = resolveWorkBlock('hero', 'published', 'WorkHeroSlider')!;
    const html = renderToStaticMarkup(
      <Hero sectionId="hero-twin" role_line="Photographer" name={TWIN}
        quote="A short line." cta_label="Start" cta_href="#contact" portrait_image="" />,
    );
    // Both language wrappers + both texts survive → the twin pattern is renderable.
    expect(html).toContain('data-en');
    expect(html).toContain('data-nl');
    expect(html).toContain('Portrait sessions');
    expect(html).toContain('Portretsessies');
  });

  it('the shared text primitives use HTML-preserving paths (no innerText assumption)', () => {
    // publishedPrimitives: HTML values render via dangerouslySetInnerHTML (nested
    // wrappers survive); editPrimitives: InlineTextEditorV2 with preserveHtml. Neither
    // reads/asserts a single text node — so a twin wrapper is never flattened.
    const pub = fs.readFileSync(path.join(__dirname, '..', 'blocks', 'publishedPrimitives.tsx'), 'utf8');
    const edit = fs.readFileSync(path.join(__dirname, '..', 'blocks', 'editPrimitives.tsx'), 'utf8');
    expect(pub, 'published Txt must render HTML values via dangerouslySetInnerHTML').toContain('dangerouslySetInnerHTML');
    expect(edit, 'edit Txt must preserve nested HTML').toContain('preserveHtml={true}');
  });
});
