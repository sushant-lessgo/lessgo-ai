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
import { Popover, PopoverTrigger, AppPopoverPanel } from '@/components/ui/popover';
import { Coming } from '@/components/ui/coming';
import { useEditStore } from '@/hooks/useEditStore';
import {
  usesTemplateModule,
  palettesForTemplate,
  defaultVariantForTemplate,
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
import {
  TemplateSwapList,
  deriveSwapSite,
  swapShortlist,
  buildSwapPatch,
} from './TemplateSwapList';

const MOODS: Array<{ id: 'bone' | 'slate'; label: string; swatch: string }> = [
  { id: 'bone', label: 'Bone', swatch: '#f7f4ee' },
  { id: 'slate', label: 'Slate', swatch: '#3d4450' },
];

// Fallback variant defs if the vestria module somehow isn't cached yet. Ids,
// labels AND blurbs mirror vestriaVariantDefs in modules/templates/vestria/tokens.ts
// — copied as literals, NOT imported (firewall: no static template import). The
// blurbs matter: they are the hover `title` that tells the user these variants
// are TYPEFACE sets, which the "Style" eyebrow no longer says.
// Other templates fall back to an empty list (section hides until loaded).
const VESTRIA_FALLBACK_VARIANTS = [
  { id: 'tailored', label: 'Tailored', blurb: 'Editorial — Bodoni Moda display over Hanken Grotesk. The atelier baseline.' },
  { id: 'modern', label: 'Modern', blurb: 'Engineered — Space Grotesk display over Hanken Grotesk.' },
  { id: 'heritage', label: 'Heritage', blurb: 'Established — Cormorant Garamond display over Source Serif 4.' },
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

  // TemplateSwapList ALWAYS emits the current template as its own (active) row,
  // and hides itself entirely when no eligible target exists. So the t14 thumb
  // row must be the FALLBACK for exactly that hidden case — otherwise the
  // current template renders twice. Exactly one current-template row, always.
  const swapSite = deriveSwapSite(sections, pages);
  const hasSwapTargets = swapShortlist(tid, swapSite).some((t) => t !== tid);

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
        <DesignMenuTrigger paletteId={activePalette} title="Template, variant & palette" />
      </PopoverTrigger>

      <AppPopoverPanel side="bottom" align="start" width={288}>
        <DesignMenuShell onClose={() => setOpen(false)}>
          {/* ─── TEMPLATE ─── see ServiceThemePopover for the full note: the row
              is t14's current-template thumb, "Browse all" is greyed (no picker
              route exists), and the WORKING swap affordance is TemplateSwapList,
              untouched — it preloads through the registry's dynamic loader. */}
          <DesignMenuGroup
            label="Template"
            action={<Coming what="browsing all templates with your content">Browse all</Coming>}
          >
            {hasSwapTargets ? (
              // Swap list draws its own current-template row + the targets. Its
              // inner "Template" heading is hidden — this group already has
              // t14's eyebrow, and that shared file is out of this phase's scope.
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

          {/* ─── STYLE (= variant, per t14; these variants are typeface sets) ─── */}
          {variants.length > 0 && (
            <DesignMenuGroup label="Style">
              <DesignSegmented
                aria-label="Typeface"
                options={variants.map((v) => ({
                  id: v.id,
                  label: v.label,
                  blurb: (v as any).blurb,
                }))}
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

          {/* ─── Mood (vestria-only: themeValues.mood → VestriaThemeInjector) ─── */}
          {isVestria && (
            <DesignMenuGroup label="Mood">
              <DesignSegmented
                aria-label="Mood"
                options={MOODS.map((m) => ({
                  id: m.id,
                  label: m.label,
                  leading: (
                    <span
                      aria-hidden
                      className="block h-3 w-3 rounded-full border border-app-border-soft"
                      style={{ background: m.swatch }}
                    />
                  ),
                }))}
                value={activeMood}
                onChange={(id) => handleMood(id as 'bone' | 'slate')}
              />
            </DesignMenuGroup>
          )}
        </DesignMenuShell>
      </AppPopoverPanel>
    </Popover>
  );
}

export default VestriaThemePopover;
