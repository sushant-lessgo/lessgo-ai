// src/modules/goals/goalToDestination.ts
// scale-04 (phase 2) — resolve a project Brief.goal into a click Destination.
// Plain module (NO 'use client') so both renderers' normalization pre-pass
// (phase 3) can import it firewall-safely.
//
// Maps the FROZEN goal mechanism vocabulary (src/modules/goals/vocabulary.ts,
// M1–M5) onto the Destination union (src/types/destination.ts). The return type
// is WIDENED (D-E) to `{ dest, formId? }` so the M1 on-site-form case can carry
// a `formId` alongside the anchor Destination — a `section` Destination has no
// formId slot. normalizeCtas (phase 3) maps that pair to the legacy
// `{type:'form', formId}` buttonConfig; M2–M5 omit formId.
//
// Unresolvable input (no goal, no mechanism, or a mechanism whose destination is
// unusable/malformed) → `undefined`: the caller falls back to legacy behavior
// (form section / `#cta`), so every existing project renders unchanged.
//
// goal-ref-cta (D-C): a goal that EXISTS but is missing its required param
// (M2 phone/email, M3 url, M4 links — the F14 "Skip for now" case) → `null`,
// which normalizeCtas maps to an inert `#` no-op (never a dead/broken href).
// `null` (param-less) is deliberately distinct from `undefined` (leave the
// entry untouched → template fallback). M1/M5 keep their working defaults.

import type { Brief } from '@/types/brief';
import type { Destination } from '@/types/destination';
import { isDestination } from '@/types/destination';
import { toDestination } from '@/utils/destinationShim';

type Goal = NonNullable<Brief['goal']>;

export interface GoalDestination {
  dest: Destination;
  /** On-site form connection (M1 only). Carried alongside the anchor Destination. */
  formId?: string;
}

/** First entry of a string | string[] goal destination, or undefined. */
function firstDestination(destination: Goal['destination']): string | undefined {
  if (destination === undefined) return undefined;
  if (Array.isArray(destination)) {
    const first = destination.find((d) => typeof d === 'string' && d.length > 0);
    return first;
  }
  return destination.length > 0 ? destination : undefined;
}

/** Best-effort social platform label from a profile URL host. Falls back to
 *  'website' when the host is unrecognized (still a valid social Destination).
 *  Exported so the M4 follow-strip injector (scale-05 phase 8) reuses this ONE
 *  inferer rather than duplicating a second platform table. */
export function inferPlatform(url: string): string {
  const host = /^https?:\/\/([^/]+)/i.exec(url)?.[1]?.toLowerCase() ?? url.toLowerCase();
  const table: Array<[RegExp, string]> = [
    [/instagram/, 'instagram'],
    [/(facebook|fb\.com)/, 'facebook'],
    [/(twitter|x\.com)/, 'twitter'],
    [/linkedin/, 'linkedin'],
    [/(youtube|youtu\.be)/, 'youtube'],
    [/tiktok/, 'tiktok'],
    [/threads/, 'threads'],
    [/pinterest/, 'pinterest'],
    [/(whatsapp|wa\.me)/, 'whatsapp'],
    [/t\.me|telegram/, 'telegram'],
  ];
  for (const [re, name] of table) {
    if (re.test(host)) return name;
  }
  return 'website';
}

/**
 * Resolve a Brief.goal into a Destination (+ optional formId for M1).
 *
 * @param goal the project goal (Brief.goal); undefined/null → undefined return.
 * @param ctx.forms the project's forms map; the first form id is used as the M1
 *        form connection (matches how a primary "on-site form" CTA wires up).
 */
export function goalToDestination(
  goal: Brief['goal'] | null | undefined,
  ctx: { forms?: Record<string, unknown> | undefined },
): GoalDestination | null | undefined {
  if (!goal || !goal.mechanism) return undefined;

  switch (goal.mechanism) {
    case 'M1': {
      // On-site form → the shared #form-section anchor + the connected formId.
      // formId is the first form on the project (if any); a missing formId still
      // returns the anchor pair — normalizeCtas emits {type:'form'} and the
      // legacy reader's own forms check falls back, identical either way.
      const formId = ctx.forms ? Object.keys(ctx.forms)[0] : undefined;
      return { dest: { kind: 'section', anchor: 'form-section' }, formId };
    }

    case 'M2': {
      // Direct channel: parse the destination string (wa.me → whatsapp,
      // tel: → call, mailto: → email; anything else → external) via the shim.
      // D-C: required param (phone/email) missing → `null` (inert `#` no-op at
      // normalizeCtas), distinct from `undefined` (leave the entry untouched).
      const raw = firstDestination(goal.destination);
      if (!raw) return null;
      const dest = toDestination(raw);
      if (dest === undefined || dest === 'GOAL_REF' || !isDestination(dest)) return undefined;
      // scale-05 phase 6: enrich a WhatsApp destination that carries no inline
      // ?text= with the materialized param.message (covers Briefs written by
      // other paths — e.g. classify — that set param.message but composed a
      // plain wa.me destination). Additive: never overrides an existing msg.
      if (dest.kind === 'whatsapp' && dest.msg === undefined && goal.param?.message) {
        return { dest: { ...dest, msg: goal.param.message } };
      }
      return { dest };
    }

    case 'M3': {
      // Redirect out: external URL verbatim (store badge, Amazon, Calendly, …).
      // D-C: missing url param → `null` (inert `#` no-op).
      const raw = firstDestination(goal.destination);
      if (!raw) return null;
      return { dest: { kind: 'external', url: raw } };
    }

    case 'M4': {
      // Subscribe / follow: a social profile link (platform inferred) or, when
      // the host is unrecognized, an external redirect. No formId.
      // D-C: missing links param → `null` (inert `#` no-op).
      const raw = firstDestination(goal.destination);
      if (!raw) return null;
      const platform = inferPlatform(raw);
      if (platform === 'website') return { dest: { kind: 'external', url: raw } };
      return { dest: { kind: 'social', platform, url: raw } };
    }

    case 'M5': {
      // Scroll / anchor (wayfinding): a same-page section anchor.
      const raw = firstDestination(goal.destination);
      if (!raw) return undefined;
      return { dest: { kind: 'section', anchor: raw.replace(/^#/, '') } };
    }

    default:
      return undefined;
  }
}
