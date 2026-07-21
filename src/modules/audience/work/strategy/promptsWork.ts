// src/modules/audience/work/strategy/promptsWork.ts
// ============================================================================
// WORK STRATEGY PROMPT — the ONE small AI call (plan design-decision #2).
//
// LEAN by construction: structure is decided in code (assembleWorkStructure), so
// this prompt asks the model for ONLY three narrative angles — positioningAngle,
// storyAngle, voiceNotes (WorkStrategyResponseSchema). It is fed the seller's
// facts (praise · dreamClient · price position · profession wording · group
// names · establishment branch) plus the pre-rendered VOICE block, and NOTHING
// about the template/skeleton it will render into (firewall).
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
//   `assertNoTemplateLeak` guards the input object; `assertNoTemplateNamesInText`
//   guards the built string. No templateId/skeletonId/template names anywhere.
// ============================================================================

import type { WorkProfession } from '@/modules/engines/workVocabulary';
import type { PricePosition } from '../pricePosition';
import type { Establishment } from '../voice';
import { assertNoTemplateLeak, assertNoTemplateNamesInText } from '../promptFirewall';

export interface WorkStrategyPromptInput {
  /** Business / seller name (identity slot 1). */
  businessName?: string;
  /** Resolved work profession (photographer | designer | writer | agency). */
  profession: WorkProfession;
  /** Plural noun for the seller's body of work (e.g. "galleries", "case studies"). */
  workNoun: string;
  /** Derived price band (premium | middle | friendly). */
  pricePosition: PricePosition;
  /** new | established — branches the story framing. */
  establishment: Establishment;
  /** Dream-client description (slot 5), verbatim. */
  dreamClient?: string;
  /** Verbatim praise strings (slot 6). */
  praise: string[];
  /** Names of the seller's work groups (slot 2), verbatim. */
  groupNames: string[];
  /** Primary content language (slot 8; languages[0]). */
  primaryLanguage: string;
  /** Pre-rendered VOICE block (formatWorkVoiceForPrompt). */
  voiceBlock: string;
}

/** Establishment-branch guidance woven into the story-angle instruction. */
function establishmentGuidance(establishment: Establishment): string {
  return establishment === 'new'
    ? 'This seller is NEW — do not imply a long history or an award shelf. Frame the story around craft, care and why they started; treat praise as "what to expect". Never invent a track record.'
    : 'This seller is ESTABLISHED — they have a real body of work and earned praise. Frame the story from that authority.';
}

export function buildWorkStrategyPrompt(input: WorkStrategyPromptInput): string {
  assertNoTemplateLeak(input, 'buildWorkStrategyPrompt');

  const {
    businessName,
    profession,
    workNoun,
    pricePosition,
    establishment,
    dreamClient,
    praise,
    groupNames,
    primaryLanguage,
    voiceBlock,
  } = input;

  const praiseBlock = praise.length
    ? praise.map((p, i) => `${i + 1}. "${p}"`).join('\n')
    : '(none stated)';

  const groupsLine = groupNames.length ? groupNames.join(', ') : '(none stated)';

  const prompt = `You are a positioning strategist for a ${profession}'s portfolio site. The structure of this site (its pages, sections and card counts) is ALREADY decided in code — your ONLY job is to choose the narrative angles the copy will lean on. Do NOT propose pages, sections, layouts or counts.

## The seller
**Name:** ${businessName || '(unnamed)'}
**Their work (${workNoun}):** ${groupsLine}
**Price position:** ${pricePosition}
**Standing:** ${establishment}
**Dream client:** ${dreamClient || '(not stated)'}

## Their praise (verbatim — do NOT rewrite; use only as evidence of what resonates)
${praiseBlock}

${voiceBlock}

## Your task
Return JSON with EXACTLY these three fields — nothing else:

- **positioningAngle**: one line (the stance the whole site leans on). Grounded in the facts above; no invented claims, numbers or credentials.
- **storyAngle**: one line framing the About / story section. ${establishmentGuidance(establishment)}
- **voiceNotes**: 2-4 short, concrete voice reminders for the copywriter (e.g. cadence, what to avoid), consistent with the VOICE block.

Write every string in ${primaryLanguage}. The facts and praise above MAY be in another language — render their MEANING in ${primaryLanguage}; never copy or echo their source-language wording (proper nouns stay as-is). Use ONLY facts stated above — invent nothing.

Output valid JSON only. No explanations or markdown.`;

  assertNoTemplateNamesInText(prompt, 'buildWorkStrategyPrompt');
  return prompt;
}
