// src/modules/social/postEngine.ts
// Pure generation core for social posts: ONE mode-conditional prompt builder, a
// zod output schema, and a length validator. No AI call, no Prisma, no next/*,
// no 'use client' imports — a plain module a server route can import.
//
// The engine has NO per-platform branching: platform personality comes entirely
// from PLATFORM_PRESETS (see ./presets.ts). Archetype personality comes entirely
// from the ARCHETYPE_INSTRUCTIONS data map below. Adding a platform or archetype
// is a DATA change, never a new code path here.

import { z } from 'zod';
import type { Archetype, Mode, Platform } from './types';
import type { BrandContext } from './types';
import { summarizeBrandContext } from './brandContext';
import type { PlatformPreset } from './presets';
import { PLATFORM_PRESETS } from './presets';

/**
 * Archetype → instruction snippet. DATA, not code paths. `testimonial_quote`
 * is deliberately written so that WITH testimonials the model may quote/echo a
 * real one, and WITHOUT testimonials it draws on general brand proof rather than
 * fabricating a quote — the builder NEVER instructs the model to invent a
 * customer testimonial (see buildSocialPostPrompt).
 */
export const ARCHETYPE_INSTRUCTIONS: Record<Archetype, string> = {
  inspirational:
    'Write an inspirational post: share a belief, lesson, or mission that motivates the audience. Ground it in what this business actually stands for — no empty platitudes.',
  product_spotlight:
    'Write a product/service spotlight: highlight one concrete capability or offer and the tangible benefit it delivers to the audience. Lead with the value, not the feature name.',
  testimonial_quote:
    'Write a social-proof post centered on customer results.',
  tip:
    'Write a practical tip post: give the audience one genuinely useful, specific piece of advice they can act on today, tied to this business\'s area of expertise.',
  announcement:
    'Write an announcement post: share news, a launch, a milestone, or an update in a way that feels exciting but credible and concrete.',
};

/** Input to the single prompt builder. */
export interface BuildSocialPostPromptArgs {
  ctx: BrandContext;
  platform: Platform;
  mode: Mode;
  /** Required for `archetype` / `archetype_context`; ignored for `polish`. */
  archetype?: Archetype;
  /** The user's free text — only used in `archetype_context`. */
  freshContext?: string;
  /** The draft to rewrite — only used in `polish`. */
  draft?: string;
}

/** Render the preset as an explicit constraint block for the model. */
function presetConstraints(preset: PlatformPreset): string {
  return [
    `Platform: ${preset.label}`,
    `Tone: ${preset.tone}`,
    `Hard length limit: ${preset.maxChars} characters MAX (stay comfortably under it).`,
    `Formatting: ${preset.formatHints}`,
    `Hashtags: ${preset.hashtagGuidance}`,
  ].join('\n');
}

/** Whether the context carries at least one usable testimonial. */
function hasTestimonials(ctx: BrandContext): boolean {
  return Array.isArray(ctx.testimonials) && ctx.testimonials.length > 0;
}

/**
 * Build the (single) social-post prompt. Mode-conditional:
 *  - `archetype`          → brand summary + archetype instruction
 *  - `archetype_context`  → same + the user's fresh context
 *  - `polish`             → brand voice summary + "rewrite this draft" + draft
 *
 * The preset is injected as explicit constraints in every mode. Output is always
 * requested as JSON `{ "post": string }`.
 */
export function buildSocialPostPrompt(args: BuildSocialPostPromptArgs): string {
  const { ctx, platform, mode, archetype, freshContext, draft } = args;
  const preset = PLATFORM_PRESETS[platform];
  const brand = summarizeBrandContext(ctx);

  const parts: string[] = [];

  parts.push(
    'You are a social media copywriter writing an on-brand post for a specific business. ' +
      'Write in the business\'s own voice. Do not invent facts, statistics, product names, ' +
      'or customer quotes that are not supported by the brand context below.',
  );

  parts.push('=== BRAND CONTEXT ===\n' + brand);

  parts.push('=== PLATFORM CONSTRAINTS ===\n' + presetConstraints(preset));

  if (mode === 'polish') {
    parts.push(
      '=== TASK ===\n' +
        'Rewrite and polish the following draft so it matches the brand voice and the ' +
        'platform constraints above. Preserve the author\'s intent and any real facts in ' +
        'the draft; improve clarity, flow, and hook. Do not add invented facts.',
    );
    parts.push('=== DRAFT TO REWRITE ===\n' + (draft ?? ''));
  } else {
    // archetype or archetype_context — both use an archetype instruction.
    const instruction = archetype
      ? ARCHETYPE_INSTRUCTIONS[archetype]
      : ARCHETYPE_INSTRUCTIONS.inspirational;

    // testimonial_quote must never fabricate a quote when none exist.
    let taskBody = instruction;
    if (archetype === 'testimonial_quote') {
      if (hasTestimonials(ctx)) {
        taskBody +=
          ' Draw on a real testimonial from the brand context above — you may quote or ' +
          'closely paraphrase it, and attribute it as given. Do not alter the meaning.';
      } else {
        taskBody +=
          ' No customer testimonials are available, so DO NOT fabricate a quote or ' +
          'attribute words to a named customer. Instead, speak to the results and value ' +
          'the business delivers, drawing only on the brand context above.';
      }
    }

    parts.push('=== TASK ===\n' + taskBody);

    if (mode === 'archetype_context' && freshContext) {
      parts.push(
        '=== ADDITIONAL CONTEXT FROM THE USER (incorporate this) ===\n' + freshContext,
      );
    }
  }

  parts.push(
    '=== OUTPUT ===\n' +
      'Respond with ONLY a JSON object of the form {"post": "..."} where "post" is the ' +
      'finished post text. No commentary, no markdown fences.',
  );

  return parts.join('\n\n');
}

// ---- output schema + validation ---------------------------------------------

/** The shape the model must return. */
export const socialPostOutputSchema = z.object({
  post: z.string().min(1),
});

export type SocialPostOutput = z.infer<typeof socialPostOutputSchema>;

/**
 * Result of validating a raw model output. Length violations are NOT thrown —
 * they return `{ ok: false, reason: 'too_long' }` so the route can retry once
 * with a stricter instruction (or trim) rather than crash.
 *
 * Contract (phase 4 consumes this):
 *   - `{ ok: true, post }`                             → use `post`
 *   - `{ ok: false, reason: 'invalid_shape', error }`  → parse failed; retry/error
 *   - `{ ok: false, reason: 'too_long', post, length, maxChars }`
 *                                                      → over limit; retry once, else trim
 */
export type ValidatePostResult =
  | { ok: true; post: string }
  | { ok: false; reason: 'invalid_shape'; error: string }
  | { ok: false; reason: 'too_long'; post: string; length: number; maxChars: number };

/**
 * Parse `raw` against the output schema, then hard-check length against
 * `preset.maxChars`. Never throws for a length violation — returns a structured
 * result the route can act on.
 */
export function validatePostOutput(
  raw: unknown,
  preset: PlatformPreset,
): ValidatePostResult {
  const parsed = socialPostOutputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'invalid_shape',
      error: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }

  const post = parsed.data.post.trim();
  if (post.length === 0) {
    return { ok: false, reason: 'invalid_shape', error: 'post is empty' };
  }

  if (post.length > preset.maxChars) {
    return {
      ok: false,
      reason: 'too_long',
      post,
      length: post.length,
      maxChars: preset.maxChars,
    };
  }

  return { ok: true, post };
}
