'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import { Button } from '@/components/ui/button';
import { usePostHog } from 'posthog-js/react';
import { hearthPalettes, type HearthPalette } from '@/types/service';
import {
  pilotEnabledPalettes,
  defaultHearthPalette,
} from '@/modules/service/design/palettes';
import PaletteSwatch from '../fields/PaletteSwatch';

export default function StyleStep() {
  const posthog = usePostHog();
  const params = useParams();
  const tokenId = params?.token as string;

  const paletteId = useServiceGenerationStore((s) => s.paletteId);
  const setPaletteId = useServiceGenerationStore((s) => s.setPaletteId);
  const nextStep = useServiceGenerationStore((s) => s.nextStep);

  const [selected, setSelected] = useState<HearthPalette>(
    paletteId ?? defaultHearthPalette
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pre-select default + write to store on mount.
    if (!paletteId) setPaletteId(defaultHearthPalette);
    posthog?.capture('service_onboarding_step_view', {
      step: 'style',
      stepIndex: 5,
      projectType: 'service',
    });
  }, [paletteId, setPaletteId, posthog]);

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
        projectType: 'service',
        paletteId: selected,
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
          One color story for the whole page. Terracotta is the pilot
          default — more palettes open up soon.
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
