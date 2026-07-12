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
import { useShallow } from 'zustand/react/shallow';
import { usePostHog } from 'posthog-js/react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useEditStore } from '@/hooks/useEditStore';
import {
  palettesForTemplate,
  type TemplateId,
} from '@/types/service';
import type { TemplateModule } from '@/types/template';
import { getLoadedTemplate } from '@/modules/templates/registry';
// templateMeta is pure List-3 data (type-only imports; no template modules) —
// firewall-safe to read directly. `looks` is the hybrid-look catalog (phase 9).
import { templateMeta } from '@/modules/templates/templateMeta';
import {
  TemplateSwapList,
  deriveSwapSite,
  buildSwapPatch,
} from './TemplateSwapList';

export function ServiceThemePopover() {
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
  const [, force] = useState(0);

  // Only service projects get this panel.
  if (audienceType !== 'service') return null;

  const tid = (templateId || 'hearth') as TemplateId;
  const tmpl = getLoadedTemplate(tid) ?? null;
  const palettes = palettesForTemplate(tid);
  const variants = tmpl?.variants ?? [];
  const activePalette = paletteId || tmpl?.defaultPaletteId || palettes[0];
  const activeVariant = variantId || tmpl?.defaultVariantId || variants[0]?.id;

  // Named looks (phase 9) — only knob-tokenized templates ship them (hearth today).
  // A look bundles knobs + variant + palette; picking one is render-side only
  // (zero copy-regen). The active look id is the hybrid-stored themeValues.lookId.
  const looks = templateMeta[tid]?.looks ?? [];
  const tv = (themeValues as Record<string, any> | null) ?? null;
  const activeLookId = typeof tv?.lookId === 'string' ? tv.lookId : undefined;

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

  // Pick a named look: resolve its bundle → flat variantId/paletteId (back-compat
  // columns) + hybrid themeValues { lookId, knobs }. RENDER-SIDE ONLY — content JSON
  // is never touched, so a look swap costs zero copy-regen. Default knob values emit
  // no CSS, so the default look is byte-identical to an unstyled draft.
  const handleLook = (look: (typeof looks)[number]) => {
    updateMeta({
      variantId: look.variantId,
      paletteId: look.paletteId,
      themeValues: { ...(tv ?? {}), lookId: look.id, knobs: look.knobs },
    });
    posthog?.register({ variantId: look.variantId, paletteId: look.paletteId });
    posthog?.capture('look_changed', {
      audienceType: 'service',
      templateId: tid,
      lookId: look.id,
      variantId: look.variantId,
      paletteId: look.paletteId,
    });
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

          {/* ─── Looks (primary — curated bundles; only look-bearing templates) ─── */}
          {looks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Looks</p>
              <div className="grid grid-cols-1 gap-1.5">
                {looks.map((look) => {
                  const isActive = activeLookId === look.id;
                  return (
                    <button
                      key={look.id}
                      onClick={() => handleLook(look)}
                      aria-pressed={isActive}
                      title={look.blurb}
                      className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition ${
                        isActive
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <span
                        data-palette={look.paletteId}
                        className="w-4 h-4 rounded-sm flex-shrink-0"
                        style={{ background: 'var(--accent, #ccc)' }}
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-gray-900">{look.label}</span>
                        <span className="block text-[11px] text-gray-500 truncate">{look.blurb}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Variant (fallback/advanced row — kept below looks, no removal) ─── */}
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
