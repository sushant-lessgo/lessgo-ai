'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import { Button } from '@/components/ui/button';
import { usePostHog } from 'posthog-js/react';
import { hearthPalettes, type HearthPalette } from '@/types/service';
import { pilotEnabledPalettes } from '@/modules/templates/hearth/palettes';
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
      // Persist paletteId to Project row before generation kicks off.
      const res = await fetch('/api/saveDraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId, paletteId: selected }),
      });
      if (!res.ok) {
        throw new Error('Failed to save palette');
      }
      posthog?.capture('service_onboarding_step_submit', {
        step: 'style',
        audienceType: 'service',
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
        <h1 className="text-2xl font-semibold text-gray-900">Pick a palette</h1>
        <p className="mt-2 text-gray-600">
          One color story for the whole page. We&rsquo;ve suggested one based
          on your work — tap any swatch to change it.
        </p>
      </div>

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
