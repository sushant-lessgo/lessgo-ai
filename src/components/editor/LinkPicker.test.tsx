// toolbar-standard-beta phase 3 — t4 LinkPicker EMISSION PARITY.
//
// WHY THIS TEST EXISTS (read before editing):
// `LinkPicker` replaces `LinkTargetPopover` at 15 edit-side mounts (14 files —
// LumenFooter has 2). Deleting the popover COMPONENT is published-safe ('use client', never imported published-side).
// Changing what it EMITS is not: every published counterpart reads the href written
// through this `onChange`, and `source: 'manual' | 'derived'` decides whether a goal
// change may later move the link (scale-04 phase-6). A one-word slip
// ('manual' ↔ 'derived') is invisible to tsc and to every other test in the repo.
//
// HOW IT WAS VALIDATED — DIFFERENTIALLY:
// While `LinkTargetPopover` still existed, EVERY payload constant below was asserted
// against BOTH components mounted with identical props and driven through the same
// interaction. The popover was the ground truth: a mistyped constant failed the
// popover half immediately. Phase 3's deletion step then removed ONLY the popover
// half; these constants and the LinkPicker assertions are BYTE-IDENTICAL to the
// version that ran green against the popover.
//
// DO NOT "fix" a failure here by re-recording what LinkPicker emits. That launders a
// regression: the constants are the pin, not the output. If LinkPicker's emission
// changed, either it is a bug, or a spec changed the published contract — and then
// `src/modules/templates/linkTargetPublished.test.tsx` (which renders the real
// published navs) must change with it.
//
// No @testing-library/react in the repo — react-dom/client + React.act, per
// src/components/ui/segmented-control.test.tsx.

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { LinkPicker } from './LinkPicker';
import type { Link } from '@/types/destination';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

// ─────────────────────────────────────────────────────────────────────────────
// Shared props — identical for every mount.
// ─────────────────────────────────────────────────────────────────────────────
const SECTION_OPTIONS = [
  { value: '#pricing', label: 'Pricing' },
  { value: '#faq', label: 'FAQ' },
];
const PAGE_OPTIONS = [
  { value: '/contact', label: 'Contact' },
  { value: '/about', label: 'About' },
];
const LEGAL_OPTIONS = [{ value: '/privacy', label: 'Privacy Policy' }];
const SOCIAL_OPTIONS = [{ value: 'https://instagram.com/acme', label: 'Instagram' }];

// ─────────────────────────────────────────────────────────────────────────────
// THE PIN — expected onChange payloads per link type.
//
// Section anchors and hand-typed URLs are MANUAL (the user chose them here).
// Pages / legal / social come from a SITE SOURCE ⇒ DERIVED.
// Pinned from LinkTargetPopover.tsx:99-118 and differentially proven against it.
// ─────────────────────────────────────────────────────────────────────────────
const EXPECT_SECTION: Link = { dest: { kind: 'section', anchor: 'pricing' }, source: 'manual' };
const EXPECT_PAGE: Link = { dest: { kind: 'page', pathSlug: '/contact' }, source: 'derived' };
const EXPECT_LEGAL: Link = { dest: { kind: 'page', pathSlug: '/privacy' }, source: 'derived' };
const EXPECT_SOCIAL: Link = {
  dest: { kind: 'social', platform: 'Instagram', url: 'https://instagram.com/acme' },
  source: 'derived',
};
const EXPECT_EXTERNAL_URL: Link = {
  dest: { kind: 'external', url: 'https://cal.com/acme' },
  source: 'manual',
};
const EXPECT_TEL_URL: Link = { dest: { kind: 'call', number: '+31612345678' }, source: 'manual' };

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

// ─────────────────────────────────────────────────────────────────────────────
// Driver. Radix portals PopoverContent to document.body, so queries are global.
// ─────────────────────────────────────────────────────────────────────────────
function mountPicker(props: Partial<React.ComponentProps<typeof LinkPicker>> = {}) {
  const onChange = vi.fn();
  act(() =>
    root.render(
      <LinkPicker
        value=""
        sectionOptions={SECTION_OPTIONS}
        onChange={onChange}
        {...props}
      />,
    ),
  );
  return onChange;
}

