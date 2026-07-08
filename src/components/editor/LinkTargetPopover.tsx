'use client';

// src/components/editor/LinkTargetPopover.tsx
// scale-04 — ONE shared inline editor control for setting a nav/footer link's
// target. Replaces the 6 byte-for-byte-identical per-template copies
// (meridian/techpremium/vestria/surge/lumen/granth) that existed before.
//
// Three modes:
//   - "Scroll to section": pick an on-page section → Destination { kind: 'section' }
//   - "Link to page":      pick a cross-page target → Destination { kind: 'page' }
//   - "Custom URL":        type any url → parsed by toDestination (external / call /
//                          email / whatsapp / …)
//
// Unlike the old copies (which emitted a raw href string), this emits a `Link`
// object — `onChange(link: Link)` — with `source: 'manual'`. Callers whose stored
// field is a plain string convert with `resolveDestination(link.dest)`.
//
// The incoming `value` is read as `string | Link` (old saved pages pass a raw
// string href) via `toDestination`, so the popover opens on the right mode either
// way. Section anchors come from buildSectionLinkOptions; pages from
// buildPageLinkOptions — matching the ids/paths the renderers emit.

import React, { useState } from 'react';
import { Link2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import type { Link } from '@/types/destination';
import { toDestination } from '@/utils/destinationShim';
import { resolveDestination } from '@/utils/resolveCtaHref';

export interface SectionOption {
  value: string; // e.g. "#pricing" (section) or "/contact" (page pathSlug)
  label: string; // e.g. "Pricing"
}

interface LinkTargetPopoverProps {
  /** Current target — a raw href string (legacy) OR a Link object (new writes). */
  value: string | Link;
  sectionOptions: SectionOption[];
  pageOptions?: SectionOption[]; // cross-page targets (value = pathSlug)
  onChange: (link: Link) => void;
  triggerClassName?: string;
}

/** Read the incoming string|Link value into a plain href string for the UI. */
function toHref(value: string | Link): string {
  const dest = toDestination(value);
  return dest && dest !== 'GOAL_REF' ? resolveDestination(dest) : '';
}

export function LinkTargetPopover({
  value,
  sectionOptions,
  pageOptions = [],
  onChange,
  triggerClassName,
}: LinkTargetPopoverProps) {
  const href = toHref(value);
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

  // Parse a raw href (section anchor / page path / custom url) into a manual Link.
  const emit = (raw: string) => {
    const dest = toDestination(raw);
    if (dest && dest !== 'GOAL_REF') onChange({ dest, source: 'manual' });
  };

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
              onChange={(e) => emit(e.target.value)}
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
              onChange={(e) => emit(e.target.value)}
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
                emit(e.target.value);
              }}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default LinkTargetPopover;
