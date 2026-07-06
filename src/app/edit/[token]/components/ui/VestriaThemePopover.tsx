"use client";

// Vestria variant + palette + mood picker for the editor (onboarding2 Phase 6).
// Clone of ServiceThemePopover minus the template switcher: vestria projects
// keep their template, but variant (typeface pairing), accent palette and
// neutral mood are user-editable. Rendered by EditHeader only for
// product+vestria (meridian/techpremium keep the LOCKED label).
//
// FIREWALL: editor code must not static-import a template module. Variant defs
// are read via getLoadedTemplate('vestria') (the renderer already preloaded
// it); palette ids come from the type-level list in @/types/product. Swatch
// colors resolve from the already-injected `[data-palette="x"]{--accent}` CSS
// vars — no palette-config import.
//
// Persistence: variant/palette via updateMeta({variantId|paletteId}) (Project
// columns); mood via updateMeta({themeValues:{...,mood}}) (Project.themeValues
// — permissive record, no schema change). All three autosave through the
// store's save() path and live-update via VestriaThemeInjector reacting to
// store meta.

import React, { useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { vestriaPalettes } from '@/types/product';
import { getLoadedTemplate } from '@/modules/templates/registry';

const MOODS: Array<{ id: 'bone' | 'slate'; label: string; swatch: string }> = [
  { id: 'bone', label: 'Bone', swatch: '#f7f4ee' },
  { id: 'slate', label: 'Slate', swatch: '#3d4450' },
];

// Fallback variant defs if the module somehow isn't cached yet (labels only —
// ids must match vestriaVariantDefs in modules/templates/vestria/tokens.ts).
const FALLBACK_VARIANTS = [
  { id: 'tailored', label: 'Tailored' },
  { id: 'modern', label: 'Modern' },
  { id: 'heritage', label: 'Heritage' },
];

export function VestriaThemePopover() {
  const {
    audienceType,
    templateId,
    variantId,
    paletteId,
    themeValues,
    updateMeta,
    triggerAutoSave,
  } = useEditStore();

  const posthog = usePostHog();
  const [open, setOpen] = useState(false);

  // Only product+vestria projects get this panel.
  if (audienceType !== 'product' || templateId !== 'vestria') return null;

  const tmpl = getLoadedTemplate('vestria' as any) ?? null;
  const variants = tmpl?.variants?.length ? tmpl.variants : FALLBACK_VARIANTS;
  const activeVariant = variantId || tmpl?.defaultVariantId || 'tailored';
  const activePalette = paletteId || tmpl?.defaultPaletteId || 'cobalt';
  const tv = (themeValues as Record<string, any> | null) ?? null;
  const activeMood: 'bone' | 'slate' = tv?.mood === 'slate' ? 'slate' : 'bone';

  // Reuse the existing autosave path (matches ServiceThemePopover).
  const persist = () => {
    void triggerAutoSave();
  };

  const handleVariant = (id: string) => {
    if (id === activeVariant) return;
    updateMeta({ variantId: id });
    posthog?.register({ variantId: id });
    posthog?.capture('variant_changed', { audienceType: 'product', templateId: 'vestria', variantId: id });
    persist();
  };

  const handlePalette = (id: string) => {
    if (id === activePalette) return;
    updateMeta({ paletteId: id });
    posthog?.capture('palette_changed', { audienceType: 'product', templateId: 'vestria', paletteId: id });
    persist();
  };

  const handleMood = (id: 'bone' | 'slate') => {
    if (id === activeMood) return;
    // Merge, don't replace — themeValues is a permissive record.
    updateMeta({ themeValues: { ...(tv ?? {}), mood: id } });
    posthog?.capture('mood_changed', { audienceType: 'product', templateId: 'vestria', mood: id });
    persist();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
          title="Variant, palette & mood"
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
          {/* ─── Typeface variant ─── */}
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

          {/* ─── Palette ─── */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Palette</p>
            <div className="grid grid-cols-8 gap-1.5">
              {vestriaPalettes.map((id) => {
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

          {/* ─── Mood ─── */}
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
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default VestriaThemePopover;
