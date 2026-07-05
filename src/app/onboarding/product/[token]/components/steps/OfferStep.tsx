'use client';

import { useState } from 'react';
import { Quote, X } from 'lucide-react';
import { useProductGenerationStore } from '@/hooks/useProductGenerationStore';
import { getPageArchetypesForTemplate } from '@/modules/audience/product/pageArchetypes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const examples = [
  'Free 14-day trial, no credit card',
  'Generate your first 10 invoices free',
  'Early access + founding-member pricing',
];

export default function OfferStep() {
  const offer = useProductGenerationStore((s) => s.offer);
  const setOffer = useProductGenerationStore((s) => s.setOffer);
  const importedTestimonials = useProductGenerationStore((s) => s.importedTestimonials);
  const setImportedTestimonials = useProductGenerationStore((s) => s.setImportedTestimonials);
  const nextStep = useProductGenerationStore((s) => s.nextStep);
  const goToStep = useProductGenerationStore((s) => s.goToStep);
  const templateId = useProductGenerationStore((s) => s.templateId);

  const [local, setLocal] = useState(offer);
  const trimmed = local.trim();
  const isValid = trimmed.length >= 10;

  const removeTestimonial = (index: number) => {
    setImportedTestimonials(importedTestimonials.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setOffer(trimmed);
    // Single-page templates (meridian) have no page menu → skip the sitemap
    // gate entirely (zero behavior change); multi-page templates enter it.
    if (getPageArchetypesForTemplate(templateId)) {
      nextStep();
    } else {
      goToStep('generating');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          What do they get to start?
        </h1>
        <p className="mt-2 text-gray-600">
          The thing on the other side of the CTA — a free trial, early access,
          a starter credit. Specific beats generic.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="offer" className="text-gray-700">
          Your offer <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="offer"
          placeholder="Free 14-day trial, no credit card"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          className="min-h-[80px]"
          maxLength={300}
        />
        <p className="text-xs text-gray-400 text-right">{local.length}/300</p>

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

      {importedTestimonials.length > 0 && (
        <div className="space-y-3 pt-2">
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
                  onClick={() => removeTestimonial(i)}
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
