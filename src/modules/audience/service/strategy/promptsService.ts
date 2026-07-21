// src/modules/service/strategy/promptsService.ts
// Strategy prompt builder for the service route. Mirror of promptsV3 structure
// (templated user prompt, no system msg, "Output valid JSON only" footer).
// Reference: docs/architecture/newServiceOnboarding.md §3 Step 7, §6 Voice (Hearth).

import type {
  ServiceUnderstandingInput,
  ServiceAssetInput,
  ServiceGoal,
} from '@/types/service';
import { serviceGoalLabels } from '@/types/service';
import { assertNoTemplateLeak } from '../promptFirewall';
import { selectServiceVoice } from '../voice';
import { getEmphasisForIntent } from '@/modules/goals/copyGuidance';
import { SERVICE_GOAL_TO_INTENT } from '@/modules/brief/bridge';

export interface ServiceStrategyPromptInput {
  oneLiner: string;
  businessName?: string;
  understanding: ServiceUnderstandingInput;
  goal: ServiceGoal;
  offer: string;
  assets: ServiceAssetInput;
  /**
   * language-settings phase 4 — output language as an English exonym
   * (`'English'`, `'Dutch'`, …). Absent ⇒ `'English'`. Mirror of the product
   * strategy hedge: strategy phrasing is pasted into the copy prompt, so
   * source-language angle text would otherwise leak into the page.
   */
  language?: string;
}

