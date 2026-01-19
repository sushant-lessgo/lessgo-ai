'use client';

import { useState } from 'react';
import { useGenerationStore } from '@/hooks/useGenerationStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const examples = [
  'AI note taker for sales calls',
  'Invoice generator for freelancers',
  'Workout planner for busy parents',
];

function validateOneLiner(text: string): { valid: boolean; error?: string } {
  const trimmed = text.trim();

  if (trimmed.length < 10) {
    return { valid: false, error: 'Min 10 characters' };
  }

  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 2) {
    return { valid: false, error: 'Describe in at least 2 words' };
  }

  // Detect repeated characters (gibberish like "qqqqqqq")
  if (/^(.)\1{5,}$/.test(trimmed.replace(/\s/g, ''))) {
    return { valid: false, error: 'Please enter a real description' };
  }

  // Detect single repeated word
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  if (uniqueWords.size === 1 && words.length > 1) {
    return { valid: false, error: 'Please use different words' };
  }

  // Gibberish detection: vowel ratio + word check
  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly.length >= 20) {
    const vowelCount = (lettersOnly.match(/[aeiouAEIOU]/g) || []).length;
    const vowelRatio = vowelCount / lettersOnly.length;
    const hasWordWithVowel = words.some((word) => /[aeiouAEIOU]/.test(word));

    // Fail only if BOTH: low ratio AND no word has vowel
    if (vowelRatio < 0.12 && !hasWordWithVowel) {
      return { valid: false, error: 'Please use real words' };
    }
  }

  return { valid: true };
}

export default function OneLinerStep() {
  const oneLiner = useGenerationStore((s) => s.oneLiner);
  const productName = useGenerationStore((s) => s.productName);
  const setOneLiner = useGenerationStore((s) => s.setOneLiner);
  const setProductName = useGenerationStore((s) => s.setProductName);
  const setUnderstandingLoading = useGenerationStore((s) => s.setUnderstandingLoading);
  const nextStep = useGenerationStore((s) => s.nextStep);

  const [localOneLiner, setLocalOneLiner] = useState(oneLiner);
  const [localProductName, setLocalProductName] = useState(productName);

  const validation = validateOneLiner(localOneLiner);
  const isValid = validation.valid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setOneLiner(localOneLiner.trim());
    setProductName(localProductName.trim());
    setUnderstandingLoading(true);
    nextStep();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isValid) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Describe your product
        </h1>
        <p className="mt-2 text-gray-600">
          Mention who it&apos;s for + the big benefit
        </p>
      </div>

      {/* One-liner (required) */}
      <div className="space-y-2">
        <Label htmlFor="oneliner" className="text-gray-700">
          What does your product do? <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="oneliner"
          placeholder="AI-powered invoice generator for freelancers"
          value={localOneLiner}
          onChange={(e) => setLocalOneLiner(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[100px]"
          maxLength={500}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-red-500">
            {!isValid && localOneLiner.length > 0 ? validation.error : ''}
          </p>
          <p className="text-xs text-gray-400">
            {localOneLiner.length}/500
          </p>
        </div>

        {/* Example chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setLocalOneLiner(ex)}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 hover:bg-orange-50
                         hover:text-brand-accentPrimary border border-transparent
                         hover:border-orange-200 transition-all duration-200"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Product name (optional) */}
      <div className="space-y-2">
        <Label htmlFor="productName" className="text-gray-700">
          Product name <span className="text-gray-400">(optional)</span>
        </Label>
        <Input
          id="productName"
          placeholder="Lessgo.ai"
          value={localProductName}
          onChange={(e) => setLocalProductName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isValid) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
        />
        <p className="text-xs text-gray-500">
          If you don&apos;t have one yet, skip it.
        </p>
      </div>

      {/* Continue */}
      <div>
        <Button
          type="submit"
          disabled={!isValid}
          className="w-full bg-brand-accentPrimary hover:bg-orange-500 hover:shadow-lg
                     transform hover:scale-105 transition-all duration-200"
          size="lg"
        >
          Continue
        </Button>
        <p className="text-xs text-gray-400 text-center mt-2">
          Takes ~30 seconds
        </p>
      </div>
    </form>
  );
}
