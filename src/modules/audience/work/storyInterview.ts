// src/modules/audience/work/storyInterview.ts
// ============================================================================
// WORK STORY-INTERVIEW (Sugarman) — single-section prompt builder + contract
// validator for the work `about`/story section.
//
// This is the SECOND, dedicated story generator (design decision #6). It runs on
// the SAME strong `work-copy` path as phase-3 generate-copy and validates its
// output against the IDENTICAL contract (`workElementContract.about`) — there is
// NO second, weaker generator. The legacy /api/regenerate-section (hard-coded
// gpt-3.5-turbo/Mixtral, unvalidated coercion) is NOT used for the work story.
//
// The interview turns THREE freeform answers into a ship-grade `about`:
//   • origin  — where the work began (one-liner)
//   • moment  — an unforgettable client moment
//   • belief  — the craft belief that spine's the story
//
// COPY TECHNIQUE (Sugarman, baked into the RULES):
//   • HOOK on the specific moment (open on the concrete scene, not a summary).
//   • BELIEF as the spine (the story earns its way to that conviction).
//   • Praise as the LANDING (close on what the work leaves people with).
//
// SAME anti-invention binding as copyPrompt: facts are law, no fabricated
// biography, graceful omission. PRIMARY-LANGUAGE directive (languages[0]).
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
//   Calls assertNoTemplateLeak(input) + assertNoTemplateNamesInText(prompt).
//   No templateId / skeletonId / template names ever reach the prompt.
// ============================================================================

import type { WorkFacts } from '@/lib/schemas/workFacts.schema';
import type { SectionCopy } from '@/types/generation';
import type { WorkVoiceSpec } from './voice';
import { formatWorkVoiceForPrompt } from './voice';
import {
  assertNoTemplateLeak,
  assertNoTemplateNamesInText,
} from './promptFirewall';
import { workElementContract } from '@/modules/engines/workSections';

/** The work story section key — DISTINCT from `proof`/`testimonials`. */
export const STORY_SECTION_KEY = 'about' as const;

/** Minimum ship-grade bio length (chars). Shorter output = a shape mismatch. */
export const MIN_STORY_BIO_CHARS = 40;

/** The three freeform interview answers. */
export interface StoryInterviewAnswers {
  /** Where the work began — a one-liner. */
  origin: string;
  /** An unforgettable client moment (the HOOK). */
  moment: string;
  /** The craft belief that spines the story. */
  belief: string;
}

export interface StoryInterviewPromptInput {
  answers: StoryInterviewAnswers;
  facts: WorkFacts;
  voice: WorkVoiceSpec;
  /** Optional existing-site context block (server-fed; tone reference only). */
  siteContextBlock?: string;
}

/**
 * The `about` element keys the contract marks REQUIRED — the SINGLE SOURCE OF
 * TRUTH both story generators (phase-3 generate-copy via parseWorkCopy and this
 * regen route) must satisfy. Derived from `workElementContract.about`; if the
 * contract drifts, both paths drift together (the parity test pins this).
 */
export function aboutRequiredKeys(): string[] {
  const schema = workElementContract[STORY_SECTION_KEY];
  if (!schema) return [];
  return Object.entries(schema.elements)
    .filter(([, def]) => def.requirement === 'required')
    .map(([key]) => key);
}

export interface StoryValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate parsed story copy against the `about` contract BEFORE returning it.
 * Rejects a malformed/short shape: the `about` section must be present, every
 * contract-required element must be a non-empty string, and the `bio` must be at
 * least MIN_STORY_BIO_CHARS (a one-word bio is not ship-grade). Facts-only /
 * anti-invention is enforced prompt-side; this is the SHAPE gate.
 */
