// src/modules/audience/product/voice.ts
// Product-type voice spec — Meridian "Modern Tech" (docs/tracks/meridianPlan.md §9 voice).
// Type-level (shared by ALL product templates, not Meridian-visual-specific):
// the accent-<em> emphasis is a product-copy rule. Baked into the product copy
// prompt. Counterpart to audience/service/voice.ts (Hearth).
//
// Tone: confident, precise, builder-to-builder. Technical credibility without
// hype. The opposite of warm-editorial Hearth AND the opposite of breathless
// SaaS marketing.
//
// FIREWALL: PLAIN module. `productVoiceForBusinessType` reads the businessTypes
// config (which imports only @/types/brief + goals vocab) — no import cycle.

import { businessTypes, type BusinessTypeKey } from '@/modules/businessTypes/config';

export const PRODUCT_VOICE = {
  toneProfile:
    'confident, precise, builder-to-builder — technical credibility without hype',

  cadenceRules: [
    'Short, declarative sentences. State the outcome, then the proof.',
    'Concrete and specific: name the actual thing ("deploy in 18 seconds", not "blazing-fast performance").',
    'Accent emphasis is rare — wrap 1-2 words in <em> on HEADLINES only (hero + cta). Never on ledes.',
    'Speak to someone who builds. Respect their time; skip the wind-up.',
    'No exclamation marks. The product carries the energy, not the punctuation.',
  ],

  lexicon: {
    preferred: ['ship', 'build', 'deploy', 'scale', 'fast', 'reliable', 'precise', 'works'],
    forbidden: [
      'revolutionary', 'game-changing', 'cutting-edge', 'seamless', 'supercharge',
      'unlock', 'leverage', 'synergy', 'best-in-class', 'next-level', 'effortless',
    ],
  },

  examples: {
    // Accent = one inline word, rendered accent-COLORED (upright), not italic.
    heroHeadline: [
      'Ship on Friday. Sleep on <em>Saturday</em>.',
      'Production-ready in <em>minutes</em>, not sprints.',
      'The deploy pipeline that <em>just works</em>.',
    ],
    ctaHeadline: [
      'Your next deploy takes <em>18 seconds</em>.',
      'Start shipping <em>today</em>.',
    ],
    eyebrow: ['BUILT FOR ENGINEERS', 'v2.0 · NOW IN GA'],
    // Ledes are plain — NO <em>. Crisp, factual, one claim.
    lede: [
      'A deploy platform for teams that ship daily and refuse to babysit infrastructure.',
      'Connect a repo, push, and watch it go live — with rollbacks one keystroke away.',
    ],
  },

  roleNotes: {
    accent:
      'The <em> accent is an accent-COLORED inline word (the [data-palette] em rule renders it upright + colored, never italic). Reserve it for the single sharpest word in a headline.',
    eyebrow: 'Tracked uppercase, mono (JetBrains Mono). Status/version framing fits well.',
  },
} as const;

/**
 * ===== TAILORED TRADE (Vestria) =====
 * Premium trade manufacturer voice — concrete, procurement-friendly, zero hype,
 * restrained. Speaks to operations/procurement buyers (hotels, hospitals,
 * schools, sites), not developers. Accent-<em> here is an ITALIC serif accent
 * (Bodoni Moda italic + accent colour), hero headline only.
 */
export const TAILORED_TRADE_VOICE = {
  toneProfile:
    'assured, tailored, operator-to-operator — trade credibility without salesmanship',

  cadenceRules: [
    'Calm, complete sentences. State the capability, then what it means on their floor.',
    'Concrete and specific: name materials, quantities, turnaround ("QC pass on every batch", not "premium quality").',
    'Accent emphasis is rare — wrap 1-2 words in <em> in the HERO headline only. Rendered as an italic serif accent.',
    'Speak to the person who runs procurement or operations. They buy reliability, not excitement.',
    'No exclamation marks. Craft carries the tone, not punctuation.',
  ],

  lexicon: {
    preferred: ['tailored', 'manufactured', 'delivered', 'managed', 'fitted', 'durable', 'consistent', 'accountable'],
    forbidden: [
      'revolutionary', 'game-changing', 'cutting-edge', 'seamless', 'supercharge',
      'unlock', 'leverage', 'synergy', 'best-in-class', 'next-level', 'effortless',
      'world-class', 'passion',
    ],
  },

  examples: {
    heroHeadline: [
      'Uniforms tailored for teams that <em>mean business.</em>',
      'Workwear built for the <em>floor you run.</em>',
    ],
    tag: ['Uniform Manufacturing · GCC', 'Custom Workwear · Since 2009'],
    lede: [
      'From five-star housekeeping to hospital wards — we design, manufacture and deliver professional attire at scale, built to your brand and fit standards.',
      'One accountable partner from first sketch to reorder: held stock, managed sizing, named account support.',
    ],
  },

  roleNotes: {
    accent:
      'The <em> accent renders as an ITALIC serif word in the accent colour (Bodoni Moda italic). Reserve it for the emotional pivot of the hero headline — nothing else.',
    tag: 'Tracked uppercase mono with a dashed rule prefix. Category + region framing fits ("Uniform Manufacturing · GCC").',
  },
} as const;

