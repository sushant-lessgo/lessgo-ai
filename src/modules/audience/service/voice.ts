// src/modules/audience/service/voice.ts
// Service-copy voice specs. AUDIENCE-LEVEL and template-agnostic: voice is chosen
// by BUSINESS ARCHETYPE (serviceType + signals in the understanding), NEVER by
// templateId — that keeps the promptFirewall invariant intact (a Surge skin and a
// Hearth skin both read whatever voice the business archetype implies).
//
// `<em>` PLACEMENT is a structural service rule (wrap 1-2 emphasized words) shared
// by every voice and emitted by the prompt. `<em>` RENDERING is template CSS
// (Hearth = italic serif; Surge = non-italic accent) and lives in each template's
// tokens.ts — NOT here.

export interface ServiceVoiceSpec {
  id: 'hearth' | 'performance';
  /** Prompt label, e.g. "HEARTH" / "PERFORMANCE". */
  label: string;
  /** One-line IDENTITY framing injected at the top of the copy prompt. */
  identity: string;
  toneProfile: string;
  cadenceRules: string[];
  lexicon: { preferred: string[]; forbidden: string[] };
  examples: {
    hero: string[];
    services: string[];
    packages: string[];
    cta: string[];
    eyebrow: string[];
    lede: string[];
  };
  roleNotes: { eyebrow: string; quote: string };
  ledeStyle: string;
}

/**
 * HEARTH — warm, editorial, craftsperson. The default for every existing service
 * flow (brand studios, boutiques, consultancies, local services).
 */
export const HEARTH_VOICE: ServiceVoiceSpec = {
  id: 'hearth',
  label: 'HEARTH',
  identity:
    'You are a conversion copywriter for a service business landing page. Write in a warm, editorial, founder-to-founder voice — like a craftsperson describing their work, not a generic SaaS landing page.',
  toneProfile: 'warm, unhurried, founder-to-founder, editorial confidence',
  cadenceRules: [
    'One long sentence, then one short.',
    'Use emphasis sparingly — wrap 1-2 emphasized words in <em>.',
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
    services: ['What we <em>tend to</em>', 'How we <em>build</em>', 'The <em>craft</em>'],
    packages: ['<em>Engagements</em>, plainly priced', 'Three ways to <em>begin</em>'],
    cta: ['Ready when <em>you</em> are', 'Let&apos;s <em>begin</em>'],
    eyebrow: ['EST 2018 · BROOKLYN', 'BRAND STUDIO'],
    lede: [
      'A six-week studio engagement for founders who want their brand to feel as <em>deliberate</em> as their product.',
      'A small team that takes <em>fewer</em> projects, on purpose.',
      'Fill your midweek seats with <em>local</em> regulars.',
      'Websites that actually <em>convert</em> browsers to bookings.',
    ],
  },
  roleNotes: {
    eyebrow: 'Tracked uppercase, paired with a horizontal line.',
    quote: 'A large open-quote mark precedes the quote.',
  },
  ledeStyle:
    'Mid-length sentence (~20-30 words), introduces the engagement on the hero\'s terms. Wraps 1 emphasized word in <em>.',
};

/**
 * PERFORMANCE — confident, proof-led, metric-first. For growth / paid-media / SEO
 * / performance-marketing agencies, where the copy lives on the numbers moved and
 * the words Hearth forbids ("leverage", hard metrics) are exactly right.
 */
