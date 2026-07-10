// src/modules/audience/product/promptBranch.test.ts
// onboarding1 Phase 4 — SaaS vs manufacturer prompt branching.
//
// (i)  SaaS strategy/copy prompt output is BYTE-IDENTICAL to a frozen baseline
//      (proves no SaaS regression).
// (ii) Manufacturer output carries the trade labels/framing (What they make: /
//      Industries served: / Value-adds label / trade framing paragraph) and
//      none of the SaaS-only markers (Other audiences: / "Modern Tech").
//
// Baseline provenance:
// - STRATEGY_SAAS_BASELINE: captured from the pre-Phase-4 builder (unchanged).
// - COPY_SAAS_BASELINE: RE-BASELINED for scale-07 phase 8b — the copy prompt
//   now reads element specs from the per-engine contract
//   (resolveEngineSectionSchema), so the hero spec carries the meridian∪vestria
//   union (tag_text, cta_href, secondary_cta_href, stamp_value/label,
//   values.*) and the collection-schema block is the unified thing set. This
//   is INTENDED convergence (same Brief ⇒ same element spec under both thing
//   templates), not drift — see the phase 8b invariant test below.

import { describe, it, expect } from 'vitest';
import {
  buildProductStrategyPrompt,
  type ProductStrategyPromptInput,
} from './strategy/promptsProduct';
import { buildProductCopyPrompt, type ProductCopyPromptInput } from './copyPrompt';
import type { ProductStrategyOutput } from '@/types/product';

// ===== Frozen SaaS baselines (do not hand-edit — recapture deliberately) =====

// eslint-disable-next-line max-len
const STRATEGY_SAAS_BASELINE = "You are a landing page strategist. Analyze this product and create a conversion-optimized strategy.\n\n## Product Information\n\n**Name:** DeployKit\n**Description:** A CLI that ships your app to production in one command.\n**Landing Goal:** signup\n**Offer:** Free tier up to 3 projects\n**Categories:** Developer Tools\n\n## Target Audience\n\n**Primary:** indie developers\n**Other audiences:** small startup teams\n\n## Features\n\n1. One-command deploy\n2. Automatic rollbacks\n\n---\n\n## Your Task\n\nGenerate a JSON response with the following structure:\n\n### Step 1: awareness\nChoose ONE awareness level that will resonate with the most number of users:\n\n- \"problem-aware-cold\": Knows problem exists but low emotional intensity. Not urgently seeking solutions. Needs to be reminded why this matters.\n- \"problem-aware-hot\": Feels the pain intensely. Actively frustrated. Urgently wants relief. \"Hair on fire\" problem.\n- \"solution-aware-skeptical\": Knows solutions exist. Has seen/tried alternatives. Hesitant, needs convincing why THIS one is different.\n- \"solution-aware-eager\": Knows solutions exist. Ready to act. Just needs to confirm this is the right choice.\n\n### Step 2: oneReader\nDefine the ONE ideal reader:\n- personaDescription: Who they are (job title, situation, context) - be specific\n- pain: Array of 3-5 pain points using their exact words/phrases\n- desire: Array of 3-5 desires using their exact words/phrases\n- objections: Array of 3-5 likely objections they'd have\n\n### Step 3: oneIdea\nDefine the core value proposition:\n- bigBenefit: The ultimate outcome they want (emotional/tangible result)\n- uniqueMechanism: WHY/HOW this product works differently\n- reasonToBelieve: The proof point that makes it credible. Do NOT invent specific numbers, customer counts, or funding figures — use a figure only if it is literally present in the product input above; otherwise use non-numeric proof framing.\n\n### Step 4: featureAnalysis\nFor each feature provided, create:\n- feature: The raw feature (from input)\n- benefit: What the user directly gets from this feature\n- benefitOfBenefit: The emotional/practical impact of that benefit\n\n\n---\n\nThis strategy drives downstream copy generation for a \"Modern Tech\" product page —\nconfident, precise, builder-to-builder, no hype. Keep oneReader/oneIdea phrasing\nconcrete and specific; copy generation builds directly on these fields.\n\nOutput valid JSON only. No explanations or markdown.";

