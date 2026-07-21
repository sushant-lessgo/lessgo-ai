// src/modules/generation/scopedRegen.ts
// ============================================================================
// SCOPED REGENERATION PRIMITIVE (regen-modernization phase 2)
//
// The ONE engine every regen scope runs on (plan ruling R4/D1). Generalizes the
// `/api/audience/work/regenerate-story` trick — a size-1 identity uiblocks map
// fed to the SAME copy-prompt builder + `generateRawJson` the first-gen copy
// routes use — into a scope-parameterized primitive:
//
//   scope 'all'      → whole page          (regenerate-content, phase 5)
//   scope 'section'  → one section         (regenerate-section, phase 4)
//   scope 'element'  → N variations of one element (regenerate-element, phase 3)
//
// Invariants (do not "simplify" away):
//  • ONE engine. All scopes call the hardened `generateRawJson`. Element scope
//    differs only by its tight `{ variations: string[] }` schema + an appended
//    output-format override — NOT a second primitive, NOT `generateWithSchema`.
//  • Dispatch key = ENGINE, never audienceType. `atelier` is a WORK-engine
//    project with audienceType 'service'; dispatching it on audienceType would
//    silently send the first paying customer's copy through the service builder.
//    `resolveCopyEngine` is the SINGLE source of builder + mock + modelConfig
//    endpoint selection (D1b/D5). Never re-derive it at a call site.
//  • The engine also yields the EXISTING modelConfig endpoint ('work' →
//    'work-copy', else 'copy') — regen rides its first-gen model tier by
//    construction. No modelConfig change (D5).
//  • NO inherited fallback (R3): `generateRawJson` throws on content/Zod
//    failures; this module owns its validate→retry loop (MAX_RETRIES = 2, the
//    error folded into the retry prompt — the work story-route shape).
//  • ENGINE-AWARE VOCABULARY: narrowing + validation must speak the vocabulary
//    the engine's PROMPT asks for. product/service → the layout schema
//    (`getCompleteElementsMap`); work → the frozen `workElementContract` + the
//    story-route's `parseWorkCopy`-BEFORE-validate order. Mixing them = 100%
//    validation failure on paid calls (see the pitfall note in README.md).
//  • Real path REJECTS writer/ecommerce (`UnsupportedProjectError` → route 422,
//    before any AI call or charge). Mock mode NEVER 422s → `resolveMockEngine`.
// ============================================================================

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { generateRawJson } from '@/lib/aiClient';
import { CopyResponseSchema } from '@/lib/schemas/copy.schema';
import { isWorkCopyTemplate } from '@/lib/workCopyEngine';
import {
  getCompleteElementsMap,
  type ElementsMap,
  type SectionElementRequirements,
} from '@/modules/sections/elementDetermination';
import {
  buildProductCopyPrompt,
  buildProductCopyRetryPrompt,
} from '@/modules/audience/product/copyPrompt';
import {
  buildServiceCopyPrompt,
  buildServiceCopyRetryPrompt,
} from '@/modules/audience/service/copyPrompt';
import {
  buildWorkCopyPrompt,
  buildWorkCopyRetryPrompt,
} from '@/modules/audience/work/copyPrompt';
import { productVoiceForBusinessType } from '@/modules/audience/product/voice';
import { readDefaultLocale } from '@/lib/i18n/projectLocale';
import { toPromptLanguage, labelToLocaleCode } from '@/lib/i18n/localeNames';
import {
  selectWorkVoice,
  type Establishment,
  type WorkProfessionRow,
} from '@/modules/audience/work/voice';
import { derivePricePosition } from '@/modules/audience/work/pricePosition';
import { DEFAULT_ESTABLISHMENT } from '@/modules/audience/work/slimStrategy';
import { getWorkFacts, type WorkFacts } from '@/lib/schemas/workFacts.schema';
import { parseWorkCopy, resolveWorkSchema } from '@/modules/audience/work/parseCopy';
import { validateStoryAbout, STORY_SECTION_KEY } from '@/modules/audience/work/storyInterview';
import type { SectionCopy } from '@/types/generation';

// ─────────────────────────────────────────────────────────────────────────────
// Engine dispatch (D1b / D5)
// ─────────────────────────────────────────────────────────────────────────────

export type CopyEngine = 'product' | 'service' | 'work';
/** An EXISTING `modelConfig` endpoint — no new endpoint is introduced (D5). */
export type CopyEndpoint = 'copy' | 'work-copy';

export interface CopyEngineResolution {
  engine: CopyEngine;
  endpoint: CopyEndpoint;
}

