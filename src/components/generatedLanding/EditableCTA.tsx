'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { CTAConfiguratorPopover } from './CTAConfiguratorPopover';
import type { CtaConfigType } from '@/types';
import type { Action } from '@/modules/generatedLanding/landingPageReducer';

interface EditableCTAProps {
  ctaConfig: CtaConfigType | null;
  isEditable: boolean;
  dispatch?: React.Dispatch<Action>;
  ctaText: string;
}

export function EditableCTA({ ctaConfig, isEditable, dispatch, ctaText }: EditableCTAProps) {
  const [open, setOpen] = useState(false);
  const posthog = usePostHog();

  const openConfig = () => {
    setOpen(true);
    posthog.capture("cta_config_open", {
      location: "hero",
      state: ctaConfig ? "edit_existing" : "create_new",
    });
  };

  // Special case: email-form placed in hero → show gear only
  if (ctaConfig?.type != null) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={openConfig}
            className="absolute top-0 right-0 bg-white shadow rounded-full p-2 hover:bg-gray-100 transition z-10"
            title="Edit CTA"
          >
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-96">
          <CTAConfiguratorPopover
            ctaConfig={ctaConfig}
            dispatch={dispatch}
            closePopover={() => setOpen(false)}
            gptCtaText={ctaText}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // Default case: full Configure CTA card
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          onClick={openConfig}
          className="w-full cursor-pointer border border-gray-300 bg-muted p-6 rounded-xl flex flex-col items-center justify-center gap-2 text-center hover:bg-gray-100 transition shadow-sm"
        >
          <Settings className="w-6 h-6 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Configure CTA</span>
          <span className="text-xs text-gray-500">Add a button or form</span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <CTAConfiguratorPopover
          ctaConfig={ctaConfig}
          dispatch={dispatch}
          closePopover={() => setOpen(false)}
          gptCtaText={ctaText}
        />
      </PopoverContent>
    </Popover>
  );
} 