// eslint-disable-next-line max-len
const COPY_SAAS_BASELINE = "## IDENTITY\nYou are a conversion copywriter for a software product landing page. The page uses the Meridian design family — \"Modern Tech\": confident, precise, builder-to-builder. You write in that voice, NOT generic breathless SaaS marketing voice.\n\n## PRODUCT\nName: DeployKit\nOne-liner: A CLI that ships your app to production in one command.\nOffer: Free tier up to 3 projects\nLanding goal: signup\nGoal = Sign up free. Primary CTA copy: \"Sign up free\" (or a close, on-brand variant).\ncta_subtext (optional muted line under the primary CTA): free-plan framing (e.g. \"Free forever plan\"). OMIT this element unless the offer EXPLICITLY states such terms — do NOT invent terms (no fabricated \"no credit card\", trial length, guarantees, or shipping claims).\nEmphasis: low friction, immediate value; address the \"is it really free\" objection.\n\nFeatures (raw, from the founder):\n- One-command deploy\n- Automatic rollbacks\n\n## ONE READER (Ideal Reader)\nIndie developer shipping side projects nights and weekends\n\nAwareness: solution-aware-skeptical\nVisitor has seen or tried alternatives. Differentiate sharply and bring proof early; assume a raised eyebrow.\n\nPain points:\n- Deploys eat my evenings\n- Rollbacks are scary\n\nDesires:\n- Push and forget\n- Sleep through release night\n\nLikely objections:\n- Another tool to learn\n- What if it locks me in\n\n## ONE IDEA (Core Value Proposition)\nBig benefit: Ship without babysitting infrastructure\nUnique mechanism: One command wraps build, deploy and rollback\nReason to believe: Rollbacks are automatic on failed health checks\n\n## FEATURE ANALYSIS (feature → benefit → impact)\n- One-command deploy → Ship in seconds → Evenings back\n\n## VOICE — MERIDIAN (Modern Tech)\n\n**Tone profile:** confident, precise, builder-to-builder — technical credibility without hype\n\n**Cadence rules:**\n- Short, declarative sentences. State the outcome, then the proof.\n- Concrete and specific: name the actual thing (\"deploy in 18 seconds\", not \"blazing-fast performance\").\n- Accent emphasis is rare — wrap 1-2 words in <em> on HEADLINES only (hero + cta). Never on ledes.\n- Speak to someone who builds. Respect their time; skip the wind-up.\n- No exclamation marks. The product carries the energy, not the punctuation.\n\n**Preferred words:** ship, build, deploy, scale, fast, reliable, precise, works\n**Forbidden words (do NOT use, anywhere — incl. brand names, CTAs, footer text):** revolutionary, game-changing, cutting-edge, seamless, supercharge, unlock, leverage, synergy, best-in-class, next-level, effortless\n\n**Accent convention (CRITICAL — restrained, headline-only):**\nThe <em> accent is an accent-COLORED inline word (the [data-palette] em rule renders it upright + colored, never italic). Reserve it for the single sharpest word in a headline.\n- Wrap 1-2 emphasized words in <em>...</em> on the HERO headline and the CTA headline ONLY.\n- Do NOT add <em> to ledes, feature titles, pricing, testimonials, or any other field. Meridian's accent budget is small — over-using it kills the effect.\n\nHero headline examples:\n  - \"Ship on Friday. Sleep on <em>Saturday</em>.\"\n  - \"Production-ready in <em>minutes</em>, not sprints.\"\n  - \"The deploy pipeline that <em>just works</em>.\"\n\nCTA headline examples:\n  - \"Your next deploy takes <em>18 seconds</em>.\"\n  - \"Start shipping <em>today</em>.\"\n\nLede examples (PLAIN — no <em>, crisp and factual):\n  - \"A deploy platform for teams that ship daily and refuse to babysit infrastructure.\"\n  - \"Connect a repo, push, and watch it go live — with rollbacks one keystroke away.\"\n\n**Eyebrow style:** Tracked uppercase, mono (JetBrains Mono). Status/version framing fits well.\nExamples: \"BUILT FOR ENGINEERS\", \"v2.0 · NOW IN GA\"\n\n## SECTIONS TO GENERATE\n\n### hero (TerminalHero)\nItems: min 0, max 4\nElements:\n- status_text [optional, null to exclude]\n- audience_tag [optional, null to exclude]\n- headline [REQUIRED]\n- lede [REQUIRED]\n- cta_text [REQUIRED]\n- cta_subtext [optional, null to exclude]\n- secondary_cta_text [optional, null to exclude]\n- caption [optional, null to exclude]\n- tag_text [optional, null to exclude]\n- cta_href [optional, null to exclude]\n- secondary_cta_href [optional, null to exclude]\n- stamp_value [optional, null to exclude] [NEEDS_REVIEW]\n- stamp_label [optional, null to exclude]\n- stats.value [optional, null to exclude] [NEEDS_REVIEW]\n- stats.label [optional, null to exclude]\n- stats.unit [optional, null to exclude]\n- values.kicker [optional, null to exclude]\n- values.title [optional, null to exclude]\n- values.description [optional, null to exclude]\n\n### cta (ArcCTA)\nElements:\n- eyebrow [optional, null to exclude]\n- headline [REQUIRED]\n- body [REQUIRED]\n- cta_text [REQUIRED]\n- secondary_cta_text [optional, null to exclude]\n- phone_line [optional, null to exclude]\n\n\nCollection schemas (for array fields — emit the exact shape):\n- nav_items: array of { id: \"\", label: string, href: string }   (2-5 items)\n- stats: array of { id: \"\", value: string [NEEDS_REVIEW], label: string }   (0-4 items; metric like \"18s\", \"99.9%\", or company facts like founding year)\n- values: array of { id: \"\", kicker: string, title: string, description: string }   (0-3; kicker like \"01 — Assurance\"; the pillars of the offer)\n- features: array of { id: \"\", title: string, description: string, icon: string, link_text: string, kicker: string }   (3-6 items; icon = a Lucide icon name e.g. \"Layers\"; kicker like \"SVC / 01\")\n- industries: array of { id: \"\", kicker: string, title: string, description: string }   (3-6; kicker like \"Sector 01\"; one per sector served)\n- items: array of { id: \"\", code: string, title: string, category: string, glyph: string }   (4-8 catalogue entries; code like \"C-04\"; category like \"Culinary · Poly-cotton\"; glyph = 1-2 word item label)\n- swatches: array of { id: \"\", name: string, code: string }   (0-9 material colourways; code like \"/ 04\")\n- rows: array of { id: \"\", name: string, use: string }   (3-6; material name + what it's used for)\n- steps: array of { id: \"\", kicker: string, title: string, description: string }   (3-6 process steps; kicker like \"Step 01\")\n- testimonials: array of { id: \"\", quote: string [NEEDS_REVIEW], author_name: string [NEEDS_REVIEW], author_role: string [NEEDS_REVIEW] }   (1-3; the FIRST renders as the large raised card)\n- logos: array of { id: \"\", name: string }   (0-6; company names only)\n- tiers: array of { id: \"\", plan: string, amount: string [NEEDS_REVIEW], per: string, pitch: string, features: string[] (3-6 short phrases), cta_text: string, featured: boolean }   (2-3 tiers; set featured:true on EXACTLY ONE — the middle \"most chosen\" tier)\n- assurances: array of { id: \"\", kicker: string, text: string }   (0-4; kicker \"01\",\"02\"…; friction-removers like \"No obligation — quotes are complimentary.\")\n- footer_columns: array of { id: \"\", heading: string, links: array of { id: \"\", label: string, href: string } (1-6 links) }   (1-5 columns)\n- link_columns: array of { id: \"\", heading: string, links: array of { id: \"\", label: string, href: string } (1-6 links) }   (0-3 columns)\n- legal_links: array of { id: \"\", label: string, href: string }   (0-4 items; legal/policy links like \"Privacy Policy\", \"Terms of Service\", \"Cookie Policy\")\n\nNotes:\n- \"id\" fields are system-generated — emit empty string \"\" (this applies to NESTED link ids in footer_columns and link_columns too); do NOT invent ids.\n- NEEDS_REVIEW fields (stats.value, testimonial quote/author, tiers.amount): write realistic copy but use general/honest framing — the founder verifies before publish. Do NOT fabricate exact customer counts, dollar figures, or named people you cannot support.\n\n## RULES (MUST FOLLOW)\n1. **Accent convention — HEADLINES ONLY.** Wrap 1-2 emphasized words in <em>...</em> in the HERO headline and the CTA headline ONLY. The renderer styles <em> as an accent-COLORED upright word (never italic). Do NOT add <em> to ledes, feature titles, pricing, testimonials, footer text, or any other field — Meridian's accent budget is deliberately small.\n2. Respect character limits and array min/max strictly.\n3. NO placeholder text — every field must be real, usable copy.\n4. NO invented exact numbers, customer names, or dollar figures. Use honest framing for NEEDS_REVIEW fields — the founder verifies before publish.\n6. Footer: each footer/link column has a \"links\" array of { id: \"\", label, href } — emit empty \"\" for every id, including nested link ids.\n7. Output EVERY section listed above — no omissions (hero, cta). Each as a key with a complete \"elements\" object.\n8. Use the Meridian voice — concrete, precise, no hype. Avoid the forbidden words ANYWHERE, including the brand/wordmark (logo_text, wordmark, brand_text), copyright line, and testimonial quotes.\n9. Return ONLY valid JSON. No markdown, no commentary.\n\n## FINAL SELF-CHECK (before returning)\n(a) Every listed section has an entry with a complete \"elements\" object.\n(b) The hero headline and the cta headline each contain exactly one <em>...</em>; NO other field does.\n(d) Every collection-item id (including nested link ids) is \"\".\n\n## OUTPUT FORMAT\n\nReturn a JSON object keyed by section type. Each value has an \"elements\" object.\n\nEXAMPLE (unrelated niche — a CLI deploy tool — to illustrate SHAPE only. Do NOT copy these words; write fresh copy for the product above.)\n\n{\n  \"hero\": {\n    \"elements\": {\n      \"status_text\": \"v2.0 · NOW IN GA\",\n      \"headline\": \"Ship on Friday. Sleep on <em>Saturday</em>.\",\n      \"lede\": \"A deploy platform for teams that ship daily and refuse to babysit infrastructure.\",\n      \"cta_text\": \"Start free\",\n      \"cta_subtext\": \"No credit card required\",\n      \"secondary_cta_text\": \"Read the docs\",\n      \"stats\": [\n        { \"id\": \"\", \"value\": \"18s\", \"label\": \"median deploy\" },\n        { \"id\": \"\", \"value\": \"99.99%\", \"label\": \"uptime\" }\n      ]\n    }\n  },\n  \"pricing\": {\n    \"elements\": {\n      \"headline\": \"Simple, usage-based pricing\",\n      \"tiers\": [\n        { \"id\": \"\", \"plan\": \"Hobby\", \"amount\": \"$0\", \"per\": \"/mo\", \"pitch\": \"For side projects\", \"features\": [\"1 project\", \"Community support\", \"Auto HTTPS\"], \"cta_text\": \"Start free\", \"featured\": false },\n        { \"id\": \"\", \"plan\": \"Team\", \"amount\": \"$20\", \"per\": \"/seat/mo\", \"pitch\": \"For shipping teams\", \"features\": [\"Unlimited projects\", \"Rollbacks\", \"Priority support\", \"SSO\"], \"cta_text\": \"Start free\", \"featured\": true },\n        { \"id\": \"\", \"plan\": \"Enterprise\", \"amount\": \"Custom\", \"per\": \"\", \"pitch\": \"For scale\", \"features\": [\"SLA\", \"Dedicated support\", \"Audit logs\"], \"cta_text\": \"Contact us\", \"featured\": false }\n      ]\n    }\n  },\n  \"cta\": {\n    \"elements\": {\n      \"headline\": \"Your next deploy takes <em>18 seconds</em>.\",\n      \"body\": \"Connect a repo and push. We handle the rest.\",\n      \"cta_text\": \"Start free\"\n    }\n  },\n  \"footer\": {\n    \"elements\": {\n      \"wordmark\": \"meridian\",\n      \"copyright\": \"© Meridian\",\n      \"footer_columns\": [\n        { \"id\": \"\", \"heading\": \"Product\", \"links\": [ { \"id\": \"\", \"label\": \"Features\", \"href\": \"#\" }, { \"id\": \"\", \"label\": \"Pricing\", \"href\": \"#\" } ] },\n        { \"id\": \"\", \"heading\": \"Company\", \"links\": [ { \"id\": \"\", \"label\": \"About\", \"href\": \"#\" } ] }\n      ]\n    }\n  }\n}\n\nOnly the hero headline and cta headline carry <em>. Match this PATTERN with copy drawn from THIS product.\nhero.cta_subtext is OPTIONAL — a short muted line under the primary CTA. OMIT it (null or absent) unless the offer explicitly supports it; do NOT invent terms.\n\nOptional elements may be set to null to exclude them.\n\nGenerate copy now:";

