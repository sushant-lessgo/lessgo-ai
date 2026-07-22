// app/edit/[token]/components/toolbars/BackgroundPanel.tsx
//
// section-background — the Background control's dropdown.
//
// phase 2 (slice 1b) shipped the COLOR row. phase 3 (slice 2) adds the HERO's
// Color | Image | Video(greyed) tabs plus the `bgMode` lever. Non-hero sections
// still see the colour row alone (spec §A: "every other section gets Color only"),
// and `bgMode` is written ONLY from the hero tabs. phase 4 (slice 3) grows the
// Image tab's ≥2 state into the docked filmstrip (`HeroSlidesTray`) — the same
// panel, not a second surface — and makes this component the single place a
// `HeroSlidesPatch` turns into an elements write (`applyPatch`).
//
// ANATOMY: an `absolute top-full left-0` sibling of the Background ToolbarButton,
// rendered INSIDE the shell's chrome box. That box is deliberately `relative` with
// NO `overflow-hidden` (ToolbarShell.tsx:248) precisely so toolbar-docked panels
// like this one anchor and are not clipped. Same shape as TextToolbarMVP's
// font-size / colour pickers.
//
// WHY CHIPS AND NOT A PICKER (spec Scope OUT, designer ruling): the chips ARE the
// template's own surfaces. A raw hex picker is "the Wix move" — and, more
// concretely, every surface here ships a complete, contrast-checked band
// (background + foreground + the polarity-bound skin tokens the block children
// read — see `BACKGROUND_CSS` in styleTokens.ts), so no choice a user can make
// here produces an unreadable pairing. Fewer chips is what buys that guarantee.

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore } from '@/hooks/useEditStore';
import type { StyleTokens, UBackground, UBgMode } from '@/modules/skeletons/styleTokens';
import { extractSectionType } from '@/modules/generatedLanding/componentRegistry';
import { useTemplateModule } from '@/modules/templates/useTemplateReady';
// The slides invariant lives in ONE pure module (plan D8) — the panel never
// hand-rolls a slides mutation, so "never exactly 1" cannot be violated from here.
import {
  normalizeSlides,
  promoteToSlides,
  replaceSlide,
  type HeroSlidesPatch,
} from '@/modules/skeletons/work/heroSlides';
import { HeroSlidesTray } from './HeroSlidesTray';
// `'use client'` modal — edit side ONLY. It is imported here and NOWHERE near a
// `.published.tsx` / core path (the `editPrimitives.tsx:213-215` guard discipline).
import { MediaPickerModal } from '../ui/MediaPickerModal';

interface ColorChip {
  value: UBackground;
  label: string;
  /** kebab `data-testid` suffix (`paper-2` would otherwise read oddly). */
  testid: string;
  /** Swatch fill. The skeleton's `--wk-*` tokens are declared on `:root` by the
   *  template's ThemeInjector, so they resolve here too; the literal is the
   *  fallback for the moment before/without injection. */
  swatch: string;
  title: string;
}

// Labels are the spec's generic v1 vocabulary ("Paper / Subtle / Ink") —
// per-template naming + real swatches are a designer round-trip that deliberately
// does not block this build.
//
// ACCENT (founder ruling G2, slice-1 gate): there is NO Accent chip — not even a
// greyed one. The ruling supersedes the greyed-placeholder default (R3). This is a
// UI-ONLY removal: `accent` is still a valid `UBackground`/`WorkSurface`, still
// painted by `BACKGROUND_CSS` + `[data-surface="accent"]`, so any stored value keeps
// working. Accent bands (and the contrast pass they need) are a later spec.
const COLOR_CHIPS: ColorChip[] = [
  { value: 'paper', label: 'Paper', testid: 'paper', swatch: 'var(--wk-paper, #faf9f7)', title: 'Light page surface' },
  { value: 'paper-2', label: 'Subtle', testid: 'paper-2', swatch: 'var(--wk-paper-2, #f1efea)', title: 'A slightly tinted band' },
  { value: 'dark', label: 'Ink', testid: 'dark', swatch: 'var(--wk-dark, #16151a)', title: 'Dark band with light text' },
];

