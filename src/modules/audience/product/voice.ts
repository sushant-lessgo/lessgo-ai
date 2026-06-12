// src/modules/audience/product/voice.ts
// Product-type voice spec — Meridian "Modern Tech" (meridianPlan.md §9 voice).
// Type-level (shared by ALL product templates, not Meridian-visual-specific):
// the accent-<em> emphasis is a product-copy rule. Baked into the product copy
// prompt. Counterpart to audience/service/voice.ts (Hearth).
//
// Tone: confident, precise, builder-to-builder. Technical credibility without
// hype. The opposite of warm-editorial Hearth AND the opposite of breathless
// SaaS marketing.

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
 * Render the voice spec as a prompt-ready Markdown block. Injected into
 * buildProductCopyPrompt.
 */
export function formatProductVoiceForPrompt(): string {
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
