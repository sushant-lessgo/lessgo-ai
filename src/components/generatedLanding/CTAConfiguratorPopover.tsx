'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePostHog } from 'posthog-js/react';
import type { CtaConfigType } from "@/types";
import type { Action } from "@/modules/generatedLanding/landingPageReducer";
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


type CTAConfiguratorPopoverProps = {
  ctaConfig: CtaConfigType | null;
  dispatch?: React.Dispatch<Action>;
  closePopover: () => void;
  gptCtaText: string;
};

export function CTAConfiguratorPopover({
  ctaConfig,
  dispatch,
  closePopover,
  gptCtaText,
}: CTAConfiguratorPopoverProps) {
  const posthog = usePostHog();

  const [ctaType, setCtaType] = useState<'link' | 'email-form'>();
  const [ctaText, setCtaText] = useState('');
  const [url, setUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [placement, setPlacement] = useState<'hero' | 'separate-section'>('hero');
  const [errors, setErrors] = useState<{ ctaText?: string; url?: string; embedCode?: string }>({});

  useEffect(() => {
    if (ctaConfig) {
      setCtaType(ctaConfig.type);
      setCtaText(ctaConfig.cta_text || '');
      if (ctaConfig.type === 'link') {
        setUrl(ctaConfig.url || '');
      } else {
        setEmbedCode(ctaConfig.embed_code || '');
        setPlacement(ctaConfig.placement || 'hero');
      }
    } else {
      setCtaText(gptCtaText);
    }
  }, [ctaConfig, gptCtaText]);

  const handleSave = () => {
    const newErrors: typeof errors = {};

    if (!ctaText.trim()) {
      newErrors.ctaText = 'CTA button text is required.';
    }

    if (ctaType === 'link' && !url.trim()) {
      newErrors.url = 'URL is required for external link.';
    }

    if (ctaType === 'email-form' && !embedCode.trim()) {
      newErrors.embedCode = 'Embed code is required for email form.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const newConfig = {
      type: ctaType!,
      cta_text: ctaText.trim(),
      ...(ctaType === 'link'
        ? { url: url.trim() }
        : { embed_code: embedCode.trim(), placement }),
    };

    dispatch?.({
      type: 'UPDATE_FIELD',
      payload: {
        path: 'hero.ctaConfig',
        value: newConfig,
      },
    });

    posthog.capture('cta_config_saved', newConfig);
    closePopover();
  };

  const handleCancel = () => {
    posthog.capture('cta_config_cancelled', {
      type: ctaType,
      cta_text: ctaText,
      url,
      embed_code: embedCode,
      placement,
    });
    closePopover();
  };

  return (
    <div className="flex flex-col gap-4">
      <Label>CTA Type*</Label>
<RadioGroup
  value={ctaType}
  onValueChange={(val) => {
    setCtaType(val as any);
    posthog.capture("cta_type_selected", { type: val });
  }}
>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="link" id="link" />
    <Tooltip>
      <TooltipTrigger asChild>
        <Label htmlFor="link" className="cursor-help">
          External Link
        </Label>
      </TooltipTrigger>
      <TooltipContent>
        Redirects users to another page or site
      </TooltipContent>
    </Tooltip>
  </div>

  <div className="flex items-center space-x-2">
    <RadioGroupItem value="email-form" id="email-form" />
    <Tooltip>
      <TooltipTrigger asChild>
        <Label htmlFor="email-form" className="cursor-help">
          Email Form
        </Label>
      </TooltipTrigger>
      <TooltipContent>
        Collects user emails for your mailing list from here itself
      </TooltipContent>
    </Tooltip>
  </div>
</RadioGroup>

      <Label>CTA Button Text*</Label>
      <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
      {errors.ctaText && <p className="text-sm text-red-500 mt-1">{errors.ctaText}</p>}

      {ctaType === 'link' && (
        <>
          <Label>URL*</Label>
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {errors.url && <p className="text-sm text-red-500 mt-1">{errors.url}</p>}
        </>
      )}

      {ctaType === 'email-form' && (
        <>
          <Label>Embed Code*</Label>
          <Input
            type="text"
            placeholder="Paste full HTML form embed (no scripts)"
            value={embedCode}
            onChange={(e) => setEmbedCode(e.target.value)}
          />
          {errors.embedCode && <p className="text-sm text-red-500 mt-1">{errors.embedCode}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            Only pure HTML embeds are supported. Script-based forms (e.g. Mailchimp JS) are not supported.
          </p>

          <Label>Placement</Label>
          <RadioGroup
            value={placement}
            onValueChange={(val) => setPlacement(val as any)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hero" id="place-hero" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label htmlFor="place-hero" className="cursor-help">
                    Hero
                  </Label>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Best for single input fields. Appears prominently at the top and is repeated in the offer section.
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="separate-section" id="place-section" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label htmlFor="place-section" className="cursor-help">
                    Offer Section
                  </Label>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Ideal for multiple input fields. Hero button scrolls to this section.
                </TooltipContent>
              </Tooltip>
            </div>
          </RadioGroup>
        </>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}
