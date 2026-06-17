'use client';

// src/modules/templates/techpremium/components/LinkTargetPopover.tsx
// Inline editor control for setting a nav/footer link's target. Two modes:
//   - "Scroll to section": pick an on-page section → writes href="#<anchor>"
//   - "Custom URL": type any url → writes href verbatim
// Shared by TechPremiumNav + TechPremiumFooter (edit mode only). Writes back via the
// caller's onChange, which persists into the link's existing `href` field. Section
// anchors come from buildSectionAnchorMap so they match the ids the renderer emits.

import React, { useState } from 'react';
import { Link2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

export interface SectionOption {
  value: string; // e.g. "#pricing"
  label: string; // e.g. "Pricing"
}

interface LinkTargetPopoverProps {
  href: string;
  sectionOptions: SectionOption[];
  onChange: (href: string) => void;
  triggerClassName?: string;
}

export function LinkTargetPopover({
  href,
  sectionOptions,
  onChange,
  triggerClassName,
}: LinkTargetPopoverProps) {
  const isSectionHref = !!href && href.startsWith('#');
  const [mode, setMode] = useState<'section' | 'url'>(
    isSectionHref || !href || href === '#' ? 'section' : 'url'
  );
  const [urlDraft, setUrlDraft] = useState(isSectionHref ? '' : href === '#' ? '' : href);

  const selectedSection = isSectionHref ? href : '';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Set link target"
          title="Set link target"
          className={
            triggerClassName ??
            'inline-flex items-center justify-center w-4 h-4 opacity-50 hover:opacity-100 transition-opacity'
          }
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'currentColor' }}
        >
          <Link2 size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 text-sm">
        <div className="space-y-3">
          <div className="flex gap-3 text-xs font-medium">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="link-target-mode"
                checked={mode === 'section'}
                onChange={() => setMode('section')}
              />
              Scroll to section
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="link-target-mode"
                checked={mode === 'url'}
                onChange={() => setMode('url')}
              />
              Custom URL
            </label>
          </div>

          {mode === 'section' ? (
            <select
              className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={sectionOptions.some((o) => o.value === selectedSection) ? selectedSection : ''}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="" disabled>
                Choose section…
              </option>
              {sectionOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <Input
              type="text"
              placeholder="https://…"
              value={urlDraft}
              onChange={(e) => {
                setUrlDraft(e.target.value);
                onChange(e.target.value);
              }}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default LinkTargetPopover;
