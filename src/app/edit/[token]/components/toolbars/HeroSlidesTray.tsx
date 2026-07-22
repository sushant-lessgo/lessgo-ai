// app/edit/[token]/components/toolbars/HeroSlidesTray.tsx
//
// section-background phase 4 (slice 3) — the FILMSTRIP TRAY.
//
// WHAT THIS IS (spec §B): the 2+ state of Image mode. Not a modal, not a separate
// surface — the SAME docked BackgroundPanel, grown. It renders horizontally so the
// strip reads as play order, cards are numbered `01/02/03`, and it stays docked to
// the section so crops can be judged against the surrounding layout.
//
// ONE WRITER (the EditableImageCollection law, :16-23). This component owns NO
// store access at all: every mutation is computed by the phase-3 pure helpers
// (`src/modules/skeletons/work/heroSlides.ts`) and handed to the SINGLE injected
// `onApplyPatch(label, patch)`, which BackgroundPanel turns into ONE
// `executeUndoableAction('sectionSwap', …)`. Phase 4 adds NO helper — the
// "`slides` is never length 1" invariant is enforced in exactly one module, and a
// delete at 2 auto-demotes there.
//
// NO CONFIRM DIALOG on delete (founder ruling, BlockVariantSelector precedent):
// one gesture = one undo entry, and the tray says so inline.
//
// SCOPE OUT, do not reintroduce: autoplay/interval/transition control, crop/focal
// point, per-slide overlay text. Clicking a thumbnail PREVIEWS that slide on the
// canvas and nothing else.

'use client';

import React from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MAX_HERO_SLIDES,
  reorderSlides,
  removeSlide,
  type HeroSlide,
  type HeroSlidesPatch,
} from '@/modules/skeletons/work/heroSlides';

/** Canvas preview channel (precedent: the `lessgo:manage-collections` window
 *  event). EDIT-ONLY and fire-and-forget: `WorkHeroSlider.tsx`'s slider effect
 *  listens, forces that slide active and pauses autoplay; `slideId: null` resumes.
 *  Nothing is stored and nothing reaches the published path — preview is not a
 *  content change. */
export const HERO_PREVIEW_SLIDE_EVENT = 'lessgo:wk-hero-preview-slide';

export function dispatchHeroSlidePreview(sectionId: string, slideId: string | null) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(HERO_PREVIEW_SLIDE_EVENT, { detail: { sectionId, slideId } }),
  );
}

/** `01 · 02 · 03` — the number IS the play position, so it is derived from the
 *  index, never stored. */
