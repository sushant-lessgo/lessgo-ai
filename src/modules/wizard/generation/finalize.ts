// src/modules/wizard/generation/finalize.ts
// scale-06 phase 5 — the SHARED generation tail, extracted verbatim from the
// near-identical product/service GeneratingStep tails:
//   buildFinalContent → seedGoalForm → injectGoalSections → saveDraft.
//
// FIREWALL / PUBLISHED-CLIENT BOUNDARY: this is a PLAIN module — it carries NO
// `'use client'` directive and imports ONLY plain, server-safe helpers
// (seedGoalForm / injectGoalSections are explicitly-plain scale-05 modules). It
// MUST NEVER import from a `'use client'` module (a store, a React component,
// a picker): importing a client function down this path risks the classic
// published-renderer "F is not a function" 500. The wizard `GeneratingSlot`
// (`'use client'`) reads the store and hands this module PLAIN DATA only.

import type { SectionCopy } from '@/types/generation';
import type { Brief } from '@/types/brief';
import type { LocaleConfig } from '@/types/core/content';
import { SUPPORTED_LOCALES } from '@/lib/i18n/localeContent';
import { labelToLocaleCode } from '@/lib/i18n/localeNames';
import { seedGoalForm } from '@/modules/goals/seedGoalForm';
import { stampGoalRefCtas, resolveGoalFormId } from '@/modules/goals/stampGoalRefCtas';
import { injectGoalSections } from '@/modules/goals/injectGoalSections';
import type { InjectGoalSectionsCtx } from '@/modules/goals/injectGoalSections';

/** The composed Brief.goal the tail seeds forms / injects sections from. */
export type BriefGoal = NonNullable<Brief['goal']>;

/** Template-specific lead-form provisioning (e.g. vestria's contact form). */
export interface LeadFormProvision {
  /** Section TYPE whose section gets a wired `form_id` (e.g. `contact`). */
  sectionType: string;
  name: string;
  fields: unknown[];
  submitButtonText: string;
  successMessage: string;
}

export interface BuildFinalContentParams {
  tokenId: string;
  title: string;
  /** Ordered section TYPES (lowercase) — the authoritative keys. */
  sections: string[];
  /** Section type → layout name (PascalCase block). */
  uiblocks: Record<string, string>;
  /** Section type → generated copy elements. */
  copy: Record<string, SectionCopy>;
  /** Persisted onboarding snapshot (engine-shaped; passed through verbatim). */
  onboardingData: Record<string, unknown>;
  /** Composed Brief.goal — drives the M1 form seed + goal-section injection. */
  briefGoal: BriefGoal | null;
  /** Optional lead-form provisioning (vestria contact). */
  leadForm?: LeadFormProvision;
  /** injectGoalSections ctx (Brief.socialProfiles fallback for M4). */
  injectCtx?: InjectGoalSectionsCtx;
}

/**
 * Build the single-page finalContent payload + run the scale-05 goal tail.
 *
 * Mirrors the shared body of BOTH old GeneratingStep `buildFinalContent`s: it
 * assembles `${type}-${uuid}` section ids, sectionLayouts, per-section content
 * with aiMetadata, meta, onboardingData, then (optionally) provisions a lead
 * form, seeds the M1 goal form, and injects deterministic goal sections. Pure —
 * no store, no fetch, no React.
 */
