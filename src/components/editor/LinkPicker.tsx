'use client';

// src/components/editor/LinkPicker.tsx
// toolbar-standard-beta phase 3 (t4) — THE shared link-target picker. Replaces
// `LinkTargetPopover` at all 15 edit-side mounts across 14 files (nav headers,
// footers — LumenFooter has 2 — and the atelier/vestria/granth/work-skeleton
// editPrimitives `E.Link`).
//
// EMISSION CONTRACT — DO NOT DRIFT. Every published counterpart reads the href
// this writes, so the emitted `Link` shape is load-bearing and is pinned by a
// parity test (`LinkPicker.test.tsx`) whose expected payloads were validated
// DIFFERENTIALLY against `LinkTargetPopover` while both components still existed:
//   - section anchor / custom URL → { dest, source: 'manual'  }
//   - page / legal / social pick  → { dest, source: 'derived' }
// `emitManual` / `emitDerived` below are carried over from the popover verbatim.
// Derived picks come from a SITE SOURCE (sitemap pages, the legal privacy page,
// site-level social profiles): they are never goal-referencing and a goal change
// never moves them (scale-04 phase-6 acceptance).
//
// The incoming `value` is dual-read as `string | Link` (old saved pages pass a
// raw string href) via `toDestination`, so the picker opens on the right mode
// either way. Section anchors come from buildSectionLinkOptions; pages from
// buildPageLinkOptions — matching the ids/paths the renderers emit.
//
// SCOPE NOTES (toolbar-standard-beta plan):
//   - NO "open in new tab" switch (ruling 1). `Link` has no newTab field —
//     new-tab is DERIVED at render by `externalLinkProps` (external ⇒ _blank).
//     A stored toggle would need both published renderers to read a new field.
//   - The handoff's Done / Cancel / Remove footer is NOT built. The popover
//     emitted LIVE on every select/keystroke and all 14 mounts persist on that
//     callback; a commit-on-Done model would change when every one of them
//     saves. "Remove" is likewise unexpressible — `Link` has no empty dest.
//   - No controlled `open`/`onOpenChange` or trigger-less mode: the plan listed
//     them for shell-mounted toolbar use, which is BLOCKED this phase (see the
//     audit). Unused API is the trap that killed the dead nav editors (ruling 3)
//     — it lands in the phase that has a consumer.

import React, { useState } from 'react';
import { Link2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import type { Link } from '@/types/destination';
import { toDestination } from '@/utils/destinationShim';
import { resolveDestination } from '@/utils/resolveCtaHref';

export interface SectionOption {
  value: string; // e.g. "#pricing" (section) or "/contact" (page pathSlug) or a social url
  label: string; // e.g. "Pricing"
}

interface LinkPickerProps {
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

type Mode = 'section' | 'url' | 'derived';

export function LinkPicker({
  value,
  sectionOptions,
  pageOptions = [],
  legalOptions = [],
  socialOptions = [],
  onChange,
  triggerClassName,
}: LinkPickerProps) {
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

  const [mode, setMode] = useState<Mode>(
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

  // Footers pass only page options → keep the familiar "Page" label; the nav
  // headers add legal/social → generic "Link".
  const derivedLabel = legalOptions.length || socialOptions.length ? 'Link' : 'Page';

  const selectClassName =
    'w-full rounded-[11px] border border-[#e6e6ec] bg-white px-[13px] py-[11px] text-[13px] font-medium text-[#191922] focus:outline-none focus:ring-1 focus:ring-[#006CFF]';

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
      <PopoverContent
        align="start"
        className="w-[284px] overflow-hidden rounded-[16px] border-[#e6e6ec] p-0 shadow-[0_24px_54px_-16px_rgba(20,20,40,.32)]"
        data-testid="link-picker"
      >
        {/* header */}
        <div className="px-4 pb-[14px] pt-4 leading-[1.3]">
          <div className="text-[15px] font-semibold text-[#191922]">Link</div>
          <div className="mt-px text-[11.5px] text-[#a6a6b0]">Where should this go?</div>
        </div>

        {/* type: text segmented (ui-foundation primitive) */}
        <div className="px-4 pb-[14px]">
          <SegmentedControl
            aria-label="Link type"
            className="flex w-full [&>button]:flex-1 [&>button]:justify-center"
            value={mode}
            onValueChange={(v) => setMode(v as Mode)}
            options={[
              { value: 'section', label: 'Section' },
              ...(hasDerived ? [{ value: 'derived', label: derivedLabel }] : []),
              { value: 'url', label: 'Web' },
            ]}
          />
        </div>

        {/* destination field */}
        <div className="px-4 pb-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[.09em] text-[#a6a6b0]">
            Destination
          </div>
          {mode === 'section' ? (
            <select
              aria-label="Choose section"
              className={selectClassName}
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
              aria-label="Choose target"
              className={selectClassName}
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
              aria-label="Custom URL"
              placeholder="https://…"
              className="h-auto rounded-[11px] border-[#e6e6ec] px-[13px] py-[11px] text-[13px]"
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

export default LinkPicker;