function slideNumber(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export interface HeroSlidesTrayProps {
  sectionId: string;
  /** Always length ≥2 here (the caller renders the tray only in slideshow state). */
  slides: HeroSlide[];
  /** The ONE writer. Called at most once per user gesture. */
  onApplyPatch: (label: string, patch: HeroSlidesPatch) => void;
  /** Open the media picker for this slide (the panel owns the picker + its state). */
  onRequestReplace: (slideId: string) => void;
  /** Open the media picker in "append" mode (promote/append lives in the panel). */
  onRequestAdd: () => void;
  /** R6: slideshow is a SLIDER-layout capability. On a non-slider hero variant the
   *  extra slides are stored but never rendered, so adding one changes nothing the
   *  user can see — the "+" card stays visible but goes inert with a why (the
   *  greyed-placeholder rule), instead of silently doing nothing. */
  allowAdd?: boolean;
  /** Same gate for the thumbnail preview: the canvas listener lives only in
   *  `WorkHeroSlider`, so on any other variant a preview click is a DEAD click. */
  allowPreview?: boolean;
}

/** Why add/preview are inert off the slider layout — shown as a `title`, never a
 *  silent omission. */
const NOT_SLIDER_WHY =
  'Slideshows only play on the slider hero layout — switch this hero to the slider to use this.';

interface SlideCardProps {
  id: string;
  index: number;
  image?: string;
  previewing: boolean;
  canPreview: boolean;
  onPreview: () => void;
  onReplace: () => void;
  onRemove: () => void;
}

function SlideCard({
  id, index, image, previewing, canPreview, onPreview, onReplace, onRemove,
}: SlideCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 5 : undefined,
  };
  const n = slideNumber(index);
  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="hero-slide"
      data-slide-id={id}
      data-previewing={previewing ? 'true' : undefined}
      role="listitem"
      aria-label={`Slide ${n}`}
      className={[
        'relative w-[68px] flex-none rounded-app-ctl border bg-app-surface p-1',
        previewing ? 'border-app-primary' : 'border-app-border',
      ].join(' ')}
    >
      {/* Thumbnail = PREVIEW. Preview only (spec Scope OUT: no per-slide overlay
          text), so this button changes the canvas and never the content. */}
      <button
        type="button"
        data-testid="hero-slide-preview"
        aria-label={`Preview slide ${n}`}
        aria-disabled={canPreview ? undefined : true}
        title={canPreview ? 'Show this slide on the page' : NOT_SLIDER_WHY}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => { if (canPreview) onPreview(); }}
        className={[
          'block h-11 w-full overflow-hidden rounded-[3px] border border-black/10 bg-app-hover bg-cover bg-center',
          canPreview ? '' : 'cursor-not-allowed opacity-60',
        ].join(' ')}
        style={image ? { backgroundImage: `url(${image})` } : undefined}
      />

      <div className="mt-1 flex items-center justify-between gap-0.5">
        <span className="font-mono text-[10px] leading-none text-app-muted">{n}</span>
        <div className="flex items-center gap-0.5">
          {/* Dedicated drag HANDLE, not the whole card: the thumbnail must stay a
              plain click (preview), and a card-wide drag would fight it. */}
          <button
            type="button"
            data-testid="hero-slide-drag"
            aria-label={`Reorder slide ${n}`}
            title="Drag to reorder — order is play order"
            className="cursor-grab px-0.5 text-[11px] leading-none text-app-faint hover:text-app-body"
            {...attributes}
            {...listeners}
          >
            ⠿
          </button>
          <button
            type="button"
            data-testid="hero-slide-replace"
            aria-label={`Replace slide ${n}`}
            title="Replace this image"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onReplace}
            className="px-0.5 text-[11px] leading-none text-app-faint hover:text-app-ink"
          >
            ⟳
          </button>
          <button
            type="button"
            data-testid="hero-slide-remove"
            aria-label={`Remove slide ${n}`}
            title="Remove this image"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onRemove}
            className="px-0.5 text-[11px] leading-none text-app-faint hover:text-app-danger"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export function HeroSlidesTray({
  sectionId, slides, onApplyPatch, onRequestReplace, onRequestAdd,
  allowAdd = true, allowPreview = true,
}: HeroSlidesTrayProps) {
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  // Mirrored in a ref so the unmount cleanup (dep `[sectionId]`, so its closure
  // never re-forms) can read the CURRENT preview instead of the mount-time value.
  const previewIdRef = React.useRef<string | null>(null);
  const setPreview = React.useCallback((next: string | null) => {
    previewIdRef.current = next;
    setPreviewId(next);
  }, []);

  // Same sensor set as `EditableImageCollection` (the repo's one dnd-kit
  // precedent): a 6px activation distance so a click still reads as a click, plus
  // the keyboard sensor so reordering is not mouse-only.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = React.useMemo(() => slides.map((s) => s.id), [slides]);

  // Release the canvas preview when the tray goes away (panel closed, demoted back
  // to a single image, section deselected) — otherwise autoplay would stay paused
  // on a slide the user can no longer see a control for.
  //
  // ONLY when something was actually previewing. The release event clears the SAME
  // `paused` flag the hero's `focusin` sets while the user types, so an
  // unconditional dispatch on every unmount restarted the slideshow mid-edit
  // (caret in hero copy → open this panel → Escape → slides rotate). Nothing
  // previewed = nothing to release.
  React.useEffect(() => {
    return () => {
      if (previewIdRef.current === null) return;
      previewIdRef.current = null;
      dispatchHeroSlidePreview(sectionId, null);
    };
  }, [sectionId]);

  // The canvas slider re-runs its effect (→ `go(0)` + autoplay restart) whenever the
  // slide id set/order changes, which silently drops its preview state. Clear the
  // tray highlight on the same signal so the card marked `data-previewing` can't
  // disagree with what the page is showing.
  const idsKey = ids.join('|');
  React.useEffect(() => {
    previewIdRef.current = null;
    setPreviewId(null);
  }, [idsKey]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    // ONE write per drop, carrying the FULL new order. `reorderSlides` IS the
    // precedent's `arrayMove` (the same splice move) with the invariant + cap
    // enforced inside it — D8 is explicit that phase 4 reuses the phase-3 helpers
    // rather than reimplementing the mutation here.
    onApplyPatch('Reordered hero slides', reorderSlides(slides, from, to));
  };

  const handleRemove = (slideId: string) => {
    // NO confirm dialog (founder ruling). `removeSlide` auto-demotes at 2 — the
    // survivor becomes `portrait_image` and the `slides` key is deleted — so the
    // "never exactly 1" invariant cannot be broken from here.
    if (previewId === slideId) {
      setPreview(null);
      dispatchHeroSlidePreview(sectionId, null);
    }
    onApplyPatch('Removed a hero slide', removeSlide(slides, slideId));
  };

  const handlePreview = (slideId: string) => {
    const next = previewId === slideId ? null : slideId;
    setPreview(next);
    dispatchHeroSlidePreview(sectionId, next);
  };

  const atCap = slides.length >= MAX_HERO_SLIDES;

  return (
    <div data-testid="hero-slides-tray" className="mt-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <div role="list" aria-label="Hero slides" className="flex gap-1.5 overflow-x-auto pb-1">
            {slides.map((slide, i) => (
              <SlideCard
                key={slide.id}
                id={slide.id}
                index={i}
                image={slide.image}
                previewing={previewId === slide.id}
                canPreview={allowPreview}
                onPreview={() => handlePreview(slide.id)}
                onReplace={() => onRequestReplace(slide.id)}
                onRemove={() => handleRemove(slide.id)}
              />
            ))}

            {/* Trailing "+" card = the add affordance in slideshow state. HIDDEN at
                the cap and replaced by a notice (SocialItemsEditor precedent) —
                before phase 4 the 7th pick was a silent no-op in the helper. */}
            {!atCap && (
              <button
                type="button"
                data-testid="hero-slide-add"
                aria-label="Add a slide"
                aria-disabled={allowAdd ? undefined : true}
                title={allowAdd ? 'Add another image' : NOT_SLIDER_WHY}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { if (allowAdd) onRequestAdd(); }}
                className={[
                  'h-[68px] w-[68px] flex-none rounded-app-ctl border border-dashed',
                  allowAdd
                    ? 'border-app-border-strong text-app-muted transition-colors hover:border-app-border-soft hover:text-app-body'
                    : 'cursor-not-allowed border-app-border text-app-faint opacity-60',
                ].join(' ')}
              >
                +
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {atCap && (
        <p data-testid="hero-slides-cap-notice" className="mt-1 text-[11px] leading-snug text-app-muted">
          Maximum {MAX_HERO_SLIDES} images. Remove one to add another.
        </p>
      )}

      {!allowPreview && (
        <p data-testid="hero-slides-not-slider-notice" className="mt-1 text-[11px] leading-snug text-app-muted">
          This hero layout shows one image, so these extra images aren’t playing right now.
          Switch the hero to the slider layout to use them.
        </p>
      )}

      <p className="mt-1 text-[11px] leading-snug text-app-muted">
        Drag to reorder — left to right is the order they play.
        {allowPreview ? ' Click one to see it on the page.' : ''} Removing is instant; Undo puts it back.
      </p>
    </div>
  );
}

export default HeroSlidesTray;
