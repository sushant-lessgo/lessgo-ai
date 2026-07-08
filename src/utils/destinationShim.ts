// src/utils/destinationShim.ts
// scale-04 — dual-read migration shim (D-D). Plain module (NO 'use client').
//
// Maps every legacy click shape — raw href strings and the old ad-hoc
// `buttonConfig` — onto the single `Destination` vocabulary, losslessly, so
// old saved pages keep rendering byte-identically once `resolveCtaHref` is
// rewritten to route through `resolveDestination`.
//
// PURE: no `forms` param. The legacy `type:'form'` case is NOT handled here —
// its forms-existence check lives in the `resolveCtaHref` wrapper (D-D), which
// resolves the form case itself and never passes a form buttonConfig here.

import type { CTAButton, Destination, Link } from '@/types/destination';
import { isCTAButton, isLink } from '@/types/destination';

/**
 * Superset of the 3 divergent legacy `ButtonConfig` interfaces the scout found
 * (`resolveCtaHref.CtaButtonConfig`, `ButtonConfigurationModal`,
 * `FormConnectedButton`). Every field optional — this is a read-only view over
 * `any`-typed persisted data.
 */
export interface LegacyButtonConfig {
  type?: 'link' | 'form' | 'link-with-input' | 'page';
  text?: string;
  url?: string;
  pageId?: string;
  pathSlug?: string;
  formId?: string;
  behavior?: 'scrollTo' | 'openModal';
  ctaType?: 'primary' | 'secondary';
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

/**
 * Classify a raw href string into a Destination. Every branch round-trips
 * byte-identically through `resolveDestination` for canonical inputs; the
 * `external` default guarantees any unrecognized string resolves back verbatim.
 */
function classifyString(str: string): Destination {
  if (str.startsWith('#')) {
    return { kind: 'section', anchor: str.slice(1) };
  }
  if (str.startsWith('/')) {
    return { kind: 'page', pathSlug: str };
  }
  if (str.startsWith('tel:')) {
    return { kind: 'call', number: str.slice('tel:'.length) };
  }
  if (str.startsWith('mailto:')) {
    return { kind: 'email', addr: str.slice('mailto:'.length) };
  }
  if (/(?:wa\.me\/|api\.whatsapp\.com)/i.test(str)) {
    return parseWhatsapp(str);
  }
  // `^https?` and everything else → external (verbatim round-trip).
  return { kind: 'external', url: str };
}

/** Parse a wa.me / api.whatsapp.com URL into a whatsapp Destination. */
function parseWhatsapp(str: string): Destination {
  // api.whatsapp.com/send?phone=<n>&text=<m>
  const apiMatch = /api\.whatsapp\.com\/send/i.test(str);
  if (apiMatch) {
    const phone = /[?&]phone=([^&]*)/i.exec(str)?.[1] ?? '';
    const textRaw = /[?&]text=([^&]*)/i.exec(str)?.[1];
    const number = safeDecode(phone);
    if (textRaw !== undefined) {
      return { kind: 'whatsapp', number, msg: safeDecode(textRaw) };
    }
    return { kind: 'whatsapp', number };
  }
  // wa.me/<number>?text=<m>
  const after = str.split('wa.me/')[1] ?? '';
  const [numberPart, queryPart] = after.split('?');
  const textRaw = queryPart ? /(?:^|&)text=([^&]*)/i.exec(queryPart)?.[1] : undefined;
  if (textRaw !== undefined) {
    return { kind: 'whatsapp', number: numberPart, msg: safeDecode(textRaw) };
  }
  return { kind: 'whatsapp', number: numberPart };
}

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

/**
 * Dual-read any legacy or new click shape into a Destination (or `'GOAL_REF'`
 * for a goal-referencing CTA, or `undefined` when there's nothing to resolve).
 *
 * PURE — the legacy `type:'form'` case returns `undefined` here (the wrapper
 * owns it); callers must handle the form case before calling this.
 */
export function toDestination(
  raw: string | LegacyButtonConfig | Link | CTAButton | undefined,
): Destination | 'GOAL_REF' | undefined {
  if (raw === undefined || raw === null) return undefined;

  if (typeof raw === 'string') {
    return classifyString(raw);
  }

  // New shapes first (they don't carry a legacy `type` field).
  if (isCTAButton(raw)) {
    return raw.dest;
  }
  if (isLink(raw)) {
    return raw.dest;
  }

  // Legacy buttonConfig.
  const cfg = raw as LegacyButtonConfig;
  switch (cfg.type) {
    case 'page':
      return { kind: 'page', pathSlug: cfg.pathSlug ?? '' };
    case 'link':
    case 'link-with-input': {
      // link-with-input folds into external{url}+formId; formId rides on the
      // CTAButton separately, so toDestination emits just the url Destination.
      const url = cfg.url ?? '';
      const d = classifyString(url);
      // Legacy links stored a verbatim url (the write path never normalized) —
      // never re-canonicalize whatsapp, or non-canonical stored links mangle.
      return d.kind === 'whatsapp' ? { kind: 'external', url } : d;
    }
    case 'form':
      // NOT handled here (D-D) — the resolveCtaHref wrapper owns the form case.
      return undefined;
    default:
      return undefined;
  }
}
