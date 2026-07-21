// src/modules/wizard/generation/work.llm.ts
// work-copy-engine phase 5 — the WORK LLM multi-page fan-out adapter.
//
// ⚠️ DELIBERATE CLONE (~180 lines): runWorkLLMGeneration below MIRRORS the THING
// fan-out in `thing.ts` (runThingGeneration L410 / runFanOut L456-635 / resume
// L638-649). Extracting ONE audience-agnostic fan-out driver shared by thing +
// work was CONSIDERED and DEFERRED for this track — the two differ in payload
// shape, voice source, collections handling, and template-knob seeding, so a
// premature abstraction would be leaky. THIS HEADER IS THE BREADCRUMB so a future
// refactor that unifies them can find BOTH copies; keep the two in sync by hand
// until then.
//
// FIREWALL: PLAIN module (no `'use client'`), executed client-side by
// `GeneratingSlot`. Imports only plain helpers + the shared `saveDraft` tail;
// NEVER imports `useWizardStore` — the slot reads the store and hands this adapter
// PLAIN DATA. The published-client boundary is preserved (never imported by a
// published renderer).
//
// HARD INVARIANT (plan decision #10): plain sitemap pages NEVER call
// `materializeIntoPages` and NEVER set `collectionKey` / `kind:'collectionItem'`
// — `mergePageIntoFinalContent` builds the body-only, chrome-at-boundaries shape
// (multiPageAssembly.ts L206). `finalizeMultiPageGeneration` is MANDATORY
// (goal-CTA stamping). Server-side retry ×2 stays in the copy route; resume rides
// `isResumableGeneration` + `completedPageKeys` skip.

import type { SectionCopy } from '@/types/generation';
import type { SitemapPage } from '@/types/product';
import { preloadTemplate } from '@/modules/templates/registry';
import type { TemplateId } from '@/types/service';
import {
  buildMultiPageSkeleton,
  mergePageIntoFinalContent,
  finalizeMultiPageGeneration,
  isResumableGeneration,
  runCollectionFanOut,
  type MultiPageOnboardingData,
  type CollectionFanOutResult,
} from '@/modules/generation/multiPageAssembly';
import { deriveWorksEntries, stampWorkGalleryBinding } from '@/modules/generation/workCollections';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import { templateMeta } from '@/modules/templates/templateMeta';
import type { CollectionEntry } from '@/modules/brief/collections';
import type {
  WorkStrategyOutput,
  WorkSitemapPage,
} from '@/modules/audience/work/strategy/parseStrategyWork';
import { saveDraft } from './finalize';
import {
  estimateFullRunCost,
  estimateCopyOnlyCost,
  isRunUnaffordable,
} from '@/lib/creditRunGate';
import {
  WORK_COPY_ENGINE_TEMPLATES,
  isWorkCopyTemplate,
  workCopyEngineEnabled,
} from '@/lib/workCopyEngine';
import type { WorkGenerationInput } from './work';
import type { GenerationCallbacks, GenerationResult, GenerationMeta } from './index';

// ---------------------------------------------------------------------------
// Allow-list + dispatch guard (plan N4/step-4 orchestrator ruling; B17: env
// kill-switch removed — the allow-list is now the whole gate).
// ---------------------------------------------------------------------------

/**
 * The allow-list, the membership predicate AND `workCopyEngineEnabled` all live
 * in the leaf module `@/lib/workCopyEngine` (single source of truth, shared with
 * the editor's story-panel gate and — since work-onboarding-shell P5 — the
 * journey seam's SYNC STEP-05 `preflight`, which must not statically import THIS
 * module because its top pulls the template registry + multi-page assembly).
 * Re-exported here so existing generation callers (`index.ts`, `work.ts`,
 * `work.llm.test.ts`) keep their import surface unchanged.
 */
export { WORK_COPY_ENGINE_TEMPLATES, isWorkCopyTemplate, workCopyEngineEnabled };

export type WorkRoutePath = 'granth-generator' | 'skeleton' | 'llm-fanout';

