// src/modules/audience/work/voice.ts
// ============================================================================
// WORK-COPY VOICE — keyed by PROFESSION × PRICE-POSITION × ESTABLISHMENT.
//
// Mirrors the service/voice.ts pattern (interface + specs + selector + prompt
// formatter), but the work voice is COMPOSED from three orthogonal axes rather
// than picked from a small fixed set:
//   • profession   (photographer | designer | writer | agency)  → identity base
//   • pricePosition (premium | middle | friendly)               → tone + lexicon
//   • establishment (new | established)                         → authority note
//
// AUDIENCE-LEVEL and TEMPLATE-AGNOSTIC: voice is NEVER keyed to templateId /
// skeletonId — that keeps the promptFirewall invariant intact (any work skin
// reads whatever voice the profession/price/establishment implies). No template
// names appear anywhere in inputs or outputs.
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
//   Pure code. `import type` only from config (for the profession-row shape).
//   No react / stores / hooks / templateId.
// ============================================================================

import type { BusinessTypeEntry } from '@/modules/businessTypes/config';
import type { WorkProfession } from '@/modules/engines/workVocabulary';
import type { PricePosition } from './pricePosition';

export type Establishment = 'new' | 'established';

/** The composed voice spec handed to the copy prompt. */
export interface WorkVoiceSpec {
  /** Stable composite id, e.g. `photographer-premium-established`. */
  id: string;
  /** Prompt label. */
  label: string;
  profession: WorkProfession;
  pricePosition: PricePosition;
  establishment: Establishment;
  /** IDENTITY framing injected at the top of the copy prompt. */
  identity: string;
  /** One-line tone summary. */
  toneProfile: string;
  cadenceRules: string[];
  lexicon: { preferred: string[]; forbidden: string[] };
  /** New-vs-established authority note (anti-invention for `new` sellers). */
  establishmentNote: string;
}

/** The profession-row input — only `.key` is read (a BusinessTypeEntry works). */
export type WorkProfessionRow = Pick<BusinessTypeEntry, 'key'>;

// ─────────────────────────────────────────────────────────────────────────────
// Axis 1 — profession identity base.
// ─────────────────────────────────────────────────────────────────────────────

const PROFESSION_IDENTITY: Record<WorkProfession, string> = {
  photographer:
    'You are a conversion copywriter for a photographer\'s portfolio site. The photographs carry the page — your words frame the work, set the mood, and make it effortless to enquire. Never describe what the image already shows; write the promise around it.',
  designer:
    'You are a conversion copywriter for a design studio\'s portfolio site. The work carries the page — your words frame the thinking behind it and make it easy to start a project. Speak like a studio that takes fewer projects on purpose, not a full-service vendor.',
  writer:
    'You are a conversion copywriter for a writer\'s site. The writing carries the page — your words frame the voice and the body of work, and invite the reader to read on or get in touch. Restraint over hype; let the sentences do the selling.',
  agency:
    'You are a conversion copywriter for a studio/agency portfolio site. The results carry the page — your words frame the outcomes delivered and make it easy to book a conversation. Operators who ship, not a brand describing itself.',
};