export function buildServiceStrategyPrompt(input: ServiceStrategyPromptInput): string {
  assertNoTemplateLeak(input, 'buildServiceStrategyPrompt');
  const { oneLiner, businessName, understanding, goal, offer, assets } = input;

  // Voice by business archetype (firewall-safe — reads understanding, not
  // templateId). Strategy fields must already read in the chosen voice so copy
  // generation builds on the right framing.
  const voice = selectServiceVoice(understanding);
  // ALWAYS emitted, English included (plan ruling 2).
  const language = input.language || 'English';

  const assetSummary = [
    assets.hasTestimonials && `client testimonials (${assets.testimonialType ?? 'text'})`,
    assets.hasClientLogos && 'client logos',
    assets.hasOutcomes && 'numeric client outcomes',
    assets.hasCaseStudies && 'case studies / portfolio',
    assets.hasTeamPhotos && 'team photos',
    assets.hasFounderPhoto && 'founder photo',
  ]
    .filter(Boolean)
    .join(', ') || 'none provided';

  return `You are a landing page strategist for service businesses (agencies, consultancies, coaches, freelancers, productized services, local services). Analyze this provider and create a conversion-optimized strategy.

## Provider

**One-liner:** ${oneLiner}
**Business name:** ${businessName || '—'}
**Service type:** ${understanding.serviceType}
**What they do:** ${understanding.whatYouDo}
**Target clients:** ${understanding.targetClients.join(', ') || '—'}
**Services offered:** ${understanding.services.join(', ') || '—'}
**Outcomes / differentiators:** ${understanding.outcomes.join(', ') || '—'}
**Delivery model:** ${understanding.deliveryModel}

## Landing Goal

**Primary CTA:** ${serviceGoalLabels[goal]} (id: ${goal})
**Offer:** ${offer}
**Emphasis:** ${getEmphasisForIntent(SERVICE_GOAL_TO_INTENT[goal] ?? SERVICE_GOAL_TO_INTENT['book-call'])}

## Assets Available

${assetSummary}

---

## Your Task

Generate a JSON response with the following structure. Speak about the *provider*, not just the offering. Services are sold person-to-person.

### Step 1: awareness

Choose ONE awareness level — the visitor's relationship to the service at landing time. Infer it from the signals above: the service type, the one-liner's framing, the offer, and which assets exist (e.g. heavy referral/testimonial language → referral-driven; broad category one-liner with a free audit → search-aware-cold).

- "search-aware-cold": Googled the service category, has a need but no preferred provider yet.
- "search-aware-comparing": Shopping multiple providers, has multiple tabs open.
- "referral-driven": Came from a recommendation, name-pre-trusted but unconvinced of fit.
- "relationship-warming": Knew the founder personally, deciding whether to engage commercially.

This choice drives page structure downstream — pick the single best fit, do not hedge.

### Step 2: oneClient

Define the ONE ideal client (not "ideal customer" — service buyers are *clients*):

- who: Specific persona description (role, stage, situation). Be concrete.
- coreDesire: The single most important outcome they want from this engagement.
- corePain: The single most acute friction they're feeling now.
- pains: Array of 3-5 specific pain points using their words.
- desires: Array of 3-5 specific desires using their words.
- objections: Array of 3-5 plausible objections they'd raise.

### Step 3: ourPosition

How the *provider* shows up — services sell trust in a person/team, not a feature list.

- promise: One clear sentence on what the provider commits to deliver. Concrete, not aspirational.
- approach: How they work — methodology, philosophy, or process style. One sentence.
- credibility: The single most relevant proof point. **Do NOT invent numbers.** Use a specific figure ONLY if one is literally present in the provider input above; otherwise use non-numeric proof framing (e.g. "specialized exclusively in family law", "trusted by independent DTC founders", "years inside the SaaS go-to-market trenches"). Never fabricate counts of clients, years, or results.

### Step 4: servicePresentation

How the offering is framed:

- format: "packages" | "quote-only" | "hybrid"
  - "packages" if standardized tiered offerings make sense (productized services, agency retainers).
  - "quote-only" if every engagement is custom-scoped (high-end consultancy).
  - "hybrid" if a starter package exists but premium work is custom.
- showProcess: true if the *how* is a meaningful selling point.
- showCaseStudies: true if portfolio/case-studies are likely to drive conversion.

### Step 5: sectionDecisions

Be selective — more sections ≠ better conversion.

- includeTransformation: true if service type is coaching/consultancy AND the engagement produces a clear personal/business "before → after". Otherwise false.
- includeProblem: true ONLY if awareness is "search-aware-cold" AND there's a sharp, easily-named problem to surface. Otherwise false.
- includeApproach: true if the methodology is a real differentiator.
- isHighTouch: true if engagement is bespoke / >$5k / months-long. Pricing model and scope shape conversion path.

### Step 6: uiblockDecisions

Advisory hints — final block choice may use heuristics. Provide your best guess for each:

- heroBlock: "PetalFramedHero" (default), "TextLedHero" (no photo asset), "VideoHero" (founder has explainer video).
- servicesBlock: "IconServiceCards" (3 services), "DetailedServiceList" (4-6 services), "ServiceMatrix" (6+).
- processBlock: "StepTimeline" (<5 steps), "AccordionProcess" (>=5 steps), "ProcessCards" (visual).
- packagesBlock: based on servicePresentation.format → "TieredPackages" | "CustomQuoteCallout" | "HybridPackagesPlusQuote".
- casestudiesBlock: "FeaturedCaseStudy" (1 case) or "CaseStudyGrid" (>=2).
- testimonialsBlock: "PullQuoteWithMark" (single anchor quote) or "ClientStoryCards" (multiple).
- ctaBlock: based on goal → "BookCallCTA" | "QuoteRequestCTA".

---

## Voice Reminder (${voice.label})

This page will use a ${voice.toneProfile} voice. Avoid these words: ${voice.lexicon.forbidden.join(', ')}. Prefer: ${voice.lexicon.preferred.join(', ')}. Strategy fields — especially "oneClient.coreDesire", "ourPosition.promise", and "ourPosition.approach" — should already read in this voice; downstream copy generation builds on them.

---

Write every string in ${language}. The provider information above MAY be in another language — render its MEANING in ${language}; never copy or echo its source-language wording (proper nouns stay as-is).

Output valid JSON only. No explanations or markdown.`;
}
