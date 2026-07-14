// src/modules/service/copy/copyPromptService.ts
// Copy generation prompt builder for the service route. Mirror of copyPromptV3
// but driven by ServiceStrategyOutput shape (oneClient/ourPosition) and the
// Hearth voice spec instead of vibe-based tone mapping.

import type {
  ServiceStrategyOutputAssembled,
  ServiceUnderstandingInput,
  ServiceGoal,
} from '@/types/service';
import {
  layoutElementSchema,
  getAllElements,
  getCardRequirements,
  type LayoutElement,
  type CardRequirements,
} from '@/modules/sections/layoutElementSchema';
import { formatServiceVoiceForPrompt, selectServiceVoice } from './voice';
import { assertNoTemplateLeak } from './promptFirewall';
import { serviceGoalLabels } from '@/types/service';
import { getGuidanceForIntent } from '@/modules/goals/copyGuidance';
import { SERVICE_GOAL_TO_INTENT } from '@/modules/brief/bridge';

export interface ServiceCopyPromptInput {
  strategy: ServiceStrategyOutputAssembled;
  uiblocks: Record<string, string>;
  oneLiner: string;
  businessName?: string;
  offer: string;
  goal: ServiceGoal;
  understanding: ServiceUnderstandingInput;
}

// proof-truth phase 2: proof-shaped elements (testimonial quote/author fields,
// trust review/case fields) get an inline plausible-generic guard. Match on the
// actual element keys the schema emits — collection subfields arrive as
// `<collection>.<field>` (see getAllElements), flat fields as bare keys.
const PROOF_COLLECTIONS = new Set(['testimonials', 'reviews', 'cases']);
const PROOF_FIELDS = new Set(['quote', 'author_name', 'author_role', 'author_company']);
const PROOF_ELEMENT_GUARD =
  '[PROOF — plausible-generic only: a fictional first-name persona is OK, but NEVER attribute the quote to a real or invented company/brand name, and NEVER put a specific number, percentage, or revenue/ROI claim inside the quote]';

function isProofElement(name: string): boolean {
  const dot = name.indexOf('.');
  const collection = dot >= 0 ? name.slice(0, dot) : '';
  const field = dot >= 0 ? name.slice(dot + 1) : name;
  return PROOF_COLLECTIONS.has(collection) || PROOF_FIELDS.has(field);
}

function formatElement(element: LayoutElement): string {
  const parts: string[] = [`- ${element.element}`];
  if (element.charLimit) parts.push(`(max ${element.charLimit} chars)`);
  parts.push(element.mandatory ? '[REQUIRED]' : '[optional, null to exclude]');
  if (element.generation === 'ai_generated_needs_review') parts.push('[NEEDS_REVIEW]');
  if (isProofElement(element.element)) parts.push(PROOF_ELEMENT_GUARD);
  return parts.join(' ');
}

function formatCardRequirements(req: CardRequirements | null): string {
  if (!req) return '';
  return `Items: min ${req.min}, max ${req.max}`;
}

function getAIElements(layoutName: string): LayoutElement[] {
  const schema = layoutElementSchema[layoutName];
  if (!schema) return [];
  return getAllElements(schema).filter(
    (e) => e.generation === 'ai_generated' || e.generation === 'ai_generated_needs_review'
  );
}

function buildSectionSpec(sectionType: string, layoutName: string): string {
  const schema = layoutElementSchema[layoutName];
  if (!schema) return `### ${sectionType} (${layoutName})\nNo schema available`;

  const elements = getAIElements(layoutName);
  const cardReq = getCardRequirements(schema);

  const lines: string[] = [`### ${sectionType} (${layoutName})`];
  if (cardReq) lines.push(formatCardRequirements(cardReq));
  lines.push('Elements:');
  for (const el of elements) lines.push(formatElement(el));
  return lines.join('\n');
}

/**
 * Goal-specific CTA guidance — steers the verbs/commitment level of every
 * CTA-bearing field (header.cta_text, hero.cta_text, packages[].cta_text,
 * cta.cta_text) AND the optional hero cta_subtext. CTA variation is copy-level
 * on the shared BookCallCTA block — there is no per-goal CTA block (Phase 9 hold).
 *
 * scale-05 phase 3: re-pointed to the shared per-intent guidance table via the
 * SERVICE_GOAL_TO_INTENT reverse map. Signature + fallback are UNCHANGED so
 * legacy callers compile untouched — the legacy ServiceGoal enum stays alive.
 */
