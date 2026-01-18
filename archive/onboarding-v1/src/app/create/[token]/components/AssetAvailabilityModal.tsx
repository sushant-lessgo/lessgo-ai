"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssetAvailability } from "@/types/core/index";
import type { StartupStage } from "@/modules/inference/taxonomy";

interface AssetAvailabilityModalProps {
  isOpen: boolean;
  startupStage: StartupStage | undefined;
  onComplete: (availability: AssetAvailability) => void;
}

interface AssetCheckbox {
  key: keyof AssetAvailability;
  label: string;
  helperText: string;
  icon: string;
}

const ASSET_CHECKBOXES: AssetCheckbox[] = [
  {
    key: "productImages",
    label: "Product screenshots or mockups",
    helperText: "For hero, features, CTA sections",
    icon: "🖼️",
  },
  {
    key: "customerLogos",
    label: "Customer/company logos (3+)",
    helperText: "For social proof, case studies",
    icon: "🏢",
  },
  {
    key: "testimonials",
    label: "Customer testimonials or reviews",
    helperText: "For testimonial sections",
    icon: "💬",
  },
  {
    key: "founderPhoto",
    label: "Your photo (founder/team)",
    helperText: "For founder note, about sections",
    icon: "👤",
  },
  {
    key: "integrationLogos",
    label: "Integration partner logos",
    helperText: "For integration sections",
    icon: "🔗",
  },
  {
    key: "demoVideo",
    label: "Product demo video",
    helperText: "For how it works, hero sections",
    icon: "🎥",
  },
];

/**
 * Get smart defaults based on startup stage
 */
function getSmartDefaults(startupStage: StartupStage | undefined): AssetAvailability {
  if (!startupStage) {
    return {
      productImages: false,
      customerLogos: false,
      testimonials: false,
      founderPhoto: false,
      integrationLogos: false,
      demoVideo: false,
    };
  }

  // Map startup stage to defaults
  const stageToDefaults: Record<string, Partial<AssetAvailability>> = {
    // Idea/MVP stages - nothing checked
    "problem-exploration": {},
    "pre-mvp": {},
    "mvp-development": {},
    "mvp-launched": { productImages: true },
    "early-feedback": { productImages: true },

    // Traction stages - product images only
    "problem-solution-fit": { productImages: true },
    "validated-early": { productImages: true },
    "early-monetization": { productImages: true, testimonials: true },
    "building-v2": { productImages: true, testimonials: true },

    // Growth stages - product images + testimonials
    "targeting-pmf": { productImages: true, testimonials: true },
    "users-250-500": { productImages: true, testimonials: true },
    "users-500-1k": { productImages: true, testimonials: true, customerLogos: true },
    "users-1k-5k": { productImages: true, testimonials: true, customerLogos: true },
    "mrr-growth": { productImages: true, testimonials: true, customerLogos: true },

    // Scale stages - all except demo video
    "seed-funded": {
      productImages: true,
      testimonials: true,
      customerLogos: true,
      founderPhoto: true,
      integrationLogos: true,
    },
    "series-b": {
      productImages: true,
      testimonials: true,
      customerLogos: true,
      founderPhoto: true,
      integrationLogos: true,
    },
    "scaling-infra": {
      productImages: true,
      testimonials: true,
      customerLogos: true,
      founderPhoto: true,
      integrationLogos: true,
    },
    "global-suite": {
      productImages: true,
      testimonials: true,
      customerLogos: true,
      founderPhoto: true,
      integrationLogos: true,
    },
  };

  const defaults = stageToDefaults[startupStage] || {};

  return {
    productImages: defaults.productImages || false,
    customerLogos: defaults.customerLogos || false,
    testimonials: defaults.testimonials || false,
    founderPhoto: defaults.founderPhoto || false,
    integrationLogos: defaults.integrationLogos || false,
    demoVideo: defaults.demoVideo || false,
  };
}

export default function AssetAvailabilityModal({
  isOpen,
  startupStage,
  onComplete,
}: AssetAvailabilityModalProps) {
  const [availability, setAvailability] = useState<AssetAvailability>(
    getSmartDefaults(startupStage)
  );

  // Update defaults when startup stage changes
  useEffect(() => {
    setAvailability(getSmartDefaults(startupStage));
  }, [startupStage]);

  const toggleAsset = (key: keyof AssetAvailability) => {
    setAvailability((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleContinue = () => {
    onComplete(availability);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-8 animate-slideUp">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">🎨</span>
            <h2 className="text-2xl font-bold text-gray-900">
              Almost there! Quick asset check
            </h2>
          </div>
          <p className="text-gray-600 mt-2">
            This helps us choose the perfect layouts for your page. You can add
            these later.
          </p>
        </div>

        {/* Question */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What do you have ready?
        </h3>

        {/* Checkboxes */}
        <div className="space-y-3 mb-8">
          {ASSET_CHECKBOXES.map((checkbox) => {
            const isChecked = availability[checkbox.key];

            return (
              <div
                key={checkbox.key}
                onClick={() => toggleAsset(checkbox.key)}
                className={`
                  relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                  ${
                    isChecked
                      ? "border-brand-accentPrimary bg-orange-50"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Custom Checkbox */}
                  <div
                    className={`
                      flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5
                      ${
                        isChecked
                          ? "bg-brand-accentPrimary border-brand-accentPrimary"
                          : "bg-white border-gray-300"
                      }
                    `}
                  >
                    {isChecked && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0 text-2xl">{checkbox.icon}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">
                      {checkbox.label}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {checkbox.helperText}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleContinue}
            className="text-base font-semibold py-3 px-8 rounded-lg shadow transition-all duration-200 bg-brand-accentPrimary text-white hover:bg-orange-500 hover:shadow-lg transform hover:scale-105"
          >
            Confirm and Generate My Page
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
