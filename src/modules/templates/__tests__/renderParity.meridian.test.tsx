// Dual-renderer CONTENT parity — the #1 architectural trap (see CLAUDE.md).
// registration/dispatch tests prove each section RESOLVES a block pair; this
// test proves the pair RENDERS the same copy: every visible fixture field must
// appear in both the edit `.tsx` output and the published `.published.tsx`
// output for the same content. Catches "field shows in the editor, missing
// when published" (and vice-versa) without a browser.
//
// Edit blocks read the store via useMeridianBlock / useIsElementExcluded, so
// both store entry points are mocked onto one vanilla zustand store seeded from
// MERIDIAN_BLOCK_MOCKS (the same fixtures the /dev/meridian/blocks gallery
// uses). Store mode is 'preview' so Editable wrappers render raw HTML — the
// same .tsx block + same extractLayoutContent path, minus the contentEditable
// machinery jsdom can't drive.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import { createStore } from 'zustand';

import { MERIDIAN_BLOCK_MOCKS } from '@/app/dev/meridian/blocks/mockContent';
import { resolveMeridianBlock } from '@/modules/templates/meridian/resolveMeridianBlock';
import { normalizeCtas } from '@/utils/normalizeCtas';
import { resolveDestination } from '@/utils/resolveCtaHref';
import { goalToDestination } from '@/modules/goals/goalToDestination';
import type { Brief } from '@/types/brief';
import type { CTAButton } from '@/types/destination';

const h = vi.hoisted(() => ({ store: null as any }));

vi.mock('@/hooks/useEditStoreLegacy', () => ({
  // Honor the selector arg (block hooks now subscribe via selectors, not a
  // whole-store destructure) — otherwise the whole state is handed where a
  // section slice is expected and blockContent comes back empty.
  useEditStoreLegacy: (selector?: (s: any) => any) =>
    selector ? selector(h.store.getState()) : h.store.getState(),
}));

// useIsElementExcluded subscribes via useEditStoreContext().store directly.
vi.mock('@/components/EditProvider', () => ({
  useEditStoreContext: () => ({ store: h.store, isReady: true, isInitialized: true, error: null }),
}));

const SECTIONS = MERIDIAN_BLOCK_MOCKS.map((m) => ({ ...m, sectionId: `${m.sectionType}-mrd` }));

function buildStoreState() {
  const content: Record<string, any> = {};
  const sections: string[] = [];
  for (const s of SECTIONS) {
    sections.push(s.sectionId);
    const elements: Record<string, any> = {};
    for (const [key, value] of Object.entries(s.content)) {
      elements[key] = { value, content: value };
    }
    content[s.sectionId] = { elements, layout: s.layout, aiMetadata: {} };
  }
  return {
    content,
    sections,
    pages: {},
    mode: 'preview',
    forms: [],
    updateElementContent: () => {},
    setSection: () => {},
    addForm: () => 'noop-form',
    deleteForm: () => {},
    getFormById: () => null,
  };
}

h.store = createStore(() => buildStoreState());

/** Visible text of an HTML string: strips tags, aria-hidden subtrees, collapses whitespace. */
function visibleText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('[aria-hidden="true"], script, style').forEach((n) => n.remove());
  return (div.textContent || '').replace(/\s+/g, ' ').trim();
}

// Fixture keys that are NOT visible copy (attributes, media, icon names, flags).
const NON_VISIBLE_KEY = /(^id$|icon|href|image|video|placeholder|^featured$|form_id)/i;

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

describe.each(SECTIONS)('meridian $sectionType ($layout) content parity', (s) => {
  const Edit = resolveMeridianBlock(s.sectionType, 'edit')!;
  const Published = resolveMeridianBlock(s.sectionType, 'published')!;
  const fields = visibleFields(s.content);

  it('has visible fixture fields to compare', () => {
    expect(fields.length).toBeGreaterThan(0);
  });

  it('no field renders in one mode but not the other', () => {
    const editText = visibleText(renderToStaticMarkup(<Edit sectionId={s.sectionId} />));
    const publishedText = visibleText(
      renderToStaticMarkup(<Published sectionId={s.sectionId} {...s.content} />)
    );
    // Parity = symmetric. A field missing from BOTH is consistent behavior
    // (e.g. the footer newsletter widget renders only when a form is connected);
    // a field present in exactly ONE mode is the dual-renderer bug.
    const diverged: string[] = [];
    for (const f of fields) {
      const inEdit = editText.includes(f.text);
      const inPublished = publishedText.includes(f.text);
      if (inEdit !== inPublished) {
        diverged.push(
          `${f.key} "${f.text}" — edit: ${inEdit ? 'yes' : 'MISSING'}, published: ${inPublished ? 'yes' : 'MISSING'}`
        );
      }
    }
    expect(diverged, diverged.join('\n')).toEqual([]);
  });

  it('most fixture fields actually render (fixture is not dead)', () => {
    const publishedText = visibleText(
      renderToStaticMarkup(<Published sectionId={s.sectionId} {...s.content} />)
    );
    const rendered = fields.filter((f) => publishedText.includes(f.text));
    // Guards against the parity test passing vacuously because nothing renders.
    expect(rendered.length).toBeGreaterThanOrEqual(Math.ceil(fields.length * 0.5));
  });
});

// ---------------------------------------------------------------------------
// scale-04 (phase 8) — CTA href parity.
//
// The content-parity block above deliberately EXCLUDES href (NON_VISIBLE_KEY).
// These assertions prove the OTHER half: the published `<a href>` a CTA renders
// equals `resolveDestination()` of the resolved Destination — i.e. the phase-3
// normalizeCtas pre-pass + the untouched legacy readers produce the resolver's
// output byte-for-byte. GOAL_REF primaries resolve from the project goal here;
// explicit dests resolve directly.
// ---------------------------------------------------------------------------