export function buildFinalContent(params: BuildFinalContentParams): { finalContent: any } {
  const { tokenId, title, sections: sectionTypes, uiblocks, copy, onboardingData, briefGoal, leadForm, injectCtx } =
    params;

  const sectionIds = sectionTypes.map((t) => `${t}-${crypto.randomUUID().slice(0, 8)}`);

  const sectionLayouts: Record<string, string> = {};
  const content: Record<string, any> = {};

  sectionIds.forEach((id, i) => {
    const sectionType = sectionTypes[i];
    const layout = uiblocks[sectionType] || 'default';
    sectionLayouts[id] = layout;

    const elements = copy[sectionType]?.elements ?? {};
    content[id] = {
      id,
      layout,
      elements,
      backgroundType: 'neutral',
      aiMetadata: {
        aiGenerated: true,
        isCustomized: false,
        lastGenerated: Date.now(),
        aiGeneratedElements: Object.keys(elements),
        excludedElements: [],
      },
    };
  });

  // Lead-form provisioning (mirror of the vestria contact form in the old
  // product tail): a real MVPForm at finalContent.forms + the section's form_id,
  // so form.v1.js wires up on publish and submissions land in the dashboard.
  let forms: Record<string, any> | undefined;
  if (leadForm) {
    const targetId = sectionIds.find((id, i) => sectionTypes[i] === leadForm.sectionType);
    if (targetId) {
      const formId = `form-${Date.now()}`;
      forms = {
        [formId]: {
          id: formId,
          name: leadForm.name,
          fields: JSON.parse(JSON.stringify(leadForm.fields)),
          submitButtonText: leadForm.submitButtonText,
          successMessage: leadForm.successMessage,
          integrations: [{ id: 'int-dashboard', type: 'dashboard', name: 'Dashboard', enabled: true }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      content[targetId].elements.form_id = formId;
    }
  }

  const finalContent = {
    layout: {
      sections: sectionIds,
      sectionLayouts,
      // Template tokens come from Project.paletteId/variantId at render time via
      // the template ThemeInjector. No theme.colors block for core templates.
      theme: {},
      globalSettings: {},
    },
    content,
    meta: {
      id: tokenId,
      title,
      slug: '',
      lastUpdated: Date.now(),
      version: 1,
      tokenId,
    },
    ...(forms ? { forms } : {}),
    onboardingData,
    generatedAt: Date.now(),
  };

  // scale-05 phase 4: M1 goals (incl. subscribe-newsletter) auto-seed an on-site
  // form, placed + wired to the CTA. No-op for non-M1 goals or when a form
  // already exists (e.g. the lead form above).
  seedGoalForm(finalContent, briefGoal);

  // goal-ref-cta phase 1: stamp `dest:'GOAL_REF'` on every primary CTA
  // (hero/header/cta `cta_text`) for EVERY mechanism M1–M5 — the F5 fix. Runs
  // AFTER seedGoalForm so the M1 formId points at the form it just created
  // (read back from finalContent.forms; seedGoalForm returns void). Outside any
  // mechanism gate; no-op when briefGoal is null. On the single-page path the
  // header is an ordinary section inside finalContent.content, so this one call
  // covers hero/header/cta alike.
  stampGoalRefCtas(finalContent.content, {
    goal: briefGoal,
    formId: resolveGoalFormId(finalContent.forms, briefGoal),
  });

  // scale-05 phase 7/8: deterministic goal-section injection (M3 download-app →
  // store-badges row; M4 follow-social → follow-strip). No-op otherwise.
  injectGoalSections(
    finalContent.layout?.sections,
    finalContent.layout?.sectionLayouts,
    finalContent.content,
    briefGoal,
    injectCtx ?? { socialProfiles: undefined }
  );

  return { finalContent };
}

/**
 * The final tail step: POST the assembled draft to the existing /api/saveDraft.
 * Thin fetch wrapper — the caller composes the engine-specific body (templateId,
 * palette/variant, themeValues, brief patch, finalContent). Throws on failure so
 * the adapter surfaces a retryable error, matching the old GeneratingStep saves.
 */
// ---------------------------------------------------------------------------
// language-settings phase 3 — the durable site-language declaration.
// ---------------------------------------------------------------------------

/**
 * The `localeConfig` fragment to SPREAD into a saveDraft body so the project
 * carries a durable, user-declared site language (the data source regen reads —
 * `content.localeConfig.defaultLocale`).
 *
 * Contract (zero-diff, ruling 7):
 *  - `en` / absent / unsupported ⇒ `{}` — the save body gains NO key, so a
 *    monolingual English project's stored `content` is byte-identical to before;
 *  - a SUPPORTED non-`en` code ⇒ `{ localeConfig: { locales:[code],
 *    defaultLocale: code } }` — a legitimate SINGLE-locale config (ruling 10:
 *    non-null ≠ multi-locale; every multi-locale surface is `isMultiLocale`-gated).
 *
 * Unsupported codes are dropped rather than persisted: `SUPPORTED_LOCALES` is the
 * closed vocabulary every reader (store, publish, prompts) validates against, so
 * writing outside it would create an unreadable declaration.
 */
export function localeConfigPatch(
  siteLanguage?: string | null
): Record<string, never> | { localeConfig: LocaleConfig } {
  if (!siteLanguage || siteLanguage === 'en') return {};
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(siteLanguage)) return {};
  return { localeConfig: { locales: [siteLanguage], defaultLocale: siteLanguage } };
}

/**
 * WORK variant (ruling 5): the work engine's existing `languages` question stores
 * human LABELS (`'English'`, `'Dutch'`), never ISO codes — map the FIRST label to
 * a code, then reuse `localeConfigPatch`.
 *
 * An unmapped custom label (e.g. `'Hindi'` — `hi` is outside `SUPPORTED_LOCALES`)
 * ⇒ `{}` + a warn: work copy is STILL generated in that language (the work prompt
 * path consumes the label directly), but the site language cannot be DECLARED.
 * Shared by `work.ts` + `work.llm.ts` so the two adapters cannot drift.
 */
export function workLocaleConfigPatch(
  languages?: string[] | null
): Record<string, never> | { localeConfig: LocaleConfig } {
  const label = languages?.[0];
  if (!label) return {};
  const code = labelToLocaleCode(label);
  if (!code) {
    console.warn(
      `[work] language label "${label}" has no supported ISO code — skipping the localeConfig declaration (copy is still written in that language).`
    );
    return {};
  }
  return localeConfigPatch(code);
}

export async function saveDraft(body: Record<string, unknown>): Promise<void> {
  const res = await fetch('/api/saveDraft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to save draft');
}
