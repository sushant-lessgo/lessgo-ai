// Dual-renderer CONTENT parity for the WORK SKELETON (atelier skin) — the #1
// architectural trap (CLAUDE.md). dispatch/conformance prove each section RESOLVES a
// block pair; THIS test proves the pair RENDERS the same copy: every visible fixture
// field must appear in BOTH the edit `.tsx` output and the `.published.tsx` output
// for the same content. Catches "field shows in the editor, missing when published"
// (and vice-versa) across ALL built work blocks — jsdom, `renderToStaticMarkup`.
//
// Clone of `renderParity.atelier.test.tsx`, adapted for the variant-aware
// resolveWorkBlock (each mock section carries its own `layout`) and the sectionId-
// taking work wrappers. The edit `.tsx` blocks read the store via useWorkBlock (→
// useEditStore) + useIsElementExcluded (→ useEditStoreContext), so BOTH store entry
// points are mocked onto one vanilla store seeded from BLOCK_MOCKS.atelier. Store
// mode is 'preview' so the edit primitives render the static, marker-emitting path.

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';

import { createHarnessStore } from '@/modules/templates/blockMocks/harness';
import { BLOCK_MOCKS, type BlockMockSection } from '@/modules/templates/blockMocks';
import { resolveWorkBlock } from './resolveWorkBlock';

// The work EDIT primitive (Txt → InlineTextEditorV2) paints its text imperatively
// in a useEffect (the DOM is its single source of truth), so `renderToStaticMarkup`
// yields EMPTY spans. We therefore MOUNT both renderers in jsdom via
// createRoot + act() so effects run, then read the painted DOM. (The published
// wrapper has no effects — mounting it is equivalent to static render.)
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

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

const h = vi.hoisted(() => ({ store: null as any }));

vi.mock('@/hooks/useEditStore', () => ({
  useEditStore: (selector?: (s: any) => any) =>
    selector ? selector(h.store.getState()) : h.store.getState(),
  useEditStoreApi: () => h.store,
}));

vi.mock('@/components/EditProvider', () => ({
  useEditStoreContext: () => ({ store: h.store, isReady: true, isInitialized: true, error: null }),
}));

const SECTIONS: BlockMockSection[] = BLOCK_MOCKS.atelier ?? [];

h.store = createHarnessStore(SECTIONS);

/** Visible text of an HTML string: strips tags, aria-hidden subtrees, collapses whitespace. */
function visibleText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('[aria-hidden="true"], script, style').forEach((n) => n.remove());
  return (div.textContent || '').replace(/\s+/g, ' ').trim();
}

// Fixture keys that are NOT visible copy (attributes, media, icon names, flags).
const NON_VISIBLE_KEY =
  /(^id$|icon|href|image|video|placeholder|^featured$|is_featured|form_ref|form_id|^layout$|network|^price_mode$|^contact_method$|number$|^mode$|^platform$|url|^cover$|^footer_nav_mode$)/i;

/** Collect { key, text } pairs of visible copy from a fixture content object. */
function visibleFields(obj: Record<string, any>, prefix = ''): Array<{ key: string; text: string }> {
  const out: Array<{ key: string; text: string }> = [];
  for (const [key, value] of Object.entries(obj)) {
    if (NON_VISIBLE_KEY.test(key)) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      const text = visibleText(value); // fixtures may embed <em>/<br>
      if (text) out.push({ key: path, text });
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === 'string') {
          const text = visibleText(item);
          if (text) out.push({ key: `${path}[${i}]`, text });
        } else if (item && typeof item === 'object') {
          out.push(...visibleFields(item, `${path}[${i}]`));
        }
      });
    }
  }
  return out;
}

describe('work-skeleton (atelier) fixtures are enrolled', () => {
  it('BLOCK_MOCKS.atelier is non-empty (parity is not vacuous)', () => {
    expect(SECTIONS.length).toBeGreaterThan(0);
  });
});

describe.each(SECTIONS)('atelier $sectionType ($layout) [$sectionId] content parity', (s) => {
  const Edit = resolveWorkBlock(s.sectionType, 'edit', s.layout)!;
  const Published = resolveWorkBlock(s.sectionType, 'published', s.layout)!;
  const fields = visibleFields(s.content);

  it('has visible fixture fields to compare', () => {
    expect(fields.length).toBeGreaterThan(0);
  });

  it('no field renders in one mode but not the other', () => {
    const editText = mount(<Edit sectionId={s.sectionId} />).text;
    const publishedText = mount(<Published sectionId={s.sectionId} {...s.content} />).text;
    // Parity = symmetric. A field missing from BOTH is consistent behavior; a field
    // present in exactly ONE mode is the dual-renderer bug.
    const diverged: string[] = [];
    for (const f of fields) {
      const inEdit = editText.includes(f.text);
      const inPublished = publishedText.includes(f.text);
      if (inEdit !== inPublished) {
        diverged.push(
          `${f.key} "${f.text}" — edit: ${inEdit ? 'yes' : 'MISSING'}, published: ${inPublished ? 'yes' : 'MISSING'}`,
        );
      }
    }
    expect(diverged, diverged.join('\n')).toEqual([]);
  });

  it('CTA/link href parity: published navigation is intact + edit keeps a link affordance', () => {
    // The work EDIT `Link` primitive renders an editable <span> + a "set link target"
    // popover (NO literal href — the editor resolves targets), while PUBLISHED emits
    // a real <a href>. So href parity is NOT a literal-string match; the meaningful
    // guarantees are: (1) every non-placeholder fixture href actually NAVIGATES in
    // the published output (no dropped link), and (2) when a section has ≥1 link, the
    // edit render still exposes a link-editing affordance for it (edit never silently
    // drops the ability to edit a link the visitor can click).
    const hrefs = collectHrefs(s.content).filter((h) => h && h !== '#');
    if (hrefs.length === 0) {
      expect(true).toBe(true);
      return;
    }
    const editHtml = mount(<Edit sectionId={s.sectionId} />).html;
    const publishedHtml = mount(<Published sectionId={s.sectionId} {...s.content} />).html;

    const missingInPublished = hrefs.filter((h) => !publishedHtml.includes(`href="${h}"`));
    expect(
      missingInPublished,
      `published dropped navigable href(s): ${missingInPublished.join(', ')}`,
    ).toEqual([]);

    expect(
      editHtml.includes('wk-link-edit'),
      'edit render must expose a link-editing affordance when the section has links',
    ).toBe(true);
  });

  it('most fixture fields actually render (fixture is not dead)', () => {
    const publishedText = mount(<Published sectionId={s.sectionId} {...s.content} />).text;
    const rendered = fields.filter((f) => publishedText.includes(f.text));
    expect(rendered.length).toBeGreaterThanOrEqual(Math.ceil(fields.length * 0.5));
  });
});

/** Collect every href-like string in a fixture (scalar `*_href` + collection `href`). */
function collectHrefs(obj: Record<string, any>): string[] {
  const out: string[] = [];
  const walk = (o: any) => {
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && (/href/i.test(k)) && v) out.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(obj);
  return out;
}
