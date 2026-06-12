"use client";

// Service template + variant + palette picker for the editor (Phase 11b).
// Rendered only for audienceType==='service' (product keeps ThemePopover).
//
// FIREWALL: editor code must not static-import a template module. The active
// template module is read via getLoadedTemplate() (the renderer already
// preloaded it); switching preloads the target via the registry's dynamic
// loader. Palette swatch colors are sourced from the already-injected
// `[data-palette="x"]{--accent}` CSS vars — a dot with data-palette={id} resolves
// to that palette's accent without importing the template's config.

import React, { useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import { Check, Loader2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import {
  templateIds,
  templateLabels,
  templateBlurbs,
  palettesForTemplate,
  type TemplateId,
} from '@/types/service';
import { getLoadedTemplate, preloadTemplate } from '@/modules/templates/registry';

export function ServiceThemePopover() {
  const {
    audienceType,
    templateId,
    variantId,
    paletteId,
    updateMeta,
    triggerAutoSave,
  } = useEditStore();

  const posthog = usePostHog();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<TemplateId | null>(null);
  const [switching, setSwitching] = useState(false);
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

  const confirmTemplate = async (target: TemplateId) => {
    setSwitching(true);
    try {
      // Preload before committing so blocks resolve without a render gap.
      const m = await preloadTemplate(target);
      // Reset BOTH variant + palette to the new template's defaults (cross-
      // template ids don't overlap — PO gap).
      updateMeta({
        templateId: target,
        variantId: m.defaultVariantId,
        paletteId: m.defaultPaletteId,
      });
      posthog?.register({ templateId: target, variantId: m.defaultVariantId });
      posthog?.capture('template_changed', {
        audienceType: 'service',
        from: tid,
        to: target,
        variantId: m.defaultVariantId,
        paletteId: m.defaultPaletteId,
      });
      persist();
      setPending(null);
      force((n) => n + 1);
    } finally {
      setSwitching(false);
    }
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
          {/* ─── Template ─── */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Template</p>
            <div className="space-y-2">
              {templateIds.map((id) => {
                const isActive = tid === id;
                const isPending = pending === id;
                return (
                  <div key={id}>
                    <button
                      onClick={() => {
                        if (isActive) return;
                        setPending(id as TemplateId);
                      }}
                      aria-pressed={isActive}
                      className={`w-full text-left rounded-lg border p-2.5 transition ${
                        isActive
                          ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50/40'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {templateLabels[id]}
                        </span>
                        {isActive && <Check className="h-4 w-4 text-blue-500" />}
                      </div>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {templateBlurbs[id]}
                      </span>
                    </button>

                    {isPending && !isActive && (
                      <div className="mt-1.5 rounded-md bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900">
                        Switch to {templateLabels[id]}? Your copy stays — the
                        design re-skins and the palette resets.
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => confirmTemplate(id as TemplateId)}
                            disabled={switching}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-60"
                          >
                            {switching && <Loader2 className="h-3 w-3 animate-spin" />}
                            Switch
                          </button>
                          <button
                            onClick={() => setPending(null)}
                            disabled={switching}
                            className="px-2.5 py-1 rounded border border-amber-300 text-amber-800 hover:bg-amber-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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
