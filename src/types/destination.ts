// src/types/destination.ts
// scale-04 — single destination vocabulary for the click system.
//
// One `Destination` union is consumed by a single dumb resolver
// (`resolveDestination` in `src/utils/resolveCtaHref.ts`). Buttons convert
// (by reference to the project goal, via `GOAL_REF`); links navigate (explicit).
//
// This file is types-only — no runtime behavior beyond the type guards, which
// are plain predicate functions (server-safe, no 'use client').

/** Where a click goes. Every variant resolves to a plain href string. */
export type Destination =
  | { kind: 'section'; anchor: string }
  | { kind: 'page'; pathSlug: string }
  | { kind: 'external'; url: string }
  | { kind: 'whatsapp'; number: string; msg?: string }
  | { kind: 'call'; number: string }
  | { kind: 'email'; addr: string }
  | { kind: 'download'; fileUrl: string }
  | { kind: 'social'; platform: string; url: string };

export type DestinationKind = Destination['kind'];

/**
 * A CTA button. Buttons convert. A primary button defaults to `'GOAL_REF'`,
 * which resolves from the project's persisted `Brief.goal` at render (see the
 * normalization pre-pass, phase 3). Secondary buttons pick an explicit `dest`.
 * `formId` carries an on-site form connection alongside the destination.
 */
export interface CTAButton {
  role: 'primary' | 'secondary';
  dest: 'GOAL_REF' | Destination;
  formId?: string;
}

/**
 * A navigation link. Links navigate — they NEVER reference the goal. `source`
 * records whether the destination was hand-picked (`'manual'`) or derived from
 * a site source such as the sitemap / social profiles (`'derived'`).
 */
export interface Link {
  dest: Destination;
  source: 'derived' | 'manual';
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isDestination(value: unknown): value is Destination {
  if (!value || typeof value !== 'object') return false;
  const kind = (value as { kind?: unknown }).kind;
  return (
    kind === 'section' ||
    kind === 'page' ||
    kind === 'external' ||
    kind === 'whatsapp' ||
    kind === 'call' ||
    kind === 'email' ||
    kind === 'download' ||
    kind === 'social'
  );
}

export function isGoalRef(value: unknown): value is 'GOAL_REF' {
  return value === 'GOAL_REF';
}

export function isCTAButton(value: unknown): value is CTAButton {
  if (!value || typeof value !== 'object') return false;
  const v = value as { role?: unknown; dest?: unknown };
  if (v.role !== 'primary' && v.role !== 'secondary') return false;
  return v.dest === 'GOAL_REF' || isDestination(v.dest);
}

export function isLink(value: unknown): value is Link {
  if (!value || typeof value !== 'object') return false;
  const v = value as { dest?: unknown; source?: unknown };
  if (v.source !== 'derived' && v.source !== 'manual') return false;
  return isDestination(v.dest);
}
