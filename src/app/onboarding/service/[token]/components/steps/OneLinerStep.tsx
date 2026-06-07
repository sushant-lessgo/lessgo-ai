'use client';

import { useState, useEffect } from 'react';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { usePostHog } from 'posthog-js/react';

const examples = [
  'Boutique branding studio for DTC skincare brands',
  'Performance marketing agency for B2B SaaS startups',
  'Web design studio for indie founders launching their first product',
];

// Validator copied from product OneLinerStep:16-53.
function validateOneLiner(text: string): { valid: boolean; error?: string } {
  const trimmed = text.trim();

  if (trimmed.length < 10) return { valid: false, error: 'Min 10 characters' };

  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 2) return { valid: false, error: 'Describe in at least 2 words' };

  if (/^(.)\1{5,}$/.test(trimmed.replace(/\s/g, ''))) {
    return { valid: false, error: 'Please enter a real description' };
  }

  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  if (uniqueWords.size === 1 && words.length > 1) {
    return { valid: false, error: 'Please use different words' };
  }

  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly.length >= 20) {
    const vowelCount = (lettersOnly.match(/[aeiouAEIOU]/g) || []).length;
    const vowelRatio = vowelCount / lettersOnly.length;
    const hasWordWithVowel = words.some((word) => /[aeiouAEIOU]/.test(word));
    if (vowelRatio < 0.12 && !hasWordWithVowel) {
      return { valid: false, error: 'Please use real words' };
    }
  }

  return { valid: true };
}

export default function OneLinerStep() {
  const posthog = usePostHog();
  const oneLiner = useServiceGenerationStore((s) => s.oneLiner);
  const setOneLiner = useServiceGenerationStore((s) => s.setOneLiner);
  const nextStep = useServiceGenerationStore((s) => s.nextStep);

  const [local, setLocal] = useState(oneLiner);
  const validation = validateOneLiner(local);
  const isValid = validation.valid;

  useEffect(() => {
    posthog?.capture('service_onboarding_step_view', {
      step: 'oneLiner',
      stepIndex: 0,
      audienceType: 'service',
    });
  }, [posthog]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setOneLiner(local.trim());
    posthog?.capture('service_onboarding_step_submit', {
      step: 'oneLiner',
      audienceType: 'service',
    });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Describe your studio
        </h1>
        <p className="mt-2 text-gray-600">
          One sentence — what you do, who you do it for.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="oneliner" className="text-gray-700">
          What does your agency do? <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="oneliner"
          placeholder="Boutique branding studio for DTC skincare brands"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isValid) {
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          className="min-h-[100px]"
          maxLength={500}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-red-500">
            {!isValid && local.length > 0 ? validation.error : ''}
          </p>
          <p className="text-xs text-gray-400">{local.length}/500</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setLocal(ex)}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 hover:bg-orange-50
                         hover:text-brand-accentPrimary border border-transparent
                         hover:border-orange-200 transition-all duration-200"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Button
          type="submit"
          disabled={!isValid}
          className="w-full bg-brand-accentPrimary hover:bg-orange-500"
          size="lg"
        >
          Continue
        </Button>
      </div>
    </form>
  );
}
