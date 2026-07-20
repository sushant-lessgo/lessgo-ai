// src/modules/skeletons/work/__tests__/imgPicker.test.tsx
// PHASE 1 (work-contract-wave2) — the shared work image primitive routes ALL image
// editing through the shared MediaPickerModal (t7 picker), NOT a raw <input type=file>.
//
// Proves the three load-bearing wiring facts:
//   1. EDIT `E.Img` renders a "pick" affordance; clicking it OPENS the picker
//      (with the ctx tokenId threaded through), and the picker's `onPick(url)`
//      writes the url string into content exactly where the old upload path wrote
//      it (a scalar `update(elementKey, url)`; for a collection item, an
//      `updateCollection` write). Work stores a bare url STRING (not the CMS
//      `{url}` object) — matching the pre-existing upload path this rewire replaces.
//   2. The LOGO path inherits the picker for free (Logo delegates to Img): a Logo
//      with a src opens the same picker and writes to its `imageKey`.
//   3. PUBLISHED `Img`/`Logo` render a plain `<img src>` with ZERO picker surface —
//      and `publishedPrimitives.tsx` imports NO 'use client' picker module (the
//      dual-renderer firewall).
//
// The MediaPickerModal is MOCKED to a lightweight stub so the test drives the
// wiring (open state + onPick) without the modal's live fetch/registry internals.

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi } from 'vitest';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Lightweight picker stub: renders only when open, echoes the tokenId it received,
// and exposes a button that fires onPick with a fixed url.
const PICKED_URL = 'https://cdn.example/picked.jpg';
vi.mock('@/app/edit/[token]/components/ui/MediaPickerModal', () => ({
  MediaPickerModal: ({ open, onPick, tokenId }: any) =>
    open ? (
      <div data-testid="media-picker" data-token={tokenId ?? ''}>
        <button type="button" data-testid="pick" onClick={() => onPick(PICKED_URL)}>
          pick
        </button>
      </div>
    ) : null,
}));

import {
  WorkEditProvider,
  editPrimitives,
  type WorkEditCtx,
} from '../blocks/editPrimitives';
import { makePublishedPrimitives } from '../blocks/publishedPrimitives';

/** Build a minimal edit ctx that records scalar + collection writes. */
function makeCtx(overrides: Partial<WorkEditCtx> = {}): {
  ctx: WorkEditCtx;
  scalarWrites: Array<[string, any]>;
  collectionWrites: Array<[string, any[]]>;
} {
  const scalarWrites: Array<[string, any]> = [];
  const collectionWrites: Array<[string, any[]]> = [];
  const collections: Record<string, any[]> = {};
  const ctx: WorkEditCtx = {
    sectionId: 'sec-1',
    update: (k, v) => scalarWrites.push([k, v]),
    updateCollection: (k, v) => {
      collections[k] = v;
      collectionWrites.push([k, v]);
    },
    getCollection: (k) => collections[k] || [],
    tokenId: 'tok-1',
    sectionOptions: [],
    pageOptions: [],
    ...overrides,
  };
  return { ctx, scalarWrites, collectionWrites };
}

/** Mount an element in jsdom (running effects). Returns the container. */
function mount(el: React.ReactElement): { container: HTMLElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(el);
  });
  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

function click(el: Element | null) {
  if (!el) throw new Error('element to click not found');
  act(() => {
    (el as HTMLElement).click();
  });
}

describe('work Img primitive — MediaPicker wiring (edit)', () => {
  it('empty Img: clicking the affordance opens the picker with the ctx tokenId', () => {
    const { ctx } = makeCtx();
    const E = editPrimitives;
    const { container, unmount } = mount(
      <WorkEditProvider ctx={ctx}>
        <E.Img elementKey="portrait_image" src="" className="box" />
      </WorkEditProvider>,
    );

    // Closed initially — no picker in the DOM.
    expect(container.querySelector('[data-testid="media-picker"]')).toBeNull();

    click(container.querySelector('.wk-img-edit__btn'));

    const picker = container.querySelector('[data-testid="media-picker"]');
    expect(picker).not.toBeNull();
    expect(picker!.getAttribute('data-token')).toBe('tok-1');
    unmount();
  });

  it('onPick writes the url STRING to the scalar element key (where upload wrote it)', () => {
    const { ctx, scalarWrites } = makeCtx();
    const E = editPrimitives;
    const { container, unmount } = mount(
      <WorkEditProvider ctx={ctx}>
        <E.Img elementKey="portrait_image" src="" />
      </WorkEditProvider>,
    );

    click(container.querySelector('.wk-img-edit__btn'));
    click(container.querySelector('[data-testid="pick"]'));

    expect(scalarWrites).toEqual([['portrait_image', PICKED_URL]]);
    unmount();
  });

  it('onPick writes into a collection item when the key is a collection path', () => {
    const { ctx, collectionWrites } = makeCtx({
      getCollection: () => [{ id: 'i1', image: '' }],
    });
    const E = editPrimitives;
    const { container, unmount } = mount(
      <WorkEditProvider ctx={ctx}>
        <E.Img elementKey="slides.i1.image" src="" />
      </WorkEditProvider>,
    );

    click(container.querySelector('.wk-img-edit__btn'));
    click(container.querySelector('[data-testid="pick"]'));

    expect(collectionWrites).toEqual([['slides', [{ id: 'i1', image: PICKED_URL }]]]);
    unmount();
  });

  it('Logo path inherits the picker (delegates to Img) and writes to imageKey', () => {
    const { ctx, scalarWrites } = makeCtx();
    const E = editPrimitives;
    const { container, unmount } = mount(
      <WorkEditProvider ctx={ctx}>
        <E.Logo
          imageKey="logo_image"
          textKey="logo_text"
          src="https://cdn.example/old-logo.jpg"
          text="Wordmark"
        />
      </WorkEditProvider>,
    );

    // With a src set, Logo renders the image affordance (not the wordmark Txt).
    click(container.querySelector('.wk-img-edit__btn'));
    const picker = container.querySelector('[data-testid="media-picker"]');
    expect(picker).not.toBeNull();
    click(container.querySelector('[data-testid="pick"]'));

    expect(scalarWrites).toEqual([['logo_image', PICKED_URL]]);
    unmount();
  });
});

describe('work Img/Logo primitive — published (no picker)', () => {
  it('published Img renders a plain <img src> and no picker surface', () => {
    const P = makePublishedPrimitives();
    const html = renderToStaticMarkup(
      <P.Img elementKey="portrait_image" src="https://cdn.example/p.jpg" className="box" imgClassName="im" />,
    );
    expect(html).toContain('<img');
    expect(html).toContain('src="https://cdn.example/p.jpg"');
    expect(html).not.toContain('media-picker');
    expect(html).not.toContain('wk-img-edit');
  });

  it('published Logo renders a plain <img src> for the logo image', () => {
    const P = makePublishedPrimitives();
    const html = renderToStaticMarkup(
      <P.Logo
        imageKey="logo_image"
        textKey="logo_text"
        src="https://cdn.example/logo.jpg"
        text="Wordmark"
        href="/"
      />,
    );
    expect(html).toContain('<img');
    expect(html).toContain('src="https://cdn.example/logo.jpg"');
    expect(html).not.toContain('media-picker');
  });

  it('publishedPrimitives.tsx imports NO MediaPickerModal (dual-renderer firewall)', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '..', 'blocks', 'publishedPrimitives.tsx'),
      'utf8',
    );
    // The 'use client' picker must never be reachable from the published path.
    expect(src).not.toMatch(/import[^\n]*MediaPickerModal/);
  });
});
