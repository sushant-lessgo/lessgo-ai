// BackgroundPanel × MediaPickerModal — the PORTAL/DISMISS regression (section-background
// phase 3 review fix).
//
// WHY THIS FILE EXISTS, and why the modal is REAL here.
//
// The bug: `MediaPickerModal` is a Radix Dialog, so its content is PORTALED to
// `document.body` — OUTSIDE `panelRef` — while a `mousedown` inside it still BUBBLES
// to the panel's document-level click-outside listener. `DialogContent` stops `click`
// propagation only; the asset button's `onMouseDown` preventDefault does not stop
// propagation either. So pressing an image ran `onClose()` → SectionToolbar unmounted
// the panel (`{showBackgroundPanel && <BackgroundPanel/>}`) → the modal unmounted as
// its React child → the asset button was detached before `mouseup`, and its `onClick`
// (the actual pick) never fired. Choose / Replace / Add-to-promote were all DEAD, and
// the dialog visibly vanished on first press.
//
// A test with a MOCKED modal cannot see any of that: the bug lives entirely in the
// real portal + real event propagation. Hence: real panel, real modal, real store, and
// a harness that reproduces the toolbar's unmount-on-close so the failure mode is
// actually reachable. The gesture is driven as the browser drives it — mousedown THEN
// click — because a click-only test passes against the broken handler.

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

// The template module is only read for the Auto hint (`getSurfaceForSection`);
// mounting the real atelier module would drag an async dynamic import in for nothing.
vi.mock('@/modules/templates/useTemplateReady', () => ({
  useTemplateModule: () => ({ ready: true, tmpl: { getSurfaceForSection: () => 'paper' } }),
}));

// Only `extractSectionType` is used by the panel; the real module pulls the whole
// block registry into jsdom.
vi.mock('@/modules/generatedLanding/componentRegistry', () => ({
  extractSectionType: (id: string) => String(id).split('-')[0],
}));

import { BackgroundPanel } from './BackgroundPanel';

const HERO = 'hero-aaa11111';
const LIB_URL = 'https://blob.test/library-pick.jpg';

let container: HTMLDivElement;
let root: Root;

/** Every network call the mounted tree can make: the library GET, plus whatever the
 *  debounced autosave fires after a write. */
function installFetchMock() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: any) => {
      const url = String(typeof input === 'string' ? input : input?.url ?? '');
      if (url.startsWith('/api/media')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            assets: [
              {
                id: 'asset-1',
                url: LIB_URL,
                source: 'upload',
                width: 1200,
                height: 800,
                blurDataUrl: null,
                alt: 'a library image',
              },
            ],
          }),
        } as any;
      }
      return { ok: true, status: 200, json: async () => ({ success: true }) } as any;
    }),
  );
}

beforeEach(() => {
  installFetchMock();
  store = createEditStore(`bgpicker-${Math.random()}`);
  act(() => {
    store.setState((s: any) => {
      s.audienceType = 'service';
      s.templateId = 'atelier';
      s.tokenId = 'tok-test';
      s.sections = [HERO];
      s.sectionLayouts = { [HERO]: 'WorkHeroSlider' };
      s.content = { [HERO]: { id: HERO, layout: 'WorkHeroSlider', elements: { portrait_image: '/old.jpg' } } };
    });
  });
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

/**
 * Reproduces SectionToolbar's mount shape EXACTLY (`{showBackgroundPanel &&
 * <BackgroundPanel …/>}`): `onClose` UNMOUNTS the panel, and the modal is a child of
 * the panel. Without this, the bug cannot express itself.
 */
let closedCount = 0;
function Harness() {
  const [open, setOpen] = React.useState(true);
  if (!open) return null;
  return (
    <BackgroundPanel
      sectionId={HERO}
      onClose={() => {
        closedCount += 1;
        setOpen(false);
      }}
    />
  );
}

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

async function mountPanel() {
  closedCount = 0;
  await act(async () => {
    root.render(<Harness />);
  });
  await flush();
}

const byTestId = (id: string) =>
  document.querySelector<HTMLElement>(`[data-testid="${id}"]`);

/**
 * A real user press: mousedown (what the dismiss listener sees) and, only AFTER the
 * mousedown's consequences have rendered, mouseup + click (what performs the pick).
 *
 * The two `act()` calls are load-bearing, not tidiness. In a browser React flushes
 * discrete-event state updates synchronously, so a `mousedown` handler that unmounts
 * the tree has already detached the button by the time `click` is dispatched. Batch
 * both into ONE `act()` and the unmount is deferred to the end of the batch, the
 * detached-before-click failure never happens, and the test goes green against the
 * broken handler. Clicking without the mousedown would not reproduce the bug either.
 */
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

const elementsNow = () => (store.getState() as any).content?.[HERO]?.elements ?? {};

describe('BackgroundPanel — picking an image through the REAL portaled modal', () => {
  it('Replace image → library asset → the store write LANDS (panel survives the press)', async () => {
    await mountPanel();

    const replace = byTestId('section-bg-replace-image');
    expect(replace, 'image tab should default open on a slider hero').toBeTruthy();
    await pressReal(replace!);

    // The dialog is PORTALED — it is in document.body, not inside the panel.
    const dialog = byTestId('media-picker');
    expect(dialog, 'the picker did not open').toBeTruthy();
    const panel = byTestId('section-bg-panel')!;
    expect(panel.contains(dialog!), 'precondition: the dialog is portaled OUTSIDE the panel').toBe(false);

    const asset = document.querySelector<HTMLElement>('[data-testid="media-picker-asset"]');
    expect(asset, 'library grid did not render the seeded asset').toBeTruthy();

    await pressReal(asset!);

    // THE assertion the bug killed.
    expect(elementsNow().portrait_image).toBe(LIB_URL);
    // …and the panel was never dismissed by the press inside the portal.
    expect(closedCount).toBe(0);
    expect(byTestId('section-bg-panel')).toBeTruthy();
    // the picker closed itself on pick
    expect(byTestId('media-picker')).toBeFalsy();
  });

  it('+ Add image → library asset → PROMOTES to a 2-slide slideshow', async () => {
    await mountPanel();

    const add = byTestId('section-bg-add-image');
    expect(add, 'the add slot should always be visible on the slider').toBeTruthy();
    await pressReal(add!);

    const asset = document.querySelector<HTMLElement>('[data-testid="media-picker-asset"]');
    expect(asset).toBeTruthy();
    await pressReal(asset!);

    const slides = elementsNow().slides;
    expect(Array.isArray(slides)).toBe(true);
    expect(slides.map((s: any) => s.image)).toEqual(['/old.jpg', LIB_URL]);
    expect(closedCount).toBe(0);
  });

  it('a mousedown genuinely OUTSIDE (no picker open) still dismisses — the guard is narrow', async () => {
    await mountPanel();

    const outside = document.createElement('div');
    document.body.appendChild(outside);
    await act(async () => {
      outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    });

    expect(closedCount).toBe(1);
    expect(byTestId('section-bg-panel')).toBeFalsy();
    outside.remove();
  });
});