export const PERFORMANCE_VOICE: ServiceVoiceSpec = {
  id: 'performance',
  label: 'PERFORMANCE',
  identity:
    'You are a conversion copywriter for a growth / performance-marketing agency landing page. Write in a confident, proof-led, founder-to-founder voice — every claim points at a number you moved. Not warm-and-crafty, not generic SaaS. Operators reporting results, not a brand describing itself.',
  toneProfile: 'confident, proof-led, kinetic-but-not-loud, founder-to-founder',
  cadenceRules: [
    'Lead with the metric, not the adjective: "+312% impressions", "3.4× pipeline" — never "we\'re passionate".',
    'One sharp claim, then the number that backs it.',
    'Name the channel AND the metric it moves (SEO → organic traffic; paid → ROAS/CAC; LinkedIn/X → pipeline).',
    'Use accent emphasis sparingly — wrap 1-2 words in <em> (the moved number or the growth lever).',
    'Speak like an operator who reports results, not a brand that describes itself.',
  ],
  lexicon: {
    preferred: ['ROAS', 'pipeline', 'impressions', 'conversion', 'CAC', 'organic traffic', 'compounding', 'attribution', 'retention', 'the number we moved'],
    forbidden: ['passionate', 'results-driven', 'full-service', 'best-in-class', 'synergy', 'game-changing', 'take your brand to the next level'],
  },
  examples: {
    hero: ['We turn attention into <em>pipeline</em>.', 'Growth you can <em>measure</em> — not vibes.'],
    services: ['Built around <em>one number per channel</em>', 'How we move the <em>graph</em>'],
    packages: ['Engagements priced to the <em>outcome</em>', 'Three ways to <em>start growing</em>'],
    cta: ['Find your fastest <em>number to move</em>', 'Book a free <em>growth audit</em>'],
    eyebrow: ['GROWTH & PAID MEDIA', 'PERFORMANCE MARKETING'],
    lede: [
      'A growth studio that reports in the only language that matters: the numbers we moved.',
      'We grow founders across SEO, X and LinkedIn — and prove it on the <em>dashboard</em>.',
    ],
  },
  roleNotes: {
    eyebrow: 'Tracked uppercase, mono feel. Often paired with an ↗ glyph.',
    quote: 'A large open-quote mark; the moved number is highlighted.',
  },
  ledeStyle:
    'Mid-length sentence (~20-30 words) naming the outcome + channel; wraps 1 emphasized word (the metric/lever) in <em>.',
};

/** Back-compat alias — the historical single export pointed at the Hearth spec. */
export const SERVICE_VOICE = HEARTH_VOICE;

/**
 * Choose the voice by BUSINESS ARCHETYPE — firewall-safe (reads understanding,
 * never templateId). Growth/paid-media/SEO agencies get PERFORMANCE; everyone
 * else keeps HEARTH (no behavior change for existing flows).
 */
export function selectServiceVoice(
  understanding:
    | { serviceType?: string | null; whatYouDo?: string | null; services?: string[] | null; outcomes?: string[] | null }
    | null
    | undefined
): ServiceVoiceSpec {
  if (!understanding) return HEARTH_VOICE;
  const isAgency = understanding.serviceType === 'agency';
  const haystack = [
    understanding.whatYouDo ?? '',
    ...(understanding.services ?? []),
    ...(understanding.outcomes ?? []),
  ]
    .join(' ')
    .toLowerCase();
  const GROWTH_SIGNALS = [
    'growth', 'performance', 'paid', 'ppc', 'ads', 'seo', 'roas', 'pipeline',
    'media buying', 'demand gen', 'lead gen', 'social media', 'conversion', 'ppc',
  ];
  const hasGrowthSignal = GROWTH_SIGNALS.some((s) => haystack.includes(s));
  return isAgency && hasGrowthSignal ? PERFORMANCE_VOICE : HEARTH_VOICE;
}

/**
 * Render a voice spec as a prompt-ready Markdown block. `<em>` rendering is
 * deliberately described as styling-NEUTRAL (the template's CSS decides
 * italic-vs-accent) — only PLACEMENT is instructed here.
 */
export function formatServiceVoiceForPrompt(voice: ServiceVoiceSpec = HEARTH_VOICE): string {
  return `## VOICE — ${voice.label}

**Tone profile:** ${voice.toneProfile}

**Cadence rules:**
${voice.cadenceRules.map((r) => `- ${r}`).join('\n')}

**Preferred words:** ${voice.lexicon.preferred.join(', ')}
**Forbidden words (do NOT use):** ${voice.lexicon.forbidden.join(', ')}

**Emphasis convention (CRITICAL — applies to EVERY section, not just hero):**
Wrap 1-2 emphasized words in <em>...</em> within EVERY "headline" field AND EVERY "lede" field across ALL sections. The renderer styles emphasized words (the template decides how) — without <em>, the page reads flat.

Hero headline examples:
${voice.examples.hero.map((e) => `  - "${e}"`).join('\n')}

Services-section headline examples:
${voice.examples.services.map((e) => `  - "${e}"`).join('\n')}

Packages-section headline examples:
${voice.examples.packages.map((e) => `  - "${e}"`).join('\n')}

CTA-section headline examples:
${voice.examples.cta.map((e) => `  - "${e}"`).join('\n')}

Lede examples (lede ALSO gets <em> — including SHORT, punchy one-line ledes; never skip the accent just because the lede is brief):
${voice.examples.lede.map((e) => `  - "${e}"`).join('\n')}

**Eyebrow style:** ${voice.roleNotes.eyebrow}
Examples: ${voice.examples.eyebrow.map((e) => `"${e}"`).join(', ')}

**Lede style:** ${voice.ledeStyle}

**Quote style:** ${voice.roleNotes.quote}`;
}
