// src/modules/goals/seedGoalForm.ts
// scale-05 phase 4 — M1 goal form auto-seed. PLAIN module (NO 'use client') so
// both onboarding GeneratingSteps can import it firewall-safely.
//
// For an M1 goal (on-site form — incl. `subscribe-newsletter`, which Phase 1's
// writeback stamps `mechanism='M1'`), instantiate the intent's form template
// into `finalContent.forms` and wire the primary CTA section's `cta_text`
// button to it — writing EXACTLY the shape the manual ButtonConfigurationModal
// path persists so the same renderer/resolver code consumes it:
//   • form in `finalContent.forms[formId]`   (mirrors formActions.createForm)
//   • elements.cta_embed = `form:${formId}`  (ButtonConfigurationModal marker)
//   • elementMetadata.cta_text = { buttonConfig }   (form wiring only)
//       buttonConfig = { type:'form', ctaType:'primary', formId, behavior:'scrollTo' }
//   • section.cta = ctaConfig (form) with label/variant/size
// goal-ref-cta phase 1: seedGoalForm NO LONGER writes the resolved `cta`
// snapshot. The mechanism-agnostic `stampGoalRefCtas` (finalize.ts, right after
// this) writes `cta = { role:'primary', dest:'GOAL_REF', formId }` on THIS
// section's cta_text AND on the hero/header primaries (the F5/F6 fix). For M1 it
// resolves at render to the shared `#form-section` anchor + the seeded form.
//
// Idempotent: no-op when the goal is not M1, or when `finalContent.forms`
// already holds a form (so a resume/regeneration never double-seeds).

import type { Brief } from '@/types/brief';
import { getFormTemplateForIntent } from '@/modules/audience/service/formTemplates';

type BriefGoal = NonNullable<Brief['goal']>;

/** Minimal view of the onboarding `finalContent` payload this seed touches. */
interface SeedableFinalContent {
  content?: Record<string, any>;
  forms?: Record<string, any>;
  layout?: {
    sections?: string[];
    sectionLayouts?: Record<string, string>;
    [key: string]: any;
  };
  [key: string]: any;
}

/** Shared LeadForm layout name (registry key = lowercased section type `leadform`). */
const SHARED_LEAD_FORM_LAYOUT = 'SharedLeadForm';

/** Short uuid suffix for a `${type}-${uuid}` section id (crypto when available). */
function shortId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().slice(0, 8);
    }
  } catch {
    /* fall through */
  }
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Locate a section id in `content` by its section TYPE. Section ids are
 * `${type}-${uuid}` (occasionally a bare `type`); match either shape.
 */
function findSectionIdByType(
  content: Record<string, any>,
  type: string
): string | undefined {
  return Object.keys(content).find(
    (id) => id === type || id.startsWith(`${type}-`)
  );
}

/**
 * Seed the M1 goal form into `finalContent` (mutates in place). No-op unless the
 * goal is M1 (or `subscribe-newsletter`) AND no form exists yet.
 */