function getGoalCtaGuidance(goal: ServiceGoal): string {
  const intent = SERVICE_GOAL_TO_INTENT[goal] ?? SERVICE_GOAL_TO_INTENT['book-call'];
  return getGuidanceForIntent(intent);
}

function getEmotionalContext(awareness: string): string {
  const map: Record<string, string> = {
    'search-aware-cold':      'Visitor Googled the service category. Has a need but no preferred provider yet — they need to feel "this provider gets it" within 3 seconds.',
    'search-aware-comparing': 'Visitor is shopping multiple providers. Has multiple tabs open. Differentiation must be sharp; trust signals must come early.',
    'referral-driven':        'Visitor came from a recommendation — name pre-trusted, but they\'re scanning to confirm fit before booking.',
    'relationship-warming':   'Visitor knew the founder personally. Deciding whether to engage commercially. Voice should feel familiar, not pitchy.',
  };
  return map[awareness] ?? 'Visitor is exploring options.';
}

/**
 * Element schemas for collections (helps LLM emit the right shape per array).
 */
function getElementSchemas(): string {
  return `
Collection schemas (for array fields):
- nav_items: array of { id: string, label: string, href: string }
- services: array of { id: string, title: string, description: string, icon: string, cta_text: string }
- packages: array of { id: string, name: string, price_display: string [NEEDS_REVIEW], timeline: string, features: string[], cta_text: string, is_featured: boolean }
- social_links: array of { id: string, platform: string, href: string }
- reviews: array of { id: string, quote: string, author_name: string, author_role: string, author_company: string }  // multi-review grid (when used); [NEEDS_REVIEW] real client quotes; quote may include <em> on the moved number
- brands: array of { id: string, name: string }  // client wordmarks (logo strip) — [NEEDS_REVIEW], placeholder if unknown
- tags: array of { id: string, label: string }   // short mono chips, e.g. "Founded 2024", "Pune, India"
- stats: array of { id: string, value: string, label: string, sublabel: string }  // About sidebar stats; value may include <em>; [NEEDS_REVIEW]
- metrics: array of { id: string, value: string, label: string }  // Stats band figures; value may include <em> for the unit, e.g. "9.2<em>M</em>"; [NEEDS_REVIEW]
- cases: array of { id: string, client: string, client_meta: string, tag: string, headline: string, metrics: array of { value: string, label: string } }  // [NEEDS_REVIEW] — placeholders, see rule 10

Notes:
- "id" fields are auto-generated by the system — emit empty string or omit; do NOT invent IDs.
- price_display: For pilot, use ranges or "from $X" framing. NEEDS_REVIEW: founder will verify before publish. Avoid invented exact numbers.
- features (in packages): 4-7 short phrases, concrete deliverables.
- stats[].value / cases[].metrics[].value: short figures with <em> on the unit; placeholdered when unknown (never fabricated).`;
}

