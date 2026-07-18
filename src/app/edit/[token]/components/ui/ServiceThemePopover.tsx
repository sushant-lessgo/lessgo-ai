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
import { Popover, PopoverTrigger, AppPopoverPanel } from '@/components/ui/popover';
import { Coming } from '@/components/ui/coming';
import { useEditStore } from '@/hooks/useEditStore';
import {
  palettesForTemplate,
  templateLabels,
  templateBlurbs,
  type TemplateId,
} from '@/types/service';
import {
  DesignMenuShell,
  DesignMenuTrigger,
  DesignMenuGroup,
  DesignTemplateRow,
  DesignSegmented,
  DesignSwatch,
  DesignSwatchRow,
} from './DesignMenuShell';
import type { TemplateModule } from '@/types/template';
import { getLoadedTemplate } from '@/modules/templates/registry';
// templateMeta is pure List-3 data (type-only imports; no template modules) —
// firewall-safe to read directly. `looks` is the hybrid-look catalog (phase 9).
import { templateMeta } from '@/modules/templates/templateMeta';
import {
  TemplateSwapList,
  deriveSwapSite,
  swapShortlist,
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

  // TemplateSwapList ALWAYS emits the current template as its own (active) row,
  // and hides itself entirely when no eligible target exists. So the t14 thumb
  // row must be the FALLBACK for exactly that hidden case — otherwise the
  // current template renders twice. Exactly one current-template row, always.
  const swapSite = deriveSwapSite(sections, pages);
  const hasSwapTargets = swapShortlist(tid, swapSite).some((t) => t !== tid);

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
        <DesignMenuTrigger paletteId={triggerSwatch} title="Template, variant & palette" />
      </PopoverTrigger>

      <AppPopoverPanel side="bottom" align="start" width={288}>
        <DesignMenuShell onClose={() => setOpen(false)}>
          {/* ─── TEMPLATE ─────────────────────────────────────────────────────
              t14 draws the current template as a bordered thumb row + a "Browse
              all" link. "Browse all" would open the generation flow's live
              preview picker — no such route/handler exists for service
              templates today, so it renders greyed (never omitted). The WORKING
              swap affordance is TemplateSwapList, untouched below: it preloads
              the target through the registry's dynamic loader (the dispatch
              firewall) and hides itself when nothing is eligible. */}
          <DesignMenuGroup
            label="Template"
            action={<Coming what="browsing all templates with your content">Browse all</Coming>}
          >
            {hasSwapTargets ? (
              // Swap list draws its own current-template row + the targets.
              // Its inner "Template" heading is hidden — this group already has
              // t14's eyebrow, and that shared file is out of scope here.
              <div className="[&>div>p]:hidden">
                <TemplateSwapList current={tid} site={swapSite} onSwap={handleSwap} />
              </div>
            ) : (
              // No eligible target ⇒ TemplateSwapList renders null; t14's thumb
              // row is the current-template row.
              <DesignTemplateRow
                name={templateLabels[tid]}
                subtitle={templateBlurbs[tid]}
                active
              />
            )}
          </DesignMenuGroup>

          {/* ─── Looks (curated bundles; only look-bearing templates) ─── */}
          {looks.length > 0 && (
            <DesignMenuGroup label="Looks">
              <div className="grid grid-cols-1 gap-1.5">
                {looks.map((look) => {
                  const isActive = activeLookId === look.id;
                  return (
                    <button
                      key={look.id}
                      onClick={() => handleLook(look)}
                      aria-pressed={isActive}
                      title={look.blurb}
                      className={`flex items-center gap-2 rounded-app-row border p-2 text-left transition-colors ${
                        isActive
                          ? 'border-app-primary bg-app-tint-soft'
                          : 'border-app-border-hairline hover:border-app-border-soft hover:bg-app-hover'
                      }`}
                    >
                      <span
                        data-palette={look.paletteId}
                        className="h-[26px] w-[26px] flex-none rounded-lg"
                        style={{ background: 'var(--accent, #ccc)' }}
                      />
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-semibold text-app-ink">
                          {look.label}
                        </span>
                        <span className="block truncate text-[10.5px] text-app-faint">
                          {look.blurb}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </DesignMenuGroup>
          )}

          {/* ─── STYLE (= variant, per t14) ─── */}
          {variants.length > 0 && (
            <DesignMenuGroup label="Style">
              <DesignSegmented
                aria-label="Layout variant"
                options={variants.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb }))}
                value={activeVariant}
                onChange={handleVariant}
              />
            </DesignMenuGroup>
          )}

          {/* ─── ACCENT — the template's REAL palettes; each swatch resolves its
              colour from the injected [data-palette]{--accent} var. ─── */}
          <DesignMenuGroup label="Accent">
            <DesignSwatchRow>
              {palettes.map((id) => (
                <DesignSwatch
                  key={id}
                  paletteId={id}
                  title={id}
                  selected={activePalette === id}
                  onClick={() => handlePalette(id)}
                />
              ))}
            </DesignSwatchRow>
          </DesignMenuGroup>
        </DesignMenuShell>
      </AppPopoverPanel>
    </Popover>
  );
}

export default ServiceThemePopover;
