'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import { Button } from '@/components/ui/button';
import { usePostHog } from 'posthog-js/react';
import { Check } from 'lucide-react';
import { hearthPalettes, type HearthPalette } from '@/types/service';
import { pilotEnabledPalettes, hearthPaletteConfigs } from '@/modules/templates/hearth/palettes';
import { inferDefaultPalette } from '@/modules/templates/hearth/paletteSelection';
import PaletteSwatch from '../fields/PaletteSwatch';

export default function StyleStep() {
  const posthog = usePostHog();
  const params = useParams();
  const tokenId = params?.token as string;

  const paletteId = useServiceGenerationStore((s) => s.paletteId);
  const understanding = useServiceGenerationStore((s) => s.understanding);
  const setPaletteId = useServiceGenerationStore((s) => s.setPaletteId);
  const nextStep = useServiceGenerationStore((s) => s.nextStep);

  const inferredPalette = useMemo(
    () => inferDefaultPalette(understanding),
    [understanding]
  );

  const [selected, setSelected] = useState<HearthPalette>(
    paletteId ?? inferredPalette
  );
  // Template picker. Pilot ships Hearth only (filtered to 1 selectable card).
  // Variant selection is deferred to Phase 11 — persist variantId='classic'.
  const SERVICE_TEMPLATES = [
    {
      id: 'hearth' as const,
      name: 'Hearth',
      blurb: 'Warm, editorial service template — cream surfaces, serif accents.',
    },
  ];
  const [selectedTemplate, setSelectedTemplate] = useState<'hearth'>('hearth');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paletteId) setPaletteId(inferredPalette);
    posthog?.capture('service_onboarding_step_view', {
      step: 'style',
      stepIndex: 5,
      audienceType: 'service',
      inferredPalette,
    });
  }, [paletteId, setPaletteId, inferredPalette, posthog]);

  const enabled = (id: HearthPalette) => pilotEnabledPalettes.includes(id);

  const handleSelect = (id: HearthPalette) => {
    if (!enabled(id)) return;
    setSelected(id);
    setPaletteId(id);
  };

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      // Persist template + variant + palette to Project row before generation.
      // variantId locked to 'classic' (template default) until Phase 11 picker.
      const res = await fetch('/api/saveDraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          templateId: selectedTemplate,
          variantId: 'classic',
          paletteId: selected,
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to save style');
      }
      posthog?.capture('service_onboarding_step_submit', {
        step: 'style',
        audienceType: 'service',
        templateId: selectedTemplate,
        variantId: 'classic',
        paletteId: selected,
        inferredPalette,
        userChanged: inferredPalette !== selected,
      });
      nextStep();
    } catch (e: any) {
      setError(e?.message || 'Could not save palette. Try again.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Choose a style</h1>
        <p className="mt-2 text-gray-600">
          Pick a template and a color story for your page.
        </p>
      </div>

      {/* Template picker — descriptive cards. Hearth-only at pilot. */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-2">Template</h2>
        <div className="grid grid-cols-1 gap-3">
          {SERVICE_TEMPLATES.map((t) => {
            const isActive = selectedTemplate === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplate(t.id)}
                aria-pressed={isActive}
                className={`text-left rounded-xl border p-4 transition ${
                  isActive
                    ? 'border-brand-accentPrimary ring-2 ring-brand-accentPrimary/30 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{t.name}</span>
                  {isActive && (
                    <Check className="h-4 w-4 text-brand-accentPrimary" />
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{t.blurb}</p>
                <div className="mt-3 flex gap-1.5">
                  {hearthPalettes.slice(0, 9).map((p) => (
                    <span
                      key={p}
                      className="h-3.5 w-3.5 rounded-full"
                      style={{
                        background:
                          hearthPaletteConfigs[p]?.accent ?? 'transparent',
                      }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <h2 className="text-sm font-medium text-gray-700">Palette</h2>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {hearthPalettes.map((id) => (
          <PaletteSwatch
            key={id}
            paletteId={id}
            label={id}
            selected={selected === id}
            enabled={enabled(id)}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <Button
        onClick={handleContinue}
        disabled={saving || !enabled(selected)}
        className="w-full bg-brand-accentPrimary hover:bg-orange-500"
        size="lg"
      >
        {saving ? 'Saving…' : 'Continue'}
      </Button>
    </div>
  );
}
