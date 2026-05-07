'use client';

import { useState, useEffect } from 'react';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePostHog } from 'posthog-js/react';
import ChipInput from '../fields/ChipInput';

type DeliveryModel = 'remote' | 'in-person' | 'hybrid';

export default function UnderstandingStep() {
  const posthog = usePostHog();
  const understanding = useServiceGenerationStore((s) => s.understanding);
  const setUnderstanding = useServiceGenerationStore((s) => s.setUnderstanding);
  const nextStep = useServiceGenerationStore((s) => s.nextStep);

  const [serviceCategories, setServiceCategories] = useState<string[]>(
    understanding?.serviceCategories ?? []
  );
  const [industries, setIndustries] = useState<string[]>(
    understanding?.industries ?? []
  );
  const [services, setServices] = useState<string[]>(
    understanding?.services ?? []
  );
  const [targetClients, setTargetClients] = useState<string>(
    understanding?.targetClients ?? ''
  );
  const [deliveryModel, setDeliveryModel] = useState<DeliveryModel>(
    (understanding?.deliveryModel as DeliveryModel) ?? 'remote'
  );

  useEffect(() => {
    posthog?.capture('service_onboarding_step_view', {
      step: 'understanding',
      stepIndex: 1,
      projectType: 'service',
    });
  }, [posthog]);

  const targetTrim = targetClients.trim();
  const isValid =
    serviceCategories.length >= 1 &&
    industries.length >= 1 &&
    services.length >= 1 &&
    targetTrim.length >= 3 &&
    !!deliveryModel;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setUnderstanding({
      serviceType: 'agency',
      serviceCategories,
      industries,
      services,
      targetClients: targetTrim,
      deliveryModel,
    });
    posthog?.capture('service_onboarding_step_submit', {
      step: 'understanding',
      projectType: 'service',
      categoryCount: serviceCategories.length,
      industryCount: industries.length,
      serviceCount: services.length,
    });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Tell us about your studio
        </h1>
        <p className="mt-2 text-gray-600">
          A few details so the page can speak directly to your kind of client.
        </p>
      </div>

      {/* Service type — locked badge */}
      <div className="space-y-2">
        <Label className="text-gray-700">Studio type</Label>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-sm text-brand-accentPrimary">
          <span className="font-medium">Agency</span>
          <span className="text-xs text-gray-500">(pilot)</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-700">
          Service categories <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs text-gray-500">
          e.g. Branding, Packaging design, Web design
        </p>
        <ChipInput
          value={serviceCategories}
          onChange={setServiceCategories}
          placeholder="Add a category, press Enter"
          ariaLabel="Service categories"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-gray-700">
          Industries you work with <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs text-gray-500">
          e.g. Skincare, Beauty, DTC
        </p>
        <ChipInput
          value={industries}
          onChange={setIndustries}
          placeholder="Add an industry, press Enter"
          ariaLabel="Industries"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetClients" className="text-gray-700">
          Target client <span className="text-red-500">*</span>
        </Label>
        <Input
          id="targetClients"
          placeholder="Founders launching DTC skincare brands"
          value={targetClients}
          onChange={(e) => setTargetClients(e.target.value)}
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-gray-700">
          Specific services <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs text-gray-500">
          e.g. Brand identity, Packaging system, Marketing site
        </p>
        <ChipInput
          value={services}
          onChange={setServices}
          placeholder="Add a service, press Enter"
          ariaLabel="Services"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-gray-700">
          Delivery <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {(['remote', 'in-person', 'hybrid'] as DeliveryModel[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDeliveryModel(m)}
              className={`px-3 py-2 rounded-md border text-sm capitalize transition-all ${
                deliveryModel === m
                  ? 'border-brand-accentPrimary bg-brand-accentPrimary/5 text-brand-accentPrimary ring-2 ring-brand-accentPrimary/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {m === 'in-person' ? 'In-person' : m}
            </button>
          ))}
        </div>
      </div>

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
