"use client";

// Product template picker for the editor. Originally the vestria-only variant +
// palette + mood picker (onboarding2 Phase 6); scale-07 phase 7 generalizes it
// to EVERY product template-module project (meridian UNLOCKED — the static
// "locked for the pilot" EditHeader label is gone) and adds a fit-filtered
// template switcher (TemplateSwapList): a swap target appears ONLY if it can
// render every section this site currently has, on the same copy engine. A
// swap changes templateId + the incoming template's DEFAULT variant/palette —
// content is never touched.
//
// FIREWALL: editor code must not static-import a template module. Variant defs
// are read via getLoadedTemplate(templateId) (the renderer already preloaded
// the active template); palette ids come from the type-level lists
// (palettesForTemplate). Swatch colors resolve from the already-injected
// `[data-palette="x"]{--accent}` CSS vars — no palette-config import.
// TemplateSwapList preloads the target via the registry's dynamic loader.
//
// Persistence: variant/palette via updateMeta({variantId|paletteId}) (Project
// columns); mood (vestria-only) via updateMeta({themeValues:{...,mood}})
// (Project.themeValues — permissive record, no schema change). All autosave
// through the store's save() path.

import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePostHog } from 'posthog-js/react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useEditStore } from '@/hooks/useEditStore';
import {
  usesTemplateModule,
  palettesForTemplate,
  defaultVariantForTemplate,
  type TemplateId,
} from '@/types/service';
import type { TemplateModule } from '@/types/template';
import { getLoadedTemplate } from '@/modules/templates/registry';
import {
  TemplateSwapList,
  deriveSwapSite,
  buildSwapPatch,
} from './TemplateSwapList';

const MOODS: Array<{ id: 'bone' | 'slate'; label: string; swatch: string }> = [
  { id: 'bone', label: 'Bone', swatch: '#f7f4ee' },
  { id: 'slate', label: 'Slate', swatch: '#3d4450' },
];

// Fallback variant defs if the vestria module somehow isn't cached yet (labels
// only — ids must match vestriaVariantDefs in modules/templates/vestria/tokens.ts).
// Other templates fall back to an empty list (section hides until loaded).
const VESTRIA_FALLBACK_VARIANTS = [
  { id: 'tailored', label: 'Tailored' },
  { id: 'modern', label: 'Modern' },
  { id: 'heritage', label: 'Heritage' },
];

