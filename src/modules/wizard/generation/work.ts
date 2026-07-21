// src/modules/wizard/generation/work.ts
// scale-06 phase 9 — the WORK (writer / granth) generation adapter.
//
// THIN, DETERMINISTIC path — NOT an LLM strategy/copy pipeline. The writer
// vertical ships a fixed Granth profile scaffold (bio + work framing); the PATH
// (entry → confirm → unified wizard → editor) is the deliverable, not a new copy
// engine. So this adapter:
//   1. asserts the Project already carries templateId 'granth' (serveGate
//      resolves it at serve time; the confirm route PERSISTS it). It THROWS
//      rather than silently overwriting — a wrong persisted template is a bug
//      upstream, never patched here.
//   2. builds the deterministic Granth home via `buildGranthHomeFinalContent`
//      (brief-derived writer name + the 3–5 wizard work uploads become book
//      covers), then
//   3. saves the draft via the shared `saveDraft` fetch wrapper.
// No strategy/copy fetch: the seed IS the content.
//
// FIREWALL: PLAIN module (no `'use client'`), executed client-side by
// `GeneratingSlot`. Imports only the plain granth seed builder + the shared
// saveDraft wrapper; NEVER imports `useWizardStore` — the slot reads the store
// and hands this adapter PLAIN DATA. The published-client boundary is preserved.

import { buildGranthHomeFinalContent } from '@/hooks/editStore/granthSeed';
import {
  runCollectionFanOut,
  buildMultiPageSkeleton,
  mergePageIntoFinalContent,
  finalizeMultiPageGeneration,
} from '@/modules/generation/multiPageAssembly';
import { templateMeta } from '@/modules/templates/templateMeta';
import { preloadTemplate } from '@/modules/templates/registry';
import type { TemplateId } from '@/types/service';
import type { CollectionsFacts } from '@/modules/brief/collections';
import type { SitemapPage } from '@/types/product';
import type { Brief } from '@/types/brief';
import type { WorkStrategyOutput } from '@/modules/audience/work/strategy/parseStrategyWork';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import { saveDraft, workLocaleConfigPatch } from './finalize';
import type { GenerationCallbacks, GenerationResult } from './index';

// work-copy-engine phase 5 — the guarded WORK LLM multi-page fan-out. Kept in a
// sibling file (work.llm.ts) so this deterministic adapter's diff stays minimal;
// re-exported here so callers have ONE work-adapter import surface.
export {
  runWorkLLMGeneration,
  workCopyEngineEnabled,
  resolveWorkRoute,
  WORK_COPY_ENGINE_TEMPLATES,
  type WorkRoutePath,
} from './work.llm';

// ---------------------------------------------------------------------------
// Adapter input — the PLAIN projection of `useWizardStore` the slot builds.
// ---------------------------------------------------------------------------

export interface WorkGenerationInput {
  tokenId: string;
  /** Resolved writer template — MUST be 'granth' (serveGate). */
  templateId: string | null;
  /** Writer name (WHO / contract `name`). */
  writerName: string;
  /** One-liner (contract `oneLiner`) — persisted onboarding snapshot only. */
  oneLiner: string;
  /** 3–5 work uploads (image URLs) captured in the wizard (contract `theWork`). */
  works: string[];

  // scale-10 phase 5 — Brief-carried collection entries (facts.collections).
  // Mirror of thing.ts; the collections bridge is DORMANT (granth declares no
  // collection-family capability) — inert until rung-C. WORK is deterministic
  // (no LLM copy), so item records are seeded VERBATIM with no connective call.
  collections?: CollectionsFacts;

  // atelier phase 2 — the CONFIRMED sitemap pages for the SKELETON path (a
  // served work→multipage template, e.g. atelier). Projected from the store's
  // `sitemap` by GeneratingSlot. Undefined/[] on the granth generator path
  // (single-page work ignores it). WorkGenerationInput can't import the store
  // (firewall), so the slot carries the page list in as plain data.
  pages?: SitemapPage[];

  // work-copy-engine phase 5 — the LLM fan-out fields. IGNORED by the granth
  // generator (runWorkGeneration) + the skeleton path (runWorkSkeleton) — they
  // never call the work copy routes. Consumed ONLY by runWorkLLMGeneration.
  /** Resolved Brief (facts.work + businessType + composed goal) the work
   *  strategy/generate-copy routes read via getWorkFacts. */
  brief?: Brief | null;
  /** SiteContext tone-lookup key (the server fetches facts/excerpts; tone-only —
   *  never a claim source). */
  sourceUrl?: string;
  /** Pre-fetched work strategy (reuse — skips the strategy call). Normally
   *  absent: the work wizard does NOT fetch strategy pre-gate (the multipage
   *  sitemap is seeded chargeless from the page-archetype menu). */
  strategy?: WorkStrategyOutput | null;
}