/**
 * Exhaustiveness guard for `CopyEngine` dispatch.
 *
 * ⚠️ WHY THIS EXISTS — read before adding an engine.
 * More engines are coming (thing / trust / work / place / quick-yes). Every
 * engine-keyed dispatch below MUST be an exhaustive switch that ends in this
 * call, so that adding a member to `CopyEngine` without handling it here is a
 * **COMPILE ERROR** (TS2345: `'newEngine'` not assignable to `never`).
 *
 * The alternative — an unguarded `else` falling through to some default builder
 * — is not hypothetical: it is EXACTLY the bug this module already shipped once.
 * The work engine's prompt speaks `workElementContract`'s vocabulary
 * (`heading`/`bio`) while the layout-schema path demands `headline`/`body`, so a
 * work project silently routed to the service/layout path produced **100%
 * validation failure, burning 3 paid AI calls per request** (see the vocabulary
 * pitfall note in this module's header + README). A wrong-builder fall-through
 * is silent at runtime and expensive; a compile error is free.
 */
function assertNeverEngine(engine: never, context: string): never {
  throw new Error(
    `Unhandled copy engine "${String(engine)}" in ${context}. ` +
      `Every CopyEngine member must be handled explicitly — see assertNeverEngine.`
  );
}

/** The minimal project view engine dispatch needs. */
export interface EngineProjectView {
  audienceType?: string | null;
  templateId?: string | null;
}

/** Project row view the primitive reads (a superset of EngineProjectView). */
export interface ScopedProject extends EngineProjectView {
  title?: string | null;
  inputText?: string | null;
  /** `project.content` JSON — `content.onboarding` is the persisted onboarding view. */
  content?: unknown;
  /** `project.brief` JSON — carries `facts.work` + businessType + goal. */
  brief?: unknown;
}

/** Thrown by `resolveCopyEngine` for writer/ecommerce/unknown — route → 422 `unsupported_project`. */
export class UnsupportedProjectError extends Error {
  readonly code = 'unsupported_project' as const;
  readonly audienceType: string | null;
  readonly templateId: string | null;
  constructor(audienceType: string | null, templateId: string | null) {
    super(
      `No copy engine for project (audienceType: ${audienceType ?? 'null'}, templateId: ${templateId ?? 'null'})`
    );
    this.name = 'UnsupportedProjectError';
    this.audienceType = audienceType;
    this.templateId = templateId;
  }
}

/** Bad/missing scope inputs (unknown section, missing layout, unknown element,
 *  missing work facts) — route → 422 validation response, no charge. */
export class ScopeInputError extends Error {
  readonly code = 'invalid_scope' as const;
  constructor(message: string) {
    super(message);
    this.name = 'ScopeInputError';
  }
}

/** Retries exhausted — route → 500 `generation_failed`, `recoverable: true`, NO charge. */
export class ScopedGenerationError extends Error {
  readonly code = 'generation_failed' as const;
  readonly attempts: number;
  constructor(message: string, attempts: number) {
    super(message);
    this.name = 'ScopedGenerationError';
    this.attempts = attempts;
  }
}

/**
 * engine → EXISTING modelConfig endpoint (D5).
 * Exhaustive by construction — a new CopyEngine member fails `tsc` here rather
 * than silently inheriting the `copy` tier. See assertNeverEngine.
 */
function endpointForEngine(engine: CopyEngine): CopyEndpoint {
  switch (engine) {
    case 'work':
      return 'work-copy';
    case 'product':
    case 'service':
      return 'copy';
    default:
      return assertNeverEngine(engine, 'endpointForEngine');
  }
}

/**
 * THE dispatch helper (D1b). Key = ENGINE:
 *   isWorkCopyTemplate(templateId)  → 'work'   (atelier — audienceType 'service'!)
 *   audienceType 'product'          → 'product'
 *   audienceType 'service'          → 'service'
 *   writer / ecommerce / unknown    → UnsupportedProjectError (real path 422)
 *
 * `isWorkCopyTemplate` is flag-INDEPENDENT by design: regen of an already
 * generated work project must not flip engines when the wizard kill-switch flips.
 */
export function resolveCopyEngine(project: EngineProjectView | null): CopyEngineResolution {
  const audienceType = project?.audienceType ?? null;
  const templateId = project?.templateId ?? null;

  if (isWorkCopyTemplate(templateId)) {
    return { engine: 'work', endpoint: endpointForEngine('work') };
  }
  if (audienceType === 'product') {
    return { engine: 'product', endpoint: endpointForEngine('product') };
  }
  if (audienceType === 'service') {
    return { engine: 'service', endpoint: endpointForEngine('service') };
  }
  throw new UnsupportedProjectError(audienceType, templateId);
}

/**
 * Lenient companion for the routes' mock short-circuit (D2): mock mode NEVER
 * 422s — the demo token has no project row at all. Resolvable → its engine;
 * null / writer / ecommerce / unknown → the 'product' mock default. Never throws.
 */