/** Chip vocabulary → the surface names the skin actually returns. Used to say what
 *  Auto resolves to right now (founder ruling G1). Unknown values render verbatim. */
const SURFACE_LABELS: Record<string, string> = {
  'paper': 'Paper',
  'paper-2': 'Subtle',
  'dark': 'Ink',
  'accent': 'Accent',
};

// ── Hero variant capabilities (plan D7's per-variant matrix) ─────────────────
// Keyed by the LOWERCASED stored layout name (`resolveWorkBlock` lowercases before
// lookup). `workherocenter` renders NO `portrait_image` at all
// (`WorkHeroCenter.core.tsx:7-9`; `WORK_HERO_CENTER_STYLES` has no `__media`), so
// Image is greyed there and `bgMode` is never written for it — it is a no-op.
// `workheroslider` is the ONLY variant that renders a slide SET, so Add-more /
// slideshow is slider-only; image + split get single-image replace.
const HERO_RENDERS_IMAGE = new Set(['workheroslider', 'workheroimage', 'workherosplit']);
const HERO_SLIDER_LAYOUT = 'workheroslider';

/** Greyed-placeholder "why" strings (founder ruling 9 — never a dead control with
 *  no explanation). */
const VIDEO_WHY = 'Video backgrounds aren’t built yet — this hero can’t play one.';
const IMAGE_WHY_CENTER = 'This hero layout doesn’t display a background image.';

interface BackgroundPanelProps {
  sectionId: string;
  onClose: () => void;
}

