// src/components/toolbars/buttonCtaAdapter.ts
// toolbar-beta-followup phase 2 — pure adapter between ButtonConfigurationModal's
// flat `ButtonConfig` state and (a) the persisted `CTAButton` shape, (b) the
// shared `LinkPicker` (its dual-read `value` + emitted `Link`).
//
// Plain module (NO 'use client') — published/client-boundary hygiene. Every
// function here is pure so the modal's persistence path stays byte-identical:
// `buildCtaButton` / `configFromCta` are the EXACT functions that used to live in
// ButtonConfigurationModal.tsx (moved verbatim so a unit test can pin the fragile
// GOAL_REF preservation without dragging in the client modal).
//
// GOAL_REF NEVER routes through LinkPicker: the modal-level `followGoal` toggle
// owns the goal-following branch (buildCtaButton line below), entirely outside the
// picker. LinkPicker strips GOAL_REF by design and can only emit a concrete
// Destination, so `applyPickerLink` never sees one.

import { toDestination } from '@/utils/destinationShim';
import { resolveDestination } from '@/utils/resolveCtaHref';
import type { CTAButton, Destination, Link } from '@/types/destination';

export interface ButtonConfig {
  type: 'link' | 'form' | 'link-with-input' | 'page';
  text: string;
  url?: string;
  pageId?: string; // cross-page link: target page id
  pathSlug?: string; // cross-page link: target page pathSlug ('/contact')
  formId?: string;
  behavior?: 'scrollTo' | 'openModal';
  ctaType?: 'primary' | 'secondary'; // NEW: CTA type for placement logic
  inputConfig?: {
    label?: string;
    placeholder?: string;
    queryParamName?: string;
  };
  leadingIcon?: string;
  trailingIcon?: string;
  iconConfig?: {
    leadingSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    trailingSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  };
}

// scale-04: reverse-map a saved CTAButton (explicit destination) back into the
// modal's flat ButtonConfig so the form fields prefill on reopen. Icons/inputs
// ride on the legacy buttonConfig (the new shape doesn't carry them), so we pull
// those from `legacy` when available.
export function configFromCta(
  cta: CTAButton,
  text: string,
  role: 'primary' | 'secondary',
  legacy: any,
): ButtonConfig {
  const dest = cta.dest as Destination;
  const base: ButtonConfig = {
    type: 'link',
    text,
    ctaType: role,
    leadingIcon: legacy?.leadingIcon,
    trailingIcon: legacy?.trailingIcon,
    iconConfig: legacy?.iconConfig || { leadingSize: 'md', trailingSize: 'md' },
  };
  if (cta.formId && dest?.kind === 'section' && dest.anchor === 'form-section') {
    return { ...base, type: 'form', formId: cta.formId, behavior: legacy?.behavior || 'scrollTo' };
  }
  if (dest?.kind === 'page') {
    return { ...base, type: 'page', pathSlug: dest.pathSlug };
  }
  // external / whatsapp / call / email / social / download → a plain link url.
  return { ...base, type: 'link', url: dest ? resolveDestination(dest) : '' };
}

// scale-04: build the new CTAButton write from the modal state. Primary + follow
// goal ⇒ GOAL_REF. A FORM cta ALWAYS carries `formId` (the pre-pass detects the
// form case by formId — a form-intent cta without it is mis-mapped to a link).
// `link-with-input` is NOT representable in the new shape (it carries inputConfig)
// ⇒ returns undefined so the legacy buttonConfig renders it instead.
export function buildCtaButton(
  config: ButtonConfig,
  role: 'primary' | 'secondary',
  followGoal: boolean,
): CTAButton | undefined {
  if (role === 'primary' && followGoal) {
    return { role: 'primary', dest: 'GOAL_REF' };
  }
  switch (config.type) {
    case 'form':
      return config.formId
        ? { role, dest: { kind: 'section', anchor: 'form-section' }, formId: config.formId }
        : undefined;
    case 'page':
      return { role, dest: { kind: 'page', pathSlug: config.pathSlug ?? '' } };
    case 'link': {
      const d = toDestination(config.url ?? '');
      return d && d !== 'GOAL_REF' ? { role, dest: d } : undefined;
    }
    case 'link-with-input':
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// LinkPicker adapter (toolbar-beta-followup phase 2)
// ---------------------------------------------------------------------------

/**
 * Current href for LinkPicker's dual-read `value` (string | Link). A `page`
 * config yields its pathSlug; a `link` config yields its url; anything else
 * (form / link-with-input — the picker isn't shown for those) yields ''.
 */
export function configToPickerValue(config: ButtonConfig): string {
  if (config.type === 'page') return config.pathSlug ?? '';
  if (config.type === 'link') return config.url ?? '';
  return '';
}

/**
 * Fold a LinkPicker emission back into ButtonConfig. A `page` destination maps to
 * `{type:'page', pathSlug}`; every other Destination kind resolves to a plain href
 * string on `{type:'link', url}`. `link.source` is UI-ephemeral and DROPPED here —
 * nothing persists it for buttons. LinkPicker can never emit GOAL_REF, so the
 * goal-following branch stays entirely modal-level.
 */
export function applyPickerLink(config: ButtonConfig, link: Link): ButtonConfig {
  if (link.dest.kind === 'page') {
    return { ...config, type: 'page', pathSlug: link.dest.pathSlug };
  }
  return { ...config, type: 'link', url: resolveDestination(link.dest) };
}