// Project goal used to resolve GOAL_REF primaries. M2 direct-channel → WhatsApp,
// so a GOAL_REF primary must render the wa.me href (the "goal re-points every
// primary" guarantee, exercised at render).
const TEST_GOAL: NonNullable<Brief['goal']> = {
  intent: 'enquiry',
  mechanism: 'M2',
  destination: 'https://wa.me/15551234567',
};
const TEST_FORMS: Record<string, unknown> = {};

/** Parse an HTML string and collect every anchor with { href, role, isCta }. */
function anchors(html: string): Array<{ href: string; role: string | null; isCta: boolean; cls: string }> {
  const div = document.createElement('div');
  div.innerHTML = html;
  return Array.from(div.querySelectorAll('a')).map((a) => ({
    href: a.getAttribute('href') ?? '',
    role: a.getAttribute('data-lessgo-cta-role'),
    isCta: a.hasAttribute('data-lessgo-cta'),
    cls: a.getAttribute('class') ?? '',
  }));
}

/** The href a `cta` should resolve to: GOAL_REF → the goal's dest; else direct. */
function expectedCtaHref(cta: CTAButton): string {
  if (cta.dest === 'GOAL_REF') {
    const gd = goalToDestination(TEST_GOAL, { forms: TEST_FORMS });
    if (!gd) throw new Error('test goal did not resolve');
    return resolveDestination(gd.dest);
  }
  return resolveDestination(cta.dest);
}

/** Render a section's PUBLISHED block after running the phase-3 pre-pass over
 *  its (new-shape) elementMetadata — exactly what the published renderer does. */
function renderPublishedWithCtas(s: (typeof SECTIONS)[number]): string {
  const Published = resolveMeridianBlock(s.sectionType, 'published')!;
  const rawContent: Record<string, any> = {
    [s.sectionId]: { elementMetadata: s.elementMetadata },
    forms: TEST_FORMS,
  };
  const normalized = normalizeCtas(rawContent, { goal: TEST_GOAL, forms: TEST_FORMS });
  const meta = normalized[s.sectionId].elementMetadata;
  return renderToStaticMarkup(
    <Published sectionId={s.sectionId} {...s.content} content={normalized} elementMetadata={meta} />
  );
}

const SECTIONS_WITH_CTA = SECTIONS.filter((s) => s.elementMetadata);

describe.each(SECTIONS_WITH_CTA)('meridian $sectionType CTA href parity', (s) => {
  // role → the cta a published anchor of that role must resolve to.
  const byRole: Record<string, CTAButton> = {};
  for (const entry of Object.values(s.elementMetadata as Record<string, any>)) {
    const cta: CTAButton | undefined = entry?.cta;
    if (cta) byRole[cta.role] = cta;
  }

  it('published CTA anchors carry data-lessgo-cta + role attrs (phase-7 net)', () => {
    const ctaAnchors = anchors(renderPublishedWithCtas(s)).filter((a) => a.isCta);
    expect(ctaAnchors.length).toBeGreaterThan(0);
    for (const a of ctaAnchors) {
      expect(a.role === 'primary' || a.role === 'secondary').toBe(true);
    }
  });

  it('published CTA hrefs equal resolveDestination() of the fixture dest', () => {
    const ctaAnchors = anchors(renderPublishedWithCtas(s)).filter((a) => a.isCta);
    for (const a of ctaAnchors) {
      const cta = a.role ? byRole[a.role] : undefined;
      if (!cta) continue; // block may render more CTA anchors than the fixture seeds
      expect(a.href, `${s.sectionType} ${a.role} CTA`).toBe(expectedCtaHref(cta));
    }
    // Every seeded role must appear as a resolved anchor (fixture is not dead).
    const seenRoles = new Set(ctaAnchors.map((a) => a.role));
    for (const role of Object.keys(byRole)) {
      expect(seenRoles.has(role), `expected a ${role} CTA anchor`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Edit↔published href equality — nav LINK items only. The header's nav renders
// real anchors on BOTH sides (edit in preview mode + published), so a Link
// object and a legacy string href must dual-read to the SAME href in each.
// CTA buttons are contentEditable non-anchors in edit by design → NOT compared.
// ---------------------------------------------------------------------------
describe('meridian nav link edit↔published href parity', () => {
  const header = SECTIONS.find((s) => s.sectionType === 'header')!;
  const navHrefs = (html: string) =>
    anchors(html)
      .filter((a) => !a.isCta && /mrd-nav-link/.test(a.cls))
      .map((a) => a.href);

  it('nav link hrefs match between edit and published', () => {
    const Edit = resolveMeridianBlock('header', 'edit')!;
    const Published = resolveMeridianBlock('header', 'published')!;
    const editHrefs = navHrefs(renderToStaticMarkup(<Edit sectionId={header.sectionId} />));
    const publishedHrefs = navHrefs(
      renderToStaticMarkup(<Published sectionId={header.sectionId} {...header.content} />)
    );
    expect(editHrefs.length).toBeGreaterThan(0);
    expect(publishedHrefs).toEqual(editHrefs);
    // The Link-object nav item resolves to its external url; the string-legacy
    // items pass through verbatim (proves the dual-read on both sides).
    expect(publishedHrefs).toContain('https://docs.meridian.dev');
    expect(publishedHrefs).toContain('/pricing');
    expect(publishedHrefs).toContain('#docs');
  });
});