/**
 * The WORK dispatch decision, extracted PURE so `GeneratingSlot`'s work fork is
 * PROVABLE without rendering React (see work.llm.test.ts's routing proof). Three
 * cases:
 *   • not multipage (granth)         → 'granth-generator' (runWorkGeneration)
 *   • multipage + allow-list template → 'llm-fanout'       (runWorkLLMGeneration)
 *   • multipage + non-allow-list      → 'skeleton'         (runWorkSkeleton, UNCHANGED)
 */
export function resolveWorkRoute(opts: {
  isWorkMultipage: boolean;
  templateId: string | null | undefined;
}): WorkRoutePath {
  if (!opts.isWorkMultipage) return 'granth-generator';
  return workCopyEngineEnabled(opts.templateId) ? 'llm-fanout' : 'skeleton';
}

// ---------------------------------------------------------------------------
// Fan-out driver.
// ---------------------------------------------------------------------------

const REDIRECT = (tokenId: string) => `/edit/${tokenId}`;
const DEFAULT_WORK_TEMPLATE = 'atelier';

function isCreditFail(status: number, error: string | undefined): boolean {
  return status === 402 || /credit/i.test(error ?? '');
}

/**
 * Aggregate the degraded-generation signal across pages: any page came back MOCK
 * ⇒ mock; any page INCOMPLETE ⇒ !complete; union the missing-section keys. Pure —
 * the fan-out threads this up so a canned/incomplete multi-page run is telemetered
 * exactly like the single-page paths (silent-fallback parity).
 */
function mergeMeta(
  acc: GenerationMeta | undefined,
  page: GenerationMeta | undefined
): GenerationMeta | undefined {
  if (!page) return acc;
  const missing = [...(acc?.missingSections ?? []), ...(page.missingSections ?? [])];
  return {
    mock: (acc?.mock ?? false) || !!page.mock,
    complete: (acc?.complete ?? true) && page.complete !== false,
    ...(missing.length ? { missingSections: missing } : {}),
  };
}

type WorkStrategyResult =
  | { status: 'done'; strategy: WorkStrategyOutput }
  | { status: 'credits' }
  | { status: 'error'; error: string };

/**
 * The ONE small work strategy call (plan phase 2 route). The Brief travels in the
 * body (decision #4); the server owns the credit charge + the deterministic
 * structure assembly. The work wizard does NOT fetch strategy pre-gate (the
 * multipage sitemap is seeded chargeless from the page-archetype menu), so this
 * is normally the first + only strategy call of the run.
 */
async function runWorkStrategy(input: WorkGenerationInput): Promise<WorkStrategyResult> {
  try {
    const res = await fetch('/api/audience/work/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: input.brief }),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      if (isCreditFail(res.status, json?.error)) return { status: 'credits' };
      throw new Error(json?.message || 'Work strategy generation failed');
    }
    return { status: 'done', strategy: json.data as WorkStrategyOutput };
  } catch (e: any) {
    return { status: 'error', error: e?.message || 'Work strategy generation failed.' };
  }
}

/**
 * The WORKS binding fan-out (work-onboarding-ingestion E2 / phase 1). Extracted
 * so it can be driven DIRECTLY in tests (fixture caps ⇒ fires; real caps ⇒
 * dormant). LLM-FREE — item copy is `{status:'done', copy:{}}` (the granth
 * precedent): zero new AI calls, zero new credit ops.
 *
 * Steps:
 *   1. entries = derive from `facts.work.groups[]` (resume: re-derive from the
 *      persisted `onboardingData.collections.works` when present).
 *   2. persist entries into `fc.onboardingData.collections` (resume durability).
 *   3. runCollectionFanOut — builds the /works catalog + one item page per entry
 *      carrying VERBATIM photos. DORMANT unless `works` is a declared capability.
 *   4. stampWorkGalleryBinding — cover_image (always) + href (only when the item
 *      page exists — D7a) on the home gallery group cards.
 *
 * NO-PHOTO / NO-GROUP FAST PATH: entries empty ⇒ returns immediately WITHOUT
 * touching `fc` — so a work run that carries no photos (the P1 prod reality: no
 * upload UI yet) stays byte-identical. Cover stamping is capability-independent
 * by design (D7a), so it only ever runs when the user actually seeded photos.
 */
