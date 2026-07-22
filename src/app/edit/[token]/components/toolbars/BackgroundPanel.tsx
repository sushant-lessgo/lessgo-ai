// app/edit/[token]/components/toolbars/BackgroundPanel.tsx
//
// section-background phase 2 (slice 1b) — the Background control's dropdown.
//
// v1 = the COLOR row only. Image / Video tabs land in phase 3 with `bgMode`; this
// file must NEVER write `bgMode` (plan D1: nothing consumes it before phase 3, so
// persisting it earlier is dead data in every user's draft).
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

import React, { useEffect, useRef } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import type { StyleTokens, UBackground } from '@/modules/skeletons/styleTokens';

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

// Labels are the spec's generic v1 vocabulary ("Paper / Subtle / Ink / Accent") —
// per-template naming + real swatches are a designer round-trip that deliberately
// does not block this build.
const COLOR_CHIPS: ColorChip[] = [
  {
    value: 'default',
    label: 'Auto',
    testid: 'auto',
    // Half-and-half so "Auto" never looks like a colour of its own.
    swatch: 'linear-gradient(135deg, #ffffff 0 50%, #d4d4d8 50% 100%)',
    title: 'Use the template’s own choice for this section',
  },
  { value: 'paper', label: 'Paper', testid: 'paper', swatch: 'var(--wk-paper, #faf9f7)', title: 'Light page surface' },
  { value: 'paper-2', label: 'Subtle', testid: 'paper-2', swatch: 'var(--wk-paper-2, #f1efea)', title: 'A slightly tinted band' },
  { value: 'dark', label: 'Ink', testid: 'dark', swatch: 'var(--wk-dark, #16151a)', title: 'Dark band with light text' },
];

// Greyed-placeholder rule (founder ruling 9 / orchestrator R3): ship it disabled
// with a WHY, never silently omit it. "Audit accent bands vs drop the chip" is an
// explicit ASK at the slice-1 founder gate.
const ACCENT_WHY =
  'Accent bands need a contrast pass first — accent-coloured buttons and marks inside a section would vanish on an accent background.';

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

  // Click-outside → close (TextToolbarMVP.tsx:449-470 precedent). The Background
  // BUTTON is excluded on purpose: it toggles, and closing on its mousedown would
  // make the subsequent click re-open the panel (a button that never closes).
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (target.closest?.('[data-action="background"]')) return;
      onClose();
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [onClose]);

  const active: UBackground = current ?? 'default';

  return (
    <div
      ref={panelRef}
      data-testid="section-bg-panel"
      role="group"
      aria-label="Section background"
      className="absolute top-full left-0 z-50 mt-1 w-56 rounded-md border border-gray-200 bg-white p-3 shadow-lg font-app-sans"
      // The panel lives inside a click-to-select canvas; keep its own clicks from
      // reaching the section/selection handlers behind the toolbar.
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        Color
      </div>

      <div className="flex flex-wrap gap-1.5">
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

        {/* Accent — greyed placeholder + why-tooltip (R3). Inert on force-click. */}
        <button
          type="button"
          data-testid="section-bg-chip-accent-disabled"
          aria-disabled="true"
          title={ACCENT_WHY}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-400"
        >
          <span
            aria-hidden
            className="h-3.5 w-3.5 flex-none rounded-[3px] border border-black/15 opacity-50"
            style={{ background: 'var(--wk-accent, #b45309)' }}
          />
          <span>Accent</span>
        </button>
      </div>

      <p className="mt-2.5 text-[11px] leading-snug text-gray-500">
        These are your template’s own surfaces, so the text stays readable whichever you pick.
      </p>
    </div>
  );
}
