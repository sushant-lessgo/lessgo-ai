// src/modules/audience/service/promptFirewall.ts
// Phase 7.5c firewall (code-enforced, not convention). The prompt layer must
// receive audienceType + persona/offer only — NEVER templateId/variantId. This
// guarantees copy and template selection generate in parallel (template choice
// can never influence copy). Throws in dev if a template field leaks in.

const FORBIDDEN_KEYS = ['templateId', 'variantId'] as const;

export function assertNoTemplateLeak(input: unknown, where: string): void {
  if (process.env.NODE_ENV === 'production') return;
  if (!input || typeof input !== 'object') return;
  for (const key of FORBIDDEN_KEYS) {
    if (key in (input as Record<string, unknown>)) {
      throw new Error(
        `[prompt firewall] ${where} received "${key}" — template identity must ` +
          `NOT reach the prompt layer (guarantees parallel copy/template generation).`,
      );
    }
  }
}