export function seedGoalForm(
  finalContent: SeedableFinalContent | null | undefined,
  goal: BriefGoal | null | undefined
): void {
  if (!finalContent || !goal) return;

  // M1 = on-site form. subscribe-newsletter is belt-and-suspenders: Phase 1's
  // writeback already forces its mechanism to M1, but guard the intent too.
  const isM1 = goal.mechanism === 'M1' || goal.intent === 'subscribe-newsletter';
  if (!isM1) return;

  // Idempotence: never seed over an existing form (resume / regeneration / a
  // template that ships its own form, e.g. vestria contact).
  if (finalContent.forms && Object.keys(finalContent.forms).length > 0) return;

  const content = finalContent.content;
  if (!content || typeof content !== 'object') return;

  // Primary CTA section is the render + scroll target. Prefer the dedicated
  // `cta` section; fall back to `contact`, then `hero` (always present).
  const targetId =
    findSectionIdByType(content, 'cta') ??
    findSectionIdByType(content, 'contact') ??
    findSectionIdByType(content, 'hero');
  if (!targetId) return;

  const section = content[targetId];
  if (!section || typeof section !== 'object') return;

  // ── Instantiate the template into a real MVPForm (createForm conventions). ──
  const template = getFormTemplateForIntent(goal.intent);
  const formId = `form-${Date.now()}`;
  const form = {
    id: formId,
    name: template.name,
    // Clone fields so later edits don't mutate the shared template constant.
    fields: template.fields.map((f) => ({ ...f })),
    submitButtonText: template.submitButtonText,
    successMessage: template.successMessage,
    // Dashboard integration so submissions land in the founder's dashboard
    // (mirrors the vestria contact-form seed).
    integrations: [
      { id: 'int-dashboard', type: 'dashboard', name: 'Dashboard', enabled: true },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  finalContent.forms = { ...(finalContent.forms ?? {}), [formId]: form };

  // ── Wire the CTA section's cta_text button to the form. ──
  if (!section.elements || typeof section.elements !== 'object') {
    section.elements = {};
  }
  // Preserve the AI-written button label; fall back to the template's submit
  // text when the section has no cta_text yet.
  const existing = section.elements.cta_text;
  const buttonText =
    typeof existing === 'string' && existing.trim()
      ? existing
      : template.submitButtonText;
  section.elements.cta_text = buttonText;
  // ButtonConfigurationModal marker for form-connected CTAs.
  section.elements.cta_embed = `form:${formId}`;

  const buttonConfig = {
    type: 'form' as const,
    ctaType: 'primary' as const,
    formId,
    behavior: 'scrollTo' as const,
  };

  // goal-ref-cta phase 1: seedGoalForm no longer writes a RESOLVED snapshot
  // `cta` here (the F6 bug — a resolved dest can never re-point). It keeps the
  // form wiring (buttonConfig / cta_embed / section.cta); the mechanism-agnostic
  // `stampGoalRefCtas` (run right after this in finalize.ts) writes the single
  // source of truth `cta = { role:'primary', dest:'GOAL_REF', formId }` for this
  // AND every other primary CTA (hero/header) — the F5 fix.
  if (!section.elementMetadata || typeof section.elementMetadata !== 'object') {
    section.elementMetadata = {};
  }
  section.elementMetadata.cta_text = { buttonConfig };

  // Section-level ctaConfig (HeroSection/CTA compatibility, mirrors the modal).
  section.cta = {
    type: 'form',
    cta_text: buttonText,
    url: undefined,
    formId,
    behavior: 'scrollTo',
    inputConfig: undefined,
    label: buttonText,
    variant: 'primary',
    size: 'medium',
  };

  // ── Inject a rendered leadForm section (shared block) carrying the
  //    `#form-section` anchor the CTA scrollTo + hero GOAL_REF resolve to. ──
  // Note: Phase 4 wrote NO FormPlacementRenderer placement record (its
  // buttonConfig lives in `elementMetadata`, not the `elements[key].metadata`
  // shape FormPlacementRenderer reads), so the seeded form never rendered on
  // core templates — the pre-existing bug this closes. Because there is no
  // surviving placement record, the new leadForm section is the SOLE renderer
  // of the form → no double-render in the editor.
  injectLeadFormSection(finalContent, content, formId, template.name);
}

/**
 * Inject a `leadForm-<uuid>` section (shared LeadForm block) near the BOTTOM of
 * the page (before the footer) so the seeded MULTI-FIELD form RENDERS on every
 * template in both renderers, and the `#form-section` anchor exists in exported
 * HTML. The hero/CTA button uses `behavior:'scrollTo'` to scroll DOWN to it
 * (house rule: multi-field forms live in a dedicated section near the bottom,
 * not directly under the hero). Idempotent: no-op when a leadForm section
 * already exists, or when the payload has no section array.
 */
function injectLeadFormSection(
  finalContent: SeedableFinalContent,
  content: Record<string, any>,
  formId: string,
  headingDefault: string
): void {
  const sections = finalContent.layout?.sections;
  if (!Array.isArray(sections)) return; // no ordered section array → skip.

  // Idempotence: never inject a second leadForm section.
  const already = sections.some((id) => id === 'leadForm' || id.startsWith('leadForm-'));
  if (already) return;

  const leadFormId = `leadForm-${shortId()}`;

  // Position: near the BOTTOM, immediately before the footer (house rule:
  // multi-field forms get a dedicated bottom section; hero CTA scrolls down to
  // it). Fall back to appending at the end when there is no footer section.
  const footerIdx = sections.findIndex((id) => id === 'footer' || id.startsWith('footer-'));
  const insertAt = footerIdx >= 0 ? footerIdx : sections.length;
  sections.splice(insertAt, 0, leadFormId);

  if (finalContent.layout && finalContent.layout.sectionLayouts) {
    finalContent.layout.sectionLayouts[leadFormId] = SHARED_LEAD_FORM_LAYOUT;
  }

  content[leadFormId] = {
    id: leadFormId,
    layout: SHARED_LEAD_FORM_LAYOUT,
    elements: {
      form_id: formId,
      form_headline: headingDefault || 'Get in touch',
    },
    backgroundType: 'neutral',
    aiMetadata: {
      aiGenerated: false,
      isCustomized: false,
      lastGenerated: Date.now(),
      aiGeneratedElements: [],
      excludedElements: [],
    },
  };
}
