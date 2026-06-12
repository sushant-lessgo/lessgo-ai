'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import { Button } from '@/components/ui/button';
import { usePostHog } from 'posthog-js/react';
import { Check } from 'lucide-react';
import type { TemplateId } from '@/types/service';
import { TEMPLATE_CATALOG, TEMPLATE_ORDER } from '../fields/templateCatalog';
import PaletteSwatch from '../fields/PaletteSwatch';

export default function StyleStep() {
  const posthog = usePostHog();
  const params = useParams();
  const tokenId = params?.token as string;

  const understanding = useServiceGenerationStore((s) => s.understanding);
  const templateId = useServiceGenerationStore((s) => s.templateId);
  const variantId = useServiceGenerationStore((s) => s.variantId);
  const paletteId = useServiceGenerationStore((s) => s.paletteId);
  const setTemplateId = useServiceGenerationStore((s) => s.setTemplateId);
  const setVariantId = useServiceGenerationStore((s) => s.setVariantId);
  const setPaletteId = useServiceGenerationStore((s) => s.setPaletteId);
  const nextStep = useServiceGenerationStore((s) => s.nextStep);

  // Service onboarding only ever holds a service template (hearth/lex); fall
  // back to hearth for any non-service id so the picker never crashes.
  const catalog = TEMPLATE_CATALOG[templateId] ?? TEMPLATE_CATALOG.hearth!;

  // Default palette inferred from the understanding, scoped to the active template.
  const inferredPalette = useMemo(
    () => catalog.inferDefaultPalette(understanding),
    [catalog, understanding]
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seed palette when none set for the active template.
  useEffect(() => {
    if (!paletteId) setPaletteId(inferredPalette);
    posthog?.capture('service_onboarding_step_view', {
      step: 'style',
      stepIndex: 5,
      audienceType: 'service',
      templateId,
      inferredPalette,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enabled = (id: string) => catalog.enabled.includes(id);

  const handleTemplate = (id: TemplateId) => {
    if (id === templateId) return;
    // Store resets variant + palette to the new template's defaults.
    setTemplateId(id);
    const next = TEMPLATE_CATALOG[id];
    if (next) setPaletteId(next.inferDefaultPalette(understanding));
  };

  const handlePalette = (id: string) => {
    if (!enabled(id)) return;
    setPaletteId(id);
  };

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      // Persist template + variant + palette to the Project row before generation.
      const res = await fetch('/api/saveDraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId, templateId, variantId, paletteId }),
      });
      if (!res.ok) throw new Error('Failed to save style');
      posthog?.capture('service_onboarding_step_submit', {
        step: 'style',
        audienceType: 'service',
        templateId,
        variantId,
        paletteId,
        inferredPalette,
        userChanged: inferredPalette !== paletteId,
      });
      nextStep();
    } catch (e: any) {
      setError(e?.message || 'Could not save style. Try again.');
      setSaving(false);
    }
  };

  const selectedPalette = paletteId ?? inferredPalette;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Choose a style</h1>
        <p className="mt-2 text-gray-600">
          Pick a template, a layout variant, and a color story for your page.
        </p>
      </div>

      {/* Template picker — descriptive cards. */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-2">Template</h2>
        <div className="grid grid-cols-1 gap-3">
          {TEMPLATE_ORDER.map((id) => {
            const t = TEMPLATE_CATALOG[id]!;
            const isActive = templateId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleTemplate(id)}
                aria-pressed={isActive}
                className={`text-left rounded-xl border p-4 transition ${
                  isActive
                    ? 'border-brand-accentPrimary ring-2 ring-brand-accentPrimary/30 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{t.label}</span>
                  {isActive && <Check className="h-4 w-4 text-brand-accentPrimary" />}
                </div>
                <p className="mt-1 text-sm text-gray-600">{t.blurb}</p>
                <div className="mt-3 flex gap-1.5">
                  {t.palettes.map((p) => (
                    <span
                      key={p}
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ background: t.swatch(p).accent ?? 'transparent' }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Variant picker — pure layout rescale, no copy impact. */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-2">Layout variant</h2>
        <div className="grid grid-cols-3 gap-2">
          {catalog.variants.map((v) => {
            const isActive = variantId === v.id;
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

      {/* Palette picker — scoped to the active template. */}
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
                onSelect={handlePalette}
              />
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <Button
        onClick={handleContinue}
        disabled={saving || !enabled(selectedPalette)}
        className="w-full bg-brand-accentPrimary hover:bg-orange-500"
        size="lg"
      >
        {saving ? 'Saving…' : 'Continue'}
      </Button>
    </div>
  );
}