export function resolveMockEngine(project: EngineProjectView | null): CopyEngine {
  try {
    return resolveCopyEngine(project).engine;
  } catch {
    return 'product';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Scope + elements-map narrowing (D4)
// ─────────────────────────────────────────────────────────────────────────────

export type RegenScope =
  | { kind: 'all' }
  | { kind: 'section'; sectionId: string }
  | { kind: 'element'; sectionId: string; elementKey: string };

/** The persisted onboarding view (`project.content.onboarding`). */
export interface OnboardingView {
  oneLiner?: string;
  validatedFields?: Record<string, any>;
  hiddenInferredFields?: Record<string, any>;
  featuresFromAI?: Array<{ feature: string; benefit: string }>;
  [key: string]: unknown;
}

/** Layout state — sourced PER SCOPE by the route (D4): 'all'/section from the
 *  REQUEST, element from persisted project state. */
export interface LayoutState {
  sections: string[];
  sectionLayouts: Record<string, string>;
}

export interface ElementsMapInput extends LayoutState {
  onboarding: OnboardingView;
}

/**
 * A section the 'all' scope could NOT regenerate, and why (regen-modernization
 * phase 5, R6.3). Before this existed, `narrowElementsMap` dropped such sections
 * SILENTLY — the user paid for a whole-page regen and one band just never
 * changed, with no explanation anywhere. Routes surface these so the editor can
 * render an honest disabled/greyed state instead of omitting them.
 *
 * Only the 'all' scope produces these: section/element scopes throw
 * `ScopeInputError` (422) instead — honest by construction.
 */
export interface SkippedSection {
  sectionId: string;
  reason: string;
}

/** Read the persisted onboarding view off a project row's `content` JSON. */
export function readOnboardingView(project: ScopedProject | null): OnboardingView {
  const content = (project?.content ?? {}) as Record<string, unknown>;
  const onboarding = content['onboarding'];
  return onboarding && typeof onboarding === 'object' ? (onboarding as OnboardingView) : {};
}

/**
 * language-settings phase 4 — REGEN's language source. Unlike first generation
 * (whose routes carry no token and therefore take the language off the REQUEST —
 * plan ruling 11), scopedRegen genuinely holds the Project row, so it reads the
 * DURABLE declaration written at onboarding: `content.localeConfig.defaultLocale`.
 * Absent/legacy ⇒ `'English'`. Both paths derive from the same wizard pick, so
 * first-gen and regen agree by construction.
 */
export function readLocaleDefault(project: ScopedProject | null): string {
  return toPromptLanguage(readDefaultLocale(project?.content) ?? 'en');
}

/** The exact assembled shape `getCompleteElementsMap` consumes (identical to
 *  `regenerationActions.ts`'s existing call contract — `meta.onboardingData` is
 *  declared by the type but never read). */
function buildStoreViews(input: ElementsMapInput) {
  const onboardingStore = {
    oneLiner: input.onboarding.oneLiner ?? '',
    validatedFields: input.onboarding.validatedFields ?? {},
    hiddenInferredFields: input.onboarding.hiddenInferredFields ?? {},
    featuresFromAI: input.onboarding.featuresFromAI ?? [],
  };
  const pageStore = {
    layout: { sections: input.sections, sectionLayouts: input.sectionLayouts },
    meta: { onboardingData: onboardingStore },
  };
  return { onboardingStore, pageStore };
}

// ── Work vocabulary (engine-aware narrowing) ────────────────────────────────
//
// CRITICAL (fixed in the phase-2 review round): the work engine's PROMPT is built
// from the frozen `workElementContract` (`buildWorkCopyPrompt` walks
// `workElementContract[section]`), NOT from `layoutElementSchema`. Deriving
// required keys from the layout schema for a work project asks the model for a
// vocabulary the prompt never defines (atelier `about` → the prompt asks for
// `heading`/`bio`; the layout map demands `headline`/`body`) → 100% validation
// failure, MAX_RETRIES+1 paid `work-copy` calls burnt. It also fails the OTHER
// way: atelier `work`/`services` layouts resolve to an EMPTY element list, so
// validation passed vacuously on `{ elements: {} }`.
// So: engine 'work' sources its narrowing + validation vocabulary from the
// CONTRACT. Product/service keep the layout-derived path (verified aligned with
// their builders).

/** Collections the system injects at parse time — the model never writes them,
 *  so they are never a validation floor (mirrors `copyPrompt`'s INJECTED_COLLECTIONS). */
const INJECTED_WORK_COLLECTIONS = new Set(['quotes']);

/** Contract-derived requirements for ONE work section type. null = not a work section. */
function workRequirements(sectionId: string): SectionElementRequirements | null {
  const sectionType = sectionTypeKey(sectionId);
  const schema = resolveWorkSchema(sectionType);
  if (!schema) return null;

  const mandatoryElements: string[] = [];
  const optionalElements: string[] = [];

  for (const [key, def] of Object.entries(schema.elements)) {
    if (def.fillMode === 'system') continue;
    (def.requirement === 'required' ? mandatoryElements : optionalElements).push(key);
  }
  // Collections are validated at the COLLECTION level (per-item fields belong to
  // the work parser), matching `validateScopedSubset`'s dotted-key handling.
  for (const [collKey, coll] of Object.entries(schema.collections ?? {})) {
    if (INJECTED_WORK_COLLECTIONS.has(collKey)) continue;
    (coll.requirement === 'required' ? mandatoryElements : optionalElements).push(collKey);
  }

  return {
    sectionId,
    sectionType,
    // Work uiblocks are the identity map (contract section type IS the key) —
    // this is what `parseWorkCopy` / `buildWorkCopyPrompt` consume.
    layout: sectionType,
    mandatoryElements,
    optionalElements,
    allElements: [...mandatoryElements, ...optionalElements],
    excludedElements: [],
  };
}

/** The work-engine counterpart of `narrowElementsMap` (contract vocabulary). */
function narrowWorkContractMap(
  input: ElementsMapInput,
  scope: RegenScope,
  skipped?: SkippedSection[]
): ElementsMap {
  if (scope.kind === 'all') {
    const map: ElementsMap = {};
    for (const sectionId of input.sections) {
      const req = workRequirements(sectionId);
      if (req) {
        map[sectionId] = req;
      } else {
        // R6.3: NEVER a silent drop. atelier's `quote` band is a real, DEFAULT
        // home section with no `workElementContract` entry — the copy engine has
        // never written it. Report it so the editor can say so honestly.
        skipped?.push({
          sectionId,
          reason: `This section isn't AI-written (no copy contract for "${sectionTypeKey(sectionId)}")`,
        });
      }
    }
    if (!Object.keys(map).length) {
      throw new ScopeInputError('Cannot regenerate: no section resolved to a work element contract');
    }
    return map;
  }

  const { sectionId } = scope;
  if (!input.sections.includes(sectionId)) {
    throw new ScopeInputError(`Unknown section "${sectionId}"`);
  }
  const requirements = workRequirements(sectionId);
  if (!requirements) {
    throw new ScopeInputError(
      `No work element contract for section "${sectionTypeKey(sectionId)}"`
    );
  }
  if (scope.kind === 'section') return { [sectionId]: requirements };

  const { elementKey } = scope;
  if (!requirements.allElements.includes(elementKey)) {
    throw new ScopeInputError(`Unknown element "${elementKey}" on section "${sectionId}"`);
  }
  return {
    [sectionId]: {
      ...requirements,
      mandatoryElements: requirements.mandatoryElements.filter((e) => e === elementKey),
      optionalElements: requirements.optionalElements.filter((e) => e === elementKey),
      allElements: [elementKey],
      excludedElements: [],
    },
  };
}

/**
 * Build the elements map and narrow it to the scope's target.
 *  • 'all'     → the full map over `input.sections`.
 *  • 'section' → a size-1 map (the story-route identity trick).
 *  • 'element' → a size-1 map whose section carries ONLY `elementKey`.
 * Unknown section / missing layout / unknown element → `ScopeInputError`.
 *
 * ENGINE-AWARE: `engine === 'work'` narrows against the frozen work CONTRACT (the
 * vocabulary its prompt actually asks for); product/service use the layout schema.
 *
 * `skipped` (optional, 'all' scope only): sections that resolved to no contract
 * are pushed here instead of vanishing (R6.3 — see `SkippedSection`).
 */
export function narrowElementsMap(
  input: ElementsMapInput,
  scope: RegenScope,
  engine: CopyEngine = 'product',
  skipped?: SkippedSection[]
): ElementsMap {
  // Engine ⇒ VOCABULARY. Exhaustive by construction: a new CopyEngine member
  // fails `tsc` here rather than silently inheriting the layout-schema path,
  // which is how the work engine once produced 100% validation failure on paid
  // calls. See assertNeverEngine.
  switch (engine) {
    case 'work':
      return narrowWorkContractMap(input, scope, skipped);
    case 'product':
    case 'service':
      // Both speak the layout element schema — fall through to the path below.
      break;
    default:
      return assertNeverEngine(engine, 'narrowElementsMap');
  }

  if (scope.kind === 'all') {
    if (!input.sections.length) {
      throw new ScopeInputError('Cannot regenerate: the page has no sections');
    }
    const { onboardingStore, pageStore } = buildStoreViews(input);
    const map = getCompleteElementsMap(onboardingStore as any, pageStore as any);
    // R6.3: `getCompleteElementsMap` drops layout-less sections with a log line
    // only. Report them instead of silently omitting them.
    for (const sectionId of input.sections) {
      if (map[sectionId]) continue;
      skipped?.push({
        sectionId,
        reason: input.sectionLayouts[sectionId]
          ? `This section isn't AI-written (no element contract for layout "${input.sectionLayouts[sectionId]}")`
          : `This section isn't AI-written (no layout is set for "${sectionId}")`,
      });
    }
    if (!Object.keys(map).length) {
      throw new ScopeInputError('Cannot regenerate: no section resolved to an element contract');
    }
    return map;
  }

  const { sectionId } = scope;
  if (!input.sections.includes(sectionId)) {
    throw new ScopeInputError(`Unknown section "${sectionId}"`);
  }
  const layout = input.sectionLayouts[sectionId];
  if (!layout) {
    throw new ScopeInputError(`No layout for section "${sectionId}"`);
  }

  // Size-1 layout view — the ABOUT_UIBLOCKS identity-map trick, generalized.
  const { onboardingStore, pageStore } = buildStoreViews({
    onboarding: input.onboarding,
    sections: [sectionId],
    sectionLayouts: { [sectionId]: layout },
  });
  const map = getCompleteElementsMap(onboardingStore as any, pageStore as any);
  const requirements = map[sectionId];
  if (!requirements) {
    throw new ScopeInputError(`No element contract for section "${sectionId}" (layout "${layout}")`);
  }

  if (scope.kind === 'section') return { [sectionId]: requirements };

  const { elementKey } = scope;
  if (!requirements.allElements.includes(elementKey)) {
    throw new ScopeInputError(`Unknown element "${elementKey}" on section "${sectionId}"`);
  }
  const narrowed: SectionElementRequirements = {
    ...requirements,
    mandatoryElements: requirements.mandatoryElements.filter((e) => e === elementKey),
    optionalElements: requirements.optionalElements.filter((e) => e === elementKey),
    allElements: [elementKey],
    excludedElements: [],
  };
  return { [sectionId]: narrowed };
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt assembly — reuse the ENGINE's own first-gen copy builder
// ─────────────────────────────────────────────────────────────────────────────

/** `hero-abc12345` → `hero` (the section-TYPE key every copy builder's
 *  `uiblocks` / section list is keyed by). */
function sectionTypeKey(sectionId: string): string {
  const dash = sectionId.indexOf('-');
  return dash > 0 ? sectionId.slice(0, dash) : sectionId;
}

/** Narrowed map → the builders' `uiblocks` (sectionType → layout name). */
function uiblocksFromMap(map: ElementsMap): Record<string, string> {
  const uiblocks: Record<string, string> = {};
  for (const [sectionId, req] of Object.entries(map)) {
    uiblocks[sectionTypeKey(sectionId)] = req.layout;
  }
  return uiblocks;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => (typeof v === 'string' ? v : String(v ?? ''))).filter(Boolean);
}

function briefOf(project: ScopedProject): Record<string, any> {
  return (project.brief ?? {}) as Record<string, any>;
}

/**
 * Regen context prelude appended to every scoped prompt: the strategy phase is
 * NOT persisted (see the module deviation note), so we tell the model plainly
 * that it is REWRITING an existing page and hand it the current copy + any user
 * guidance instead of inventing a fresh strategic frame.
 */
function buildRegenContextBlock(args: {
  scopeLabel: string;
  currentContent?: string;
  userGuidance?: string;
}): string {
  const lines: string[] = ['', '## REGENERATION CONTEXT', `Scope: ${args.scopeLabel}.`];
  lines.push(
    'This page already exists — you are REWRITING it. Keep the business meaning; improve the copy. Invent no facts.'
  );
  if (args.currentContent?.trim()) {
    lines.push('', 'CURRENT COPY (rewrite it — do not simply echo it):', args.currentContent.trim().slice(0, 4000));
  }
  if (args.userGuidance?.trim()) {
    lines.push('', `USER GUIDANCE (highest priority): ${args.userGuidance.trim().slice(0, 1000)}`);
  }
  return lines.join('\n');
}

function buildProductPrompt(project: ScopedProject, map: ElementsMap): string {
  const onboarding = readOnboardingView(project);
  const validated = onboarding.validatedFields ?? {};
  const features = (onboarding.featuresFromAI ?? []).filter(Boolean);
  const sectionTypes = Object.keys(uiblocksFromMap(map));
  const uiblocks = uiblocksFromMap(map);
  const brief = briefOf(project);

  // Derived from PERSISTED state only — never fabricated. Fields the (unsaved)
  // strategy phase would have supplied fall back to a neutral value.
  const strategy = {
    awareness: (validated.awarenessLevel ?? onboarding.hiddenInferredFields?.awarenessLevel ??
      'problem-aware-cold') as any,
    oneReader: {
      personaDescription: validated.targetAudience ?? '',
      pain: [validated.keyProblem].filter(Boolean) as string[],
      desire: [],
      objections: [],
    },
    oneIdea: {
      // The strategy phase is not persisted. `inputText` is the ONE-LINER — it is
      // already passed as `oneLiner` below; re-labelling it as the strategic
      // "big benefit" would present persisted data as something it is not. Left
      // neutral, like the other unavailable strategy fields.
      bigBenefit: '',
      uniqueMechanism: '',
      reasonToBelieve: '',
    },
    featureAnalysis: features.map((f) => ({
      feature: f.feature,
      benefit: f.benefit,
      benefitOfBenefit: '',
    })),
    sections: sectionTypes,
    uiblocks,
  };

  return buildProductCopyPrompt({
    strategy: strategy as any,
    uiblocks,
    productName: project.title ?? '',
    oneLiner: project.inputText ?? '',
    offer: validated.offer ?? '',
    landingGoal: (validated.landingPageGoals ?? 'signup') as any,
    features: features.map((f) => f.feature),
    voiceId: productVoiceForBusinessType(brief.businessType),
    language: readLocaleDefault(project),
  });
}

function buildServicePrompt(project: ScopedProject, map: ElementsMap): string {
  const onboarding = readOnboardingView(project);
  const validated = onboarding.validatedFields ?? {};
  const uiblocks = uiblocksFromMap(map);
  const sectionTypes = Object.keys(uiblocks);

  const understanding = {
    serviceType: (validated.serviceType ?? 'consultancy') as any,
    whatYouDo: project.inputText ?? '',
    services: asStringList(validated.services),
    targetClients: [validated.targetAudience].filter(Boolean) as string[],
    outcomes: asStringList(validated.outcomes),
    deliveryModel: (validated.deliveryModel ?? 'remote') as any,
  };

  const strategy = {
    awareness: (onboarding.hiddenInferredFields?.awarenessLevel ?? 'search-aware-cold') as any,
    oneClient: {
      who: validated.targetAudience ?? '',
      coreDesire: '',
      corePain: validated.keyProblem ?? '',
      pains: [validated.keyProblem].filter(Boolean) as string[],
      desires: [],
      objections: [],
    },
    ourPosition: { promise: '', approach: '', credibility: '' },
    servicePresentation: { format: 'hybrid', showProcess: true, showCaseStudies: false },
    sectionDecisions: {
      includeTransformation: false,
      includeProblem: false,
      includeApproach: false,
      isHighTouch: false,
    },
    uiblockDecisions: {},
    sections: sectionTypes,
    uiblocks,
  };

  return buildServiceCopyPrompt({
    strategy: strategy as any,
    uiblocks,
    oneLiner: project.inputText ?? '',
    businessName: project.title ?? '',
    offer: validated.offer ?? '',
    goal: (validated.landingPageGoals ?? 'book-call') as any,
    understanding,
    language: readLocaleDefault(project),
  });
}

/** Work facts or `ScopeInputError` (→422, before any AI call). */
function requireWorkFacts(project: ScopedProject): WorkFacts {
  const facts = getWorkFacts(briefOf(project).facts);
  if (!facts) {
    throw new ScopeInputError('brief.facts.work is required to regenerate a work-engine project');
  }
  return facts;
}

/**
 * The work engine's own language answer (`facts.languages[0]`) as a prompt-facing
 * name. The stored value is a human LABEL ('Dutch', 'Nederlands') — mapped to an
 * English exonym when it is one of the 12 supported languages, otherwise passed
 * through verbatim (an unmapped label like 'Hindi' is still a usable instruction
 * for the model even though no localeConfig may be written for it).
 */
function workFactsLanguage(facts: WorkFacts): string | null {
  const raw = facts.languages?.[0];
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const code = labelToLocaleCode(raw);
  return code ? toPromptLanguage(code) : raw.trim();
}

function buildWorkPrompt(project: ScopedProject, map: ElementsMap): string {
  const brief = briefOf(project);
  // Present ⇒ the site DECLARED a language; null ⇒ fall back to the work facts.
  const declared = readDefaultLocale(project?.content);
  const declaredLanguage = declared ? toPromptLanguage(declared) : null;
  const facts = requireWorkFacts(project);
  const sectionTypes = Object.keys(uiblocksFromMap(map));
  const pricePosition = derivePricePosition(facts);
  const establishment: Establishment = facts.establishment ?? DEFAULT_ESTABLISHMENT;
  const professionRow: WorkProfessionRow | null = brief.businessType
    ? ({ key: brief.businessType } as WorkProfessionRow)
    : null;
  const voice = selectWorkVoice({ professionRow, pricePosition, establishment });

  const strategy = {
    // The AI narrative half is NOT persisted — regen keeps the page's existing
    // angle rather than inventing a new one (see the module deviation note).
    positioningAngle: 'Keep the positioning this page already takes; sharpen the wording only.',
    storyAngle: 'Keep the story this page already tells; sharpen the wording only.',
    voiceNotes: [],
    sections: sectionTypes,
    uiblocks: uiblocksFromMap(map),
    sitemap: [],
    storyBranch: establishment,
    // language-settings phase 4 (plan ruling 4) — RECONCILE the two sources.
    // `content.localeConfig.defaultLocale` is the site's CURRENT declared
    // language (user-set at onboarding, editable in Site Settings later), so it
    // WINS. `facts.languages[0]` is onboarding-time raw input and stays the
    // fallback for legacy work projects with no config — and for a work answer
    // whose label is outside SUPPORTED_LOCALES (e.g. 'Hindi'), which never gets
    // a localeConfig written at all. Do not delete it.
    primaryLanguage:
      declaredLanguage ?? workFactsLanguage(facts) ?? 'en',
  };

  return buildWorkCopyPrompt({
    strategy: strategy as any,
    page: {
      archetypeKey: 'regen',
      title: project.title ?? 'Page',
      pathSlug: '/',
      isHome: true,
      sections: sectionTypes,
    },
    facts,
    voice,
  });
}

// Exhaustive by construction — a new CopyEngine member fails `tsc` here rather
// than silently falling through to the service builder. See assertNeverEngine.
function buildEnginePrompt(engine: CopyEngine, project: ScopedProject, map: ElementsMap): string {
  switch (engine) {
    case 'work':
      return buildWorkPrompt(project, map);
    case 'product':
      return buildProductPrompt(project, map);
    case 'service':
      return buildServicePrompt(project, map);
    default:
      return assertNeverEngine(engine, 'buildEnginePrompt');
  }
}

function buildRetryPrompt(engine: CopyEngine, originalPrompt: string, error: string): string {
  switch (engine) {
    case 'work':
      return buildWorkCopyRetryPrompt(originalPrompt, error, '');
    case 'product':
      return buildProductCopyRetryPrompt(originalPrompt, error, '');
    case 'service':
      return buildServiceCopyRetryPrompt(originalPrompt, error, '');
    default:
      return assertNeverEngine(engine, 'buildRetryPrompt');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Contract validation of the generated SUBSET (never default-fill)
// ─────────────────────────────────────────────────────────────────────────────

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** Resolve a response section entry by section-TYPE key or raw sectionId. */
function pickSection(
  response: Record<string, { elements?: Record<string, unknown> }>,
  sectionId: string
) {
  return response[sectionTypeKey(sectionId)] ?? response[sectionId];
}

/**
 * Validate the generated subset against the narrowed map: every narrowed section
 * must be present and every mandatory element non-empty. Returns a reason string
 * on failure (folded into the retry prompt), or null when valid.
 * Dotted collection-field requirements (`items.title`) are checked at the
 * COLLECTION level only — per-item field checks belong to the per-engine parsers.
 */
export function validateScopedSubset(
  response: Record<string, { elements?: Record<string, unknown> }>,
  map: ElementsMap
): string | null {
  for (const [sectionId, req] of Object.entries(map)) {
    const section = pickSection(response, sectionId);
    if (!section?.elements) return `Section "${sectionTypeKey(sectionId)}" is missing from the response`;
    const seen = new Set<string>();
    for (const element of req.mandatoryElements) {
      const key = element.includes('.') ? element.split('.')[0] : element;
      if (seen.has(key)) continue;
      seen.add(key);
      if (isEmptyValue(section.elements[key])) {
        return `Required element "${key}" is empty or missing on section "${sectionTypeKey(sectionId)}"`;
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// The primitive
// ─────────────────────────────────────────────────────────────────────────────

export const MAX_RETRIES = 2;

/** Element scope's tight schema — a z.object (NOT a z.record), so it parses
 *  through the same hardened `generateRawJson` (R4). */
export const ElementVariationsSchema = z.object({
  variations: z.array(z.string()).min(1),
});

export interface ScopedCopyInput {
  project: ScopedProject;
  /** Per-scope layout state (D4). */
  layoutState: LayoutState;
  scope: RegenScope;
  /** Current copy — element scope: the element's text; section/all: a JSON blob. */
  currentContent?: string;
  userGuidance?: string;
  /** Element scope only. Default 3. */
  variationCount?: number;
  /** Optional `generateRawJson` cap (element scope shouldn't pay for 8k). */
  maxTokens?: number;
}

export interface ScopedCopyResult {
  engine: CopyEngine;
  endpoint: CopyEndpoint;
  attempts: number;
  elementsMap: ElementsMap;
  /** Set for 'all' / 'section' scopes. Keyed as the model returned it. */
  sections?: Record<string, { elements: Record<string, unknown> }>;
  /** Set for 'element' scope. */
  variations?: string[];
  /**
   * 'all' scope: sections that carry no copy contract and were therefore NOT
   * regenerated — reported, never silently dropped (R6.3). Always present
   * (empty for section/element scopes, which throw instead).
   */
  skippedSections: SkippedSection[];
}

function scopeLabel(scope: RegenScope): string {
  if (scope.kind === 'all') return 'the whole page';
  if (scope.kind === 'section') return `the "${sectionTypeKey(scope.sectionId)}" section only`;
  return `the "${scope.elementKey}" element of the "${sectionTypeKey(scope.sectionId)}" section only`;
}

/**
 * Generate copy for ONE scope. Dispatches the engine (D1b), builds the prompt
 * from the engine's own first-gen builder over the narrowed map, calls the
 * hardened `generateRawJson` on the engine's EXISTING endpoint (D5), validates,
 * and retries with the error folded in (R3 — inherits no fallback).
 *
 * Throws: `UnsupportedProjectError` (→422), `ScopeInputError` (→422),
 * `ScopedGenerationError` (→500 recoverable). Never charges — the ROUTE does.
 */
export async function generateScopedCopy(input: ScopedCopyInput): Promise<ScopedCopyResult> {
  const { project, layoutState, scope, currentContent, userGuidance } = input;

  // 1. Engine dispatch — BEFORE any AI call (route maps 422 with no charge).
  const { engine, endpoint } = resolveCopyEngine(project);

  // 2. Narrow the elements map to the scope's target — in the ENGINE's own
  //    vocabulary (work → frozen contract; product/service → layout schema).
  //    'all' scope: contract-less sections land in `skippedSections` (R6.3) —
  //    the route reports them; they are never silently dropped.
  const skippedSections: SkippedSection[] = [];
  const elementsMap = narrowElementsMap(
    { onboarding: readOnboardingView(project), ...layoutState },
    scope,
    engine,
    skippedSections
  );

  // 2b. Work post-processing inputs (also 422s on missing facts before any call).
  const workFacts = engine === 'work' ? requireWorkFacts(project) : null;
  const workUiblocks = engine === 'work' ? uiblocksFromMap(elementsMap) : {};

  // 3. Prompt = the ENGINE's own copy builder over the narrowed map + regen context.
  const basePrompt = buildEnginePrompt(engine, project, elementsMap);
  const contextBlock = buildRegenContextBlock({
    scopeLabel: scopeLabel(scope),
    currentContent,
    userGuidance,
  });

  const isElementScope = scope.kind === 'element';
  const variationCount = Math.max(1, input.variationCount ?? 3);
  const prompt = isElementScope
    ? `${basePrompt}${contextBlock}

## OVERRIDE — OUTPUT FORMAT (this call only)
Ignore the JSON-by-section output format above. Write ${variationCount} alternative version(s) of the "${
        (scope as { elementKey: string }).elementKey
      }" element ONLY — nothing else. Respect that element's length cap and every rule above.
Return exactly: {"variations": ["…", …]} with ${variationCount} entries.`
    : `${basePrompt}${contextBlock}`;

  logger.dev(`[scopedRegen] engine=${engine} endpoint=${endpoint} scope=${scope.kind} PROMPT:`, prompt);

  // 4. Own validate→retry loop (R3). MAX_RETRIES + 1 attempts, max.
  let attempts = 0;
  let lastError: string | null = null;
  let currentPrompt = prompt;

  while (attempts <= MAX_RETRIES) {
    attempts++;
    try {
      if (isElementScope) {
        const response = (await generateRawJson(
          endpoint,
          currentPrompt,
          ElementVariationsSchema,
          input.maxTokens ? { maxTokens: input.maxTokens } : undefined
        )) as z.infer<typeof ElementVariationsSchema>;
        const variations = response.variations.map((v) => v.trim()).filter(Boolean);
        if (!variations.length) {
          lastError = 'No non-empty variations returned';
        } else {
          return {
            engine,
            endpoint,
            attempts,
            elementsMap,
            skippedSections,
            variations: variations.slice(0, variationCount),
          };
        }
      } else {
        const response = (await generateRawJson(
          endpoint,
          currentPrompt,
          CopyResponseSchema,
          input.maxTokens ? { maxTokens: input.maxTokens } : undefined
        )) as Record<string, { elements: Record<string, unknown> }>;

        // Work runs the ENGINE's post-processing BEFORE validating — exactly the
        // story-route order (parseWorkCopy → validate): contract defaults,
        // VERBATIM praise injection, collection ids. Skipping it made regen
        // stricter than first-gen and dropped the seller's praise.
        const processed =
          engine === 'work'
            ? (parseWorkCopy(
                response as Record<string, SectionCopy>,
                workUiblocks,
                workFacts?.praise,
                workFacts?.groups
              ) as unknown as Record<string, { elements: Record<string, unknown> }>)
            : response;

        let reason = validateScopedSubset(processed, elementsMap);
        // Extra ship-grade story gate, shared with the story route (bio floor).
        if (
          !reason &&
          engine === 'work' &&
          Object.keys(elementsMap).some((id) => sectionTypeKey(id) === STORY_SECTION_KEY)
        ) {
          const check = validateStoryAbout(processed as unknown as Record<string, SectionCopy>);
          if (!check.valid) reason = check.reason ?? 'invalid story shape';
        }
        if (reason) {
          lastError = reason;
        } else {
          return { engine, endpoint, attempts, elementsMap, skippedSections, sections: processed };
        }
      }
    } catch (err: any) {
      lastError = err?.message || 'AI generation failed';
    }

    logger.warn(`[scopedRegen] attempt ${attempts} rejected: ${lastError}`);
    if (attempts <= MAX_RETRIES) {
      currentPrompt = buildRetryPrompt(engine, prompt, lastError || 'Unknown error');
    }
  }

  throw new ScopedGenerationError(
    lastError || 'Failed to generate valid copy after retries',
    attempts
  );
}
