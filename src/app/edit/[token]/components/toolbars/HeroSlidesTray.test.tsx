// HeroSlidesTray — the filmstrip (section-background phase 4, slice 3).
//
// WHAT THIS PINS, and why each case is not inert:
//
//  1. REORDER writes the FULL new order, ONCE, through the store — and the
//     PUBLISHED renderer then plays them in exactly that order. That last hop is
//     the phase's acceptance criterion ("order matches the published play order"),
//     so it is asserted against real published markup rather than left as a manual
//     note: `work.v1.js` iterates `.wk-hero__slide` in DOCUMENT order, so document
//     order IS play order.
//  2. DELETE AT 2 demotes: `portrait_image` is set to the survivor and the `slides`
//     KEY IS GONE (not `[]` — note N5: an empty array gets re-stamped by
//     `stampHeroSlides`, silently undoing the user's delete).
//  3. The ADD card hides at the cap of 6 and a cap NOTICE takes its place — before
//     phase 4 the 7th pick was a silent no-op inside the helper.
//  4. DELETE → UNDO restores, in one step, through the real store's history.
//  5. The preview event is dispatched for the clicked slide (the canvas channel).
//
// The panel + store are REAL (same harness shape as `BackgroundPanel.picker.test.tsx`):
// the tray is deliberately store-free — every mutation goes through the panel's ONE
// `applyPatch` writer — so a test that mocked the panel away would prove nothing
// about what actually gets persisted.
//
// dnd-kit IS mocked, narrowly and on purpose: a real pointer drag needs layout
// (jsdom reports every rect as 0×0), so the library's own drop resolution cannot
// run here. The mock captures the `onDragEnd` WE pass and invokes it with real
// slide ids, which exercises the part this phase owns — id lookup → helper →
// single write. The drag FEEL is the phase's declared manual check.

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useStore } from 'zustand';
import { createEditStore, type EditStoreInstance } from '@/stores/editStore';
import type { EditStore } from '@/types/store';

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let store: EditStoreInstance;

vi.mock('@/hooks/useEditStore', () => ({
  useEditStore: <T,>(selector: (s: EditStore) => T) => useStore(store, selector),
  useEditStoreApi: () => store,
}));

vi.mock('@/modules/templates/useTemplateReady', () => ({
  useTemplateModule: () => ({ ready: true, tmpl: { getSurfaceForSection: () => 'paper' } }),
}));

vi.mock('@/modules/generatedLanding/componentRegistry', () => ({
  extractSectionType: (id: string) => String(id).split('-')[0],
}));

// ── dnd-kit stubs (see header) ──────────────────────────────────────────────
const dnd = vi.hoisted(() => ({ onDragEnd: null as null | ((e: any) => void) }));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: any) => {
    dnd.onDragEnd = onDragEnd;
    return children;
  },
  PointerSensor: function PointerSensor() {},
  KeyboardSensor: function KeyboardSensor() {},
  useSensor: () => ({}),
  useSensors: (...s: any[]) => s,
  closestCenter: () => [],
}));

vi.mock('@dnd-kit/modifiers', () => ({ restrictToHorizontalAxis: () => ({ x: 0, y: 0 }) }));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => children,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  rectSortingStrategy: () => null,
  sortableKeyboardCoordinates: () => ({ x: 0, y: 0 }),
}));

import { BackgroundPanel } from './BackgroundPanel';
import { HERO_PREVIEW_SLIDE_EVENT } from './HeroSlidesTray';
import { resolveWorkBlock } from '@/modules/skeletons/work/resolveWorkBlock';

const HERO = 'hero-tray0001';

const THREE = [
  { id: 's1', image: '/a.jpg' },
  { id: 's2', image: '/b.jpg' },
  { id: 's3', image: '/c.jpg' },
];

let container: HTMLDivElement;
let root: Root;

function seed(slides: Array<{ id: string; image: string }>) {
  store = createEditStore(`bgtray-${Math.random()}`);
  act(() => {
    store.setState((s: any) => {
      s.audienceType = 'service';
      s.templateId = 'atelier';
      s.tokenId = 'tok-tray';
      s.sections = [HERO];
      s.sectionLayouts = { [HERO]: 'WorkHeroSlider' };
      s.content = {
        [HERO]: {
          id: HERO,
          layout: 'WorkHeroSlider',
          elements: { portrait_image: '/old.jpg', slides },
        },
      };
    });
  });
}

