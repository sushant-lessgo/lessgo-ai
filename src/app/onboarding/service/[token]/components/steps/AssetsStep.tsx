'use client';

import { useState, useEffect } from 'react';
import { Quote, X } from 'lucide-react';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { usePostHog } from 'posthog-js/react';

type TestimonialType = 'text' | 'photos' | 'video' | 'transformation';

const ASSET_FIELDS: Array<{
  key:
    | 'hasTestimonials'
    | 'hasClientLogos'
    | 'hasOutcomes'
    | 'hasCaseStudies'
    | 'hasTeamPhotos'
    | 'hasFounderPhoto';
  label: string;
  hint: string;
}> = [
  { key: 'hasTestimonials', label: 'Client testimonials', hint: 'Quotes you can publish' },
  { key: 'hasClientLogos', label: 'Client logos', hint: 'Permission to display brand marks' },
  { key: 'hasOutcomes', label: 'Numeric outcomes', hint: '"Grew revenue 3x", "47% conversion lift"' },
  { key: 'hasCaseStudies', label: 'Case studies / portfolio', hint: 'Detailed work you can write up' },
  { key: 'hasTeamPhotos', label: 'Team photos', hint: 'For a Team grid section' },
  { key: 'hasFounderPhoto', label: 'Founder photo', hint: 'For a personal Founder Letter' },
];

const TESTIMONIAL_TYPES: Array<{ value: TestimonialType; label: string }> = [
  { value: 'text', label: 'Text quotes' },
  { value: 'photos', label: 'With client photos' },
  { value: 'video', label: 'Video testimonials' },
  { value: 'transformation', label: 'Transformation stories' },
];

export default function AssetsStep() {
  const posthog = usePostHog();
  const assets = useServiceGenerationStore((s) => s.assets);
  const setAssets = useServiceGenerationStore((s) => s.setAssets);
  const importedTestimonials = useServiceGenerationStore((s) => s.importedTestimonials);
  const setImportedTestimonials = useServiceGenerationStore((s) => s.setImportedTestimonials);
  const nextStep = useServiceGenerationStore((s) => s.nextStep);

  const hasImported = importedTestimonials.length > 0;

  // Import pre-fills testimonial availability → this step becomes a confirm.
  const [hasTestimonials, setHasTestimonials] = useState(
    assets?.hasTestimonials ?? hasImported
  );
  const [hasClientLogos, setHasClientLogos] = useState(assets?.hasClientLogos ?? false);
  const [hasOutcomes, setHasOutcomes] = useState(assets?.hasOutcomes ?? false);
  const [hasCaseStudies, setHasCaseStudies] = useState(assets?.hasCaseStudies ?? false);
  const [hasTeamPhotos, setHasTeamPhotos] = useState(assets?.hasTeamPhotos ?? false);
  const [hasFounderPhoto, setHasFounderPhoto] = useState(assets?.hasFounderPhoto ?? false);
  const [testimonialType, setTestimonialType] = useState<TestimonialType | null>(
    (assets?.testimonialType as TestimonialType | null) ?? (hasImported ? 'text' : null)
  );
  // Track whether the user manually toggled testimonials, so removing the last
  // imported quote can safely flip the auto-set flag back off (but never override
  // a deliberate user choice).
  const [testimonialsTouched, setTestimonialsTouched] = useState(false);

  const removeImportedTestimonial = (index: number) => {
    const next = importedTestimonials.filter((_, i) => i !== index);
    setImportedTestimonials(next);
    // Full removal + user hasn't manually toggled → drop the auto-set availability
    // so sectionSelection doesn't force an empty testimonials section.
    if (next.length === 0 && !testimonialsTouched) {
      setHasTestimonials(false);
    }
  };

  useEffect(() => {
    posthog?.capture('service_onboarding_step_view', {
      step: 'assets',
      stepIndex: 4,
      audienceType: 'service',
    });
  }, [posthog]);

  const togglesByKey = {
    hasTestimonials: [hasTestimonials, setHasTestimonials] as const,
    hasClientLogos: [hasClientLogos, setHasClientLogos] as const,
    hasOutcomes: [hasOutcomes, setHasOutcomes] as const,
    hasCaseStudies: [hasCaseStudies, setHasCaseStudies] as const,
    hasTeamPhotos: [hasTeamPhotos, setHasTeamPhotos] as const,
    hasFounderPhoto: [hasFounderPhoto, setHasFounderPhoto] as const,
  };

  const isValid = !hasTestimonials || !!testimonialType;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setAssets({
      hasTestimonials,
      hasClientLogos,
      hasOutcomes,
      hasCaseStudies,
      hasTeamPhotos,
      hasFounderPhoto,
      testimonialType: hasTestimonials ? testimonialType : null,
    });
    posthog?.capture('service_onboarding_step_submit', {
      step: 'assets',
      audienceType: 'service',
      hasTestimonials,
      hasClientLogos,
      hasOutcomes,
      hasCaseStudies,
      hasTeamPhotos,
      hasFounderPhoto,
      testimonialType: hasTestimonials ? testimonialType : null,
    });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          What do you have to work with?
        </h1>
        <p className="mt-2 text-gray-600">
          {hasImported
            ? 'We pulled these from your site. Confirm what you have — toggle anything off you can’t actually use. You can flip these later.'
            : 'Toggle on what you already have. We’ll only build sections you can actually fill in. You can flip any of these later.'}
        </p>
      </div>

      {importedTestimonials.length > 0 && (
        <div className="space-y-3">
          <div>
            <Label className="text-gray-700">Testimonials from your website</Label>
            <p className="text-xs text-gray-500 mt-1">
              We&apos;ll add these to your page word-for-word. Remove any you don&apos;t want.
            </p>
          </div>
          <div className="space-y-2">
            {importedTestimonials.map((t, i) => (
              <div
                key={i}
                className="relative rounded-lg border border-gray-200 bg-gray-50 p-3 pr-9"
              >
                <Quote className="w-3.5 h-3.5 text-brand-accentPrimary mb-1" />
                <p className="text-sm text-gray-800">&ldquo;{t.quote}&rdquo;</p>
                {(t.author_name || t.author_role) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {[t.author_name, t.author_role].filter(Boolean).join(' · ')}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => removeImportedTestimonial(i)}
                  title="Remove"
                  className="absolute top-2 right-2 p-1 rounded-full text-gray-400
                             hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {ASSET_FIELDS.map(({ key, label, hint }) => {
          const [val, setter] = togglesByKey[key];
          return (
            <button
              type="button"
              key={key}
              onClick={() => {
                setter(!val);
                if (key === 'hasTestimonials') setTestimonialsTouched(true);
              }}
              className={`w-full text-left p-4 rounded-lg border transition-all flex items-start justify-between ${
                val
                  ? 'border-brand-accentPrimary bg-brand-accentPrimary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div>
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-sm text-gray-500">{hint}</div>
              </div>
              <div
                className={`mt-1 w-10 h-6 rounded-full relative transition-colors ${
                  val ? 'bg-brand-accentPrimary' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    val ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {hasTestimonials && (
        <div className="space-y-2">
          <Label className="text-gray-700">
            What kind of testimonials? <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {TESTIMONIAL_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTestimonialType(value)}
                className={`px-3 py-2 rounded-md border text-sm transition-all ${
                  testimonialType === value
                    ? 'border-brand-accentPrimary bg-brand-accentPrimary/5 text-brand-accentPrimary ring-2 ring-brand-accentPrimary/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={!isValid}
        className="w-full bg-brand-accentPrimary hover:bg-orange-500"
        size="lg"
      >
        Continue
      </Button>
    </form>
  );
}
