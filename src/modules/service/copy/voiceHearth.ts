// src/modules/service/copy/voiceHearth.ts
// Hearth voice spec — verbatim from newServiceOnboarding.md §6.
// Baked into copyPromptService prompt. No per-vibe branching for service route;
// Hearth is the only family at v1.

export const HEARTH_VOICE = {
  toneProfile: 'warm, unhurried, founder-to-founder, editorial confidence',

  cadenceRules: [
    'One long sentence, then one short.',
    'Use serif-italic emphasis sparingly — wrap 1-2 emphasized words in <em>.',
    'Avoid corporate jargon: "unlock", "empower", "leverage", "solutions", "synergy".',
    'Prefer concrete nouns: "a packaging refresh", not "brand transformation deliverables".',
    'Speak as a craftsperson, not a salesperson.',
  ],

  lexicon: {
    preferred: ['craft', 'consider', 'shape', 'build', 'invite', 'offer', 'tend to', 'with care'],
    forbidden: ['unlock', 'revolutionary', 'game-changing', 'synergy', 'leverage', 'solutions', 'best-in-class'],
  },

  examples: {
    hero: [
      'Brand identity that <em>stays with you</em>.',
      'We design <em>quietly</em>. The work speaks loud.',
    ],
    services: [
      'What we <em>tend to</em>',
      'How we <em>build</em>',
      'The <em>craft</em>',
    ],
    packages: [
      '<em>Engagements</em>, plainly priced',
      'Three ways to <em>begin</em>',
    ],
    cta: [
      'Ready when <em>you</em> are',
      'Let&apos;s <em>begin</em>',
    ],
    eyebrow: [
      'EST 2018 · BROOKLYN',
      'BRAND STUDIO',
    ],
    lede: [
      'A six-week studio engagement for founders who want their brand to feel as <em>deliberate</em> as their product.',
      'A small team that takes <em>fewer</em> projects, on purpose.',
    ],
  },

  roleNotes: {
    eyebrow: 'Tracked uppercase, mono-feel via DM Sans 500. Often paired with a horizontal line.',
    quote: 'Italic Fraunces. Preceded by a small italic mark glyph (large open-quote).',
  },
} as const;

/**
 * Render the voice spec as a prompt-ready Markdown block.
 * Used inside copyPromptService to inject the full spec into the LLM prompt.
 */
export function formatHearthVoiceForPrompt(): string {
  return `## VOICE — HEARTH

**Tone profile:** ${HEARTH_VOICE.toneProfile}

**Cadence rules:**
${HEARTH_VOICE.cadenceRules.map((r) => `- ${r}`).join('\n')}

**Preferred words:** ${HEARTH_VOICE.lexicon.preferred.join(', ')}
**Forbidden words (do NOT use):** ${HEARTH_VOICE.lexicon.forbidden.join(', ')}

**Italic-accent convention (CRITICAL — applies to EVERY section, not just hero):**
Wrap 1-2 emphasized words in <em>...</em> within EVERY "headline" field AND EVERY "lede" field across ALL sections. The renderer styles those as accent-deep italic Fraunces. This is the visual signature of Hearth — without it, the page reads flat.

Hero headline examples:
${HEARTH_VOICE.examples.hero.map((e) => `  - "${e}"`).join('\n')}

Services-section headline examples:
${HEARTH_VOICE.examples.services.map((e) => `  - "${e}"`).join('\n')}

Packages-section headline examples:
${HEARTH_VOICE.examples.packages.map((e) => `  - "${e}"`).join('\n')}

CTA-section headline examples:
${HEARTH_VOICE.examples.cta.map((e) => `  - "${e}"`).join('\n')}

Lede examples (lede ALSO gets <em>):
${HEARTH_VOICE.examples.lede.map((e) => `  - "${e}"`).join('\n')}

**Eyebrow style:** ${HEARTH_VOICE.roleNotes.eyebrow}
Examples: ${HEARTH_VOICE.examples.eyebrow.map((e) => `"${e}"`).join(', ')}

**Lede style:** Mid-length sentence (~20-30 words), introduces the engagement on the hero's terms. Wraps 1 emphasized word in <em>.

**Quote style:** ${HEARTH_VOICE.roleNotes.quote}`;
}
