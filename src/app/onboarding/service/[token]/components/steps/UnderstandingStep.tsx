'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import type { ServiceUnderstanding } from '@/hooks/useServiceGenerationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
// Shared editor reused from the product flow (same precedent as service
// GeneratingStep cross-imports).
import FeatureListEditor from '@/components/onboarding/shared/FeatureListEditor';
import {
  personaToServiceType,
  type ServiceType,
  type UserPersona,
} from '@/types/service';

type DeliveryModel = 'remote' | 'in-person' | 'hybrid';

const loadingMessages = [
  'Analyzing your business...',
  'Identifying who you serve...',
  'Extracting your services...',
  'Almost there...',
];

// Editable, persona-agnostic understanding (serviceType is derived separately).
interface UnderstandingEdits {
  whatYouDo: string;
  services: string[];
  targetClients: string[];
  outcomes: string[];
  deliveryModel: DeliveryModel;
}

function ChipEditor({
  label,
  hint,
  chips,
  onChange,
  placeholder,
  maxChips = 5,
}: {
  label: string;
  hint?: string;
  chips: string[];
  onChange: (chips: string[]) => void;
  placeholder: string;
  maxChips?: number;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleRemove = (index: number) => {
    onChange(chips.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    const value = inputValue.trim();
    if (value && chips.length < maxChips && !chips.includes(value)) {
      onChange([...chips, value]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {chips.map((chip, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer group"
            onClick={() => handleRemove(index)}
            title="Click to remove"
          >
            {chip}
            <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
          </span>
        ))}
        {chips.length < maxChips && (
          <div className="inline-flex items-center gap-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="h-8 w-40 text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAdd}
              disabled={!inputValue.trim()}
              className="h-8 px-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingView() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-brand-accentPrimary rounded-full animate-spin" />
      <p className="text-gray-600 animate-pulse">{loadingMessages[messageIndex]}</p>
      <div className="w-full max-w-sm space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function UnderstandingStep() {
  const posthog = usePostHog();
  const oneLiner = useServiceGenerationStore((s) => s.oneLiner);
  const understanding = useServiceGenerationStore((s) => s.understanding);
  const understandingLoading = useServiceGenerationStore((s) => s.understandingLoading);
  const understandingError = useServiceGenerationStore((s) => s.understandingError);
  const setUnderstanding = useServiceGenerationStore((s) => s.setUnderstanding);
  const setUnderstandingLoading = useServiceGenerationStore((s) => s.setUnderstandingLoading);
  const setUnderstandingError = useServiceGenerationStore((s) => s.setUnderstandingError);
  const resetUnderstanding = useServiceGenerationStore((s) => s.resetUnderstanding);
  const nextStep = useServiceGenerationStore((s) => s.nextStep);
  const prevStep = useServiceGenerationStore((s) => s.prevStep);

  const hasCalledApi = useRef(false);
  const [localEdits, setLocalEdits] = useState<UnderstandingEdits | null>(null);

  // serviceType is persona-derived (no visible badge). Seed from the user's
  // persona so it survives into the confirmed understanding for strategy /
  // section selection / palette fallback. Falls back to 'agency'.
  const serviceTypeRef = useRef<ServiceType>(
    understanding?.serviceType ?? 'agency'
  );
  useEffect(() => {
    let cancelled = false;
    fetch('/api/user/persona')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const persona = data?.persona as UserPersona | null;
        const seeded = persona ? personaToServiceType(persona) : null;
        if (seeded) serviceTypeRef.current = seeded;
      })
      .catch(() => {/* keep default */});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    posthog?.capture('service_onboarding_step_view', {
      step: 'understanding',
      stepIndex: 1,
      audienceType: 'service',
    });
  }, [posthog]);

  // Hydrate edits when the store gets an understanding (AI result or import).
  useEffect(() => {
    if (understanding && !localEdits) {
      setLocalEdits({
        whatYouDo: understanding.whatYouDo,
        services: understanding.services,
        targetClients: understanding.targetClients,
        outcomes: understanding.outcomes,
        deliveryModel: understanding.deliveryModel,
      });
    }
  }, [understanding, localEdits]);

  const callUnderstandAPI = useCallback(async () => {
    setUnderstandingLoading(true);
    setUnderstandingError(null);

    try {
      const response = await fetch('/api/v2/understand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oneLiner, audienceType: 'service' }),
      });

      const result = await response.json();

      if (result.success) {
        const data = result.data as UnderstandingEdits;
        setUnderstanding({ ...data, serviceType: serviceTypeRef.current });
        setLocalEdits({ ...data });
      } else {
        setUnderstandingError(result.message || 'Failed to analyze your business');
      }
    } catch {
      setUnderstandingError('Network error. Please try again.');
    }
  }, [oneLiner, setUnderstanding, setUnderstandingLoading, setUnderstandingError]);

  // Mount-only: fire inference ONLY when OneLinerStep flagged loading and there's
  // no understanding yet. An import-hydrated step (understanding set,
  // loading=false) skips this — no double charge.
  useEffect(() => {
    if (
      understandingLoading &&
      !understanding &&
      !understandingError &&
      !hasCalledApi.current
    ) {
      hasCalledApi.current = true;
      callUnderstandAPI();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: Partial<UnderstandingEdits>) => {
    if (localEdits) setLocalEdits({ ...localEdits, ...patch });
  };

  const isValid =
    !!localEdits &&
    localEdits.whatYouDo.trim().length > 0 &&
    localEdits.services.length > 0 &&
    localEdits.targetClients.length > 0 &&
    localEdits.outcomes.length > 0 &&
    localEdits.outcomes.every((o) => o.trim().length > 0) &&
    !!localEdits.deliveryModel;

  const handleConfirm = () => {
    if (!localEdits || !isValid) return;
    const confirmed: ServiceUnderstanding = {
      ...localEdits,
      whatYouDo: localEdits.whatYouDo.trim(),
      serviceType: serviceTypeRef.current,
    };
    setUnderstanding(confirmed);
    posthog?.capture('service_onboarding_step_submit', {
      step: 'understanding',
      audienceType: 'service',
      serviceCount: localEdits.services.length,
      targetClientCount: localEdits.targetClients.length,
      outcomeCount: localEdits.outcomes.length,
    });
    nextStep();
  };

  const handleEditOneLiner = () => {
    resetUnderstanding();
    hasCalledApi.current = false;
    setLocalEdits(null);
    prevStep();
  };

  if (understandingLoading && !understanding) {
    return <LoadingView />;
  }

  if (understandingError && !understanding) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            We couldn&apos;t understand that description
          </h2>
          <p className="mt-2 text-gray-600 max-w-sm">
            Try rephrasing it with more detail about what you do and who you do
            it for.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            onClick={handleEditOneLiner}
            className="w-full bg-brand-accentPrimary hover:bg-orange-500"
            size="lg"
          >
            Edit your one-liner
          </Button>
          <Button onClick={callUnderstandAPI} variant="outline" size="lg" className="w-full">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!localEdits) {
    return <LoadingView />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">We understood this</h1>
        <p className="mt-2 text-gray-600">
          Review and edit if needed. Click chips to remove.
        </p>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        <Label className="text-sm font-medium text-gray-700">What you do</Label>
        <Textarea
          value={localEdits.whatYouDo}
          onChange={(e) => update({ whatYouDo: e.target.value })}
          placeholder="Describe the service you provide and the result clients get..."
          className="min-h-[80px] bg-white"
          maxLength={200}
        />
        <p className="text-xs text-gray-400 text-right">
          {localEdits.whatYouDo.length}/200
        </p>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <ChipEditor
          label="Services"
          hint="e.g. Brand identity, Packaging design, Marketing site"
          chips={localEdits.services}
          onChange={(services) => update({ services })}
          placeholder="Add a service..."
          maxChips={8}
        />
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <ChipEditor
          label="Target clients"
          hint="Who you do your best work for"
          chips={localEdits.targetClients}
          onChange={(targetClients) => update({ targetClients })}
          placeholder="Add a client type..."
          maxChips={3}
        />
      </div>

      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Outcomes &amp; differentiators
        </Label>
        <p className="text-xs text-gray-500">
          The results and reasons clients pick you
        </p>
        <FeatureListEditor
          features={localEdits.outcomes}
          onChange={(outcomes) => update({ outcomes })}
          maxFeatures={6}
        />
      </div>

      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        <Label className="text-sm font-medium text-gray-700">Delivery</Label>
        <div className="grid grid-cols-3 gap-2">
          {(['remote', 'in-person', 'hybrid'] as DeliveryModel[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => update({ deliveryModel: m })}
              className={`px-3 py-2 rounded-md border text-sm capitalize transition-all ${
                localEdits.deliveryModel === m
                  ? 'border-brand-accentPrimary bg-brand-accentPrimary/5 text-brand-accentPrimary ring-2 ring-brand-accentPrimary/20'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {m === 'in-person' ? 'In-person' : m}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleConfirm}
        disabled={!isValid}
        className="w-full bg-brand-accentPrimary hover:bg-orange-500 hover:shadow-lg
                   transform hover:scale-105 transition-all duration-200"
        size="lg"
      >
        Looks Good
      </Button>
    </div>
  );
}
