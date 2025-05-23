'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePostHog } from 'posthog-js/react';
import type { CtaConfigType } from "@/types"; // adjust path if needed
import type { Action } from "@/modules/generatedLanding/landingPageReducer";

type CTAConfiguratorPopoverProps = {
  ctaConfig: CtaConfigType | null;
  dispatch: React.Dispatch<Action>;
  closePopover: () => void;
  gptCtaText: string;
};



export function CTAConfiguratorPopover({
  ctaConfig,
  dispatch,
  closePopover,
  gptCtaText
}: CTAConfiguratorPopoverProps) {
  const posthog = usePostHog();

  const [ctaType, setCtaType] = useState<'link' | 'email-form'>();
  const [ctaText, setCtaText] = useState('');
  const [url, setUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [placement, setPlacement] = useState<'hero' | 'separate-section'>('hero');

  useEffect(() => {
  if (ctaConfig) {
    setCtaType(ctaConfig.type);
    setCtaText(ctaConfig.cta_text || "");
    if (ctaConfig.type === "link") {
      setUrl(ctaConfig.url || "");
    } else {
      setEmbedCode(ctaConfig.embed_code || "");
      setPlacement(ctaConfig.placement || "hero");
    }
  } else {
    // Prefill from GPT CTA text if available
    setCtaText(gptCtaText); // <-- you'll pass this as a prop
  }
}, [ctaConfig, gptCtaText]);

  const handleSave = () => {
    if (!ctaType) return;

    const newConfig = {
      type: ctaType,
      cta_text: ctaText,
      ...(ctaType === 'link'
        ? { url }
        : {
            embed_code: embedCode,
            placement,
          }),
    };

    dispatch({
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
      <Label>CTA Type</Label>
      <RadioGroup
        value={ctaType}
        onValueChange={(val) => {
          setCtaType(val as any);
          posthog.capture('cta_type_selected', { type: val });
        }}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="link" id="link" />
          <Label htmlFor="link">External Link</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="email-form" id="email-form" />
          <Label htmlFor="email-form">Email Form</Label>
        </div>
      </RadioGroup>

      <Label>CTA Button Text</Label>
      <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} />

      {ctaType === 'link' && (
        <>
          <Label>URL</Label>
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </>
      )}

      {ctaType === 'email-form' && (
        <>
          <Label>Embed Code</Label>
          <Input
      type="text"
      placeholder="Paste full HTML form embed (no scripts)"
      value={embedCode}
      onChange={(e) => setEmbedCode(e.target.value)}
    />
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
              <Label htmlFor="place-hero">Hero</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="separate-section" id="place-section" />
              <Label htmlFor="place-section">Offer Section</Label>
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
