'use client';

// scale-06 phase 4 — the STYLE slot (thing engine).
//
// Wraps the EXISTING product-tree pickers (HeroVariantPicker / ProductStylePicker)
// by IMPORT for now — they are re-homed to the wizard tree in phase 10 (D "old
// code untouched until 10"). Style is only offered on the manufacturer/vestria
// flow (mirrors the old GeneratingStep gate: pickers render only when
// `isManufacturerFlow(templateId)`); single-page meridian ships locked
// mint/developer defaults, so the slot shows a short "nothing to configure" note.
//
// Store writes: HeroVariantPicker is prop-controlled → bound directly to the
// wizard store (heroVariant). ProductStylePicker is internally coupled to the OLD
// useProductGenerationStore (unchanged), so we MIRROR its picks into the wizard
// store's thing-only style fields via a subscription — that keeps the wizard
// store the source of truth for the phase-5 adapter without editing the picker.
//
// FIREWALL: client-only. The pickers import data-only vestria palette/token
// modules (no block components); WizardShell is already dynamically imported
// (ssr:false) so this never enters the firewall-pure entry bundle.

import { useEffect } from 'react';
import { useWizardStore } from '@/hooks/useWizardStore';
import {
  useProductGenerationStore,
  type VestriaHeroVariant,
} from '@/hooks/useProductGenerationStore';
import { isManufacturerFlow } from '@/modules/audience/product/manufacturerFlow';
import HeroVariantPicker from '@/app/onboarding/product/[token]/components/fields/HeroVariantPicker';
import ProductStylePicker from '@/app/onboarding/product/[token]/components/fields/ProductStylePicker';

const DEFAULT_HERO_VARIANT: VestriaHeroVariant = 'VestriaTailoredHero';

export default function StyleSlot() {
  const templateId = useWizardStore((s) => s.templateId);
  const heroVariant = useWizardStore((s) => s.heroVariant);
  const setHeroVariant = useWizardStore((s) => s.setHeroVariant);
  const setStyleVariantId = useWizardStore((s) => s.setStyleVariantId);
  const setStylePaletteId = useWizardStore((s) => s.setStylePaletteId);
  const setStyleMood = useWizardStore((s) => s.setStyleMood);

  // Mirror the OLD product store's cosmetic picks (written by ProductStylePicker)
  // into the wizard store so the phase-5 adapter reads a single source of truth.
  const oldVariantId = useProductGenerationStore((s) => s.variantId);
  const oldPaletteId = useProductGenerationStore((s) => s.paletteId);
  const oldMood = useProductGenerationStore((s) => s.mood);

  useEffect(() => {
    if (oldVariantId) setStyleVariantId(oldVariantId);
  }, [oldVariantId, setStyleVariantId]);
  useEffect(() => {
    if (oldPaletteId) setStylePaletteId(oldPaletteId);
  }, [oldPaletteId, setStylePaletteId]);
  useEffect(() => {
    if (oldMood) setStyleMood(oldMood);
  }, [oldMood, setStyleMood]);

  const isMfr = isManufacturerFlow(templateId ?? undefined);

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Your look</h1>
        <p className="mt-2 text-gray-600">
          Optional — you can change any of this later in the editor.
        </p>
      </div>

      {isMfr ? (
        <>
          <HeroVariantPicker
            value={(heroVariant as VestriaHeroVariant | null) ?? DEFAULT_HERO_VARIANT}
            onChange={(v) => setHeroVariant(v)}
          />
          <ProductStylePicker />
        </>
      ) : (
        <p className="pt-4 text-sm text-gray-500">
          We&apos;ll use a clean default theme. You can fine-tune fonts, colours
          and layout in the editor once your page is generated.
        </p>
      )}
    </div>
  );
}