export function buildServiceCopyPrompt(input: ServiceCopyPromptInput): string {
  assertNoTemplateLeak(input, 'buildServiceCopyPrompt');
  const { strategy, uiblocks, oneLiner, businessName, offer, goal, understanding } = input;

  // Voice is chosen by business ARCHETYPE (serviceType + growth signals), never by
  // templateId — firewall-safe. Drives IDENTITY, the voice block, and the rules.
  const voice = selectServiceVoice(understanding);
  const hasCaseStudies = strategy.sections.includes('casestudies');
  const hasServicesSection = strategy.sections.includes('services');

  // Bind the services section to the provider's ACTUAL stated services — the #1
  // source of "it invented services I never offer". Surface them as their own
  // prominent, one-per-line block (not the buried comma line in PROVIDER) so the
  // model treats them as the source of truth, plus an explicit rule below.
  const servicesSourceBlock =
    understanding.services.length > 0
      ? `## SERVICES THE PROVIDER OFFERS (source of truth — use these, do NOT invent)
${understanding.services.map((s) => `- ${s}`).join('\n')}
`
      : '';

  const sectionSpecs = strategy.sections
    .map((sectionType) => {
      const layout = uiblocks[sectionType];
      if (!layout) return null;
      return buildSectionSpec(sectionType, layout);
    })
    .filter(Boolean)
    .join('\n\n');

  // Anchor rules that bind generated copy to the user's actual inputs (services +
  // offer). Numbered after the existing rules (case-studies rule 10 is conditional).
  const bindServices = hasServicesSection && understanding.services.length > 0;
  const bindOffer = offer.trim().length > 0;
  let nextRule = hasCaseStudies ? 11 : 10;
  const bindingRuleLines: string[] = [];
  if (bindServices) {
    bindingRuleLines.push(
      `${nextRule++}. **The services section MUST be built from the provider's actual services listed in "SERVICES THE PROVIDER OFFERS" above.** Emit one "services" card per stated service, deriving each card title directly from the user's service (rephrase for polish only — do NOT invent, rename, drop, or add services). If the schema allows more items than the provider has services, generate fewer cards; NEVER pad with fabricated services (this overrides the array-min rule for the services section only).`
    );
  }
  if (bindOffer) {
    bindingRuleLines.push(
      `${nextRule++}. **Bind the CTA to the stated offer.** The hero and cta call-to-action must reflect the provider's actual offer ("${offer}") as the literal next step — do NOT invent a different offer or promise.`
    );
  }
  const bindingRules = bindingRuleLines.length > 0 ? `\n${bindingRuleLines.join('\n')}` : '';

  return `## IDENTITY
${voice.identity}

## PROVIDER
One-liner: ${oneLiner}
Business name: ${businessName || '—'}
Service type: ${understanding.serviceType}
What they do: ${understanding.whatYouDo}
Services offered: ${understanding.services.join(', ') || '—'}
Target clients: ${understanding.targetClients.join(', ') || '—'}
Outcomes / differentiators: ${understanding.outcomes.join(', ') || '—'}
Delivery: ${understanding.deliveryModel}
Offer: ${offer}
Landing goal: ${serviceGoalLabels[goal]} (${goal})
${getGoalCtaGuidance(goal)}

## ONE CLIENT (Ideal Reader)
${strategy.oneClient.who}

Awareness: ${strategy.awareness}
${getEmotionalContext(strategy.awareness)}

Core desire: ${strategy.oneClient.coreDesire}
Core pain: ${strategy.oneClient.corePain}

Pain points:
${strategy.oneClient.pains.map((p) => `- ${p}`).join('\n')}

Desires:
${strategy.oneClient.desires.map((d) => `- ${d}`).join('\n')}

Likely objections:
${strategy.oneClient.objections.map((o) => `- ${o}`).join('\n')}

## OUR POSITION (the Provider)
Promise: ${strategy.ourPosition.promise}
Approach: ${strategy.ourPosition.approach}
Credibility: ${strategy.ourPosition.credibility}

## SERVICE PRESENTATION
Format: ${strategy.servicePresentation.format}
Show process: ${strategy.servicePresentation.showProcess}
Show case studies: ${strategy.servicePresentation.showCaseStudies}

${formatServiceVoiceForPrompt(voice)}

${servicesSourceBlock}## SECTIONS TO GENERATE

${sectionSpecs}

${getElementSchemas()}

## RULES (MUST FOLLOW)
1. **Emphasis convention — applies to EVERY section, not just hero.** Every "headline" field AND every "lede" field across ALL sections (hero, services, packages, testimonials, cta — every one) must wrap 1-2 emphasized words in <em>...</em>. The renderer styles emphasized words (the template decides how). Without <em>, the page reads flat. Do not skip it on services/packages/cta headlines or on any lede.
   - ⚠️ **LEDES ARE THE #1 MISSED FIELD.** A lede is a full descriptive sentence, so it is easy to forget the accent — but it needs exactly one <em>...</em> just like a headline. Pick the single most meaningful word in each lede and wrap it. Re-read every lede before you output.
2. Respect character limits and array min/max strictly.
3. NO placeholder text — every field must be real, usable copy.
4. NO invented exact numbers, client names, or dollar figures. Use ranges or "experienced in X" framing.
5. NEEDS_REVIEW elements (price_display, quote, author_*): write realistic copy but use general framing — founder will verify. For any testimonial/review/case proof: a fictional first-name persona is acceptable, but NEVER attribute a quote to a real or invented company/brand name (author_company / cases[].client), and NEVER put a specific metric, percentage, or revenue/ROI figure inside a quote (e.g. "284% ROI for GlowSkin" is forbidden).
6. For arrays: return the actual array, respecting min/max.
7. Return ONLY valid JSON. No markdown, no commentary.
8. **Output EVERY section listed above — no omissions.** Include each section key (header, hero, services, testimonials, packages, cta, footer — whichever are listed) with a complete "elements" object. Do not drop trailing sections like testimonials or footer.
9. Use ${voice.label} voice (see the VOICE section above). **Avoid that voice's forbidden words ANYWHERE** — including invented brand names (logo_text), company names (author_company), copyright lines, and testimonial quotes. Forbidden words for this voice: ${voice.lexicon.forbidden.join(', ')}.${hasCaseStudies ? `
10. **Case studies — placeholders, NOT fabrication (overrides rule 3 for this section only).** For the "casestudies" section, you do NOT know the agency's real clients or numbers. In each item of "cases", emit EXPLICIT placeholders the founder will replace: set "client" to "[Client]" (or "[Client name]"), and every metric "value" to a bracketed placeholder like "+XX% [metric]" / "X.X× [metric]". Write the "tag" and "headline" (the result sentence) as real, specific-sounding copy in the voice above, but NEVER invent real-looking client names or exact figures. This is the one place placeholders are required.` : ''}${bindingRules}

## FINAL SELF-CHECK (do this before returning)
Scan your JSON once more and fix any miss:
(a) Every section listed in "SECTIONS TO GENERATE" has an entry.
(b) Every "headline" contains an <em>...</em>.
(c) Every "lede" contains an <em>...</em> — this is the field most often missed.${bindServices ? `
(d) Every services-section item maps to one of the provider's stated services — no invented services.` : ''}

## OUTPUT FORMAT

Return a JSON object keyed by section type. Each value has an "elements" object:

EXAMPLE (using an unrelated niche — vintage bookbinding studio — to illustrate the SHAPE only. Do NOT copy these words. Write fresh copy for the provider above.)

{
  "hero": {
    "elements": {
      "eyebrow": "BOOKBINDING SINCE 2014",
      "headline": "Library bindings that <em>outlast</em> the books inside them.",
      "lede": "A small studio for collectors and archivists who want every spine to feel as <em>considered</em> as the volume it protects.",
      "cta_text": "Request a quote",
      "cta_subtext": "No obligation — quotes within one day"
    }
  },
  "services": {
    "elements": {
      "headline": "What we <em>repair</em>",
      "services": [
        { "id": "", "title": "Spine restoration", "description": "...", "icon": "Sparkles", "cta_text": "Learn more" }
      ]
    }
  },
  "packages": {
    "elements": {
      "headline": "Three ways to <em>begin</em>",
      "lede": "Quotes scoped to the condition of your <em>volume</em>, not a generic page count.",
      "packages": [
        { "id": "", "name": "Single Volume", "price_display": "from $200", "timeline": "2 weeks", "features": ["..."], "cta_text": "Request quote", "is_featured": false }
      ]
    }
  },
  "cta": {
    "elements": {
      "headline": "Bring us your <em>oldest</em> book.",
      "lede": "A short call to assess condition and walk through what <em>restoration</em> would look like.",
      "cta_text": "Book an assessment"
    }
  }
}

Every "headline" and every "lede" above shows <em> wrapping. Match this PATTERN — but with words and ideas drawn from THIS provider's offering, not the bookbinding example.

hero.cta_subtext is OPTIONAL — a short muted line under the primary CTA. OMIT it (null or absent) unless the offer explicitly supports it; do NOT invent terms.

Optional elements may be set to null to exclude them.

Generate copy now:`;
}

/**
 * Retry prompt when the previous attempt failed to parse.
 */
export function buildServiceCopyRetryPrompt(
  originalPrompt: string,
  parseError: string,
  invalidSnippet: string
): string {
  return `${originalPrompt}

---
PREVIOUS ATTEMPT FAILED TO PARSE

Error: ${parseError}
Invalid snippet: ${invalidSnippet.slice(0, 500)}

Common issues: trailing commas, unescaped quotes in strings, missing closing braces, comments in JSON.

Return the complete, valid JSON response (no markdown wrapping, no commentary):`;
}