export async function runWorksFanOut(
  fc: any,
  input: WorkGenerationInput,
  declaredCapabilities: readonly string[],
  persist: (fc: any) => Promise<void>
): Promise<CollectionFanOutResult> {
  const persisted = fc.onboardingData?.collections?.works as CollectionEntry[] | undefined;
  const entries =
    persisted && persisted.length
      ? persisted
      : deriveWorksEntries(getWorkFacts(input.brief?.facts));
  if (entries.length === 0) return { status: 'done' }; // no photos/groups ⇒ byte-identical

  if (!fc.onboardingData) fc.onboardingData = {};
  fc.onboardingData.collections = { ...(fc.onboardingData.collections ?? {}), works: entries };

  const result = await runCollectionFanOut({
    fc,
    collections: { works: entries },
    declaredCapabilities,
    // LLM-FREE — no route call, no charge (granth precedent). Records ride the
    // slice seed; the clamp keeps VERBATIM_ITEM_FIELDS (incl. photos) untouched.
    generateItemCopy: async () => ({ status: 'done', copy: {} }),
    persist,
  });
  if (result.status !== 'done') return result;

  stampWorkGalleryBinding(fc, entries);
  return { status: 'done' };
}

/**
 * FIRST-GEN-ONLY signature default (Wave 2 About lane). Stamp the seller's own
 * name into each `about` section's `signature` when it is empty. PURE (mutates fc
 * in place). Walks the flat home content + every page's content, matching a
 * section by its `about-…` id, and writes ONLY when signature is empty — a
 * customized signature (set later in the editor) is NEVER clobbered, so re-running
 * on RESUME is idempotent.
 *
 * Why HERE and not in `parseWorkCopy`: the story-regen route (regenerate-story)
 * ALSO calls `parseWorkCopy`, so a parse-time inject would re-emit `signature=name`
 * on every story regen and the client merge would then overwrite a user-edited
 * signature. This first-gen site is unreachable by scoped/story regen → no clobber
 * by construction. The AI can never emit `signature` itself (it is
 * `fillMode:'system'` → the parse-time system-key strip drops it), so the field is
 * empty until this stamp fills it.
 *
 * Placed in the works-binding region of `runFanOut` (NOT inside `runWorksFanOut`)
 * so it fires on EVERY fresh generation — `runWorksFanOut` early-returns when there
 * are no derivable works entries, which would skip a name-only default that has
 * nothing to do with photos.
 */
export function stampAboutSignature(fc: any, name: string | undefined | null): void {
  const sig = (name ?? '').trim();
  if (!fc || !sig) return;
  const stampTree = (content: Record<string, any> | undefined): void => {
    if (!content || typeof content !== 'object') return;
    for (const sec of Object.values(content)) {
      const id = (sec as any)?.id;
      if (typeof id !== 'string' || !id.startsWith('about-')) continue;
      const el = (sec as any).elements;
      if (!el || typeof el !== 'object') continue;
      if (!el.signature) el.signature = sig; // only-when-empty — never clobber
    }
  };
  stampTree(fc.content);
  const pages = fc.pages && typeof fc.pages === 'object' ? fc.pages : {};
  for (const page of Object.values(pages)) stampTree((page as any)?.content);
}

/**
 * The WORK LLM multi-page fan-out. Guarded (workCopyEngineEnabled / atelier
 * allow-list) at the GeneratingSlot fork — called DIRECTLY, mirroring
 * runWorkSkeleton (NOT via runGeneration).
 */