const PROFESSION_PREFERRED: Record<WorkProfession, string[]> = {
  photographer: ['photograph', 'shoot', 'frame', 'light', 'capture', 'story', 'day'],
  designer: ['design', 'craft', 'system', 'identity', 'project', 'shape', 'considered'],
  writer: ['write', 'words', 'voice', 'piece', 'read', 'story', 'craft'],
  agency: ['deliver', 'result', 'outcome', 'engagement', 'ship', 'work', 'move'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Axis 2 — price-position tone + lexicon.
// ─────────────────────────────────────────────────────────────────────────────

const POSITION_TONE: Record<PricePosition, string> = {
  premium:
    'restrained, confident, quiet-luxury; let the work and the white space do the selling',
  middle: 'warm, professional, clear; approachable without being casual',
  friendly: 'warm, human, welcoming; plain-spoken and easy to say yes to',
};

const POSITION_CADENCE: Record<PricePosition, string[]> = {
  premium: [
    'Say less. One true line beats three clever ones.',
    'Confidence, not superlatives — the work is the proof, not the adjectives.',
    'No exclamation marks. Calm carries authority.',
  ],
  middle: [
    'Clear and concrete over clever.',
    'One long sentence, then one short.',
    'Warm and direct — a real person, not a brochure.',
  ],
  friendly: [
    'Plain, warm words. Write like you talk.',
    'Make the next step feel easy and low-pressure.',
    'Short sentences. No jargon.',
  ],
};

// Forbidden lexicon: a shared marketing-fluff base + per-position additions.
const BASE_FORBIDDEN = [
  'unlock',
  'leverage',
  'synergy',
  'best-in-class',
  'world-class',
  'game-changing',
  'revolutionary',
  'cutting-edge',
  'one-stop',
  'seamless',
  'elevate your brand',
  'take it to the next level',
  'passionate',
  'solutions',
];

const POSITION_FORBIDDEN: Record<PricePosition, string[]> = {
  premium: ['cheap', 'affordable', 'budget', 'deal', 'discount', 'bargain', 'low-cost'],
  middle: ['cheapest', 'luxury', 'elite'],
  friendly: ['exclusive', 'bespoke', 'luxury', 'elite', 'discerning', 'uncompromising'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Axis 3 — establishment authority note (anti-invention for `new`).
// ─────────────────────────────────────────────────────────────────────────────

const ESTABLISHMENT_NOTE: Record<Establishment, string> = {
  established:
    'This seller has a real body of work and earned praise. Speak from that authority and use their testimonials verbatim as proof.',
  new:
    'This seller is NEW. Do NOT imply a long history, an award shelf, or a client roster that is not stated in the facts. Frame praise as "what to expect", lean on craft and care, and never fabricate a track record.',
};

// ─────────────────────────────────────────────────────────────────────────────
// Profession resolver — BusinessTypeKey (or any string) → WorkProfession.
// ─────────────────────────────────────────────────────────────────────────────

const KEY_TO_PROFESSION: Record<string, WorkProfession> = {
  photographer: 'photographer',
  designer: 'designer',
  writer: 'writer',
  agency: 'agency',
};

/**
 * Map a business-type key onto a work profession. Unknown keys fall back to
 * `'photographer'` (the pilot profession) — a conservative, documented default.
 */
export function resolveWorkProfession(key: string | null | undefined): WorkProfession {
  return (key && KEY_TO_PROFESSION[key]) || 'photographer';
}

// ─────────────────────────────────────────────────────────────────────────────
// Selector + formatter.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compose the work voice from the three axes. Firewall-safe (reads profession
 * row + derived price position + establishment; never templateId).
 */
export function selectWorkVoice(input: {
  professionRow: WorkProfessionRow | null | undefined;
  pricePosition: PricePosition;
  establishment: Establishment;
}): WorkVoiceSpec {
  const profession = resolveWorkProfession(input.professionRow?.key);
  const { pricePosition, establishment } = input;

  return {
    id: `${profession}-${pricePosition}-${establishment}`,
    label: `${profession.toUpperCase()} · ${pricePosition.toUpperCase()} · ${establishment.toUpperCase()}`,
    profession,
    pricePosition,
    establishment,
    identity: PROFESSION_IDENTITY[profession],
    toneProfile: POSITION_TONE[pricePosition],
    cadenceRules: POSITION_CADENCE[pricePosition],
    lexicon: {
      preferred: PROFESSION_PREFERRED[profession],
      forbidden: [...BASE_FORBIDDEN, ...POSITION_FORBIDDEN[pricePosition]],
    },
    establishmentNote: ESTABLISHMENT_NOTE[establishment],
  };
}

/** Render a WorkVoiceSpec as a prompt-ready Markdown block. */
export function formatWorkVoiceForPrompt(voice: WorkVoiceSpec): string {
  return `## VOICE — ${voice.label}

**Identity:** ${voice.identity}

**Tone profile:** ${voice.toneProfile}

**Cadence rules:**
${voice.cadenceRules.map((r) => `- ${r}`).join('\n')}

**Preferred words:** ${voice.lexicon.preferred.join(', ')}
**Forbidden words (do NOT use):** ${voice.lexicon.forbidden.join(', ')}

**Establishment:** ${voice.establishmentNote}`;
}
