// src/modules/audience/product/promptFirewall.ts
// Code-enforced firewall (mirror of audience/service/promptFirewall.ts). The
// prompt layer must receive audienceType + persona/offer only — NEVER
// templateId/variantId. Guarantees copy and template selection generate in
// parallel (Meridian palette/variant can never influence copy). Throws in dev
// if a template field leaks into prompt input.

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