export function validateStoryAbout(
  sections: Record<string, SectionCopy>
): StoryValidationResult {
  const about = sections[STORY_SECTION_KEY];
  if (!about || !about.elements) {
    return { valid: false, reason: 'missing about section' };
  }
  const elements = about.elements as Record<string, unknown>;

  for (const key of aboutRequiredKeys()) {
    const value = elements[key];
    if (typeof value !== 'string' || value.trim().length === 0) {
      return { valid: false, reason: `missing or empty required element "${key}"` };
    }
  }

  const bio = elements['bio'];
  if (typeof bio === 'string' && bio.trim().length < MIN_STORY_BIO_CHARS) {
    return { valid: false, reason: 'bio too short (not ship-grade)' };
  }

  return { valid: true };
}

/**
 * Build the single-section story-interview prompt for the work `about` section.
 * Sugarman-shaped (hook / belief-spine / praise-landing) + anti-invention +
 * primary-language directive. Firewall-guarded on entry and exit.
 */
export function buildStoryInterviewPrompt(input: StoryInterviewPromptInput): string {
  assertNoTemplateLeak(input, 'buildStoryInterviewPrompt');
  const { answers, facts, voice, siteContextBlock } = input;

  const language = facts.languages?.[0] || 'en';
  const praise = facts.praise ?? [];
  const praiseBlock =
    praise.length > 0
      ? praise.map((p) => `- "${p}"`).join('\n')
      : '(no client praise stated — do NOT invent any)';

  const forbidden = voice.lexicon.forbidden.join(', ');

  const prompt = `${voice.identity}

${formatWorkVoiceForPrompt(voice)}

Establishment: ${voice.establishment}
${voice.establishmentNote}
${siteContextBlock ? `\n${siteContextBlock}\n` : ''}
## THE INTERVIEW (the ONLY raw material for the story)
The seller answered three questions. Build the story from THESE answers and the
stated facts ONLY — nothing else.

1. Where the work began: ${answers.origin || '(not answered)'}
2. An unforgettable client moment: ${answers.moment || '(not answered)'}
3. The craft belief that drives the work: ${answers.belief || '(not answered)'}

## CLIENT PRAISE (verbatim — use as the landing, never fabricate)
${praiseBlock}

## PAGE TO WRITE — the \`about\` (story) section ONLY
Write ONLY the \`about\` section. Do NOT write any other section.
- eyebrow (optional, short label)
- heading (required — a short, true headline for the story)
- bio (required — the story itself, one lean paragraph)

## RULES (MUST FOLLOW)
1. **Write EVERY string in ${language}.** No other language, no mixed-language
   fragments, no English fragments (unless ${language} IS English).
2. **HOOK on the moment.** Open the bio on the SPECIFIC client moment above — a
   concrete scene, not a summary. Earn the reader's attention in the first line.
3. **BELIEF is the spine.** Let the story build to the craft belief above; make
   it the conviction the whole story is organised around.
4. **Praise is the LANDING.** Close on what the work leaves people with, echoing
   the stated praise (verbatim where you quote it — never invent a quote).
5. **Anti-invention — facts are law.** Use ONLY the three answers, the stated
   praise, and the facts. NEVER fabricate a biography, founding year, award,
   credential, client roster, statistic, or history that is not stated. If a
   detail is missing, leave it out — graceful omission beats a fabricated claim.${
     voice.establishment === 'new'
       ? '\n   This seller is NEW — do NOT imply a long history or an award shelf; lean on craft and care.'
       : ''
   }
6. **Ship-grade, lean.** One true paragraph. Restraint over hype — one true line
   beats three clever ones.
7. Use the ${voice.label} voice. **Avoid its forbidden words ANYWHERE.**
   Forbidden words: ${forbidden}.
8. Return ONLY valid JSON. No markdown, no commentary.

## OUTPUT FORMAT
Return a JSON object with a single key "about" whose value is
{ "elements": { "eyebrow"?: string, "heading": string, "bio": string } }.

Generate the story now:`;

  assertNoTemplateNamesInText(prompt, 'buildStoryInterviewPrompt');
  return prompt;
}
