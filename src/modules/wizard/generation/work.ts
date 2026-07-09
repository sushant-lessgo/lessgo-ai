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
import { runCollectionFanOut } from '@/modules/generation/multiPageAssembly';
import { templateMeta } from '@/modules/templates/templateMeta';
import type { CollectionsFacts } from '@/modules/brief/collections';
import { saveDraft } from './finalize';
import type { GenerationCallbacks, GenerationResult } from './index';

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
}

const REDIRECT = (tokenId: string) => `/edit/${tokenId}`;

const GRANTH_PALETTE = 'sinduri';
const GRANTH_VARIANT = 'granth';

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
