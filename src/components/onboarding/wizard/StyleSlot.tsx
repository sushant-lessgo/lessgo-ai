'use client';

// scale-06 phase 4/8 — the STYLE slot.
//
// THING (phase 4): wraps the EXISTING product-tree pickers (HeroVariantPicker /
// ProductStylePicker) by IMPORT for now — re-homed to the wizard tree in phase 10
// (D "old code untouched until 10"). Style is only offered on the manufacturer/
// vestria flow; single-page meridian ships locked defaults with a short note.
//
// TRUST (phase 8): a variant + palette picker for the serveGate-resolved service
// template (hearth/lex/surge). templateId is LOCKED by serve — no template
// switcher — so we render only the layout-variant + palette knobs, bound to the
// wizard store's trust-only `variantId`/`paletteId`. Palette swatches use the
// COPIED shared `PaletteSwatch`; swatch colors + variant labels come from the
// old service-tree TEMPLATE_CATALOG (data-only picker metadata, re-homed in
// phase 10 — same IMPORT-for-now pattern as the thing pickers above).
//
// Store writes (thing): HeroVariantPicker is prop-controlled → bound directly to
// the wizard store (heroVariant). ProductStylePicker (re-homed in phase 10) now
// writes its variant/palette/mood picks DIRECTLY to the wizard store — the old
// useProductGenerationStore mirror subscription was deleted with that store.
//
// FIREWALL: client-only. The pickers/catalog import data-only palette/token
// modules (no block components); WizardShell is already dynamically imported
// (ssr:false) so this never enters the firewall-pure entry bundle.

import { useEffect } from 'react';
import { useWizardStore } from '@/hooks/useWizardStore';
import type { VestriaHeroVariant } from '@/types/product';
import HeroVariantPicker from '@/components/onboarding/wizard/fields/HeroVariantPicker';
import ProductStylePicker from '@/components/onboarding/wizard/fields/ProductStylePicker';
import PaletteSwatch from '@/components/onboarding/shared/PaletteSwatch';
import { TEMPLATE_CATALOG } from '@/components/onboarding/wizard/fields/templateCatalog';
import type { TemplateId } from '@/types/service';

const DEFAULT_HERO_VARIANT: VestriaHeroVariant = 'VestriaTailoredHero';

/** TRUST style branch — variant + palette picker for the resolved service template. */
function TrustStyleSlot() {
  const templateId = useWizardStore((s) => s.templateId);
  const variantId = useWizardStore((s) => s.variantId);
  const paletteId = useWizardStore((s) => s.paletteId);
  const setVariantId = useWizardStore((s) => s.setVariantId);
  const setPaletteId = useWizardStore((s) => s.setPaletteId);

  // Service onboarding only ever holds a service template (hearth/lex/surge);
  // fall back to hearth for any non-service id so the picker never crashes.
  const catalog = TEMPLATE_CATALOG[(templateId as TemplateId) ?? 'hearth'] ?? TEMPLATE_CATALOG.hearth!;
  const enabled = (id: string) => catalog.enabled.includes(id);
  const selectedPalette = paletteId ?? catalog.enabled[0] ?? catalog.palettes[0];
  const selectedVariant = variantId ?? catalog.variants[0]?.id;

  // Named looks (phase 9) — curated variant+palette bundles for knob-tokenized
  // templates (hearth today). Onboarding applies a look's variant + palette (the
  // dominant visual signal); the look's knob refinements + hybrid lookId are
  // applied at full fidelity in the editor (ServiceThemePopover → themeValues).
  // Active look = the tile whose variant + palette both match the current pick.
  const looks = catalog.looks ?? [];
  const activeLookId = looks.find(
    (l) => l.variantId === selectedVariant && l.paletteId === selectedPalette,
  )?.id;
  const pickLook = (look: (typeof looks)[number]) => {
    if (enabled(look.paletteId)) setPaletteId(look.paletteId);
    setVariantId(look.variantId);
  };

  // Seed defaults on mount when none picked yet (mirror old StyleStep seeding).
  useEffect(() => {
    if (!paletteId && selectedPalette) setPaletteId(selectedPalette);
    if (!variantId && selectedVariant) setVariantId(selectedVariant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Your look</h1>
        <p className="mt-2 text-gray-600">
          Pick a layout variant and a color story. You can change either later in
          the editor.
        </p>
      </div>

      {/* Curated looks — PRIMARY choice for look-bearing templates. Each bundles
          a layout variant + color story; the raw variant/palette rows below stay
          as the fallback/advanced controls (conservative — no removal). */}
      {looks.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-2">Looks</h2>
          <div className="grid grid-cols-2 gap-2">
            {looks.map((look) => {
              const isActive = activeLookId === look.id;
              // Swatch color from the catalog (explicit hex — onboarding has no
              // injected [data-palette]{--accent} CSS, unlike the editor).
              const sw = catalog.swatch(look.paletteId);
              return (
                <button
                  key={look.id}
                  type="button"
                  onClick={() => pickLook(look)}
                  aria-pressed={isActive}
                  className={`flex items-center gap-2 text-left rounded-lg border px-3 py-2 transition ${
                    isActive
                      ? 'border-brand-accentPrimary ring-2 ring-brand-accentPrimary/30 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-sm flex-shrink-0"
                    style={{ background: sw.accent ?? '#ccc' }}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900">{look.label}</span>
                    <span className="block text-xs text-gray-500 truncate">{look.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Layout variant — pure token rescale, no copy impact. */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-2">Layout variant</h2>
        <div className="grid grid-cols-3 gap-2">
          {catalog.variants.map((v) => {
            const isActive = selectedVariant === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                aria-pressed={isActive}
                className={`text-left rounded-lg border px-3 py-2 transition ${
                  isActive
                    ? 'border-brand-accentPrimary ring-2 ring-brand-accentPrimary/30 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="block text-sm font-medium text-gray-900">{v.label}</span>
                {v.blurb && (
                  <span className="block text-xs text-gray-500 mt-0.5">{v.blurb}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Palette — scoped to the resolved template. */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-2">Palette</h2>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {catalog.palettes.map((id) => {
            const sw = catalog.swatch(id);
            return (
              <PaletteSwatch
                key={id}
                paletteId={id}
                label={id}
                selected={selectedPalette === id}
                enabled={enabled(id)}
                accent={sw.accent}
                accentDeep={sw.accentDeep}
                wash={sw.wash}
                onSelect={(pid) => enabled(pid) && setPaletteId(pid)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function StyleSlot() {
  const engine = useWizardStore((s) => s.engine);
  if (engine === 'trust') return <TrustStyleSlot />;
  return <ThingStyleSlot />;
}

function ThingStyleSlot() {
  const templateId = useWizardStore((s) => s.templateId);
  const heroVariant = useWizardStore((s) => s.heroVariant);
  const setHeroVariant = useWizardStore((s) => s.setHeroVariant);

  // ProductStylePicker writes variant/palette/mood DIRECTLY to the wizard store
  // (single source of truth for the phase-5 adapter) — no mirror needed.
  // These pickers are VESTRIA-TYPED (HeroVariantPicker imports VestriaHeroVariant),
  // so they are vestria-only by construction. atelier phase 2: gate strictly on
  // `templateId === 'vestria'`, NOT `isMultipage` — a multipage WORK template
  // (atelier) must NOT surface vestria's hero-variant/style pickers.
  const showVestriaPickers = templateId === 'vestria';

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Your look</h1>
        <p className="mt-2 text-gray-600">
          Optional — you can change any of this later in the editor.
        </p>
      </div>

      {showVestriaPickers ? (
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
