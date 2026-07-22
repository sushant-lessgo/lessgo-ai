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
//
// The same effect also listens for `lessgo:wk-hero-preview-slide` (the Background
// panel's filmstrip, phase 4) → show that slide + pause. Edit-only, DOM-only.

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
  // Slide IDS as a STABLE STRING dep (an array literal would re-run the effect on
  // every render). The filmstrip's preview event names a slide by id; the DOM
  // `.wk-hero__slide` nodes deliberately carry NO id attribute — adding one would
  // change published markup for untouched drafts (D9) — so the id→index map is
  // resolved here, from the same array the core renders in order.
  const slideIdsKey = React.useMemo(
    () => ((blockContent as any)?.slides || []).map((s: any) => s?.id ?? '').join('|'),
    [blockContent],
  );

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

    // ── FILMSTRIP PREVIEW (section-background phase 4) ────────────────────────
    // Clicking a tray thumbnail shows THAT slide on the canvas and pauses autoplay
    // so it stays put while the panel is open; `slideId: null` (tray unmounted /
    // preview toggled off) resumes. EDIT-ONLY and DOM-only: nothing is stored, no
    // markup changes, and `work.v1.js` never sees any of it — preview is not a
    // content change (spec Scope OUT: per-slide overlay text is not in this build).
    const slideIds = slideIdsKey ? slideIdsKey.split('|') : [];
    const onPreview = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { sectionId?: string; slideId?: string | null }
        | undefined;
      if (!detail || detail.sectionId !== sectionId) return;
      if (!detail.slideId) {
        paused = false;
        restart();
        return;
      }
      const i = slideIds.indexOf(detail.slideId);
      if (i < 0) return;
      paused = true;
      stop();
      go(i);
    };
    window.addEventListener('lessgo:wk-hero-preview-slide', onPreview);

    go(0);
    restart();

    return () => {
      stop();
      window.removeEventListener('lessgo:wk-hero-preview-slide', onPreview);
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
  }, [slideCount, bgMode, slideIdsKey, sectionId]);

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
