'use client';

import { useState, useEffect } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePostHog } from 'posthog-js/react';
import {
  personaToServiceType,
  type ServiceType,
  type ServiceGoal,
  type UserPersona,
} from '@/types/service';

const examples = [
  'Boutique branding studio for DTC skincare brands',
  'Performance marketing agency for B2B SaaS startups',
  'Web design studio for indie founders launching their first product',
];

/** Normalize user input to an http(s) URL; returns null if not URL-like.
 *  Copied from product OneLinerStep. */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProto);
    if (!u.hostname.includes('.')) return null;
    return u.href;
  } catch {
    return null;
  }
}

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
  const businessName = useServiceGenerationStore((s) => s.businessName);
  const setOneLiner = useServiceGenerationStore((s) => s.setOneLiner);
  const setBusinessName = useServiceGenerationStore((s) => s.setBusinessName);
  const setUnderstanding = useServiceGenerationStore((s) => s.setUnderstanding);
  const setUnderstandingLoading = useServiceGenerationStore((s) => s.setUnderstandingLoading);
  const setOffer = useServiceGenerationStore((s) => s.setOffer);
  const setGoal = useServiceGenerationStore((s) => s.setGoal);
  const setImportSourceUrl = useServiceGenerationStore((s) => s.setImportSourceUrl);
  const setImportedTestimonials = useServiceGenerationStore((s) => s.setImportedTestimonials);
  const nextStep = useServiceGenerationStore((s) => s.nextStep);

  const [local, setLocal] = useState(oneLiner);
  const [localBusinessName, setLocalBusinessName] = useState(businessName);
  const validation = validateOneLiner(local);
  const isValid = validation.valid;

  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const normalizedUrl = normalizeUrl(url);

  useEffect(() => {
    posthog?.capture('service_onboarding_step_view', {
      step: 'oneLiner',
      stepIndex: 0,
      audienceType: 'service',
    });
  }, [posthog]);

  const handleImport = async () => {
    if (!normalizedUrl || importing) return;
    setImporting(true);
    setImportError(null);

    // Fetch persona in PARALLEL with the scrape (the scrape dominates latency, so
    // this is effectively free) and derive the real serviceType. Doing it here —
    // not via UnderstandingStep's async effect — closes the import + instant-confirm
    // race that would otherwise ship a mislabeled serviceType for non-agency personas.
    const personaP = fetch('/api/user/persona')
      .then((r) => r.json())
      .then((d) => (d?.persona ?? null) as UserPersona | null)
      .catch(() => null);

    try {
      const res = await fetch('/api/v2/scrape-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl, audienceType: 'service' }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setImportError(
          json?.message || "Couldn't read that site. Fill it in manually below."
        );
        return;
      }
      const d = json.data;
      const persona = await personaP;
      const serviceType: ServiceType =
        (persona ? personaToServiceType(persona) : null) ?? 'agency';

      // Hydrate the store directly. We set `understanding` (not understandingLoading)
      // so UnderstandingStep renders its confirm view without firing a second
      // /understand call — no double charge.
      setOneLiner(d.oneLiner || '');
      if (d.businessName) setBusinessName(d.businessName);
      setUnderstanding({
        whatYouDo: d.whatYouDo ?? '',
        services: d.services ?? [],
        targetClients: d.targetClients ?? [],
        outcomes: d.outcomes ?? [],
        deliveryModel: d.deliveryModel ?? 'remote',
        serviceType,
      });
      if (d.offer) setOffer(d.offer);
      if (d.goal) setGoal(d.goal as ServiceGoal);
      setImportedTestimonials(Array.isArray(d.testimonials) ? d.testimonials : []);
      setImportSourceUrl(normalizedUrl);
      posthog?.capture('service_onboarding_import', {
        audienceType: 'service',
        testimonialsFound: Array.isArray(d.testimonials) ? d.testimonials.length : 0,
      });
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
    setOneLiner(local.trim());
    setBusinessName(localBusinessName.trim());
    // Flag loading so UnderstandingStep auto-fires the inference call on mount
    // (mirror product OneLinerStep). Import path sets understanding directly and
    // does NOT set this, so it won't double-charge.
    setUnderstandingLoading(true);
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
            placeholder="yourstudio.com"
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
            We&apos;ll pull your services + testimonials. You can review everything next.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">or describe it manually</span>
        <div className="h-px flex-1 bg-gray-200" />
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

      {/* Business name (optional) */}
      <div className="space-y-2">
        <Label htmlFor="businessName" className="text-gray-700">
          Studio / business name <span className="text-gray-400">(optional)</span>
        </Label>
        <Input
          id="businessName"
          placeholder="Studio Hearth"
          value={localBusinessName}
          onChange={(e) => setLocalBusinessName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isValid) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
        />
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