// ===== Fixtures =====

const saasStrategyInput: ProductStrategyPromptInput = {
  productName: 'DeployKit',
  oneLiner: 'A CLI that ships your app to production in one command.',
  features: ['One-command deploy', 'Automatic rollbacks'],
  landingGoal: 'signup',
  offer: 'Free tier up to 3 projects',
  primaryAudience: 'indie developers',
  otherAudiences: ['small startup teams'],
  categories: ['Developer Tools'],
};

const mfrStrategyInput: ProductStrategyPromptInput = {
  productName: 'Golden Shadow Trading',
  oneLiner: 'Custom uniform manufacturer supplying hotels and clinics across the GCC.',
  // Remapped client-side per D3: features ← valueAdds
  features: ['In-house embroidery unit', 'Bulk-order pricing'],
  landingGoal: 'enquiry',
  offer: 'Free quote within one business day',
  primaryAudience: 'procurement managers',
  // Remapped client-side per D3: otherAudiences ← industriesServed
  otherAudiences: ['Hospitality', 'Healthcare'],
  // Remapped client-side per D3: categories ← productCategories
  categories: ['Chef uniforms', 'Medical scrubs'],
  voiceId: 'tailored-trade',
  whatYouMake: 'Custom-tailored uniforms, chef wear and medical scrubs',
};