export async function runWorkLLMGeneration(
  input: WorkGenerationInput,
  cb: GenerationCallbacks = {}
): Promise<GenerationResult> {
  const { tokenId } = input;
  const title = (input.writerName.trim() || input.oneLiner || 'Your site').slice(0, 50);
  const resolvedTemplateId = (input.templateId ?? DEFAULT_WORK_TEMPLATE) as TemplateId;
  // Composed Brief.goal (if any) — MANDATORY input to finalizeMultiPageGeneration's
  // goal-CTA stamping. Null ⇒ no stamp (byte-identical to a goal-less run).
  const briefGoal = input.brief?.goal ?? null;

  // Resolve the template's ZERO-CONFIG default knobs ONCE (mirror runWorkSkeleton
  // — atelier → square buttons). Non-fatal: an unknown/unloadable template just
  // skips the knob seed.
  let themeValues: Record<string, unknown> | undefined;
  try {
    const mod = await preloadTemplate(resolvedTemplateId);
    if (mod.defaultKnobs) themeValues = { knobs: mod.defaultKnobs };
  } catch {
    /* skip knob seed */
  }

  const saveFC = async (fc: any) => {
    await saveDraft({
      tokenId,
      title: (fc.meta?.title as string) || title,
      ...(input.templateId ? { templateId: input.templateId } : {}),
      ...(themeValues ? { themeValues } : {}),
      // Persist the wizard's COMPOSED brief (entry + work + collections) so the
      // regen route can read `Project.brief.facts.work` server-side. saveDraft
      // replaces `facts` wholesale, so send the whole brief — never a partial
      // `{facts:{work}}` patch. Idempotent re-send on each save is harmless.
      ...(input.brief ? { brief: input.brief } : {}),
      finalContent: fc,
    });
  };

  // ─── Fan-out (per-page copy + persistence + resume) ───
  const runFanOut = async (fc: any): Promise<GenerationResult> => {
    const ob = fc.onboardingData as MultiPageOnboardingData;
    const sitemap = ob.sitemap as unknown as WorkSitemapPage[];
    const strategy = ob.strategy as WorkStrategyOutput;
    const total = sitemap.length;
    let meta: GenerationMeta | undefined;

    cb.onStage?.('copy');
    try {
      for (let i = 0; i < sitemap.length; i++) {
        const page = sitemap[i];
        if (fc.generationProgress.completedPageKeys.includes(page.archetypeKey)) continue;
        cb.onPageProgress?.({
          done: fc.generationProgress.completedPageKeys.length + 1,
          total,
        });

        const isHome = page.pathSlug === '/';
        // Home gets chrome copy; the work copy route REQUIRES `page.sections`
        // (WorkCopyPageSchema, min 1). mergePageIntoFinalContent still receives
        // the BODY-ONLY page and injects header/footer itself — so the payload
        // section list is chrome-inclusive, the merge page stays body-only.
        const payloadSections = isHome
          ? ['header', ...page.sections, 'footer']
          : [...page.sections];

        const res = await fetch('/api/audience/work/generate-copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strategy,
            brief: input.brief,
            page: {
              archetypeKey: page.archetypeKey,
              title: page.title,
              pathSlug: page.pathSlug,
              isHome,
              sections: payloadSections,
            },
            ...(input.sourceUrl ? { sourceUrl: input.sourceUrl } : {}),
          }),
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          if (isCreditFail(res.status, json?.error)) return { status: 'credits' };
          throw new Error(json?.message || `Copy generation failed (${page.title})`);
        }
        meta = mergeMeta(meta, json.meta as GenerationMeta | undefined);

        // HARD INVARIANT: plain sitemap page — body-only merge, NO collectionKey /
        // materializeIntoPages (mergePageIntoFinalContent enforces the shape).
        mergePageIntoFinalContent({
          fc,
          page: page as SitemapPage,
          order: i,
          copy: json.sections as Record<string, SectionCopy>,
          templateId: resolvedTemplateId,
        });

        await saveFC(fc); // persist THIS page before generating the next
      }
    } catch (e: any) {
      return { status: 'error', error: e?.message || 'Copy generation failed.' };
    }

    // ─── Works binding fan-out (E2 P1) — after the sitemap pages, before finalize.
    // LLM-free; dormant unless `resolvedTemplateId` declares the `works` capability
    // (byte-identical no-op on P1 templates). Persists item pages + stamps covers.
    try {
      const declaredCapabilities = templateMeta[resolvedTemplateId]?.capabilities ?? [];
      const worksResult = await runWorksFanOut(fc, input, declaredCapabilities, saveFC);
      if (worksResult.status === 'credits') return { status: 'credits' };
      if (worksResult.status === 'error') return { status: 'error', error: worksResult.error };
    } catch (e: any) {
      return { status: 'error', error: e?.message || 'Works binding failed.' };
    }

    // ─── About signature default (Wave 2) — first-gen only; the SAME call-site
    // family as the works stamps. Fills `about.signature` with the seller's name
    // when empty. Runs unconditionally (unlike runWorksFanOut's photo-gated early
    // return) so a name-only default is never skipped. Idempotent on resume.
    stampAboutSignature(fc, getWorkFacts(input.brief?.facts)?.identity?.name);

    cb.onStage?.('saving');
    try {
      // MANDATORY — drops the in-progress marker + stamps goal-ref CTAs.
      finalizeMultiPageGeneration(fc, briefGoal);
      await saveFC(fc);
    } catch (e: any) {
      return { status: 'error', error: e?.message || 'Could not save the draft.' };
    }

    cb.onStage?.('done');
    return { status: 'done', redirectTo: REDIRECT(tokenId), meta };
  };

  // ─── Resume FIRST: an in-progress multi-page generation in the DB wins ───
  try {
    const res = await fetch(`/api/loadDraft?tokenId=${encodeURIComponent(tokenId)}`);
    if (res.ok) {
      const json = await res.json();
      const loaded = json?.finalContent || json?.content?.finalContent || json?.content;
      if (isResumableGeneration(loaded)) return runFanOut(loaded);
    }
  } catch {
    /* resume is best-effort — fall through to a fresh run */
  }

  // ─── B8 (qa-0719) UPFRONT full-run credit gate — FRESH runs only ───
  // Before the FIRST charged LLM call (work strategy, or per-page copy when a
  // strategy is pre-supplied), check the balance ONCE against the WHOLE-run
  // cost. The work sitemap is KNOWN upfront (`input.pages`, seeded chargeless
  // from the page-archetype menu), so this is an EXACT estimate — no mid-fan-out
  // gap. Insufficient ⇒ status:'credits' (GeneratingSlot renders the shared warm
  // out-of-credits block) with ZERO AI calls / zero partial charge. A resumable
  // run returned above, so its already-paid strategy is never re-gated; the
  // per-page 402 stays the backstop for both resume and any add-pages overrun.
  const pageCount = input.pages?.length || 1;
  const fullCost = input.strategy
    ? estimateCopyOnlyCost(pageCount) // strategy already paid/pre-supplied
    : estimateFullRunCost(pageCount);
  if (await isRunUnaffordable(fullCost)) {
    return { status: 'credits' };
  }

  // ─── Fresh run: the ONE work strategy call (unless pre-supplied) ───
  let strategy = input.strategy ?? null;
  if (!strategy) {
    cb.onStage?.('strategy');
    const strategyResult = await runWorkStrategy(input);
    if (strategyResult.status !== 'done') return strategyResult;
    strategy = strategyResult.strategy;
  }

  // Prefer the user-CONFIRMED sitemap (structure gate) when present; else the
  // strategy's deterministic sitemap. Both are body-only WorkSitemapPage lists.
  const pages: WorkSitemapPage[] =
    input.pages && input.pages.length
      ? (input.pages as unknown as WorkSitemapPage[])
      : strategy.sitemap;

  const ob: MultiPageOnboardingData = {
    oneLiner: input.oneLiner,
    productName: input.writerName,
    understanding: {},
    landingGoal: null,
    offer: '',
    ...(input.sourceUrl ? { importSourceUrl: input.sourceUrl } : {}),
    sitemap: pages as unknown as SitemapPage[],
    strategy,
  };
  const fc = buildMultiPageSkeleton({ tokenId, title, onboardingData: ob });
  try {
    await saveFC(fc); // durable skeleton (sitemap + strategy) before any copy call
  } catch (e: any) {
    return { status: 'error', error: e?.message || 'Could not save the draft.' };
  }
  return runFanOut(fc);
}
