'use client';

// src/components/editor/LinkTargetPopover.tsx
// scale-04 — ONE shared inline editor control for setting a nav/footer link's
// target. Replaces the 6 byte-for-byte-identical per-template copies
// (meridian/techpremium/vestria/surge/lumen/granth) that existed before.
//
// Modes:
//   - "Scroll to section": pick an on-page section → Destination { kind: 'section' } (manual)
//   - "Link" (derived):    pick a page / legal / social target → Destination + source:'derived'
//   - "Custom URL":        type any url → parsed by toDestination (external / call / …) (manual)
//
// It emits a `Link` object — `onChange(link: Link)`. Hand-typed / on-page picks
// are `source: 'manual'`; picks from a SITE SOURCE (sitemap pages, the legal
// privacy page, site-level social profiles) are `source: 'derived'` — they are
// never goal-referencing and a goal change never moves them (phase-6 acceptance).
// Callers whose stored field is a plain string convert with
// `resolveDestination(link.dest)`.
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
  value: string; // e.g. "#pricing" (section) or "/contact" (page pathSlug) or a social url
  label: string; // e.g. "Pricing"
}

interface LinkTargetPopoverProps {
  /** Current target — a raw href string (legacy) OR a Link object (new writes). */
  value: string | Link;
  sectionOptions: SectionOption[];
  pageOptions?: SectionOption[]; // cross-page targets (value = pathSlug) — DERIVED
  /** Legal pages (e.g. the privacy page). value = path ('/privacy'). DERIVED. */
  legalOptions?: SectionOption[];
  /** Site-level social profiles. value = profile url, label = platform. DERIVED. */
  socialOptions?: SectionOption[];
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
  legalOptions = [],
  socialOptions = [],
  onChange,
  triggerClassName,
}: LinkTargetPopoverProps) {
  const href = toHref(value);
  const isSectionHref = !!href && href.startsWith('#');

  // Derived options = sitemap pages + legal pages + social profiles. All resolve
  // to a Destination and are stored with source:'derived'.
  const hasDerived =
    pageOptions.length > 0 || legalOptions.length > 0 || socialOptions.length > 0;
  const derivedValues = React.useMemo(
    () =>
      new Set([
        ...pageOptions.map((o) => o.value),
        ...legalOptions.map((o) => o.value),
        ...socialOptions.map((o) => o.value),
      ]),
    [pageOptions, legalOptions, socialOptions],
  );
  const isDerivedHref = !!href && derivedValues.has(href);

  const [mode, setMode] = useState<'section' | 'url' | 'derived'>(
    isSectionHref || !href || href === '#'
      ? 'section'
      : isDerivedHref && hasDerived
      ? 'derived'
      : 'url',
  );
  const [urlDraft, setUrlDraft] = useState(
    isSectionHref || isDerivedHref ? '' : href === '#' ? '' : href,
  );

  const selectedSection = isSectionHref ? href : '';
  const selectedDerived = isDerivedHref ? href : '';

  // Parse a raw href (section anchor / custom url) into a MANUAL Link.
  const emitManual = (raw: string) => {
    const dest = toDestination(raw);
    if (dest && dest !== 'GOAL_REF') onChange({ dest, source: 'manual' });
  };

  // A derived pick (page / legal / social) → DERIVED Link. Social profiles keep
  // their `social` destination kind (platform + url); page/legal paths become a
  // `page` destination.
  const emitDerived = (rawValue: string) => {
    const social = socialOptions.find((o) => o.value === rawValue);
    if (social) {
      onChange({
        dest: { kind: 'social', platform: social.label, url: social.value },
        source: 'derived',
      });
      return;
    }
    if (!rawValue) return;
    onChange({ dest: { kind: 'page', pathSlug: rawValue }, source: 'derived' });
  };

  // Footers pass only page options → keep the familiar "Link to page" label; the
  // nav headers add legal/social → generic "Link".
  const derivedLabel =
    legalOptions.length || socialOptions.length ? 'Link' : 'Link to page';

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
            {hasDerived && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="link-target-mode"
                  checked={mode === 'derived'}
                  onChange={() => setMode('derived')}
                />
                {derivedLabel}
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
              onChange={(e) => emitManual(e.target.value)}
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
          ) : mode === 'derived' ? (
            <select
              className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={derivedValues.has(selectedDerived) ? selectedDerived : ''}
              onChange={(e) => emitDerived(e.target.value)}
            >
              <option value="" disabled>
                Choose target…
              </option>
              {pageOptions.length > 0 && (
                <optgroup label="Pages">
                  {pageOptions.map((o) => (
                    <option key={`p-${o.value}`} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              )}
              {legalOptions.length > 0 && (
                <optgroup label="Legal">
                  {legalOptions.map((o) => (
                    <option key={`l-${o.value}`} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              )}
              {socialOptions.length > 0 && (
                <optgroup label="Social">
                  {socialOptions.map((o) => (
                    <option key={`s-${o.value}`} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          ) : (
            <Input
              type="text"
              placeholder="https://…"
              value={urlDraft}
              onChange={(e) => {
                setUrlDraft(e.target.value);
                emitManual(e.target.value);
              }}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default LinkTargetPopover;