beforeEach(() => {
  // The debounced autosave fires after every write; absorb it.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ success: true }) }) as any),
  );
  dnd.onDragEnd = null;
  seed(THREE);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

async function mountPanel() {
  await act(async () => {
    root.render(<BackgroundPanel sectionId={HERO} onClose={() => {}} />);
  });
  await flush();
}

const byTestId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const allByTestId = (id: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

const elementsNow = () => (store.getState() as any).content?.[HERO]?.elements ?? {};
const slidesNow = () => elementsNow().slides as Array<{ id: string; image: string }> | undefined;

/** A real press: mousedown, THEN (separately) mouseup + click. The two `act()`
 *  calls are load-bearing — see BackgroundPanel.picker.test.tsx:153-163. Batching
 *  them lets a handler that unmounts on mousedown pass green. */
async function pressReal(el: HTMLElement) {
  await act(async () => {
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  });
  await flush();
  await act(async () => {
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await flush();
}

/** Render the PUBLISHED hero wrapper off whatever is in the store right now and
 *  return the `<img>` srcs in DOCUMENT order = the order `work.v1.js` plays. */
function publishedSlideOrder(): string[] {
  const Published = resolveWorkBlock('hero', 'published', 'WorkHeroSlider')!;
  const host = document.createElement('div');
  document.body.appendChild(host);
  const r = createRoot(host);
  act(() => {
    r.render(React.createElement(Published, { sectionId: HERO, ...elementsNow() } as any));
  });
  const srcs = Array.from(host.querySelectorAll('.wk-hero__slide img')).map(
    (n) => (n as HTMLImageElement).getAttribute('src') || '',
  );
  act(() => r.unmount());
  host.remove();
  return srcs;
}

describe('HeroSlidesTray — the filmstrip', () => {
  it('renders one numbered card per slide, in play order', async () => {
    await mountPanel();

    expect(byTestId('hero-slides-tray'), 'the tray should grow the Image tab at ≥2').toBeTruthy();
    const cards = allByTestId('hero-slide');
    expect(cards.map((c) => c.dataset.slideId)).toEqual(['s1', 's2', 's3']);
    // `01/02/03` — derived from position, never stored.
    expect(cards.map((c) => c.getAttribute('aria-label'))).toEqual([
      'Slide 01', 'Slide 02', 'Slide 03',
    ]);
    // The single-image Add slot is NOT also rendered (one add control, not two).
    expect(byTestId('section-bg-add-image')).toBeFalsy();
    expect(byTestId('hero-slide-add')).toBeTruthy();
  });

  it('drag-reorder writes the FULL new order once — and the PUBLISHED play order matches', async () => {
    await mountPanel();
    expect(dnd.onDragEnd, 'the tray never mounted a DndContext').toBeTruthy();

    const before = slidesNow()!.map((s) => s.id);
    expect(before).toEqual(['s1', 's2', 's3']);

    // Drop card 3 onto position 1.
    await act(async () => {
      dnd.onDragEnd!({ active: { id: 's3' }, over: { id: 's1' } });
    });
    await flush();

    const after = slidesNow()!;
    expect(after.map((s) => s.id), 'the whole new order must be persisted').toEqual([
      's3', 's1', 's2',
    ]);
    // Nothing else about the slides changed (images ride along with their ids).
    expect(after.map((s) => s.image)).toEqual(['/c.jpg', '/a.jpg', '/b.jpg']);
    // The cards re-number 01/02/03 against the NEW order.
    expect(allByTestId('hero-slide').map((c) => c.dataset.slideId)).toEqual(['s3', 's1', 's2']);

    // THE acceptance criterion: published document order === tray order.
    expect(publishedSlideOrder()).toEqual(['/c.jpg', '/a.jpg', '/b.jpg']);

    // A no-op drop (dropped on itself / outside) writes nothing.
    const snapshot = JSON.stringify(elementsNow());
    await act(async () => {
      dnd.onDragEnd!({ active: { id: 's1' }, over: { id: 's1' } });
      dnd.onDragEnd!({ active: { id: 's1' }, over: null });
    });
    await flush();
    expect(JSON.stringify(elementsNow())).toBe(snapshot);
  });

  it('delete down to one DEMOTES: portrait_image set, `slides` KEY gone', async () => {
    seed([
      { id: 's1', image: '/keep.jpg' },
      { id: 's2', image: '/drop.jpg' },
    ]);
    await mountPanel();

    const removeButtons = allByTestId('hero-slide-remove');
    expect(removeButtons).toHaveLength(2);
    // No confirm dialog anywhere (founder ruling): one gesture, one write.
    await pressReal(removeButtons[1]);

    const els = elementsNow();
    expect(els.portrait_image, 'the survivor must become the single image').toBe('/keep.jpg');
    // NOT `[]` — the KEY itself is gone (note N5).
    expect('slides' in els, '`slides` key survived the demote').toBe(false);
    // The invariant, from the outside: never exactly 1.
    expect(slidesNow()).toBeUndefined();
    // The tray is gone with it; state A's controls are back.
    expect(byTestId('hero-slides-tray')).toBeFalsy();
    expect(byTestId('section-bg-add-image')).toBeTruthy();
  });

  it('delete at 3 keeps a slideshow, and ONE undo restores the whole gesture', async () => {
    await mountPanel();

    await pressReal(allByTestId('hero-slide-remove')[0]);
    expect(slidesNow()!.map((s) => s.id)).toEqual(['s2', 's3']);

    // `executeUndoableAction('sectionSwap', …)` is the only history type whose undo
    // restores the whole content snapshot — a single undo puts the slide back.
    await act(async () => {
      (store.getState() as any).undo();
    });
    await flush();
    expect(slidesNow()!.map((s) => s.id), 'one undo did not restore the deleted slide').toEqual([
      's1', 's2', 's3',
    ]);
  });

  it('at the cap of 6 the add card is HIDDEN and a cap notice takes its place', async () => {
    seed([1, 2, 3, 4, 5, 6].map((n) => ({ id: `s${n}`, image: `/${n}.jpg` })));
    await mountPanel();

    expect(allByTestId('hero-slide')).toHaveLength(6);
    expect(byTestId('hero-slide-add'), 'add must be hidden at the cap').toBeFalsy();
    const notice = byTestId('hero-slides-cap-notice');
    expect(notice, 'a hidden control needs a why (greyed-placeholder rule)').toBeTruthy();
    expect(notice!.textContent).toMatch(/6/);

    // Below the cap it comes back.
    seed(THREE);
    await mountPanel();
    expect(byTestId('hero-slide-add')).toBeTruthy();
    expect(byTestId('hero-slides-cap-notice')).toBeFalsy();
  });

  it('clicking a thumbnail dispatches the canvas PREVIEW event (and nothing is written)', async () => {
    await mountPanel();
    const seen: any[] = [];
    const listener = (e: Event) => seen.push((e as CustomEvent).detail);
    window.addEventListener(HERO_PREVIEW_SLIDE_EVENT, listener);

    const snapshot = JSON.stringify(elementsNow());
    await pressReal(allByTestId('hero-slide-preview')[1]);
    expect(seen).toEqual([{ sectionId: HERO, slideId: 's2' }]);
    // Preview only — no content mutation (spec Scope OUT: no per-slide overlay).
    expect(JSON.stringify(elementsNow())).toBe(snapshot);

    // Clicking the same one again releases the preview (autoplay resumes).
    await pressReal(allByTestId('hero-slide-preview')[1]);
    expect(seen[1]).toEqual({ sectionId: HERO, slideId: null });

    window.removeEventListener(HERO_PREVIEW_SLIDE_EVENT, listener);
  });

  it('no autoplay / interval / transition / crop / focal control is exposed (Scope OUT)', async () => {
    await mountPanel();
    const text = (byTestId('section-bg-panel')!.textContent || '').toLowerCase();
    for (const forbidden of ['autoplay', 'interval', 'transition', 'crop', 'focal']) {
      expect(text, `"${forbidden}" must not appear in the panel`).not.toContain(forbidden);
    }
  });
});

// ── Phase 4b regressions ────────────────────────────────────────────────────
describe('HeroSlidesTray — phase 4b fixes', () => {
  /** Mount the panel behind a toggle so it can be unmounted the way Escape / a
   *  click-outside unmounts it (the tray's cleanup is what bug 1 lived in). */
  function mountToggleable() {
    let close: () => void = () => {};
    function Harness() {
      const [open, setOpen] = React.useState(true);
      close = () => setOpen(false);
      return open ? <BackgroundPanel sectionId={HERO} onClose={() => {}} /> : null;
    }
    return { render: () => root.render(<Harness />), close: () => close() };
  }

  it('BUG 1: unmounting with NOTHING previewed dispatches no release (the edit pause survives)', async () => {
    const h = mountToggleable();
    await act(async () => { h.render(); });
    await flush();
    expect(byTestId('hero-slides-tray')).toBeTruthy();

    const seen: any[] = [];
    const listener = (e: Event) => seen.push((e as CustomEvent).detail);
    window.addEventListener(HERO_PREVIEW_SLIDE_EVENT, listener);

    // Escape / click-outside path: the panel goes away without any preview click.
    await act(async () => { h.close(); });
    await flush();
    expect(byTestId('hero-slides-tray')).toBeFalsy();

    // The release event clears the SAME autoplay pause `focusin` sets while the
    // user types, so firing it here restarted the slideshow under the caret.
    expect(seen, 'an unpreviewed tray must not touch the canvas pause').toEqual([]);

    window.removeEventListener(HERO_PREVIEW_SLIDE_EVENT, listener);
  });

  it('BUG 1: unmounting WHILE previewing still releases (exactly once)', async () => {
    const h = mountToggleable();
    await act(async () => { h.render(); });
    await flush();

    await pressReal(allByTestId('hero-slide-preview')[1]);

    const seen: any[] = [];
    const listener = (e: Event) => seen.push((e as CustomEvent).detail);
    window.addEventListener(HERO_PREVIEW_SLIDE_EVENT, listener);

    await act(async () => { h.close(); });
    await flush();
    expect(seen, 'a live preview must be released when the tray goes away').toEqual([
      { sectionId: HERO, slideId: null },
    ]);

    window.removeEventListener(HERO_PREVIEW_SLIDE_EVENT, listener);
  });

  it('BUG 2: on a NON-slider hero, add + preview are inert with a why (R6)', async () => {
    seed(THREE);
    act(() => {
      store.setState((s: any) => {
        // Reachable today: slides are stamped on any hero, and the layout can be
        // swapped afterwards — the extra slides come along but never render.
        s.sectionLayouts = { [HERO]: 'WorkHeroImage' };
        s.content[HERO].layout = 'WorkHeroImage';
      });
    });
    await mountPanel();
    expect(byTestId('hero-slides-tray'), 'the tray still lists the stored slides').toBeTruthy();

    // The "+" card is present but DISABLED with a reason (greyed-placeholder rule),
    // not silently omitted…
    const add = byTestId('hero-slide-add')!;
    expect(add).toBeTruthy();
    expect(add.getAttribute('aria-disabled')).toBe('true');
    expect(add.getAttribute('title')).toMatch(/slider/i);
    // …and pressing it opens NO picker (it used to add a slide nothing renders).
    await pressReal(add);
    expect(document.querySelector('[role="dialog"]'), 'add must be inert off the slider').toBeFalsy();

    // Thumbnail preview is a dead click here (the canvas listener lives only in
    // WorkHeroSlider), so it must not pretend otherwise.
    const seen: any[] = [];
    const listener = (e: Event) => seen.push((e as CustomEvent).detail);
    window.addEventListener(HERO_PREVIEW_SLIDE_EVENT, listener);
    const thumb = allByTestId('hero-slide-preview')[0];
    expect(thumb.getAttribute('aria-disabled')).toBe('true');
    expect(thumb.getAttribute('title')).toMatch(/slider/i);
    await pressReal(thumb);
    expect(seen, 'no preview event may be dispatched off the slider').toEqual([]);
    expect(allByTestId('hero-slide')[0].dataset.previewing, 'no phantom highlight').toBeUndefined();
    window.removeEventListener(HERO_PREVIEW_SLIDE_EVENT, listener);

    // And the why is stated in the panel body too, not just in a tooltip.
    expect(byTestId('hero-slides-not-slider-notice')).toBeTruthy();
  });

  it('BUG 2: on the slider layout both stay LIVE', async () => {
    await mountPanel();
    const add = byTestId('hero-slide-add')!;
    expect(add.getAttribute('aria-disabled')).toBeNull();
    await pressReal(add);
    expect(document.querySelector('[role="dialog"]'), 'add must still open the picker').toBeTruthy();
    expect(byTestId('hero-slides-not-slider-notice')).toBeFalsy();
  });

  it('BUG 3: the preview highlight clears when the slide set changes (canvas resets)', async () => {
    await mountPanel();
    await pressReal(allByTestId('hero-slide-preview')[1]);
    expect(allByTestId('hero-slide')[1].dataset.previewing, 'preview did not mark its card').toBe('true');

    // Removing a DIFFERENT slide re-runs the canvas slider effect → go(0) + autoplay
    // restart. The tray must not keep claiming s2 is on screen.
    await pressReal(allByTestId('hero-slide-remove')[0]);
    expect(slidesNow()!.map((s) => s.id)).toEqual(['s2', 's3']);
    expect(
      allByTestId('hero-slide').some((c) => c.dataset.previewing === 'true'),
      'a stale highlight disagreed with the canvas',
    ).toBe(false);
  });
});

// ── The two phase-3-review carry-forwards this phase was asked to fix. They live
//    in BackgroundPanel, but both are only reachable through this surface, and
//    phase 4 is what makes the second one reachable at all (per-card replace = a
//    second picker entry point). Kept here rather than in a third test file.
describe('BackgroundPanel — phase-3 carry-forward fixes', () => {
  const styleTokensNow = () => (store.getState() as any).themeValues?.styleTokens?.[HERO];

  it('a Color click on a variant that renders no media writes NO bgMode at all', async () => {
    seed(THREE);
    act(() => {
      store.setState((s: any) => {
        s.sectionLayouts = { [HERO]: 'WorkHeroCenter' };
      });
    });
    await mountPanel();

    // Center is Color-only (D7), so the tab is already Color; clicking it is the
    // gesture a user makes. Phase 3 blocked only the `'image'` write, so this
    // persisted `bgMode:'color'` — harmless on center (it ignores the prop) but it
    // turns into a colour hero the moment the user swaps back to the slider.
    await pressReal(byTestId('section-bg-tab-color')!);
    expect(styleTokensNow()?.bgMode, 'bgMode must never be written on a no-media variant')
      .toBeUndefined();

    // The chips still work — only `bgMode` is refused, not the colour itself.
    await pressReal(byTestId('section-bg-chip-dark')!);
    expect(styleTokensNow()?.background).toBe('dark');
    expect(styleTokensNow()?.bgMode).toBeUndefined();
  });

  it('`picking` resets when the image tab unmounts under an open picker', async () => {
    seed(THREE);
    let closed = 0;
    function Harness() {
      const [open, setOpen] = React.useState(true);
      if (!open) return null;
      return (
        <BackgroundPanel
          sectionId={HERO}
          onClose={() => {
            closed += 1;
            setOpen(false);
          }}
        />
      );
    }
    await act(async () => {
      root.render(<Harness />);
    });
    await flush();

    // Open a picker from a tray card (a phase-4 entry point).
    await pressReal(allByTestId('hero-slide-replace')[0]);
    expect(document.querySelector('[role="dialog"]'), 'the picker did not open').toBeTruthy();

    // Now flip the tab out from under it. `MediaPickerModal` unmounts WITHOUT
    // `onOpenChange` firing, so without the reset effect `picking` would stay set
    // and the click-outside guard (`if (picking !== null) return`) would make the
    // panel permanently undismissable.
    await pressReal(byTestId('section-bg-tab-color')!);
    expect(document.querySelector('[role="dialog"]')).toBeFalsy();

    const outside = document.createElement('div');
    document.body.appendChild(outside);
    await act(async () => {
      outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    });
    expect(closed, 'the panel was left undismissable by a stale `picking`').toBe(1);
    outside.remove();
  });
});
