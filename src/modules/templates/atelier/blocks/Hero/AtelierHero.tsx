'use client';

// Atelier Hero — EDIT wrapper. Layout lives in AtelierHero.core.tsx.
//
// The slider is animated the SAME way it is on published pages: an effect drives
// the EXACT core-rendered DOM (data-atl-slider / .lg-atelier-slide / .is-active /
// [data-atl-prev|next] / [data-atl-dots] → injected .lg-atelier-dot) — it does NOT
// restructure the markup, so editor↔published DOM/CSS stay identical. Parity
// baseline = slide 1 active (core ships .is-active on the first slide; go(0) holds
// it). Autoplay is PAUSED whenever the cover has focus so inline editing of hero
// text/images is never interrupted; arrows/dots stay usable to preview slides.

import React from 'react';
import { useAtelierBlock } from '../../hooks/useAtelierBlock';
import { AtelierEditProvider, editPrimitives, useAtelierEditCtx } from '../editPrimitives';
import { AtelierHeroCore, type AtelierHeroContent } from './AtelierHero.core';

export default function AtelierHero({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useAtelierBlock<AtelierHeroContent>({ sectionId });
  const ctx = useAtelierEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const slideCount = blockContent?.slides?.length ?? 0;
  const isPageHead = blockContent?.mode === 'pageHead';

  React.useEffect(() => {
    if (isPageHead) return;
    const root = rootRef.current;
    if (!root) return;

    const slider = root.querySelector<HTMLElement>('[data-atl-slider]');
    if (!slider) return;
    const cover = slider.closest<HTMLElement>('.lg-atelier-cover') || slider;
    const slides = Array.from(slider.querySelectorAll<HTMLElement>('.lg-atelier-slide'));
    if (slides.length < 2) return;

    let interval = parseInt(slider.getAttribute('data-interval') || '', 10);
    if (!interval || interval < 1) interval = 5000;

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let idx = 0;
    let timer: ReturnType<typeof setInterval> | null = null;
    let paused = false;

    // Inject dots into the EMPTY [data-atl-dots] container (mirrors slider.v1.js).
    const dotsWrap = cover.querySelector<HTMLElement>('[data-atl-dots]');
    const dots: HTMLButtonElement[] = [];
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach((_s, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lg-atelier-dot';
        b.setAttribute('aria-label', `Slide ${i + 1}`);
        b.setAttribute('aria-current', i === 0 ? 'true' : 'false');
        b.addEventListener('click', () => { go(i); restart(); });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }

    function go(n: number) {
      idx = (n % slides.length + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      dots.forEach((d, i) => d.setAttribute('aria-current', i === idx ? 'true' : 'false'));
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }
    function restart() {
      stop();
      if (reduce || paused) return;
      timer = setInterval(() => go(idx + 1), interval);
    }

    const prev = cover.querySelector<HTMLElement>('[data-atl-prev]');
    const next = cover.querySelector<HTMLElement>('[data-atl-next]');
    const onPrev = () => { go(idx - 1); restart(); };
    const onNext = () => { go(idx + 1); restart(); };
    prev?.addEventListener('click', onPrev);
    next?.addEventListener('click', onNext);

    // Pause autoplay while editing content inside the cover.
    const onFocusIn = () => { paused = true; stop(); };
    const onFocusOut = () => { paused = false; restart(); };
    cover.addEventListener('focusin', onFocusIn);
    cover.addEventListener('focusout', onFocusOut);

    go(0);
    restart();

    return () => {
      stop();
      prev?.removeEventListener('click', onPrev);
      next?.removeEventListener('click', onNext);
      cover.removeEventListener('focusin', onFocusIn);
      cover.removeEventListener('focusout', onFocusOut);
      if (dotsWrap) dotsWrap.innerHTML = '';
      // Reset to the parity baseline (first slide active).
      slides.forEach((s, i) => s.classList.toggle('is-active', i === 0));
    };
  }, [isPageHead, slideCount]);

  return (
    <AtelierEditProvider ctx={ctx}>
      {/* display:contents → the grouping div is layout-transparent, so editor
          DOM parity with the published wrapper (no extra box) is preserved. */}
      <div ref={rootRef} style={{ display: 'contents' }}>
        <AtelierHeroCore content={blockContent} E={editPrimitives} />
      </div>
    </AtelierEditProvider>
  );
}
