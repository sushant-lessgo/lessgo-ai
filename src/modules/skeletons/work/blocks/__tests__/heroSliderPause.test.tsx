// section-background phase 4b — AUTOPLAY PAUSE PROVENANCE (bug 1).
//
// The hero pauses its slideshow for TWO independent reasons:
//   - focus  — the user is typing inside the hero (`focusin`/`focusout`);
//   - preview — the Background panel's filmstrip is pinning one slide.
//
// They used to share ONE `paused` flag, so the preview RELEASE event (which the
// tray fires when it unmounts — panel closed, Escape) also cleared the focus
// pause and restarted the slideshow UNDER THE CARET. This pins that a release
// can no longer clear an edit pause, while a real preview still releases.
//
// Not inert: the first case proves autoplay actually runs in this harness, so a
// "nothing ever rotates" false green cannot hide behind the later assertions.

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { createHarnessStore } from '@/modules/templates/blockMocks/harness';
import { resolveWorkBlock } from '../../resolveWorkBlock';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const HERO = 'hero-pause001';
const PREVIEW_EVENT = 'lessgo:wk-hero-preview-slide';

const HERO_CONTENT: Record<string, any> = {
  role_line: 'Photographer',
  name: 'Kundius',
  quote: 'Pictures that keep their nerve.',
  portrait_image: 'https://cdn.example/portrait.jpg',
  cta_label: 'Start a project',
  cta_href: '#contact',
  slides: [
    { id: 's1', image: 'https://cdn.example/1.jpg' },
    { id: 's2', image: 'https://cdn.example/2.jpg' },
    { id: 's3', image: 'https://cdn.example/3.jpg' },
  ],
};

const h = vi.hoisted(() => ({ store: null as any }));

vi.mock('@/hooks/useEditStore', () => ({
  useEditStore: (selector?: (s: any) => any) =>
    selector ? selector(h.store.getState()) : h.store.getState(),
  useEditStoreApi: () => h.store,
}));

vi.mock('@/components/EditProvider', () => ({
  useEditStoreContext: () => ({ store: h.store, isReady: true, isInitialized: true, error: null }),
}));

h.store = createHarnessStore([]);

let container: HTMLDivElement;
let root: Root;

function mountSlider() {
  const elements: Record<string, any> = {};
  for (const [k, v] of Object.entries(HERO_CONTENT)) elements[k] = { value: v, content: v };
  h.store.setState({
    content: { [HERO]: { elements, layout: 'WorkHeroSlider', aiMetadata: {} } },
    sections: [HERO],
    sectionLayouts: { [HERO]: 'WorkHeroSlider' },
    themeValues: {},
  });
  const Edit = resolveWorkBlock('hero', 'edit', 'WorkHeroSlider')!;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(React.createElement(Edit, { sectionId: HERO }));
  });
}

const slider = () => container.querySelector<HTMLElement>('[data-wk-hero-slider]')!;
const slideEls = () => Array.from(container.querySelectorAll<HTMLElement>('.wk-hero__slide'));
/** Index of the slide currently painted on the canvas. */
const activeIndex = () => slideEls().findIndex((s) => s.classList.contains('is-active'));

const tick = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

/** Assert the canvas STAYS on `i`. Deliberately checked after EACH interval rather
 *  than after one long wait: with 3 slides a 3×interval wait lands back on the
 *  starting index, so a running slideshow would read as "held" (modulus luck — the
 *  repo's documented inert-assertion pattern). */
function expectHeldAt(i: number, why: string) {
  for (let n = 0; n < 2; n++) {
    tick(5000);
    expect(activeIndex(), why).toBe(i);
  }
}

const fire = (type: string, detail?: any) =>
  act(() => {
    if (detail === undefined) slider().dispatchEvent(new Event(type, { bubbles: true }));
    else window.dispatchEvent(new CustomEvent(type, { detail }));
  });

beforeEach(() => {
  vi.useFakeTimers();
  mountSlider();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

describe('WorkHeroSlider — autoplay pause provenance', () => {
  it('autoplays by default (the harness really drives the slideshow)', () => {
    expect(slideEls().length, 'need >=2 slides or the effect bails').toBeGreaterThan(1);
    expect(activeIndex()).toBe(0);
    tick(5000);
    expect(activeIndex(), 'autoplay never advanced — later assertions would be inert').toBe(1);
  });

  it('a filmstrip RELEASE does not clear the focus/edit pause (bug 1)', () => {
    // Caret enters the hero copy.
    fire('focusin');
    expectHeldAt(0, 'focus must pause autoplay');

    // The Background panel closes → the tray unmounts → release event. Before the
    // fix this cleared the SAME flag and restarted the slideshow mid-typing.
    fire(PREVIEW_EVENT, { sectionId: HERO, slideId: null });
    expectHeldAt(0, 'a preview release restarted autoplay while the user was editing');

    // Blur ends the edit pause and autoplay resumes normally.
    fire('focusout');
    tick(5000);
    expect(activeIndex()).toBe(1);
  });

  it('a real preview still pins its slide and its release still resumes', () => {
    fire(PREVIEW_EVENT, { sectionId: HERO, slideId: 's3' });
    expect(activeIndex(), 'preview must show the named slide').toBe(2);
    expectHeldAt(2, 'preview must hold the slide (autoplay paused)');

    fire(PREVIEW_EVENT, { sectionId: HERO, slideId: null });
    tick(5000);
    expect(activeIndex(), 'releasing a real preview must resume autoplay').toBe(0);
  });

  it('a preview release does not resume while the hero still has focus', () => {
    fire(PREVIEW_EVENT, { sectionId: HERO, slideId: 's2' });
    expect(activeIndex()).toBe(1);
    fire('focusin');
    fire(PREVIEW_EVENT, { sectionId: HERO, slideId: null });
    expectHeldAt(1, 'both pauses must be released before autoplay resumes');
  });

  it('ignores preview events aimed at another section', () => {
    fire(PREVIEW_EVENT, { sectionId: 'hero-other', slideId: 's3' });
    expect(activeIndex()).toBe(0);
  });
});
