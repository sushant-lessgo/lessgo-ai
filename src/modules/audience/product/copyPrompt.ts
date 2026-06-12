// src/modules/audience/product/copyPrompt.ts
// Copy generation prompt builder for the Meridian product route (P3). Mirror of
// audience/service/copyPrompt.ts, driven by ProductStrategyOutput
// (oneReader/oneIdea/featureAnalysis) and the Meridian "Modern Tech" voice
// instead of Hearth. Reads element specs from the global layoutElementSchema
// registry (works because meridianElementSchema is spread in).

import type { ProductStrategyOutput } from '@/types/product';
import type { LandingGoal } from '@/types/generation';
import {
  layoutElementSchema,
  getAllElements,
  getCardRequirements,
  type LayoutElement,
  type CardRequirements,
} from '@/modules/sections/layoutElementSchema';
import { formatProductVoiceForPrompt } from './voice';
import { assertNoTemplateLeak } from './promptFirewall';

export interface ProductCopyPromptInput {
  strategy: ProductStrategyOutput;
  uiblocks: Record<string, string>;
  productName: string;
  oneLiner: string;
  offer: string;
  landingGoal: LandingGoal;
  features: string[];
}

function formatElement(element: LayoutElement): string {
  const parts: string[] = [`- ${element.element}`];
  if (element.charLimit) parts.push(`(max ${element.charLimit} chars)`);
  parts.push(element.mandatory ? '[REQUIRED]' : '[optional, null to exclude]');
  if (element.generation === 'ai_generated_needs_review') parts.push('[NEEDS_REVIEW]');
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
 * CTA-bearing field (header.cta_text, hero.cta_text, tiers[].cta_text,
 * cta.cta_text). CTA variation is copy-level on the shared Meridian blocks.
 */
function getGoalCtaGuidance(goal: LandingGoal): string {
  const map: Record<LandingGoal, string> = {
    waitlist:
      'Goal = join waitlist (pre-launch). CTA copy: "Join the waitlist", "Get early access", "Request access". Signal scarcity/earliness, not a live product.',
    signup:
      'Goal = sign up. CTA copy: "Sign up", "Create your account", "Get started". Low friction, immediate.',
    'free-trial':
      'Goal = start a free trial. CTA copy: "Start free", "Start your free trial", "Try it free". Emphasize no-commitment.',
    buy:
      'Goal = purchase. CTA copy: "Get started", "Buy now", "Start building". Confident, value-forward.',
    demo:
      'Goal = book a demo. CTA copy: "Book a demo", "See it in action", "Get a walkthrough". For higher-consideration/B2B.',
    download:
      'Goal = download. CTA copy: "Download", "Get the app", "Install now". Direct, action-first.',
  };
  return map[goal] ?? map.signup;
}

function getEmotionalContext(awareness: string): string {
  const map: Record<string, string> = {
    'problem-aware-cold':
      'Visitor knows the problem exists but is not urgently looking. Remind them why it matters — fast — before pitching the fix.',
    'problem-aware-hot':
      'Visitor feels the pain acutely and is actively hunting for relief. Lead with the payoff; do not make them wait.',
    'solution-aware-skeptical':
      'Visitor has seen or tried alternatives. Differentiate sharply and bring proof early; assume a raised eyebrow.',
    'solution-aware-eager':
      'Visitor is ready to act and just wants to confirm this is the right pick. Reduce friction; make the next step obvious.',
  };
  return map[awareness] ?? 'Visitor is evaluating the product.';
}

/**
 * Collection field shapes (helps the LLM emit the right structure per array).
 * Replaces service's getElementSchemas with the Meridian collection set —
 * note the two NESTED shapes (tiers + footer_columns).
 */
function getMeridianCollectionSchemas(): string {
  return `
Collection schemas (for array fields — emit the exact shape):
- nav_items: array of { id: "", label: string, href: string }   (2-5 items)
- stats: array of { id: "", value: string [NEEDS_REVIEW], label: string }   (0-4 items; metric like "18s", "99.9%")
- features: array of { id: "", title: string, description: string, icon: string, link_text: string }   (3-6 items; icon = a Lucide icon name e.g. "Layers")
- testimonials: array of { id: "", quote: string [NEEDS_REVIEW], author_name: string [NEEDS_REVIEW], author_role: string [NEEDS_REVIEW] }   (1-3; the FIRST renders as the large raised card)
- logos: array of { id: "", name: string }   (0-6; company names only)
- tiers: array of { id: "", plan: string, amount: string [NEEDS_REVIEW], per: string, pitch: string, features: string[] (3-6 short phrases), cta_text: string, featured: boolean }   (2-3 tiers; set featured:true on EXACTLY ONE — the middle "most chosen" tier)
- footer_columns: array of { id: "", heading: string, links: array of { id: "", label: string, href: string } (1-6 links) }   (1-5 columns)

Notes:
- "id" fields are system-generated — emit empty string "" (this applies to NESTED link ids in footer_columns too); do NOT invent ids.
- NEEDS_REVIEW fields (stats.value, testimonial quote/author, tiers.amount): write realistic copy but use general/honest framing — the founder verifies before publish. Do NOT fabricate exact customer counts, dollar figures, or named people you cannot support.`;
}

export function buildProductCopyPrompt(input: ProductCopyPromptInput): string {
  assertNoTemplateLeak(input, 'buildProductCopyPrompt');
  const { strategy, uiblocks, productName, oneLiner, offer, landingGoal, features } = input;

  const sectionSpecs = strategy.sections
    .map((sectionType) => {
      const layout = uiblocks[sectionType];
      if (!layout) return null;
      return buildSectionSpec(sectionType, layout);
    })
    .filter(Boolean)
    .join('\n\n');

  return `## IDENTITY
You are a conversion copywriter for a software product landing page. The page uses the Meridian design family — "Modern Tech": confident, precise, builder-to-builder. You write in that voice, NOT generic breathless SaaS marketing voice.

## PRODUCT
Name: ${productName}
One-liner: ${oneLiner}
Offer: ${offer}
Landing goal: ${landingGoal}
${getGoalCtaGuidance(landingGoal)}

Features (raw, from the founder):
${features.map((f) => `- ${f}`).join('\n')}

## ONE READER (Ideal Reader)
${strategy.oneReader.personaDescription}

Awareness: ${strategy.awareness}
${getEmotionalContext(strategy.awareness)}

Pain points:
${strategy.oneReader.pain.map((p) => `- ${p}`).join('\n')}

Desires:
${strategy.oneReader.desire.map((d) => `- ${d}`).join('\n')}

Likely objections:
${strategy.oneReader.objections.map((o) => `- ${o}`).join('\n')}

## ONE IDEA (Core Value Proposition)
Big benefit: ${strategy.oneIdea.bigBenefit}
Unique mechanism: ${strategy.oneIdea.uniqueMechanism}
Reason to believe: ${strategy.oneIdea.reasonToBelieve}

## FEATURE ANALYSIS (feature → benefit → impact)
${strategy.featureAnalysis
  .map((f) => `- ${f.feature} → ${f.benefit} → ${f.benefitOfBenefit}`)
  .join('\n')}

${formatProductVoiceForPrompt()}

## SECTIONS TO GENERATE

${sectionSpecs}

${getMeridianCollectionSchemas()}

## RULES (MUST FOLLOW)
1. **Accent convention — HEADLINES ONLY.** Wrap 1-2 emphasized words in <em>...</em> in the HERO headline and the CTA headline ONLY. The renderer styles <em> as an accent-COLORED upright word (never italic). Do NOT add <em> to ledes, feature titles, pricing, testimonials, footer text, or any other field — Meridian's accent budget is deliberately small.
2. Respect character limits and array min/max strictly.
3. NO placeholder text — every field must be real, usable copy.
4. NO invented exact numbers, customer names, or dollar figures. Use honest framing for NEEDS_REVIEW fields (stats, testimonial quotes/authors, tier amounts) — the founder verifies before publish.
5. Pricing: set "featured": true on EXACTLY ONE tier (the middle "most chosen" plan); all others false. Each tier's "features" is an array of 3-6 short concrete strings.
6. Footer: each footer_column has a "links" array of { id: "", label, href } — emit empty "" for every id, including nested link ids.
7. Output EVERY section listed above — no omissions (header, hero, features, testimonials, pricing, cta, footer). Each as a key with a complete "elements" object.
8. Use Meridian voice — concrete, precise, no hype. Avoid the forbidden words ANYWHERE, including the brand/wordmark (logo_text, wordmark), copyright line, and testimonial quotes.
9. Return ONLY valid JSON. No markdown, no commentary.

## FINAL SELF-CHECK (before returning)
(a) Every listed section has an entry with a complete "elements" object.
(b) The hero headline and the cta headline each contain exactly one <em>...</em>; NO other field does.
(c) Exactly one pricing tier has featured:true.
(d) Every collection-item id (including nested footer link ids) is "".

## OUTPUT FORMAT

Return a JSON object keyed by section type. Each value has an "elements" object.

EXAMPLE (unrelated niche — a CLI deploy tool — to illustrate SHAPE only. Do NOT copy these words; write fresh copy for the product above.)

{
  "hero": {
    "elements": {
      "status_text": "v2.0 · NOW IN GA",
      "headline": "Ship on Friday. Sleep on <em>Saturday</em>.",
      "lede": "A deploy platform for teams that ship daily and refuse to babysit infrastructure.",
      "cta_text": "Start free",
      "secondary_cta_text": "Read the docs",
      "stats": [
        { "id": "", "value": "18s", "label": "median deploy" },
        { "id": "", "value": "99.99%", "label": "uptime" }
      ]
    }
  },
  "pricing": {
    "elements": {
      "headline": "Simple, usage-based pricing",
      "tiers": [
        { "id": "", "plan": "Hobby", "amount": "$0", "per": "/mo", "pitch": "For side projects", "features": ["1 project", "Community support", "Auto HTTPS"], "cta_text": "Start free", "featured": false },
        { "id": "", "plan": "Team", "amount": "$20", "per": "/seat/mo", "pitch": "For shipping teams", "features": ["Unlimited projects", "Rollbacks", "Priority support", "SSO"], "cta_text": "Start free", "featured": true },
        { "id": "", "plan": "Enterprise", "amount": "Custom", "per": "", "pitch": "For scale", "features": ["SLA", "Dedicated support", "Audit logs"], "cta_text": "Contact us", "featured": false }
      ]
    }
  },
  "cta": {
    "elements": {
      "headline": "Your next deploy takes <em>18 seconds</em>.",
      "body": "Connect a repo and push. We handle the rest.",
      "cta_text": "Start free"
    }
  },
  "footer": {
    "elements": {
      "wordmark": "meridian",
      "copyright": "© Meridian",
      "footer_columns": [
        { "id": "", "heading": "Product", "links": [ { "id": "", "label": "Features", "href": "#" }, { "id": "", "label": "Pricing", "href": "#" } ] },
        { "id": "", "heading": "Company", "links": [ { "id": "", "label": "About", "href": "#" } ] }
      ]
    }
  }
}

Only the hero headline and cta headline carry <em>. Match this PATTERN with copy drawn from THIS product.

Optional elements may be set to null to exclude them.

Generate copy now:`;
}

/**
 * Retry prompt when the previous attempt failed to parse.
 */
export function buildProductCopyRetryPrompt(
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
