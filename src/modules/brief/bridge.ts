// src/modules/brief/bridge.ts
// Brief → wizard prefill bridges — PURE module (scale-02 phase 1, plan D3/D5).
// SERVE writes Project.brief; each wizard page.tsx mount-hydrates its store
// from these prefills (phase 6 wiring). All fields read from
// brief.facts.entry; return null when absent (hydrate no-op guard — today's
// flows byte-identical when Project.brief is null).

import type { Brief } from '@/types/brief';
import type { ServiceGoal, ServiceType } from '@/types/service';
import type { LandingGoal } from '@/types/generation';
import type { GoalIntent, GoalMechanism } from '@/modules/goals/vocabulary';
import { goalIntentMeta } from '@/modules/goals/vocabulary';
import type { BusinessTypeKey } from '@/modules/businessTypes/config';
import { getEntryFacts } from './classify';
import { buildWhatsappPrefill, type WhatsappFacts } from '@/modules/goals/whatsappPrefill';

/**
 * businessType → ServiceType (plan D3 — persona is dead; SERVE only happens
 * with a KNOWN businessType, so the map is businessType-keyed and tiny).
 * Fallback 'agency' matches OneLinerStep's existing fallback.
 */
const BUSINESS_TYPE_TO_SERVICE_TYPE: Partial<Record<BusinessTypeKey, ServiceType>> = {
  agency: 'agency',
  consultant: 'consultancy',
  coach: 'coaching',
  // work-contract phase 4 — designer → 'agency' (same as photographer's fallback,
  // bridge.test.ts:58); no dedicated ServiceType exists for the work vertical yet.
  designer: 'agency',
};

export function serviceTypeForBusinessType(businessType: string | undefined): ServiceType {
  return BUSINESS_TYPE_TO_SERVICE_TYPE[businessType as BusinessTypeKey] ?? 'agency';
}

/**
 * goalIntent → ServiceGoal — direct where names match; unmapped ⇒ undefined
 * (GoalStep asks anyway).
 */
const INTENT_TO_SERVICE_GOAL: Partial<Record<GoalIntent, ServiceGoal>> = {
  'book-call': 'book-call',
  'request-quote': 'request-quote',
  'lead-magnet': 'lead-magnet',
  'apply': 'apply',
  'subscribe-newsletter': 'subscribe-newsletter',
};

/** goalIntent → product LandingGoal — small table vs `landingGoals`; unmapped ⇒ undefined. */
const INTENT_TO_LANDING_GOAL: Partial<Record<GoalIntent, LandingGoal>> = {
  'waitlist': 'waitlist',
  'signup-free': 'signup',
  'free-trial': 'free-trial',
  'buy-via-link': 'buy',
  'request-demo': 'demo',
  'download-app': 'download',
  'enquiry': 'enquiry',
};

/**
 * ===== Reverse maps (scale-05 phase 1) — legacy goal enum → GoalIntent =====
 * TOTAL by construction (Record, not Partial): every legacy goal maps to an
 * intent so `legacyGoalToBriefGoal` can always compose a Brief.goal. Legacy
 * enums stay alive (design call #4) — these maps only feed the Brief writeback.
 */
export const SERVICE_GOAL_TO_INTENT: Record<ServiceGoal, GoalIntent> = {
  'book-call': 'book-call',
  'request-quote': 'request-quote',
  'lead-magnet': 'lead-magnet',
  'apply': 'apply',
  // Closest intent: downloading a portfolio is a gated-resource grab (M1).
  'download-portfolio': 'lead-magnet',
  'subscribe-newsletter': 'subscribe-newsletter',
};

export const LANDING_GOAL_TO_INTENT: Record<LandingGoal, GoalIntent> = {
  'waitlist': 'waitlist',
  'signup': 'signup-free',
  'free-trial': 'free-trial',
  'buy': 'buy-via-link',
  'demo': 'request-demo',
  'download': 'download-app',
  'enquiry': 'enquiry',
};

/**
 * ===== Forward map (scale-05 phase 9) — GoalIntent → legacy goal =====
 * The intent-first wizard captures a `GoalIntent` directly, but every
 * downstream generation path (copy prompts, form seed, injectors, writeback)
 * still keys on the legacy `ServiceGoal`/`LandingGoal`. This helper mirrors the
 * picked intent to its legacy enum so the store can persist BOTH — legacy
 * enums stay alive (design call #4), nothing downstream breaks. Unmapped
 * intents fall back per audience (product → `signup`, service → `book-call`);
 * the writeback prefers the real `goalIntent` over this legacy mirror.
 */
