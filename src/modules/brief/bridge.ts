// src/modules/brief/bridge.ts
// Brief → wizard prefill bridges — PURE module (scale-02 phase 1, plan D3/D5).
// SERVE writes Project.brief; each wizard page.tsx mount-hydrates its store
// from these prefills (phase 6 wiring). All fields read from
// brief.facts.entry; return null when absent (hydrate no-op guard — today's
// flows byte-identical when Project.brief is null).

import type { Brief } from '@/types/brief';
import type { ServiceGoal, ServiceType } from '@/types/service';
import type { LandingGoal } from '@/types/generation';
import type { GoalIntent } from '@/modules/goals/vocabulary';
import type { BusinessTypeKey } from '@/modules/businessTypes/config';
import { getEntryFacts } from './classify';

/**
 * businessType → ServiceType (plan D3 — persona is dead; SERVE only happens
 * with a KNOWN businessType, so the map is businessType-keyed and tiny).
 * Fallback 'agency' matches OneLinerStep's existing fallback.
 */
const BUSINESS_TYPE_TO_SERVICE_TYPE: Partial<Record<BusinessTypeKey, ServiceType>> = {
  agency: 'agency',
  consultant: 'consultancy',
  coach: 'coaching',
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
}

export function briefToProductPrefill(brief: Brief | null | undefined): ProductPrefill | null {
  const entry = getEntryFacts(brief);
  if (!entry) return null;

  const landingGoal = brief?.goal ? INTENT_TO_LANDING_GOAL[brief.goal.intent] : undefined;

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
  };
}

export function briefToServicePrefill(brief: Brief | null | undefined): ServicePrefill | null {
  const entry = getEntryFacts(brief);
  if (!entry) return null;

  const goal = brief?.goal ? INTENT_TO_SERVICE_GOAL[brief.goal.intent] : undefined;

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
  };
}
