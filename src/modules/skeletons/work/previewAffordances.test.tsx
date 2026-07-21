// qa-0721 B1 regression — PREVIEW MUST HAVE ZERO EDITING AFFORDANCES.
//
// Bug: clicking "Preview" in /edit hid the toolbars but left the page fully
// editable — text was click-to-edit (and committed), "×" remove icons, "+ Add",
// "Manage photos →" and the "Add a client testimonial" hint all still rendered.
// Root cause: the work/granth/vestria edit primitives never read the store `mode`.
//
// Setup cloned from `renderParity.work.test.tsx` (same two per-file store mocks,
// same createRoot+act mount so the imperative text paint runs). The harness store
// seeds `mode:'preview'`.
//
// NOTE the click-then-assert below: `contentEditable={isEditing}` starts FALSE, so
// a bare initial-render check would be INERT (green while the bug is live). The
// click is what proves it.

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeAll } from 'vitest';

import { createHarnessStore } from '@/modules/templates/blockMocks/harness';
import { BLOCK_MOCKS, type BlockMockSection } from '@/modules/templates/blockMocks';
import { resolveWorkBlock } from './resolveWorkBlock';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

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

/** Extra seeded section: a proof band with NO quotes (the empty-state affordance). */
const PROOF_EMPTY = {
  sectionId: 'preview-proof-empty',
  layout: 'WorkProofTestimonials',
  content: { eyebrow: 'Kind words', heading: 'What clients say', awards_line: '', quotes: [] },
};

h.store = createHarnessStore([...SECTIONS, PROOF_EMPTY]);
// InlineTextEditorV2's focus handler calls these store actions; stub them so a
// PRE-FIX run fails on the ASSERTION (contentEditable) and not on a TypeError.
h.store.setState({
  setTextEditingMode: () => {},
  showToolbar: () => {},
  hideToolbar: () => {},
});

/** Mount an element in jsdom (effects run) and hand the live container to `fn`. */
function withMounted(el: React.ReactElement, fn: (container: HTMLElement) => void) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(el); });
  try {
    fn(container);
  } finally {
    act(() => { root.unmount(); });
    container.remove();
  }
}

/** Visible text of an HTML string (same helper as renderParity.work.test.tsx). */
function visibleText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('[aria-hidden="true"], script, style').forEach((n) => n.remove());
  return (div.textContent || '').replace(/\s+/g, ' ').trim();
}

beforeAll(() => {
  expect(h.store.getState().mode, 'harness must seed preview mode').toBe('preview');
});

describe('preview mode renders NO editing affordances (work skeleton / atelier)', () => {
  it('fixtures are enrolled (the sweep is not vacuous)', () => {
    expect(SECTIONS.length).toBeGreaterThan(0);
  });

  it.each(SECTIONS)('$sectionType ($layout) [$sectionId]', (s) => {
    const Edit = resolveWorkBlock(s.sectionType, 'edit', s.layout)!;
    withMounted(<Edit sectionId={s.sectionId} />, (container) => {
      // 1. THE assertion that bites first: clicking (and focusing) any element node
      //    must not turn it into a live contentEditable.
      const nodes = Array.from(container.querySelectorAll('[data-element-key]'));
      act(() => {
        for (const n of nodes) {
          n.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          (n as HTMLElement).focus?.();
        }
      });
      expect(
        container.querySelector('[contenteditable="true"]'),
        'preview text became editable on click',
      ).toBeNull();

      // 2. No inline text editor at all.
      expect(container.innerHTML).not.toContain('inline-text-editor-v2');
      expect(container.querySelector('[role="textbox"]')).toBeNull();

      // 3. No collection / image / link / toggle chrome.
      for (const sel of ['.wk-list-x', '.wk-list-add', '.wk-img-edit', '.wk-link-edit__btn', '.wk-toggle-edit']) {
        expect(container.querySelector(sel), `${sel} rendered in preview`).toBeNull();
      }

      // 4. Block-level edit-only affordances.
      expect(container.querySelector('[data-wk-manage-photos]')).toBeNull();
      expect(container.querySelector('[data-wk-proof-empty]')).toBeNull();

      // 5. Markers survive (conformance + toolbar selectors depend on them).
      expect(container.querySelector('[data-section-id]')).not.toBeNull();
    });
  });

  it('an EMPTY proof band is omitted entirely in preview (matches published)', () => {
    const Edit = resolveWorkBlock('proof', 'edit', 'WorkProofTestimonials')!;
    withMounted(<Edit sectionId={PROOF_EMPTY.sectionId} />, (container) => {
      expect(container.querySelector('[data-wk-proof-empty]')).toBeNull();
      expect(container.querySelector('[data-wk-proof-testimonials]')).toBeNull();
    });
  });

  it('positive control 2: visible copy still renders in preview', () => {
    const proof = SECTIONS.find((s) => s.sectionId === 'atelier-proof')!;
    const Edit = resolveWorkBlock(proof.sectionType, 'edit', proof.layout)!;
    withMounted(<Edit sectionId={proof.sectionId} />, (container) => {
      const text = visibleText(container.innerHTML);
      expect(text).toContain(proof.content.heading);
      expect(text).toContain((proof.content.quotes as any[])[0].text);
    });
  });
});

describe('positive control: EDIT mode still has its affordances (the fix did not nuke the editor)', () => {
  it('edit mode renders the inline editor + "+ Add"', () => {
    const proof = SECTIONS.find((s) => s.sectionId === 'atelier-proof')!;
    const Edit = resolveWorkBlock(proof.sectionType, 'edit', proof.layout)!;
    h.store.setState({ mode: 'edit' });
    try {
      withMounted(<Edit sectionId={proof.sectionId} />, (container) => {
        expect(container.innerHTML).toContain('inline-text-editor-v2');
        expect(container.querySelector('.wk-list-add')).not.toBeNull();
      });
    } finally {
      h.store.setState({ mode: 'preview' });
    }
  });
});