const saasStrategyOutput: ProductStrategyOutput = {
  awareness: 'solution-aware-skeptical',
  oneReader: {
    personaDescription: 'Indie developer shipping side projects nights and weekends',
    pain: ['Deploys eat my evenings', 'Rollbacks are scary'],
    desire: ['Push and forget', 'Sleep through release night'],
    objections: ['Another tool to learn', 'What if it locks me in'],
  },
  oneIdea: {
    bigBenefit: 'Ship without babysitting infrastructure',
    uniqueMechanism: 'One command wraps build, deploy and rollback',
    reasonToBelieve: 'Rollbacks are automatic on failed health checks',
  },
  featureAnalysis: [
    {
      feature: 'One-command deploy',
      benefit: 'Ship in seconds',
      benefitOfBenefit: 'Evenings back',
    },
  ],
  sections: ['hero', 'cta'],
  uiblocks: { hero: 'TerminalHero', cta: 'ArcCTA' },
};

const saasCopyInput: ProductCopyPromptInput = {
  strategy: saasStrategyOutput,
  uiblocks: saasStrategyOutput.uiblocks,
  productName: 'DeployKit',
  oneLiner: 'A CLI that ships your app to production in one command.',
  offer: 'Free tier up to 3 projects',
  landingGoal: 'signup',
  features: ['One-command deploy', 'Automatic rollbacks'],
};