function openPicker() {
  const trigger = container.querySelector<HTMLButtonElement>('[aria-label="Set link target"]');
  if (!trigger) throw new Error('link trigger not found');
  act(() => trigger.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  const panel = document.body.querySelector<HTMLElement>('[data-testid="link-picker"]');
  if (!panel) throw new Error('link picker panel did not open');
  return panel;
}

/** Click a segmented type tab by its visible label. */
function selectMode(label: string) {
  const tab = Array.from(
    document.body.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
  ).find((b) => b.textContent?.trim() === label);
  if (!tab) throw new Error(`type tab "${label}" not found`);
  act(() => tab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
}

/** Set a <select>'s value and fire React's change event. */
function chooseOption(selectEl: HTMLSelectElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value',
    )!.set!;
    setter.call(selectEl, value);
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

/** Type into the custom-URL input (React-controlled → native setter + input event). */
function typeUrl(value: string) {
  const input = document.body.querySelector<HTMLInputElement>('[aria-label="Custom URL"]');
  if (!input) throw new Error('custom URL input not found');
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )!.set!;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function theSelect(): HTMLSelectElement {
  const el = document.body.querySelector<HTMLSelectElement>(
    '[data-testid="link-picker"] select',
  );
  if (!el) throw new Error('destination select not found');
  return el;
}

describe('LinkPicker — emission parity (the published href contract)', () => {
  it('section anchor → source:"manual"', () => {
    const onChange = mountPicker();
    openPicker();
    chooseOption(theSelect(), '#pricing');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(EXPECT_SECTION);
  });

  it('page pick → source:"derived"', () => {
    const onChange = mountPicker({ pageOptions: PAGE_OPTIONS });
    openPicker();
    selectMode('Page');
    chooseOption(theSelect(), '/contact');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(EXPECT_PAGE);
  });

  it('legal pick → page dest, source:"derived"', () => {
    const onChange = mountPicker({ pageOptions: PAGE_OPTIONS, legalOptions: LEGAL_OPTIONS });
    openPicker();
    selectMode('Link');
    chooseOption(theSelect(), '/privacy');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(EXPECT_LEGAL);
  });

  it('social pick → social dest (platform+url), source:"derived"', () => {
    const onChange = mountPicker({ pageOptions: PAGE_OPTIONS, socialOptions: SOCIAL_OPTIONS });
    openPicker();
    selectMode('Link');
    chooseOption(theSelect(), 'https://instagram.com/acme');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(EXPECT_SOCIAL);
  });

  it('custom URL → external dest, source:"manual"', () => {
    const onChange = mountPicker();
    openPicker();
    selectMode('Web');
    typeUrl('https://cal.com/acme');
    expect(onChange).toHaveBeenLastCalledWith(EXPECT_EXTERNAL_URL);
  });

  it('custom tel: URL → call dest, source:"manual" (classifyString is live)', () => {
    const onChange = mountPicker();
    openPicker();
    selectMode('Web');
    typeUrl('tel:+31612345678');
    expect(onChange).toHaveBeenLastCalledWith(EXPECT_TEL_URL);
  });

  // The derived tab is labelled "Page" for footers (pages only) and "Link" for nav
  // headers (which add legal/social). Pinned because the two labels are how the
  // above tests address the tab at all.
  it('derived tab is absent with no derived options', () => {
    mountPicker();
    openPicker();
    const labels = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
    ).map((b) => b.textContent?.trim());
    expect(labels).toEqual(['Section', 'Web']);
  });
});


describe('LinkPicker — dual-shape `value` acceptance (string | Link)', () => {
  it('legacy raw string href opens on the matching mode and preselects it', () => {
    mountPicker({ value: '#faq' });
    openPicker();
    expect(theSelect().value).toBe('#faq');
  });

  it('a Link object opens on the matching mode and preselects it', () => {
    const value: Link = { dest: { kind: 'section', anchor: 'faq' }, source: 'manual' };
    mountPicker({ value });
    openPicker();
    expect(theSelect().value).toBe('#faq');
  });

  it('a derived Link object opens on the derived mode', () => {
    const value: Link = { dest: { kind: 'page', pathSlug: '/about' }, source: 'derived' };
    mountPicker({ value, pageOptions: PAGE_OPTIONS });
    openPicker();
    expect(theSelect().value).toBe('/about');
  });

  it('an external Link object opens on the URL mode with the url drafted', () => {
    const value: Link = { dest: { kind: 'external', url: 'https://cal.com/acme' }, source: 'manual' };
    mountPicker({ value });
    openPicker();
    const input = document.body.querySelector<HTMLInputElement>('[aria-label="Custom URL"]');
    expect(input?.value).toBe('https://cal.com/acme');
  });
});