export function intentToLegacyGoal(
  intent: GoalIntent,
  audience: 'product',
): LandingGoal;
export function intentToLegacyGoal(
  intent: GoalIntent,
  audience: 'service',
): ServiceGoal;
export function intentToLegacyGoal(
  intent: GoalIntent,
  audience: 'product' | 'service',
): LandingGoal | ServiceGoal {
  if (audience === 'service') {
    return INTENT_TO_SERVICE_GOAL[intent] ?? 'book-call';
  }
  return INTENT_TO_LANDING_GOAL[intent] ?? 'signup';
}

/**
 * Raw goal-slot capture from the wizard (mirrors Brief.goal.param zod shape).
 * Plain type in a plain module so stores, GoalParamFields and GeneratingSteps
 * can all import it without firewall concerns.
 */
export interface GoalParamInput {
  phone?: string;
  email?: string;
  url?: string;
  links?: string[];
  date?: string;
  message?: string;
}

type BriefGoal = NonNullable<Brief['goal']>;

/** Trimmed, non-empty entries of a links array (or []). */
function cleanLinks(links: string[] | undefined): string[] {
  return (links ?? []).map((l) => l.trim()).filter((l) => l.length > 0);
}

/** wa.me wants bare digits (country code included, no +/spaces/dashes). */
function waDigits(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

/**
 * Compose a wa.me destination from a phone (any format) + optional prefilled
 * message (scale-05 phase 6). Digits-only number; `?text=` is
 * encodeURIComponent-encoded. Shared by the M2 writeback below and the edit-page
 * goal modal's message recomposition — keep the format identical in both.
 */
export function composeWhatsappDestination(phone: string, message?: string): string {
  const base = `https://wa.me/${waDigits(phone)}`;
  const msg = message?.trim();
  return msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
}

/**
 * Legacy wizard goal (+ optional goal-slot param) → Brief.goal (scale-05 phase 1).
 *
 * Composition rules — INTENT-SPECIFIC BRANCHES FIRST, mechanism-generic fallback:
 * - `subscribe-newsletter` → mechanism FORCED to 'M1' (design call #6: it's an
 *   email-capture form seeded in phase 4), NO param, NO destination — hero
 *   GOAL_REF resolves via the existing M1 `#form-section` path. Never derive
 *   this from goalIntentMeta (frozen vocab says M4); never edit vocabulary.ts.
 * - `download-app` → persist `param.links` verbatim (both store URLs; phase 6's
 *   badge injector reads exactly `brief.goal.param.links`), destination = links[0].
 * - `rsvp` → link + date captured; link present → M3 external, else M1 form
 *   (date is stored only — no rendering in this feature).
 * - generic: phone/email → M2 (wa.me / mailto) when the intent allows M2;
 *   url → M3 external when the intent allows M3; M4 → links; M1/M5 → none.
 *   `mechanism = goalIntentMeta[intent].mechanisms[0]` unless a param upgrades
 *   it to an allowed secondary mechanism (e.g. request-demo + Calendly → M3).
 */
export function legacyGoalToBriefGoal(
  legacyGoal: ServiceGoal | LandingGoal,
  param?: GoalParamInput,
  facts?: WhatsappFacts,
): BriefGoal {
  const intent: GoalIntent =
    SERVICE_GOAL_TO_INTENT[legacyGoal as ServiceGoal] ??
    LANDING_GOAL_TO_INTENT[legacyGoal as LandingGoal];
  return intentToBriefGoal(intent, param, facts);
}

/**
 * Intent-first Brief.goal composer (scale-05 phase 9). Same composition rules
 * as `legacyGoalToBriefGoal` but keyed on the REAL captured `GoalIntent` — the
 * intent-first wizard prefers this so unmapped/lossy legacy round-trips (e.g.
 * `book-me`→`book-call`) don't discard the picked intent. `legacyGoalToBriefGoal`
 * delegates here after reverse-mapping the legacy enum (its FALLBACK path when
 * the store carries no goalIntent).
 */
export function intentToBriefGoal(
  intent: GoalIntent,
  param?: GoalParamInput,
  facts?: WhatsappFacts,
): BriefGoal {
  // ── Intent-specific branches FIRST ──
  if (intent === 'subscribe-newsletter') {
    // Explicit M1 override — NO param, NO destination (see doc block above).
    return { intent, mechanism: 'M1' };
  }

  if (intent === 'download-app') {
    const links = cleanLinks(param?.links);
    if (links.length === 0) return { intent, mechanism: 'M3' };
    return { intent, mechanism: 'M3', destination: links[0], param: { links } };
  }

  if (intent === 'rsvp') {
    const url = param?.url?.trim();
    const date = param?.date?.trim();
    const paramOut: GoalParamInput = {
      ...(url ? { url } : {}),
      ...(date ? { date } : {}),
    };
    if (url) {
      return { intent, mechanism: 'M3', destination: url, param: paramOut };
    }
    return {
      intent,
      mechanism: 'M1',
      ...(date ? { param: paramOut } : {}),
    };
  }

  // ── Mechanism-generic fallback ──
  const mechanisms = goalIntentMeta[intent].mechanisms;
  const primary: GoalMechanism = mechanisms[0];

  const phone = param?.phone?.trim();
  const email = param?.email?.trim();
  if (mechanisms.includes('M2') && (phone || email)) {
    if (phone) {
      // scale-05 phase 6: materialize the deterministic WhatsApp prefill into
      // param.message and compose destination = wa.me/{digits}?text={encoded}.
      // NO AI — pure string from facts (see whatsappPrefill.ts). Editable later
      // via the edit-page goal modal (which recomposes ?text= on change).
      const message = buildWhatsappPrefill(facts);
      return {
        intent,
        mechanism: 'M2',
        destination: composeWhatsappDestination(phone, message),
        param: { phone, message },
      };
    }
    return { intent, mechanism: 'M2', destination: `mailto:${email}`, param: { email } };
  }

  const url = param?.url?.trim();
  if (mechanisms.includes('M3') && url) {
    return { intent, mechanism: 'M3', destination: url, param: { url } };
  }

  if (primary === 'M4') {
    const links = cleanLinks(param?.links);
    if (links.length === 0) return { intent, mechanism: 'M4' };
    return { intent, mechanism: 'M4', destination: links, param: { links } };
  }

  // M1 / M5 (and M2/M3-primary intents with no usable param): no destination —
  // goalToDestination returns undefined for destination-less M2/M3 and the
  // caller falls back to legacy behavior.
  return { intent, mechanism: primary };
}

export interface ProductPrefill {
  oneLiner: string;
  productName: string;
  understanding: {
    categories: string[];
    audiences: string[];
    whatItDoes: string;
    features: string[];
  };
  offer?: string;
  landingGoal?: LandingGoal;
  /** Intent-first prefill (scale-05 phase 9) — raw `brief.goal.intent`. */
  goalIntent?: GoalIntent;
}

export interface ServicePrefill {
  oneLiner: string;
  businessName: string;
  understanding: {
    serviceType: ServiceType;
    whatYouDo: string;
    services: string[];
    targetClients: string[];
    outcomes: string[];
    deliveryModel: 'remote' | 'in-person' | 'hybrid';
  };
  goal?: ServiceGoal;
  offer?: string;
  importedTestimonials?: string[];
  /** Intent-first prefill (scale-05 phase 9) — raw `brief.goal.intent`. */
  goalIntent?: GoalIntent;
}

export function briefToProductPrefill(brief: Brief | null | undefined): ProductPrefill | null {
  const entry = getEntryFacts(brief);
  if (!entry) return null;

  const landingGoal = brief?.goal ? INTENT_TO_LANDING_GOAL[brief.goal.intent] : undefined;
  const goalIntent = brief?.goal?.intent;

  return {
    oneLiner: entry.oneLiner,
    productName: entry.businessName,
    understanding: {
      categories: entry.categories ?? [],
      audiences: entry.audiences ?? [],
      whatItDoes: entry.summary,
      features: entry.offerings ?? [],
    },
    ...(entry.offer ? { offer: entry.offer } : {}),
    ...(landingGoal ? { landingGoal } : {}),
    ...(goalIntent ? { goalIntent } : {}),
  };
}

export function briefToServicePrefill(brief: Brief | null | undefined): ServicePrefill | null {
  const entry = getEntryFacts(brief);
  if (!entry) return null;

  const goal = brief?.goal ? INTENT_TO_SERVICE_GOAL[brief.goal.intent] : undefined;
  const goalIntent = brief?.goal?.intent;

  return {
    oneLiner: entry.oneLiner,
    businessName: entry.businessName,
    understanding: {
      serviceType: serviceTypeForBusinessType(brief?.businessType),
      whatYouDo: entry.summary,
      services: entry.offerings ?? [],
      targetClients: entry.audiences ?? [],
      outcomes: entry.outcomes ?? [],
      // deliveryModel default 'remote' when null (plan step 3).
      deliveryModel: entry.deliveryModel ?? 'remote',
    },
    ...(goal ? { goal } : {}),
    ...(entry.offer ? { offer: entry.offer } : {}),
    ...(entry.testimonials?.length ? { importedTestimonials: entry.testimonials } : {}),
    ...(goalIntent ? { goalIntent } : {}),
  };
}
