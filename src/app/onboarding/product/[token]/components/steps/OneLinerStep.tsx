'use client';

import { useState } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { useProductGenerationStore } from '@/hooks/useProductGenerationStore';
import { isManufacturerFlow } from '@/modules/audience/product/manufacturerFlow';
import type { LandingGoal } from '@/types/generation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const examples = [
  'AI note taker for sales calls',
  'Invoice generator for freelancers',
  'Workout planner for busy parents',
];

// Manufacturer / trade-supplier flow (onboarding1) — maker-appropriate
// examples. SaaS `examples` above stay byte-identical.
const manufacturerExamples = [
  'Custom uniforms & workwear for hospitality and healthcare',
  'CNC-machined precision parts for industrial equipment makers',
  'Private-label skincare manufacturing for indie brands',
];

/** Normalize user input to an http(s) URL; returns null if not URL-like. */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProto);
    // Require a dot in the host so "foo" isn't treated as a site.
    if (!u.hostname.includes('.')) return null;
    return u.href;
  } catch {
    return null;
  }
}

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
  const oneLiner = useProductGenerationStore((s) => s.oneLiner);
  const productName = useProductGenerationStore((s) => s.productName);
  const setOneLiner = useProductGenerationStore((s) => s.setOneLiner);
  const setProductName = useProductGenerationStore((s) => s.setProductName);
  const setUnderstanding = useProductGenerationStore((s) => s.setUnderstanding);
  const setUnderstandingLoading = useProductGenerationStore((s) => s.setUnderstandingLoading);
  const setOffer = useProductGenerationStore((s) => s.setOffer);
  const setLandingGoal = useProductGenerationStore((s) => s.setLandingGoal);
  const setImportSourceUrl = useProductGenerationStore((s) => s.setImportSourceUrl);
  const setImportedTestimonials = useProductGenerationStore((s) => s.setImportedTestimonials);
  const nextStep = useProductGenerationStore((s) => s.nextStep);
  const templateId = useProductGenerationStore((s) => s.templateId);

  const isManufacturer = isManufacturerFlow(templateId);

  const [localOneLiner, setLocalOneLiner] = useState(oneLiner);
  const [localProductName, setLocalProductName] = useState(productName);

  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const validation = validateOneLiner(localOneLiner);
  const isValid = validation.valid;
  const normalizedUrl = normalizeUrl(url);

  const handleImport = async () => {
    if (!normalizedUrl || importing) return;
    setImporting(true);
    setImportError(null);
    try {
      const res = await fetch('/api/v2/scrape-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // templateId carries the manufacturer signal (onboarding1, D1) so the
        // scrape route runs the manufacturer extraction branch.
        body: JSON.stringify({ url: normalizedUrl, templateId }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setImportError(
          json?.message || "Couldn't read that site. Fill it in manually below."
        );
        return;
      }
      const d = json.data;
      // Hydrate the store directly. We set `understanding` (not
      // understandingLoading) so UnderstandingStep renders its confirm view
      // without firing a second /understand call — no double charge.
      setOneLiner(d.oneLiner || '');
      if (d.productName) setProductName(d.productName);
      if (isManufacturer) {
        // Manufacturer shape (onboarding1, D2): write the 4 manufacturer keys
        // and PAD the 4 required SaaS fields so the object satisfies
        // setUnderstanding and SaaS-path reads like `.length` never throw.
        setUnderstanding({
          categories: d.categories ?? [],
          audiences: d.audiences ?? [],
          whatItDoes: d.whatItDoes ?? '',
          features: d.features ?? [],
          whatYouMake: d.whatYouMake ?? '',
          industriesServed: d.industriesServed ?? [],
          productCategories: d.productCategories ?? [],
          valueAdds: d.valueAdds ?? [],
        });
      } else {
        setUnderstanding({
          categories: d.categories ?? [],
          audiences: d.audiences ?? [],
          whatItDoes: d.whatItDoes ?? '',
          features: d.features ?? [],
        });
      }
      if (d.offer) setOffer(d.offer);
      if (d.landingGoal) setLandingGoal(d.landingGoal as LandingGoal);
      setImportedTestimonials(Array.isArray(d.testimonials) ? d.testimonials : []);
      setImportSourceUrl(normalizedUrl);
      nextStep();
    } catch {
      setImportError("Couldn't reach that site. Fill it in manually below.");
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setOneLiner(localOneLiner.trim());
    setProductName(localProductName.trim());
    // Flag loading so UnderstandingStep auto-fires the inference call on mount.
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

      {/* Import from existing website (optional shortcut) */}
      <div className="rounded-lg border border-orange-200 bg-orange-50/60 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand-accentPrimary" />
          <p className="text-sm font-medium text-gray-800">
            Already have a website? Import it to skip the typing.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="url"
            inputMode="url"
            placeholder="yourcompany.com"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (importError) setImportError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && normalizedUrl && !importing) {
                e.preventDefault();
                handleImport();
              }
            }}
            disabled={importing}
            className="bg-white"
          />
          <Button
            type="button"
            onClick={handleImport}
            disabled={!normalizedUrl || importing}
            className="bg-brand-accentPrimary hover:bg-orange-500 shrink-0"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                Reading…
              </>
            ) : (
              'Import'
            )}
          </Button>
        </div>
        {importError ? (
          <p className="text-xs text-red-500">{importError}</p>
        ) : (
          <p className="text-xs text-gray-500">
            We&apos;ll pull your copy + testimonials. You can review everything next.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">or describe it manually</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* One-liner (required) */}
      <div className="space-y-2">
        <Label htmlFor="oneliner" className="text-gray-700">
          What does your product do? <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="oneliner"
          placeholder={
            isManufacturer
              ? 'Custom workwear manufacturer for hotels and hospitals'
              : 'AI-powered invoice generator for freelancers'
          }
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
          <p className="text-xs text-gray-400">{localOneLiner.length}/500</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {(isManufacturer ? manufacturerExamples : examples).map((ex) => (
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
          placeholder={isManufacturer ? 'Apex Uniform Works' : 'Lessgo.ai'}
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