const mfrStrategyOutput: ProductStrategyOutput = {
  awareness: 'solution-aware-eager',
  oneReader: {
    personaDescription: 'Procurement manager at a GCC hotel group',
    pain: ['Inconsistent sizing across suppliers', 'Late deliveries before season'],
    desire: ['One accountable supplier', 'Uniforms that survive industrial laundry'],
    objections: ['Minimum order too high?', 'Can they match our brand colours?'],
  },
  oneIdea: {
    bigBenefit: 'Uniforms handled end to end by one supplier',
    uniqueMechanism: 'In-house tailoring and embroidery under one roof',
    reasonToBelieve: 'Supplying hotels and clinics across the GCC',
  },
  featureAnalysis: [
    {
      feature: 'In-house embroidery unit',
      benefit: 'Brand-accurate logos',
      benefitOfBenefit: 'Staff look the part on day one',
    },
  ],
  sections: ['hero', 'contact'],
  uiblocks: { hero: 'VestriaTailoredHero', contact: 'VestriaLeadForm' },
};

const mfrCopyInput: ProductCopyPromptInput = {
  strategy: mfrStrategyOutput,
  uiblocks: mfrStrategyOutput.uiblocks,
  productName: 'Golden Shadow Trading',
  oneLiner: 'Custom uniform manufacturer supplying hotels and clinics across the GCC.',
  offer: 'Free quote within one business day',
  landingGoal: 'enquiry',
  // Remapped client-side per D3: features ← valueAdds
  features: ['In-house embroidery unit', 'Bulk-order pricing'],
  voiceId: 'tailored-trade',
};

