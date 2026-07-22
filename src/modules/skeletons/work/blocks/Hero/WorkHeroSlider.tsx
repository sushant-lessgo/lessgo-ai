'use client';

// WorkHeroSlider — EDIT wrapper. Wires the store into edit primitives and renders
// the shared core. All layout/markup lives in WorkHeroSlider.core.tsx.
//
// The slider is animated the SAME way it is on published pages: an effect drives
// the EXACT core-rendered DOM ([data-wk-hero-slider] / .wk-hero__slide / .is-active
// / [data-wk-prev|next] / [data-wk-dots] → injected .wk-hero__dot) — it does NOT
// restructure the markup, so editor↔published DOM/CSS stay identical. It MIRRORS
// src/lib/staticExport/workBehaviors.js one-for-one. ≥2-slide guard: the pilot hero
// ships a single portrait (no `.wk-hero__slide` set), so BOTH the editor effect and
// the published asset bail (slides.length < 2) → identical static first-slide state,
// the exact state a real single-slide hero ships live (honest edit==published).
// Autoplay pauses while the hero has focus so inline editing is never interrupted.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkHeroSliderCore, type WorkHeroSliderContent } from './WorkHeroSlider.core';

export default function WorkHeroSlider({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkHeroSliderContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  // Design state (Design ▾ / Background layer), NOT a content-contract key — the
  // WorkHeader `headerMode` precedent. SCALAR selector (plan D4): one string, so
  // this block re-renders only when ITS OWN bgMode changes, never on unrelated
  // styleTokens churn. Absent → today's behaviour.
  const bgMode = useEditStore(
    (s) => (s as any).themeValues?.styleTokens?.[sectionId]?.bgMode,
  ) as string | undefined;

  const rootRef = React.useRef<HTMLDivElement>(null);
  // Re-run when the number of slides changes (future multi-slide content).
  const slideCount = (blockContent as any)?.slides?.length ?? 0;

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const slider = root.querySelector<HTMLElement>('[data-wk-hero-slider]');
    if (!slider) return;
    const slides = Array.from(slider.querySelectorAll<HTMLElement>('.wk-hero__slide'));
    if (slides.length < 2) return; // single-slide pilot state → nothing to animate

    let interval = parseInt(slider.getAttribute('data-wk-interval') || '', 10);
    if (!interval || interval < 1) interval = 5000;

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let idx = 0;
    let timer: ReturnType<typeof setInterval> | null = null;
    let paused = false;

    // Inject dots into the EMPTY [data-wk-dots] container (mirrors work.v1.js).
    const dotsWrap = slider.querySelector<HTMLElement>('[data-wk-dots]');
    const dots: HTMLButtonElement[] = [];
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach((_s, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'wk-hero__dot';
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

    const prev = slider.querySelector<HTMLElement>('[data-wk-prev]');
    const next = slider.querySelector<HTMLElement>('[data-wk-next]');
    const onPrev = () => { go(idx - 1); restart(); };
    const onNext = () => { go(idx + 1); restart(); };
    prev?.addEventListener('click', onPrev);
    next?.addEventListener('click', onNext);

    // Pause autoplay while editing content inside the hero.
    const onFocusIn = () => { paused = true; stop(); };
    const onFocusOut = () => { paused = false; restart(); };
    slider.addEventListener('focusin', onFocusIn);
    slider.addEventListener('focusout', onFocusOut);

    go(0);
    restart();

    return () => {
      stop();
      prev?.removeEventListener('click', onPrev);
      next?.removeEventListener('click', onNext);
      slider.removeEventListener('focusin', onFocusIn);
      slider.removeEventListener('focusout', onFocusOut);
      if (dotsWrap) dotsWrap.innerHTML = '';
      // Reset to the parity baseline (first slide active).
      slides.forEach((s, i) => s.classList.toggle('is-active', i === 0));
    };
    // `bgMode` is a dep because Color mode removes the whole slide set from the
    // DOM: without it the effect would keep an interval running against detached
    // nodes until the next content change.
  }, [slideCount, bgMode]);

  return (
    <WorkEditProvider ctx={ctx}>
      {/* display:contents → the grouping div is layout-transparent, so editor DOM
          parity with the published wrapper (no extra box) is preserved. */}
      <div ref={rootRef} style={{ display: 'contents' }}>
        <WorkHeroSliderCore content={blockContent} E={editPrimitives} sectionId={sectionId} bgMode={bgMode} />
      </div>
    </WorkEditProvider>
  );
}