export function VestriaThemePopover() {
  // Render-read: audienceType/templateId/variantId/paletteId/themeValues + sections/pages
  // (fit-filter list). updateMeta + triggerAutoSave are stable action refs used in handlers.
  const {
    audienceType,
    templateId,
    variantId,
    paletteId,
    themeValues,
    sections,
    pages,
    updateMeta,
    triggerAutoSave,
  } = useEditStore(
    useShallow((s) => ({
      audienceType: s.audienceType,
      templateId: s.templateId,
      variantId: s.variantId,
      paletteId: s.paletteId,
      themeValues: s.themeValues,
      sections: s.sections,
      pages: s.pages,
      updateMeta: s.updateMeta,
      triggerAutoSave: s.triggerAutoSave,
    }))
  );

  const posthog = usePostHog();
  const [open, setOpen] = useState(false);

  // Only product template-module projects get this panel (meridian/vestria;
  // techpremium is retired — it still gets variant/palette, swap list is empty).
  if (audienceType !== 'product' || !usesTemplateModule(audienceType, templateId)) {
    return null;
  }

  const tid = templateId as TemplateId;
  const tmpl = getLoadedTemplate(tid) ?? null;
  const variants = tmpl?.variants?.length
    ? tmpl.variants
    : tid === 'vestria'
      ? VESTRIA_FALLBACK_VARIANTS
      : [];
  const palettes = palettesForTemplate(tid);
  const activeVariant = variantId || tmpl?.defaultVariantId || defaultVariantForTemplate[tid];
  const activePalette = paletteId || tmpl?.defaultPaletteId || palettes[0];
  const tv = (themeValues as Record<string, any> | null) ?? null;
  const activeMood: 'bone' | 'slate' = tv?.mood === 'slate' ? 'slate' : 'bone';
  const isVestria = tid === 'vestria';

  // Reuse the existing autosave path (matches ServiceThemePopover).
  const persist = () => {
    void triggerAutoSave();
  };

  const handleVariant = (id: string) => {
    if (id === activeVariant) return;
    updateMeta({ variantId: id });
    posthog?.register({ variantId: id });
    posthog?.capture('variant_changed', { audienceType: 'product', templateId: tid, variantId: id });
    persist();
  };

  const handlePalette = (id: string) => {
    if (id === activePalette) return;
    updateMeta({ paletteId: id });
    posthog?.capture('palette_changed', { audienceType: 'product', templateId: tid, paletteId: id });
    persist();
  };

  const handleMood = (id: 'bone' | 'slate') => {
    if (id === activeMood) return;
    // Merge, don't replace — themeValues is a permissive record.
    updateMeta({ themeValues: { ...(tv ?? {}), mood: id } });
    posthog?.capture('mood_changed', { audienceType: 'product', templateId: tid, mood: id });
    persist();
  };

  // Swap = templateId + the NEW template's default variant/palette ONLY —
  // content untouched (zero words change). See buildSwapPatch.
  const handleSwap = (target: TemplateId, m: TemplateModule) => {
    const patch = buildSwapPatch(target, m);
    updateMeta(patch);
    posthog?.register({ templateId: target, variantId: patch.variantId });
    posthog?.capture('template_changed', {
      audienceType: 'product',
      from: tid,
      to: target,
      variantId: patch.variantId,
      paletteId: patch.paletteId,
    });
    persist();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
          title="Template, variant & palette"
        >
          <span
            data-palette={activePalette}
            className="w-4 h-4 rounded-sm"
            style={{ background: 'var(--accent, #4a5fc1)' }}
          />
          <span>Style</span>
        </button>
      </PopoverTrigger>

      <PopoverContent side="bottom" align="start" className="w-80 p-0">
        <div className="p-4 space-y-4">
          {/* ─── Template (fit-filtered swap — hides when no eligible target) ─── */}
          <TemplateSwapList
            current={tid}
            site={deriveSwapSite(sections, pages)}
            onSwap={handleSwap}
          />

          {/* ─── Typeface variant ─── */}
          {variants.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Typeface</p>
              <div className="grid grid-cols-3 gap-1.5">
                {variants.map((v) => {
                  const isActive = activeVariant === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleVariant(v.id)}
                      aria-pressed={isActive}
                      title={(v as any).blurb}
                      className={`rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                        isActive
                          ? 'border-blue-500 ring-2 ring-blue-200 text-gray-900'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Palette ─── */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Palette</p>
            <div className={`grid gap-1.5 ${palettes.length > 8 ? 'grid-cols-9' : 'grid-cols-8'}`}>
              {palettes.map((id) => {
                const isActive = activePalette === id;
                return (
                  <button
                    key={id}
                    onClick={() => handlePalette(id)}
                    aria-pressed={isActive}
                    title={id}
                    className={`aspect-square rounded-md border-2 transition-all ${
                      isActive
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {/* Swatch color from the injected [data-palette]{--accent} var. */}
                    <span
                      data-palette={id}
                      className="block w-full h-full rounded-sm"
                      style={{ background: 'var(--accent, #ccc)' }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Mood (vestria-only: themeValues.mood → VestriaThemeInjector) ─── */}
          {isVestria && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Mood</p>
              <div className="grid grid-cols-2 gap-1.5">
                {MOODS.map((m) => {
                  const isActive = activeMood === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleMood(m.id)}
                      aria-pressed={isActive}
                      className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                        isActive
                          ? 'border-blue-500 ring-2 ring-blue-200 text-gray-900'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <span
                        aria-hidden
                        className="w-3.5 h-3.5 rounded-full border border-gray-300"
                        style={{ background: m.swatch }}
                      />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default VestriaThemePopover;