// ===== Tests =====

describe('promptBranch (onboarding1 Phase 4)', () => {
  describe('SaaS path — byte-identical to frozen baseline', () => {
    it('strategy prompt is unchanged', () => {
      expect(buildProductStrategyPrompt(saasStrategyInput)).toBe(STRATEGY_SAAS_BASELINE);
    });

    it('copy prompt is unchanged', () => {
      expect(buildProductCopyPrompt(saasCopyInput)).toBe(COPY_SAAS_BASELINE);
    });
  });

  describe('manufacturer strategy prompt (tailored-trade)', () => {
    const prompt = buildProductStrategyPrompt(mfrStrategyInput);

    it('carries the manufacturer business-context lines', () => {
      expect(prompt).toContain(
        '**What they make:** Custom-tailored uniforms, chef wear and medical scrubs'
      );
      expect(prompt).toContain('**Industries served:** Hospitality, Healthcare');
      // Categories slot fed by productCategories (label unchanged).
      expect(prompt).toContain('**Categories:** Chef uniforms, Medical scrubs');
    });

    it('carries the tailored-trade framing paragraph', () => {
      expect(prompt).toContain('manufacturer / trade-supplier');
      expect(prompt).toContain('enquiry-driven, no startup hype');
    });

    it('carries NO SaaS-only markers', () => {
      expect(prompt).not.toContain('Other audiences:');
      expect(prompt).not.toContain('Modern Tech');
      expect(prompt).not.toContain('builder-to-builder');
    });
  });

  describe('manufacturer copy prompt (tailored-trade)', () => {
    const prompt = buildProductCopyPrompt(mfrCopyInput);

    it('relabels the features block as value-adds', () => {
      expect(prompt).toContain('Value-adds / USPs (raw, from the founder):');
      expect(prompt).not.toContain('Features (raw, from the founder):');
    });

    it('lists the remapped value-adds under the relabeled block', () => {
      expect(prompt).toContain('- In-house embroidery unit');
      expect(prompt).toContain('- Bulk-order pricing');
    });

    it('carries NO SaaS-only markers', () => {
      expect(prompt).not.toContain('Modern Tech');
      expect(prompt).not.toContain('Meridian design family');
    });
  });

  // F27 — legal_links is fillMode:'ai_generated' in the product element schema but
  // was absent from the Collection-schemas block, so the model filled an array it
  // never saw the shape of and emitted an object → generation died. The prompt now
  // declares its shape.
  describe('F27 — legal_links collection shape is declared in the copy prompt', () => {
    it('the SaaS copy prompt documents legal_links as an array shape', () => {
      const prompt = buildProductCopyPrompt(saasCopyInput);
      expect(prompt).toContain('- legal_links: array of { id: "", label: string, href: string }');
    });

    it('the manufacturer copy prompt documents legal_links too', () => {
      expect(buildProductCopyPrompt(mfrCopyInput)).toContain('- legal_links: array of {');
    });
  });
});

// ===== scale-07 phase 8b — the §3 invariant on the WIZARD copy path =====
// Same Brief ⇒ IDENTICAL copy-prompt element spec under meridian and vestria.
// The layout name inside each "### <section> (<Layout>)" heading is a display
// handle only (which block renders) — normalized away before comparison. Voice
// text (identity/rules/example/notes) differs by design; the ELEMENT SPEC and
// the collection-schema list must not.

const CONVERGED_SECTIONS = ['header', 'hero', 'features', 'testimonials', 'footer'];