export function BackgroundPanel({ sectionId, onClose }: BackgroundPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // SCALAR selector (plan D4): one string, so the panel re-renders only when THIS
  // section's background changes — never on unrelated styleTokens churn.
  const current = useEditStore(
    (s) =>
      ((s.themeValues as Record<string, any> | null)?.styleTokens as StyleTokens | undefined)?.[
        sectionId
      ]?.background,
  );
  // The ONE writer of `themeValues.styleTokens` (D3) — it owns the deep merge, so
  // sibling themeValues keys and other sections' tokens survive the write.
  const setSectionStyleTokens = useEditStore((s) => s.setSectionStyleTokens);

  // ── What does "Auto" mean HERE? (founder ruling G1) ──────────────────────────
  // Auto = "no override; the skin decides", so the honest answer is the skin's own
  // TYPE-keyed default — exactly what EditablePageRenderer feeds `resolveSectionSurface`
  // as its fallback. Read it from the SAME source (`tmpl.getSurfaceForSection`) so the
  // hint can never drift from what the canvas paints. The template module is already
  // loaded by the renderer, so this hook resolves from cache with no extra fetch.
  const { audienceType, templateId } = useEditStore(
    useShallow((s) => ({ audienceType: s.audienceType, templateId: s.templateId })),
  );
  const { tmpl } = useTemplateModule(audienceType, templateId);
  const autoSurface = tmpl?.getSurfaceForSection(extractSectionType(sectionId));
  const autoLabel = autoSurface ? SURFACE_LABELS[autoSurface] ?? autoSurface : null;

  // (The click-outside effect used to live here. It MOVED below the `picking`
  // state it now has to read — see "PORTAL TRAP" there.)

  // (The phase-2-polish `getComputedStyle` accent resolution lived here. It existed
  // ONLY to fill the greyed Accent chip's swatch; ruling G2 dropped that chip, so it
  // went with it. The live chips read `--wk-paper`/`--wk-paper-2`/`--wk-dark`, which
  // are declared on `:root` and resolve inside the toolbar chrome without help.)

  const active: UBackground = current ?? 'default';

  // ── phase 3: hero tabs ──────────────────────────────────────────────────────
  const isHero = extractSectionType(sectionId) === 'hero';
  const heroLayout = useEditStore((s) => s.sectionLayouts?.[sectionId]);
  const layoutKey = String(heroLayout || '').toLowerCase();
  const rendersImage = isHero && HERO_RENDERS_IMAGE.has(layoutKey);
  const isSlider = isHero && layoutKey === HERO_SLIDER_LAYOUT;

  const storedBgMode = useEditStore(
    (s) =>
      ((s.themeValues as Record<string, any> | null)?.styleTokens as StyleTokens | undefined)?.[
        sectionId
      ]?.bgMode,
  );
  // ABSENT → derive from data, which for a hero variant that renders media IS image
  // mode (that is what the canvas is showing). Never write on that derivation —
  // storing it eagerly would be dead data in every draft (D1).
  //
  // `rendersImage` GATES the stored value, it does not just supply the default.
  // Hero variants are user-swappable (`manifest.ts`), so this is reachable:
  // slider → click Image (persists `bgMode:'image'`) → swap to "Centered type",
  // which renders no media. Honouring the stored `'image'` there would hide the
  // colour chips AND gate off the image block (`isHero && rendersImage && …`),
  // leaving three tabs with an EMPTY body. On a variant that cannot show media,
  // Color is the only truthful tab.
  const tab: UBgMode = rendersImage ? storedBgMode ?? 'image' : 'color';

  // This hero's element slice (narrow selector) + the read-side coercion, so the
  // panel always agrees with what the canvas renders (D8).
  const heroElements = useEditStore((s) => s.content?.[sectionId]?.elements) as
    | Record<string, any>
    | undefined;
  const norm = useMemo(() => normalizeSlides(heroElements as any), [heroElements]);

  const setSection = useEditStore((s) => s.setSection);
  const executeUndoableAction = useEditStore((s) => s.executeUndoableAction);
  const tokenId = useEditStore((s) => s.tokenId);

  // Which picker is open: the single-image slot, the "add another" slot, or one
  // tray card's replace (phase 4 — hence the object shape, it carries the target).
  const [picking, setPicking] = useState<
    null | { mode: 'single' } | { mode: 'add' } | { mode: 'replace'; slideId: string }
  >(null);

  // ── `picking` SILENT-UNMOUNT RESET (phase-3 review carry-forward). ──────────
  // `MediaPickerModal` is mounted inside `{isHero && rendersImage && tab ===
  // 'image' && …}`. If any of those flip while a picker is open — the user swaps
  // the hero variant to "Centered type", or clicks Color — the modal unmounts
  // WITHOUT `onOpenChange` ever firing, so `picking` would stay set forever and
  // the click-outside guard above (`if (picking !== null) return`) would leave the
  // panel permanently undismissable. Unreachable in phase 3 (nothing could flip
  // those while the modal held focus); phase 4 adds per-card replace, i.e. more
  // entry points, so the reset lands now rather than after the bug.
  const imageTabMounted = isHero && rendersImage && tab === 'image';
  useEffect(() => {
    if (!imageTabMounted) setPicking(null);
  }, [imageTabMounted]);

  // Click-outside → close (TextToolbarMVP.tsx:449-470 precedent). The Background
  // BUTTON is excluded on purpose: it toggles, and closing on its mousedown would
  // make the subsequent click re-open the panel (a button that never closes).
  //
  // ⚠️ PORTAL TRAP (the bug this guard exists for). `MediaPickerModal` is a Radix
  // Dialog: its content is PORTALED to `document.body`, so it is NOT inside
  // `panelRef`, yet a `mousedown` inside it still BUBBLES to this document
  // listener. `DialogContent` stops `click` propagation only, and the asset
  // button's `onMouseDown` preventDefault does not stop propagation either. So
  // without these two guards, pressing an image in the picker called `onClose()`
  // → SectionToolbar unmounted the panel → the modal (a React child of the panel)
  // unmounted with it → the asset button was detached before `mouseup`, and its
  // `onClick` (the actual pick) NEVER FIRED. Choose/Replace/Add were all dead.
  //   guard 1: while a picker is open, outside-mousedown never dismisses.
  //   guard 2: belt-and-braces for anything else portaled into a dialog.
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (picking !== null) return;
      if (target.closest?.('[role="dialog"]')) return;
      if (panelRef.current?.contains(target)) return;
      if (target.closest?.('[data-action="background"]')) return;
      onClose();
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [onClose, picking]);

  /**
   * ONE store write per user gesture, inside ONE `executeUndoableAction`
   * (BlockVariantSelector precedent — `'sectionSwap'` is the only history type
   * whose undo restores the whole content snapshot, so a single undo restores a
   * promote/demote PAIR; no confirm dialog anywhere).
   *
   * `setSection({elements})` — not `updateElementContent` — because it REPLACES the
   * elements object, which is the only way to genuinely DELETE the `slides` key
   * (note N5: writing `slides: []` would be re-stamped by `stampHeroSlides`, whose
   * skip test is `length > 0`). It also pushes no second history entry of its own.
   */
  const writeElements = (label: string, next: Record<string, any>) => {
    executeUndoableAction('sectionSwap', label, () => {
      setSection(sectionId, { elements: next, aiMetadata: { isCustomized: true } } as any);
    });
  };

  /**
   * The ONE place a `HeroSlidesPatch` becomes an elements write (phase 4). The
   * two patch shapes are NOT symmetrical: `'single'` means "set the scalar and
   * DELETE the `slides` key" (note N5 — writing `slides: []` would be re-stamped
   * by `stampHeroSlides`, silently undoing the user's demote).
   */
  const applyPatch = (label: string, patch: HeroSlidesPatch) => {
    const next: Record<string, any> = { ...(heroElements || {}) };
    if (patch.kind === 'slides') {
      next.slides = patch.slides;
    } else {
      delete next.slides;
      next.portrait_image = patch.portraitImage;
    }
    writeElements(label, next);
  };

  const pickSingle = (url: string) => {
    writeElements('Set hero background image', { ...(heroElements || {}), portrait_image: url });
  };

  const pickAdditional = (url: string) => {
    applyPatch('Added a hero slide', promoteToSlides(heroElements as any, url));
  };

  const setTab = (next: UBgMode) => {
    // Center never gets `bgMode` written AT ALL (D7: it is a no-op there — the
    // variant renders no media, so there is nothing to suppress). Phase 3 only
    // blocked the `'image'` write, which let a Color click persist
    // `bgMode: 'color'` on `workherocenter`: harmless while the user stays there
    // (center ignores the prop) but it turns into a colour hero the moment they
    // swap back to a variant that DOES render media — a mode they never chose.
    if (!rendersImage) return;
    setSectionStyleTokens(sectionId, { bgMode: next });
  };

  return (
    <div
      ref={panelRef}
      data-testid="section-bg-panel"
      role="group"
      aria-label="Section background"
      className={`absolute top-full left-0 z-50 mt-1 ${isHero ? 'w-64' : 'w-56'} rounded-md border border-gray-200 bg-white p-3 shadow-lg font-app-sans`}
      // The panel lives inside a click-to-select canvas; keep its own clicks from
      // reaching the section/selection handlers behind the toolbar.
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── HERO: the three types (spec §A). Every other section is Color-only, so
          it keeps the phase-2 panel exactly as it was — no tab strip at all. */}
      {isHero && (
        <div role="tablist" aria-label="Background type" data-testid="section-bg-tabs" className="mb-2.5 flex gap-1">
          <TypeTab
            testid="color"
            label="Color"
            active={tab === 'color'}
            onSelect={() => setTab('color')}
          />
          <TypeTab
            testid="image"
            label="Image"
            active={tab === 'image' && rendersImage}
            // GREYED with a why (D7): `workherocenter` renders no background image
            // at all, so an Image tab there would be a lie. Same greyed-placeholder
            // pattern as Video.
            disabledWhy={rendersImage ? undefined : IMAGE_WHY_CENTER}
            onSelect={() => setTab('image')}
          />
          <TypeTab
            testid="video"
            label="Video"
            active={false}
            // `WorkHeroVideo` is a declared-but-NOT-built slot — there is no
            // component behind it. Greyed with a why, never silently omitted.
            disabledWhy={VIDEO_WHY}
            onSelect={() => {}}
          />
        </div>
      )}

      {(!isHero || tab === 'color') && (
      <>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        Color
      </div>

      <div className="flex flex-wrap gap-1.5">
        {/* AUTO — a MODE, not a colour (ruling G1). It is rendered on its own rather
            than as a COLOR_CHIPS row entry because its swatch is deliberately NOT a
            fill: a dashed ring around an "A" glyph, so it can never be mistaken for
            Paper the way a solid swatch of its resolved value was. */}
        {(() => {
          const isActive = active === 'default';
          return (
            <button
              type="button"
              data-testid="section-bg-chip-auto"
              data-active={isActive ? 'true' : undefined}
              data-auto-surface={autoSurface ?? undefined}
              aria-pressed={isActive}
              title={
                autoLabel
                  ? `Use the template’s own choice for this section (currently ${autoLabel})`
                  : 'Use the template’s own choice for this section'
              }
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setSectionStyleTokens(sectionId, { background: 'default' })}
              className={[
                'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors',
                isActive
                  ? 'border-[#006CFF] bg-blue-50 text-[#006CFF] font-medium'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50',
              ].join(' ')}
            >
              <span
                aria-hidden
                className="flex h-3.5 w-3.5 flex-none items-center justify-center rounded-[3px] border border-dashed border-gray-400 bg-transparent text-[7px] font-bold leading-none text-gray-500"
              >
                A
              </span>
              <span>Auto</span>
            </button>
          );
        })()}

        {COLOR_CHIPS.map((chip) => {
          const isActive = active === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              data-testid={`section-bg-chip-${chip.testid}`}
              data-active={isActive ? 'true' : undefined}
              aria-pressed={isActive}
              title={chip.title}
              // Keep any active contenteditable selection alive (the shared
              // ToolbarButton convention — these are plain buttons, so they need
              // their own preventDefault).
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setSectionStyleTokens(sectionId, { background: chip.value })}
              className={[
                'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors',
                isActive
                  ? 'border-[#006CFF] bg-blue-50 text-[#006CFF] font-medium'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50',
              ].join(' ')}
            >
              <span
                aria-hidden
                className="h-3.5 w-3.5 flex-none rounded-[3px] border border-black/15"
                style={{ background: chip.swatch }}
              />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Ruling G1's second half: say WHICH surface Auto lands on here, visibly —
          a tooltip alone would not tell the user what Auto means before hovering. */}
      {autoLabel && (
        <p
          data-testid="section-bg-auto-hint"
          className="mt-2 text-[11px] leading-snug text-gray-500"
        >
          Auto here = <span className="font-medium text-gray-700">{autoLabel}</span>, your
          template’s choice for this section.
        </p>
      )}

      <p className="mt-2.5 text-[11px] leading-snug text-gray-500">
        These are your template’s own surfaces, so the text stays readable whichever you pick.
      </p>
      </>
      )}

      {/* ── IMAGE tab (hero only, and only on variants that render media). ────────
          Switching tabs writes `bgMode` and NOTHING else — images are never
          cleared, so Color ↔ Image is lossless in both directions (spec §C). */}
      {isHero && rendersImage && tab === 'image' && (
        <div data-testid="section-bg-image-tab">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Image
          </div>

          {norm.isSlideshow ? (
            <>
              <p data-testid="section-bg-slides-count" className="mb-2 text-[11px] leading-snug text-gray-600">
                <span className="font-medium text-gray-800">{norm.slides.length} images</span> — your
                hero plays them as a slideshow.
              </p>
              {/* STATE B (spec §B): the same panel, GROWN into the filmstrip — not a
                  modal, not a separate surface. It owns add/replace/remove/reorder
                  from here on, which is why the single-image Add slot below is
                  rendered only in state A (one add control, never two). */}
              <HeroSlidesTray
                sectionId={sectionId}
                slides={norm.slides}
                onApplyPatch={applyPatch}
                onRequestReplace={(slideId) => setPicking({ mode: 'replace', slideId })}
                onRequestAdd={() => setPicking({ mode: 'add' })}
                // R6: slideshow is SLIDER-layout only. A hero can still be carrying
                // ≥2 slides on another variant (they are stamped regardless of
                // layout, and swapping layouts keeps them), and there add/preview do
                // nothing visible — the canvas preview listener only exists in
                // `WorkHeroSlider`. Inert-with-a-why beats a dead click.
                allowAdd={isSlider}
                allowPreview={isSlider}
              />
            </>
          ) : (
            <button
              type="button"
              data-testid="section-bg-replace-image"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setPicking({ mode: 'single' })}
              className="flex w-full items-center gap-2 rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50"
            >
              <span
                aria-hidden
                className="h-6 w-6 flex-none rounded-[3px] border border-black/10 bg-gray-100 bg-cover bg-center"
                style={norm.image ? { backgroundImage: `url(${norm.image})` } : undefined}
              />
              <span>{norm.image ? 'Replace image' : 'Choose image'}</span>
            </button>
          )}

          {/* ALWAYS-VISIBLE add slot, slider layout only (R6 + the standing
              discoverability rule: a control that only appears later is a capability
              the user never learns they have). Slideshow is EMERGENT from count —
              there is no "make a slideshow" mode to pick.
              STATE A ONLY: once there are ≥2 images the tray's trailing "+" card is
              the add control (and it is what hides at the cap), so rendering this
              one too would be two buttons doing one job. */}
          {isSlider && !norm.isSlideshow && (
            <>
              <button
                type="button"
                data-testid="section-bg-add-image"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setPicking({ mode: 'add' })}
                className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 px-2 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50"
              >
                + Add image
              </button>
              <p className="mt-1.5 text-[11px] leading-snug text-gray-500">
                Add more to make a slideshow.
              </p>
            </>
          )}

          {/* The `'use client'` picker. Radix renders NOTHING while closed, so this
              costs no DOM; it is mounted here (edit-only chrome) and is unreachable
              from any published path. */}
          <MediaPickerModal
            open={picking !== null}
            onOpenChange={(open) => setPicking(open ? picking : null)}
            tokenId={tokenId}
            initialTab="library"
            onPick={(url) => {
              if (picking?.mode === 'add') pickAdditional(url);
              else if (picking?.mode === 'replace') {
                applyPatch('Replaced a hero slide', replaceSlide(norm.slides, picking.slideId, url));
              } else pickSingle(url);
              setPicking(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

/** One of the hero's three background TYPES. Greyed types keep their reason as a
 *  `title` + `aria-disabled` and are inert (founder ruling 9 — no dead control
 *  without a why, and never silently omitted). */
function TypeTab({
  testid, label, active, disabledWhy, onSelect,
}: {
  testid: string;
  label: string;
  active: boolean;
  disabledWhy?: string;
  onSelect: () => void;
}) {
  const disabled = Boolean(disabledWhy);
  return (
    <button
      type="button"
      role="tab"
      data-testid={`section-bg-tab-${testid}`}
      aria-selected={active}
      aria-disabled={disabled || undefined}
      title={disabledWhy}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => { if (!disabled) onSelect(); }}
      className={[
        'flex-1 rounded-md border px-2 py-1 text-xs transition-colors',
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
          : active
          ? 'border-[#006CFF] bg-blue-50 text-[#006CFF] font-medium'
          : 'border-gray-200 text-gray-700 hover:bg-gray-50',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
