'use client';

// ProductStylePicker — onboarding2 Phase 6 (Axis A, generation-time pick).
// Cosmetic look chooser (typeface variant + accent palette + neutral mood)
// shown NON-BLOCKINGLY while copy streams on the manufacturer/vestria flow,
// below the hero-variant picker. GeneratingSlot applies the values to every
// draft save (variantId/paletteId columns + themeValues.mood) gated on the
// resume-safe `stylePicked` flags. Never awaited by the pipeline; skipping =
// defaults (tailored/cobalt/bone).
//
// Re-homed from src/app/onboarding/product/[token]/components/fields/ in
// scale-06 phase 10. Re-wired to write DIRECTLY to useWizardStore (the old
// useProductGenerationStore mirror subscription was deleted with the store).
//
// Swatch strategy (service pattern, adapted): swatches read the injected
// `[data-palette="x"]{--accent}` CSS vars — but no vestria ThemeInjector is
// mounted on the onboarding route, so the picker mounts those variable blocks
// itself via serializePaletteOverrides() from the vestria palettes module. That
// module is data-only (no block components); WizardShell is already
// dynamically imported (ssr:false) so this never enters the firewall-pure entry
// bundle.

import { useWizardStore } from '@/hooks/useWizardStore';
import { vestriaPalettes, type VestriaVariant, type VestriaLookMood } from '@/types/product';
import { serializePaletteOverrides, pilotEnabledPalettes } from '@/modules/templates/vestria/palettes';
import { vestriaVariantDefs } from '@/modules/templates/vestria/tokens';

const MOODS: Array<{ id: VestriaLookMood; label: string; description: string }> = [
  { id: 'bone', label: 'Bone', description: 'Warm paper neutrals' },
  { id: 'slate', label: 'Slate', description: 'Cool graphite neutrals' },
];

export default function ProductStylePicker() {
  const variantId = useWizardStore((s) => s.styleVariantId);
  const paletteId = useWizardStore((s) => s.stylePaletteId);
  const mood = useWizardStore((s) => s.styleMood);
  const setStyleVariantId = useWizardStore((s) => s.setStyleVariantId);
  const setStylePaletteId = useWizardStore((s) => s.setStylePaletteId);
  const setStyleMood = useWizardStore((s) => s.setStyleMood);

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      {/* Palette CSS vars for the swatches (no ThemeInjector on this route). */}
      <style dangerouslySetInnerHTML={{ __html: serializePaletteOverrides() }} />

      <p className="text-sm font-medium text-gray-900 text-center mb-1">
        …and your look
      </p>
      <p className="text-xs text-gray-500 text-center mb-4">
        Optional. Typeface, accent color and mood — all changeable later.
      </p>

      {/* Typeface variant */}
      <div className="grid grid-cols-3 gap-2 mb-4" role="radiogroup" aria-label="Typeface style">
        {vestriaVariantDefs.map((v) => {
          const active = variantId === v.id;
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={active}
              title={v.blurb}
              onClick={() => setStyleVariantId(v.id as VestriaVariant)}
              className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                active
                  ? 'border-brand-accentPrimary ring-1 ring-brand-accentPrimary bg-orange-50/40'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <span className="block text-sm font-medium text-gray-900">{v.label}</span>
            </button>
          );
        })}
      </div>

      {/* Accent palette — swatch color from the injected [data-palette]{--accent} var. */}
      <div className="grid grid-cols-8 gap-1.5 mb-4" role="radiogroup" aria-label="Accent color">
        {vestriaPalettes.map((id) => {
          const active = paletteId === id;
          const enabled = pilotEnabledPalettes.includes(id);
          if (!enabled) return null;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              title={id}
              onClick={() => setStylePaletteId(id)}
              className={`aspect-square rounded-md border-2 transition-all ${
                active
                  ? 'border-brand-accentPrimary ring-1 ring-brand-accentPrimary'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <span
                data-palette={id}
                className="block w-full h-full rounded-sm"
                style={{ background: 'var(--accent, #ccc)' }}
              />
            </button>
          );
        })}
      </div>

      {/* Neutral mood */}
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Neutral mood">
        {MOODS.map((m) => {
          const active = mood === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setStyleMood(m.id)}
              className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                active
                  ? 'border-brand-accentPrimary ring-1 ring-brand-accentPrimary bg-orange-50/40'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="w-3.5 h-3.5 rounded-full border border-gray-300"
                  style={{ background: m.id === 'bone' ? '#f7f4ee' : '#3d4450' }}
                />
                <span className="text-sm font-medium text-gray-900">{m.label}</span>
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">{m.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
