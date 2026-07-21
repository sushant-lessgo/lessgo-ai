// src/modules/audience/product/strategy/promptsProduct.ts
// Strategy prompt builder for the Meridian product route (P3). LEAN adaptation
// of modules/strategy/promptsV3.ts (buildSimplifiedStrategyPrompt): reuses the
// proven oneReader / oneIdea / featureAnalysis instruction blocks that drive
// product copy quality, but DROPS the `vibe` step (palette/variant locked) and
// the sectionDecisions / uiblockDecisions steps (Meridian's pilot uses a fixed
// section list + fixed block map, so the LLM makes no layout choices).
//
// Legacy promptsV3.ts is UNTOUCHED — it still serves the 47-block path.

import type { LandingGoal } from '@/types/generation';
import type { PageArchetypeDef } from '../pageArchetypes';
import type { ProductVoiceId } from '../voice';
import { assertNoTemplateLeak } from '../promptFirewall';

export interface ProductStrategyPromptInput {
  productName: string;
  oneLiner: string;
  features: string[];
  landingGoal: LandingGoal;
  offer: string;
  primaryAudience: string;
  otherAudiences: string[];
  categories: string[];
  /** Copy-voice id, resolved ROUTE-side from templateId (D4 — same firewall
   *  stance as buildProductCopyPrompt: a VOICE, never template identity).
   *  'tailored-trade' switches the manufacturer labels/framing. */
  voiceId?: ProductVoiceId;
  /** Manufacturer flow only (onboarding1 D3): what the business makes —
   *  the one-liner alone under-specifies a maker. Strategy-side only. */
  whatYouMake?: string;
  /** Page-archetype MENU (capability data, not template identity — resolved
   *  route-side). When present, the prompt gains Step 5: sitemap proposal. */
  pageArchetypes?: PageArchetypeDef[];
  /**
   * language-settings phase 4 — output language as an English exonym
   * (`'English'`, `'Dutch'`, …). Absent ⇒ `'English'`. The strategy output is
   * mostly internal reasoning, BUT positioning/persona/benefit phrasing is
   * pasted verbatim into the copy prompt — without this hedge, source-language
   * angle text leaks into the page. Mirrors work/strategy/promptsWork.ts:95.
   * Always route-validated (`resolvePromptLanguage`), never raw client input.
   */
  language?: string;
}

function buildSitemapStep(menu: PageArchetypeDef[]): string {
  const menuLines = menu
    .map(
      (a) =>
        `- "${a.key}"${a.required ? ' (ALWAYS included, first)' : ''} — ${a.description}\n  allowed sections: ${a.allowedSections.join(', ')} · required: ${a.requiredSections.join(', ') || '—'}`
    )
    .join('\n');

  return `

### Step 5: sitemap
Propose the pages this business's site needs, from THIS menu only:

${menuLines}

Return sitemap.pages — for each page: { archetypeKey, title, sections, reason }.
- archetypeKey: a key from the menu. title: short page name. reason: one line on why this business needs the page.
- sections: the page's body sections IN ORDER, chosen ONLY from that page's allowed sections. Include its required sections.
- "home" is always present and always first.
- Include a page only when this business has real substance for it — a thin or brand-new business may legitimately be home-only or home + contact.
- Do not repeat the same heavy section on many pages (e.g. the full catalogue grid belongs on one or two pages, not every page).
- When a section moves to its own dedicated page, consider whether home still needs the full section or the site reads better without the duplication.`;
}

export function buildProductStrategyPrompt(input: ProductStrategyPromptInput): string {
  assertNoTemplateLeak(input, 'buildProductStrategyPrompt');
  const {
    productName,
    oneLiner,
    features,
    landingGoal,
    offer,
    primaryAudience,
    otherAudiences,
    categories,
    whatYouMake,
    pageArchetypes,
  } = input;

  const isTrade = (input.voiceId ?? 'modern-tech') === 'tailored-trade';
  // ALWAYS emitted, English included (plan ruling 2).
  const language = input.language || 'English';

  const sitemapStep = pageArchetypes?.length ? buildSitemapStep(pageArchetypes) : '';

  // Manufacturer branch (onboarding1 D3): explicit "What they make:" line —
  // emitted ONLY for tailored-trade; SaaS output stays byte-identical.
  const whatTheyMakeLine =
    isTrade && whatYouMake ? `\n**What they make:** ${whatYouMake}` : '';

  // Manufacturer branch: otherAudiences slot carries industriesServed — relabel.
  const audienceListLabel = isTrade ? 'Industries served' : 'Other audiences';

  // Trailing framing paragraph — SaaS wording is frozen (byte-identical);
  // tailored-trade replaces the "Modern Tech" SaaS framing entirely.
  const framing = isTrade
    ? `This strategy drives downstream copy generation for a manufacturer / trade-supplier
page — concrete, capability-led, enquiry-driven, no startup hype. Keep oneReader/oneIdea
phrasing concrete and specific; copy generation builds directly on these fields.`
    : `This strategy drives downstream copy generation for a "Modern Tech" product page —
confident, precise, builder-to-builder, no hype. Keep oneReader/oneIdea phrasing
concrete and specific; copy generation builds directly on these fields.`;

  return `You are a landing page strategist. Analyze this product and create a conversion-optimized strategy.

## Product Information

**Name:** ${productName}
**Description:** ${oneLiner}
**Landing Goal:** ${landingGoal}
**Offer:** ${offer}
**Categories:** ${categories.join(', ') || '—'}${whatTheyMakeLine}

## Target Audience

**Primary:** ${primaryAudience}
${otherAudiences.length > 0 ? `**${audienceListLabel}:** ${otherAudiences.join(', ')}` : ''}

## Features

${features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

---

## Your Task

Generate a JSON response with the following structure:

### Step 1: awareness
Choose ONE awareness level that will resonate with the most number of users:

- "problem-aware-cold": Knows problem exists but low emotional intensity. Not urgently seeking solutions. Needs to be reminded why this matters.
- "problem-aware-hot": Feels the pain intensely. Actively frustrated. Urgently wants relief. "Hair on fire" problem.
- "solution-aware-skeptical": Knows solutions exist. Has seen/tried alternatives. Hesitant, needs convincing why THIS one is different.
- "solution-aware-eager": Knows solutions exist. Ready to act. Just needs to confirm this is the right choice.

### Step 2: oneReader
Define the ONE ideal reader:
- personaDescription: Who they are (job title, situation, context) - be specific
- pain: Array of 3-5 pain points using their exact words/phrases
- desire: Array of 3-5 desires using their exact words/phrases
- objections: Array of 3-5 likely objections they'd have

### Step 3: oneIdea
Define the core value proposition:
- bigBenefit: The ultimate outcome they want (emotional/tangible result)
- uniqueMechanism: WHY/HOW this product works differently
- reasonToBelieve: The proof point that makes it credible. Do NOT invent specific numbers, customer counts, or funding figures — use a figure only if it is literally present in the product input above; otherwise use non-numeric proof framing.

### Step 4: featureAnalysis
For each feature provided, create:
- feature: The raw feature (from input)
- benefit: What the user directly gets from this feature
- benefitOfBenefit: The emotional/practical impact of that benefit
${sitemapStep}

---

${framing}

Write every string in ${language}. The product information above MAY be in another language — render its MEANING in ${language}; never copy or echo its source-language wording (proper nouns stay as-is).

Output valid JSON only. No explanations or markdown.`;
}