const REDIRECT = (tokenId: string) => `/edit/${tokenId}`;

const GRANTH_PALETTE = 'sinduri';
const GRANTH_VARIANT = 'granth';

/**
 * language-settings phase 3 — the durable site-language declaration for WORK.
 *
 * Work adds NO second language control: it derives the declaration from the
 * EXISTING Step-3 `languages` question (`facts.work.languages`, human LABELS
 * like `'English'`/`'Dutch'`). ONE resolver, spread into EVERY work save site
 * (this file ×3 + `work.llm.ts` ×1) so no save path can drop it. `{}` for
 * English / no answer / an unmapped label ⇒ zero-diff (see
 * `workLocaleConfigPatch`). Work's PROMPT language is unchanged — it keeps
 * consuming the label directly server-side; this is persistence only.
 */
function workLocalePatch(input: WorkGenerationInput) {
  return workLocaleConfigPatch(getWorkFacts(input.brief?.facts)?.languages);
}

/**
 * Fetch the persisted Project templateId (load-detection path). Returns null on
 * any failure so the caller can decide (we treat "couldn't read" as a hard fail
 * — the guard below is a defense, not a best-effort).
 */
async function persistedTemplateId(tokenId: string): Promise<string | null> {
  const res = await fetch(`/api/loadDraft?tokenId=${encodeURIComponent(tokenId)}`);
  if (!res.ok) return null;
  const json = await res.json();
  return (json?.templateId ?? null) as string | null;
}

export async function runWorkGeneration(
  input: WorkGenerationInput,
  cb: GenerationCallbacks = {}
): Promise<GenerationResult> {
  const { tokenId } = input;

  // ─── Guard: the Project MUST already be granth (serveGate + confirm route) ───
  // Defense-in-depth: throw, never silently overwrite. A mismatch means the
  // serve resolution or the confirm persistence regressed upstream.
  let persisted: string | null;
  try {
    persisted = await persistedTemplateId(tokenId);
  } catch (e: any) {
    return { status: 'error', error: e?.message || 'Could not read the project.' };
  }
  if (persisted !== 'granth') {
    throw new Error(
      `Work generation expected a persisted templateId of 'granth' but found '${persisted ?? 'null'}'. ` +
        `serveGate resolves granth at serve time and /api/brief/confirm persists it — refusing to overwrite.`
    );
  }

  // ─── Build the deterministic Granth home (thin — no LLM) ───
  cb.onStage?.('saving');
  const writerName = input.writerName.trim() || undefined;
  const title = (input.writerName.trim() || input.oneLiner || 'Writer').slice(0, 50);
  // Resolved ONCE per run (one warn at most for an unmapped label).
  const localePatch = workLocalePatch(input);

  try {
    const finalContent = buildGranthHomeFinalContent({
      tokenId,
      title,
      writerName,
      // The 3–5 wizard uploads become book covers on the deterministic shelf.
      works: input.works,
    });

    // NOTE: audienceType ('writer') is already persisted by /api/brief/confirm
    // at serve time (alongside templateId) and DraftSaveSchema strips it anyway —
    // so it is intentionally NOT re-sent here; the guard above proves it's set.
    await saveDraft({
      tokenId,
      title: (finalContent.meta?.title as string) || title,
      paletteId: GRANTH_PALETTE,
      templateId: 'granth',
      variantId: GRANTH_VARIANT,
      ...localePatch,
      finalContent,
    });

    // scale-10 phase 5 — collections bridge (DORMANT: granth declares no
    // collection-family capability, so runCollectionFanOut no-ops today). Mirror
    // of thing.ts, minus the LLM: WORK is deterministic, so item records are
    // seeded VERBATIM by the bridge and generateItemCopy returns empty connective
    // copy. Charge stays FLAT.
    const declaredCaps = templateMeta.granth?.capabilities ?? [];
    const collResult = await runCollectionFanOut({
      fc: finalContent,
      collections: (input.collections ?? {}) as CollectionsFacts,
      declaredCapabilities: declaredCaps,
      persist: async (fc) => {
        await saveDraft({
          tokenId,
          title: (fc.meta?.title as string) || title,
          paletteId: GRANTH_PALETTE,
          templateId: 'granth',
          variantId: GRANTH_VARIANT,
          ...localePatch,
          finalContent: fc,
        });
      },
      generateItemCopy: async () => ({ status: 'done', copy: {} }),
    });
    if (collResult.status === 'credits') return { status: 'credits' };
    if (collResult.status === 'error') return { status: 'error', error: collResult.error };
  } catch (e: any) {
    return { status: 'error', error: e?.message || 'Could not save the draft.' };
  }

  cb.onStage?.('done');
  return { status: 'done', redirectTo: REDIRECT(tokenId) };
}

