'use client';

// src/modules/templates/vestria/components/LinkTargetPopover.tsx
// Inline editor control for setting a link's target (nav items, CTAs, footer links).
//   - "Scroll to section": pick an on-page section → writes href="#<anchor>"
//   - "Link to page": pick another page → writes href="/<pathSlug>" (hidden when none)
//   - "Custom URL": type any url → writes href verbatim (tel:/wa.me/mailto links)
// Generic copy of the Granth/Lumen popover (no template tokens). Edit mode only —
// NEVER imported by the published renderer.

import React, { useState } from 'react';
import { Link2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

export interface SectionOption {
  value: string; // e.g. "#books"
  label: string; // e.g. "Books"
}

interface LinkTargetPopoverProps {
  href: string;
  sectionOptions: SectionOption[];
  pageOptions?: SectionOption[]; // cross-page targets (value = pathSlug)
  onChange: (href: string) => void;
  triggerClassName?: string;
}

export function LinkTargetPopover({
  href,
  sectionOptions,
  pageOptions = [],
  onChange,
  triggerClassName,
}: LinkTargetPopoverProps) {
  const isSectionHref = !!href && href.startsWith('#');
  const isPageHref = !!href && href.startsWith('/');
  const [mode, setMode] = useState<'section' | 'url' | 'page'>(
    isSectionHref || !href || href === '#'
      ? 'section'
      : isPageHref && pageOptions.length
      ? 'page'
      : 'url'
  );
  const [urlDraft, setUrlDraft] = useState(isSectionHref || isPageHref ? '' : href === '#' ? '' : href);

  const selectedSection = isSectionHref ? href : '';
  const selectedPage = isPageHref ? href : '';

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
            {pageOptions.length > 0 && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="link-target-mode"
                  checked={mode === 'page'}
                  onChange={() => setMode('page')}
                />
                Link to page
              </label>
            )}
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
          ) : mode === 'page' ? (
            <select
              className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={pageOptions.some((o) => o.value === selectedPage) ? selectedPage : ''}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="" disabled>
                Choose page…
              </option>
              {pageOptions.map((o) => (
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
