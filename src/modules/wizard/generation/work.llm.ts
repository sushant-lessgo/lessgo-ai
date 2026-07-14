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
  type MultiPageOnboardingData,
} from '@/modules/generation/multiPageAssembly';
import type {
  WorkStrategyOutput,
  WorkSitemapPage,
} from '@/modules/audience/work/strategy/parseStrategyWork';
import { saveDraft } from './finalize';
import { WORK_COPY_ENGINE_TEMPLATES, isWorkCopyTemplate } from '@/lib/workCopyEngine';
import type { WorkGenerationInput } from './work';
import type { GenerationCallbacks, GenerationResult, GenerationMeta } from './index';

// ---------------------------------------------------------------------------
// Flag + dispatch guard (plan decisions #8 + N4/step-4 orchestrator ruling).
// ---------------------------------------------------------------------------

/**
 * Founder-approved ALLOW-LIST of WORK templates the LLM copy engine may drive.
 * RELOCATED to the leaf module `@/lib/workCopyEngine` (single source of truth,
 * shared with the editor's story-panel gate) — re-exported here so existing
 * generation callers (`index.ts`, `work.ts`, `work.llm.test.ts`) keep their
 * import surface unchanged.
 */
export { WORK_COPY_ENGINE_TEMPLATES, isWorkCopyTemplate };

/**
 * Whether the WORK LLM copy engine is enabled for `templateId`. TRUE only when
 * (a) the env kill-switch `NEXT_PUBLIC_WORK_COPY_ENGINE === 'true'` AND (b) the
 * template is on `WORK_COPY_ENGINE_TEMPLATES`. `NEXT_PUBLIC_*` is BUILD-TIME
 * INLINED (plan decision #8) — flipping it needs a REDEPLOY, not a runtime
 * toggle. Default OFF (unset ⇒ false) ⇒ the existing skeleton path is
 * byte-identical.
 */
export function workCopyEngineEnabled(templateId: string | null | undefined): boolean {
  if (process.env.NEXT_PUBLIC_WORK_COPY_ENGINE !== 'true') return false;
  return isWorkCopyTemplate(templateId);
}

export type WorkRoutePath = 'granth-generator' | 'skeleton' | 'llm-fanout';

/**
 * The WORK dispatch decision, extracted PURE so `GeneratingSlot`'s work fork is
 * PROVABLE without rendering React (see work.llm.test.ts's byte-identical routing
 * proof). Three cases:
 *   • not multipage (granth)          → 'granth-generator' (runWorkGeneration)
 *   • multipage + flag/allow-list ON  → 'llm-fanout'       (runWorkLLMGeneration)
 *   • multipage + flag/allow-list OFF → 'skeleton'         (runWorkSkeleton, UNCHANGED)
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
