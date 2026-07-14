// src/modules/audience/work/promptFirewall.ts
// ============================================================================
// WORK PROMPT FIREWALL — code-enforced (clone of audience/product/promptFirewall).
//
// The work copy engine generates in PARALLEL with template/skeleton selection:
// copy must NEVER see which template (atelier / lumen / granth …) or skeleton it
// will be rendered by. Two guards enforce that invariant:
//
//   1. `assertNoTemplateLeak(input, where)` — no template-identity KEY
//      (templateId / skeletonId / variantId) may appear on an object handed to a
//      prompt builder. Throws in dev; a no-op in production (perf).
//
//   2. `assertNoTemplateNamesInText(text, where)` — no template NAME token
//      (atelier / granth / lumen / meridian / …) or identity key may appear in a
//      built prompt STRING. Throws in dev; a no-op in production.
//
// Together they cover the plan's "no templateId/skeletonId/template names in any
// prompt string OR engine input object" (AC-7 first half).
// ============================================================================

/** Template-identity KEYS forbidden on any prompt-builder input object. */
export const WORK_FORBIDDEN_KEYS = ['templateId', 'skeletonId', 'variantId'] as const;

/**
 * Template/skeleton NAME tokens (+ identity keys) forbidden in any built prompt
 * string. Lowercased; matched as whole-ish substrings. This is the current work +
 * cross-vertical template roster — extend when a new work template ships.
 */
export const TEMPLATE_NAME_TOKENS = [
  'atelier',
  'granth',
  'lumen',
  'meridian',
  'techpremium',
  'hearth',
  'lex',
  'vestria',
  'surge',
  'templateid',
  'skeletonid',
  'variantid',
] as const;

/**
 * Guard a prompt-builder INPUT OBJECT: throws (dev only) if a template-identity
 * key is present. Template identity must never reach the prompt layer.
 */
export function assertNoTemplateLeak(input: unknown, where: string): void {
  if (process.env.NODE_ENV === 'production') return;
  if (!input || typeof input !== 'object') return;
  for (const key of WORK_FORBIDDEN_KEYS) {
    if (key in (input as Record<string, unknown>)) {
      throw new Error(
        `[work prompt firewall] ${where} received "${key}" — template identity ` +
          `must NOT reach the prompt layer (copy generates in parallel with ` +
          `template selection).`
      );
    }
  }
}

/**
 * Guard a built prompt STRING: throws (dev only) if any template/skeleton name
 * token leaked into the text. The last line of defence for AC-7.
 */
export function assertNoTemplateNamesInText(text: string, where: string): void {
  if (process.env.NODE_ENV === 'production') return;
  const haystack = text.toLowerCase();
  for (const token of TEMPLATE_NAME_TOKENS) {
    if (haystack.includes(token)) {
      throw new Error(
        `[work prompt firewall] ${where} produced a prompt containing template ` +
          `token "${token}" — copy prompts must be template-agnostic.`
      );
    }
  }
}