// ---------------------------------------------------------------------------
// atelier phase 2 — SKELETON path (served work → multipage, e.g. atelier)
// ---------------------------------------------------------------------------
// A served work-engine brief whose picked template declares `multipage` builds
// an EMPTY multipage draft for MANUAL FILL — zero LLM calls, zero credits, zero
// copy — instead of running the writer/granth generator above (buildWorkInput /
// runWorkGeneration). This path is NEVER taken by granth (no `multipage`
// capability → GeneratingSlot's dispatch gate is false), so the writer flow is
// byte-for-byte unchanged.
//
// Reuses the EXISTING multipage assembly helpers (multiPageAssembly.ts) with an
// EMPTY per-page copy map, so each confirmed sitemap page becomes real section
// ids (`${type}-${uuid}`) + layout mappings + empty content elements. No
// templateId-guard/overwrite check (unlike runWorkGeneration): the skeleton just
// materializes whatever template + pages the confirmed structure carries.
export async function runWorkSkeleton(
  input: WorkGenerationInput,
  cb: GenerationCallbacks = {}
): Promise<GenerationResult> {
  const { tokenId } = input;
  const pages = input.pages ?? [];
  const title = (input.writerName.trim() || input.oneLiner || 'Your site').slice(0, 50);
  const localePatch = workLocalePatch(input);

  cb.onStage?.('saving');
  try {
    const fc = buildMultiPageSkeleton({
      tokenId,
      title,
      onboardingData: {
        oneLiner: input.oneLiner,
        productName: input.writerName,
        understanding: {},
        landingGoal: null,
        offer: '',
        sitemap: pages,
        strategy: null,
      },
    });

    // One EMPTY page entry per CONFIRMED sitemap page. `copy: {}` ⇒ every
    // section gets empty elements; home carries header/footer chrome. Layout
    // names resolve via the shared selectProductBlocks map (falls back to
    // 'default' for a not-yet-registered template — phases 4/5 register the
    // real atelier block/layout mappings).
    pages.forEach((page, order) => {
      mergePageIntoFinalContent({
        fc,
        page,
        order,
        copy: {},
        templateId: input.templateId ?? 'atelier',
      });
    });

    // The skeleton IS the deliverable — drop the in-progress generation marker
    // so the draft loads as an ordinary editable multipage draft (NOT a
    // resumable generation). No goal stamping (no goal on this path).
    finalizeMultiPageGeneration(fc);

    // Phase 12b — seed the served template's ZERO-CONFIG default knobs into
    // themeValues.knobs so the zero-config published + editor render reflects the
    // template's signature (atelier → square buttons). Resolve defaultKnobs off the
    // loaded template module (server-safe barrel). MERGE into themeValues (there is
    // none on this path today, but never clobber a future mood/palette/variant).
    // Templates without defaultKnobs (granth) leave themeValues untouched.
    const resolvedTemplateId = (input.templateId ?? 'atelier') as TemplateId;
    let themeValues: Record<string, unknown> | undefined;
    try {
      const mod = await preloadTemplate(resolvedTemplateId);
      if (mod.defaultKnobs) {
        themeValues = { knobs: mod.defaultKnobs };
      }
    } catch {
      // Non-fatal: an unknown/unloadable template just skips the knob seed.
    }

    await saveDraft({
      tokenId,
      title: (fc.meta?.title as string) || title,
      ...(input.templateId ? { templateId: input.templateId } : {}),
      ...(themeValues ? { themeValues } : {}),
      ...localePatch,
      finalContent: fc,
    });
  } catch (e: any) {
    return { status: 'error', error: e?.message || 'Could not build the skeleton.' };
  }

  cb.onStage?.('done');
  return { status: 'done', redirectTo: REDIRECT(tokenId) };
}