export type ProductVoiceId = 'modern-tech' | 'tailored-trade';

const PRODUCT_VOICE_IDS: readonly ProductVoiceId[] = ['modern-tech', 'tailored-trade'];

/**
 * Derive the product copy-voice from a businessType key (scale-08 phase 1) —
 * the single source of the THING engine's voice fork. Reads
 * `businessTypes[key].voiceHint`; returns it when it's a valid `ProductVoiceId`,
 * else falls back to `'modern-tech'` (unknown/undefined key, service entries
 * with no voiceHint, or a garbage value). REPLACES the old
 * `templateId === 'vestria'` fork so voice lives in config, not template id.
 */
export function productVoiceForBusinessType(key?: string | null): ProductVoiceId {
  const hint = key ? businessTypes[key as BusinessTypeKey]?.voiceHint : undefined;
  return hint && (PRODUCT_VOICE_IDS as readonly string[]).includes(hint)
    ? (hint as ProductVoiceId)
    : 'modern-tech';
}

/**
 * Render the voice spec as a prompt-ready Markdown block. Injected into
 * buildProductCopyPrompt. Defaults to Meridian "Modern Tech".
 */
export function formatProductVoiceForPrompt(voiceId: ProductVoiceId = 'modern-tech'): string {
  if (voiceId === 'tailored-trade') {
    return `## VOICE — TAILORED TRADE (Premium Manufacturer)

**Tone profile:** ${TAILORED_TRADE_VOICE.toneProfile}

**Cadence rules:**
${TAILORED_TRADE_VOICE.cadenceRules.map((r) => `- ${r}`).join('\n')}

**Preferred words:** ${TAILORED_TRADE_VOICE.lexicon.preferred.join(', ')}
**Forbidden words (do NOT use, anywhere — incl. brand names, CTAs, footer text):** ${TAILORED_TRADE_VOICE.lexicon.forbidden.join(', ')}

**Accent convention (CRITICAL — hero headline only):**
${TAILORED_TRADE_VOICE.roleNotes.accent}
- Wrap 1-2 emphasized words in <em>...</em> in the HERO headline ONLY.
- Do NOT add <em> to ledes, section headlines, cards, quotes, or any other field.

Hero headline examples:
${TAILORED_TRADE_VOICE.examples.heroHeadline.map((e) => `  - "${e}"`).join('\n')}

Lede examples (PLAIN — no <em>, concrete and operator-facing):
${TAILORED_TRADE_VOICE.examples.lede.map((e) => `  - "${e}"`).join('\n')}

**Tag style:** ${TAILORED_TRADE_VOICE.roleNotes.tag}
Examples: ${TAILORED_TRADE_VOICE.examples.tag.map((e) => `"${e}"`).join(', ')}`;
  }

  return `## VOICE — MERIDIAN (Modern Tech)

**Tone profile:** ${PRODUCT_VOICE.toneProfile}

**Cadence rules:**
${PRODUCT_VOICE.cadenceRules.map((r) => `- ${r}`).join('\n')}

**Preferred words:** ${PRODUCT_VOICE.lexicon.preferred.join(', ')}
**Forbidden words (do NOT use, anywhere — incl. brand names, CTAs, footer text):** ${PRODUCT_VOICE.lexicon.forbidden.join(', ')}

**Accent convention (CRITICAL — restrained, headline-only):**
${PRODUCT_VOICE.roleNotes.accent}
- Wrap 1-2 emphasized words in <em>...</em> on the HERO headline and the CTA headline ONLY.
- Do NOT add <em> to ledes, feature titles, pricing, testimonials, or any other field. Meridian's accent budget is small — over-using it kills the effect.

Hero headline examples:
${PRODUCT_VOICE.examples.heroHeadline.map((e) => `  - "${e}"`).join('\n')}

CTA headline examples:
${PRODUCT_VOICE.examples.ctaHeadline.map((e) => `  - "${e}"`).join('\n')}

Lede examples (PLAIN — no <em>, crisp and factual):
${PRODUCT_VOICE.examples.lede.map((e) => `  - "${e}"`).join('\n')}

**Eyebrow style:** ${PRODUCT_VOICE.roleNotes.eyebrow}
Examples: ${PRODUCT_VOICE.examples.eyebrow.map((e) => `"${e}"`).join(', ')}`;
}