const MERIDIAN_CORE_UIBLOCKS: Record<string, string> = {
  header: 'MeridianNavHeader',
  hero: 'TerminalHero',
  features: 'HairlineFeatureGrid',
  testimonials: 'ProofWithLogoRail',
  footer: 'HairlineFooter',
};

const VESTRIA_CORE_UIBLOCKS: Record<string, string> = {
  header: 'VestriaNavHeader',
  hero: 'VestriaTailoredHero',
  features: 'VestriaServicesGrid',
  testimonials: 'VestriaQuotes',
  footer: 'VestriaFooter',
};

/** Extract the "## SECTIONS TO GENERATE" spec block and strip layout names. */
function extractNormalizedSpec(prompt: string): string {
  const spec = prompt
    .split('## SECTIONS TO GENERATE')[1]
    .split('\nCollection schemas')[0];
  return spec.replace(/^### (\w+) \([A-Za-z]+\)$/gm, '### $1').trim();
}

/** Extract the collection-schema LIST (shapes; excludes the voice-worded Notes). */
function extractCollectionList(prompt: string): string {
  return prompt
    .split('Collection schemas (for array fields — emit the exact shape):')[1]
    .split('\nNotes:')[0]
    .trim();
}

function copyInputFor(uiblocks: Record<string, string>, voiceId?: 'tailored-trade') {
  return {
    strategy: {
      ...saasStrategyOutput,
      sections: CONVERGED_SECTIONS,
      uiblocks,
    },
    uiblocks,
    productName: 'DeployKit',
    oneLiner: 'A CLI that ships your app to production in one command.',
    offer: 'Free tier up to 3 projects',
    landingGoal: 'signup' as const,
    features: ['One-command deploy', 'Automatic rollbacks'],
    ...(voiceId ? { voiceId } : {}),
  } satisfies ProductCopyPromptInput;
}

describe('phase 8b invariant — same Brief ⇒ same copy-prompt element spec (meridian vs vestria)', () => {
  const meridianPrompt = buildProductCopyPrompt(copyInputFor(MERIDIAN_CORE_UIBLOCKS));
  const vestriaPrompt = buildProductCopyPrompt(
    copyInputFor(VESTRIA_CORE_UIBLOCKS, 'tailored-trade')
  );

  it('section element specs are IDENTICAL once layout names are normalized away', () => {
    expect(extractNormalizedSpec(vestriaPrompt)).toBe(extractNormalizedSpec(meridianPrompt));
  });

  it('collection-schema shape list is IDENTICAL across voices', () => {
    expect(extractCollectionList(vestriaPrompt)).toBe(extractCollectionList(meridianPrompt));
  });

  it('the spec carries union fields from BOTH templates (convergence, not meridian-only)', () => {
    const spec = extractNormalizedSpec(meridianPrompt);
    // vestria-origin optionals now offered under meridian:
    expect(spec).toContain('tag_text');
    expect(spec).toContain('stamp_value');
    expect(spec).toContain('values.kicker');
    // meridian-origin fields now offered under vestria (same spec — proven by
    // the equality above; assert presence for readability):
    expect(spec).toContain('status_text');
    expect(spec).toContain('cta_subtext');
    expect(spec).toContain('footer_columns.heading');
    expect(spec).toContain('link_columns.heading');
  });

  it('fall-through: non-thing layouts keep the layout-name spec path (no contract leak)', () => {
    // ContactForm (techpremium/naayom editor-only, sectionType 'contact') is
    // NOT engine-covered — resolveEngineSectionSchema returns null and the
    // spec must come from its OWN layout schema, NOT the thing contract's
    // contact entry (VestriaLeadForm: tag_text + assurances).
    const uiblocks = { contact: 'ContactForm' };
    const input = copyInputFor(uiblocks);
    (input.strategy as any).sections = ['contact'];
    const prompt = buildProductCopyPrompt(input);
    const spec = prompt.split('## SECTIONS TO GENERATE')[1].split('\nCollection schemas')[0];
    expect(spec).toContain('### contact (ContactForm)');
    expect(spec).toContain('form_heading'); // ContactForm's own field
    expect(spec).not.toContain('tag_text'); // VestriaLeadForm contract field
    expect(spec).not.toContain('assurances.kicker'); // contract collection
  });
});
