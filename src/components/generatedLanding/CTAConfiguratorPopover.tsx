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
  <div className="flex items-start space-x-2">
    <RadioGroupItem value="link" id="link" />
    <div>
      <Label htmlFor="link">External Link</Label>
      <p className="text-sm text-muted-foreground">
        Redirect visitors to a tool like Typeform, Calendly, Notion, or your own site.
      </p>
    </div>
  </div>

  <div className="flex items-start space-x-2 mt-2">
    <RadioGroupItem value="email-form" id="email-form" />
    <div>
      <Label htmlFor="email-form">Email Form Embed</Label>
      <p className="text-sm text-muted-foreground">
        Paste raw HTML from Mailchimp, ConvertKit, Brevo, etc. to collect emails here directly.
      </p>
    </div>
  </div>
</RadioGroup>

<Label className="mt-4 block">CTA Button Text*</Label>
<Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
{errors.ctaText && <p className="text-sm text-red-500 mt-1">{errors.ctaText}</p>}

{ctaType === 'link' && (
  <>
    <div className="p-2 bg-muted border text-sm rounded-md text-muted-foreground my-2">
      Paste a URL from tools like Typeform, Calendly, Notion, or any external landing page.
    </div>
    <Label>URL*</Label>
    <Input
      type="url"
      placeholder="https://your-form-link.com"
      value={url}
      onChange={(e) => setUrl(e.target.value)}
    />
    {errors.url && <p className="text-sm text-red-500 mt-1">{errors.url}</p>}
  </>
)}

{ctaType === 'email-form' && (
  <>
    <div className="p-2 bg-muted border text-sm rounded-md text-muted-foreground my-2">
      Paste full HTML embed code (without scripts) from tools like Mailchimp, ConvertKit, or Brevo.
      <br />
      <span className="italic text-xs">Example:</span>
      <pre className="bg-gray-100 mt-1 p-2 rounded text-xs overflow-auto">
{`<form action="https://yourmailchimp.com">
  <input type="email" name="EMAIL" />
  <button type="submit">Subscribe</button>
</form>`}
      </pre>
    </div>

    <Label>Embed Code*</Label>
    <Input
      type="text"
      placeholder="Paste HTML form code here"
      value={embedCode}
      onChange={(e) => setEmbedCode(e.target.value)}
    />
    {errors.embedCode && <p className="text-sm text-red-500 mt-1">{errors.embedCode}</p>}
    <p className="text-xs text-muted-foreground mt-1">
      Only pure HTML embeds are supported. Script-based forms (e.g. Mailchimp JS) are not supported.
    </p>

    <Label className="mt-4 block">Placement</Label>
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
            Best for single input fields. Appears at the top and also in the offer section.
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
            Ideal for multi-field forms. Hero button scrolls to this section.
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
