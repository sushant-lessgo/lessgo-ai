'use client';

import { useState, useEffect } from 'react';
import { useGenerationStore } from '@/hooks/useGenerationStore';
import { useSimplifiedOnboardingV3 } from '@/hooks/useSimplifiedOnboarding';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  MessageSquareQuote,
  Building2,
  TrendingUp,
  Video,
  FileText,
  Camera,
  Play,
  RefreshCw,
  BadgeCheck,
  Newspaper,
  Users,
} from 'lucide-react';
import type { AssetAvailability, TestimonialType, SocialProofTypes } from '@/types/generation';

const defaultAssets: AssetAvailability = {
  hasTestimonials: false,
  hasSocialProof: false,
  hasConcreteResults: false,
  hasDemoVideo: false,
  testimonialType: null,
  socialProofTypes: null,
};

const defaultSocialProofTypes: SocialProofTypes = {
  hasLogos: false,
  hasMediaMentions: false,
  hasCertifications: false,
};

const testimonialTypeOptions: { value: TestimonialType; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: 'Text quotes', icon: <FileText className="w-4 h-4" /> },
  { value: 'photos', label: 'Photos with quotes', icon: <Camera className="w-4 h-4" /> },
  { value: 'video', label: 'Video testimonials', icon: <Play className="w-4 h-4" /> },
  { value: 'transformation', label: 'Transformation stories', icon: <RefreshCw className="w-4 h-4" /> },
];

const socialProofTypeOptions: { key: keyof SocialProofTypes; label: string; icon: React.ReactNode }[] = [
  { key: 'hasLogos', label: 'Company/client logos', icon: <Users className="w-4 h-4" /> },
  { key: 'hasMediaMentions', label: 'Media mentions', icon: <Newspaper className="w-4 h-4" /> },
  { key: 'hasCertifications', label: 'Certifications/badges', icon: <BadgeCheck className="w-4 h-4" /> },
];

export default function AssetAvailabilityStep() {
  const isV3 = useSimplifiedOnboardingV3();
  const assetAvailability = useGenerationStore((s) => s.assetAvailability);
  const setAssetAvailability = useGenerationStore((s) => s.setAssetAvailability);
  const setIVOCLoading = useGenerationStore((s) => s.setIVOCLoading);
  const setStrategyLoading = useGenerationStore((s) => s.setStrategyLoading);
  const setSimplifiedV3 = useGenerationStore((s) => s.setSimplifiedV3);
  const nextStep = useGenerationStore((s) => s.nextStep);

  const [assets, setAssets] = useState<AssetAvailability>(assetAvailability || defaultAssets);

  // Set V3 mode in store when component mounts
  useEffect(() => {
    setSimplifiedV3(isV3);
  }, [isV3, setSimplifiedV3]);

  const toggleMainAsset = (key: 'hasTestimonials' | 'hasSocialProof' | 'hasConcreteResults' | 'hasDemoVideo') => {
    setAssets((prev) => {
      const newValue = !prev[key];
      const updates: Partial<AssetAvailability> = { [key]: newValue };

      // Reset sub-options when unchecking
      if (key === 'hasTestimonials' && !newValue) {
        updates.testimonialType = null;
      }
      if (key === 'hasSocialProof' && !newValue) {
        updates.socialProofTypes = null;
      }

      return { ...prev, ...updates };
    });
  };

  const setTestimonialType = (type: TestimonialType) => {
    setAssets((prev) => ({ ...prev, testimonialType: type }));
  };

  const toggleSocialProofType = (key: keyof SocialProofTypes) => {
    setAssets((prev) => {
      const currentTypes = prev.socialProofTypes || defaultSocialProofTypes;
      return {
        ...prev,
        socialProofTypes: { ...currentTypes, [key]: !currentTypes[key] },
      };
    });
  };

  const handleContinue = () => {
    setAssetAvailability(assets);

    if (isV3) {
      // V3: Skip research, go directly to strategy
      setStrategyLoading(true);
    } else {
      // V2: Prime research step
      setIVOCLoading(true);
    }

    nextStep();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">What do you have ready?</h1>
        <p className="mt-2 text-gray-600">
          Check the assets you can provide (you can add them later too)
        </p>
      </div>

      <div className="space-y-3">
        {/* Testimonials */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <label className="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors">
            <Checkbox
              checked={assets.hasTestimonials}
              onCheckedChange={() => toggleMainAsset('hasTestimonials')}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Customer testimonials</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Reviews, quotes, or success stories from customers
              </p>
            </div>
          </label>

          {/* Testimonial type sub-options */}
          {assets.hasTestimonials && (
            <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">What type do you have?</p>
              <RadioGroup
                value={assets.testimonialType || ''}
                onValueChange={(v) => setTestimonialType(v as TestimonialType)}
                className="grid grid-cols-2 gap-2"
              >
                {testimonialTypeOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-colors ${
                      assets.testimonialType === opt.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value={opt.value} id={`testimonial-${opt.value}`} />
                    <span className="text-gray-600">{opt.icon}</span>
                    <Label htmlFor={`testimonial-${opt.value}`} className="text-sm cursor-pointer">
                      {opt.label}
                    </Label>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>

        {/* Social Proof */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <label className="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors">
            <Checkbox
              checked={assets.hasSocialProof}
              onCheckedChange={() => toggleMainAsset('hasSocialProof')}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Social proof</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Company logos, user counts, or media mentions
              </p>
            </div>
          </label>

          {/* Social proof type sub-options */}
          {assets.hasSocialProof && (
            <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">What do you have?</p>
              <div className="space-y-2">
                {socialProofTypeOptions.map((opt) => {
                  const isChecked = assets.socialProofTypes?.[opt.key] || false;
                  return (
                    <label
                      key={opt.key}
                      className={`flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-colors ${
                        isChecked ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleSocialProofType(opt.key)}
                      />
                      <span className="text-gray-600">{opt.icon}</span>
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Concrete Results */}
        <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all duration-200">
          <Checkbox
            checked={assets.hasConcreteResults}
            onCheckedChange={() => toggleMainAsset('hasConcreteResults')}
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Concrete results</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Specific stats, metrics, or case study data
            </p>
          </div>
        </label>

        {/* Demo Video */}
        <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all duration-200">
          <Checkbox
            checked={assets.hasDemoVideo}
            onCheckedChange={() => toggleMainAsset('hasDemoVideo')}
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Demo video</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Product walkthrough or demo video
            </p>
          </div>
        </label>
      </div>

      <p className="text-sm text-gray-500 text-center">
        Don&apos;t have these yet? No problem — we&apos;ll write draft copy and mark anything that
        needs your real data.
      </p>

      <Button
        onClick={handleContinue}
        className="w-full bg-brand-accentPrimary hover:bg-orange-500 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
