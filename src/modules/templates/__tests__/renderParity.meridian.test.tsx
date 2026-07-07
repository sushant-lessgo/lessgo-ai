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

const h = vi.hoisted(() => ({ store: null as any }));

vi.mock('@/hooks/useEditStoreLegacy', () => ({
  useEditStoreLegacy: () => h.store.getState(),
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
