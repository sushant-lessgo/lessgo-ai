"use client";

// Service template + variant + palette picker for the editor (Phase 11b).
// Rendered only for audienceType==='service' (product keeps ThemePopover).
//
// scale-07 phase 7: the template switcher list is FIT-FILTERED via the shared
// TemplateSwapList — a target appears only if it can render every section this
// site currently has, on the same copy engine (was: all service templateIds).
// The swap mechanism (preload → templateId + incoming defaults, content
// untouched) is the same one this popover always had, now extracted there.
//
// FIREWALL: editor code must not static-import a template module. The active
// template module is read via getLoadedTemplate() (the renderer already
// preloaded it); switching preloads the target via the registry's dynamic
// loader. Palette swatch colors are sourced from the already-injected
// `[data-palette="x"]{--accent}` CSS vars — a dot with data-palette={id} resolves
// to that palette's accent without importing the template's config.

import React, { useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import {
  palettesForTemplate,
  type TemplateId,
} from '@/types/service';
import type { TemplateModule } from '@/types/template';
import { getLoadedTemplate } from '@/modules/templates/registry';
import {
  TemplateSwapList,
  deriveSwapSite,
  buildSwapPatch,
} from './TemplateSwapList';

export function ServiceThemePopover() {
  const {
    audienceType,
    templateId,
    variantId,
    paletteId,
    sections,
    pages,
    updateMeta,
    triggerAutoSave,
  } = useEditStore();

  const posthog = usePostHog();
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);

  // Only service projects get this panel.
  if (audienceType !== 'service') return null;

  const tid = (templateId || 'hearth') as TemplateId;
  const tmpl = getLoadedTemplate(tid) ?? null;
  const palettes = palettesForTemplate(tid);
  const variants = tmpl?.variants ?? [];
  const activePalette = paletteId || tmpl?.defaultPaletteId || palettes[0];
  const activeVariant = variantId || tmpl?.defaultVariantId || variants[0]?.id;

  // Reuse the existing autosave path (PO call: no explicit save).
  const persist = () => {
    void triggerAutoSave();
  };

  const handlePalette = (id: string) => {
    if (id === activePalette) return;
    updateMeta({ paletteId: id });
    persist();
  };

  const handleVariant = (id: string) => {
    if (id === activeVariant) return;
    updateMeta({ variantId: id });
    posthog?.register({ variantId: id });
    posthog?.capture('variant_changed', { audienceType: 'service', templateId: tid, variantId: id });
    persist();
  };

  // Commit a swap prepared by TemplateSwapList (target already preloaded).
  // Reset BOTH variant + palette to the new template's defaults (cross-
  // template ids don't overlap — PO gap); content untouched (buildSwapPatch).
  const handleSwap = (target: TemplateId, m: TemplateModule) => {
    const patch = buildSwapPatch(target, m);
    updateMeta(patch);
    posthog?.register({ templateId: target, variantId: patch.variantId });
    posthog?.capture('template_changed', {
      audienceType: 'service',
      from: tid,
      to: target,
      variantId: patch.variantId,
      paletteId: patch.paletteId,
    });
    persist();
    force((n) => n + 1);
  };

  const triggerSwatch = activePalette;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
          title="Template, variant & palette"
        >
          <span
            data-palette={triggerSwatch}
            className="w-4 h-4 rounded-sm"
            style={{ background: 'var(--accent, #c2683f)' }}
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

          {/* ─── Variant ─── */}
          {variants.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Layout variant</p>
              <div className="grid grid-cols-3 gap-1.5">
                {variants.map((v) => {
                  const isActive = activeVariant === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleVariant(v.id)}
                      aria-pressed={isActive}
                      title={v.blurb}
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
            <div className="grid grid-cols-9 gap-1.5">
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
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ServiceThemePopover;
