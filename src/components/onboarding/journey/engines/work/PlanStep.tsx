'use client';

// ============================================================================
// STEP 04 — THE PLAN, the WORK ENGINE body (plan-proposal-gate phase 2).
//
// Engine-OWNED (loaded via the seam's `plan.loadStep`, the founder-signed D9
// field REUSED for STEP 04 — same field STEP 02/03 use, never a new mechanism).
// The agnostic frame (`steps/StepPlan.tsx`) runs `plan.prepare` (the chargeless,
// PROPOSAL-DRIVEN sitemap seed) and renders THIS at render time (post-confirm),
// so nothing here lands on the pre-confirm entry bundle.
//
// ── SCOPE (the reconceived gate) ─────────────────────────────────────────────
// Two decisions only — everything editor-level (rename / reorder / goals /
// photos / section rows / lead-swap) leaves the gate:
//   • SITE SHAPE — Single-page vs Multi-page (pre-selected to the deterministic
//     `proposeWorkSiteStructure()` guess, folded/expanded on switch).
//   • PAGES — tiles from the closed `workPageTypes` master list (Home locked on),
//     pre-selected to the proposal's page subset.
// Then "Build my site" approves + fires generation.
//
// ── ONE WRITE DOOR ──────────────────────────────────────────────────────────
// Every structure edit goes through the pure validators (`applyTileToggle`/
// `applyWorkGroupToggle`, and the shape helpers `foldToSinglePage`/
// `expandToMultiPage`) → `commitRail(buildPlanCommit(next, facts))`. NO new
// saveDraft call / API route / store action. Optimistic UI + failure-revert come
// free from `commitRail`'s set/revert (it snapshots the sitemap too); a rejected
// edit surfaces inline and clears on the next success.
//
// ── ZERO INTERNAL VOCABULARY ────────────────────────────────────────────────
// Tile labels + descriptions are FIXED plain strings held here — an internal key
// (hero/proof/experiences/archetype…) never reaches the screen. The atelier
// `/experiences` page is the "Prices" tile (canonical vocab); its real slug stays
// plumbing, never surfaced.
//
// The shell owns the "What we understood" rail (journey-wide rule); this body
// must not hide or cover it — it renders only the shape cards + tiles + the CTA.
// ============================================================================

import { useMemo, useRef, useState } from 'react';
import {
  useWizardStore,
  selectSetJourneyStep,
  selectBriefFacts,
  selectCommitRail,
} from '@/hooks/useWizardStore';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import {
  canPromoteWorkGroup,
  siteShapeOf,
  foldToSinglePage,
  expandToMultiPage,
  TILE_ALIAS,
} from '@/modules/wizard/work/shape';
import {
  applyTileToggle,
  applyWorkGroupToggle,
  buildPlanCommit,
} from '@/modules/wizard/work/plan';
import { getPageArchetypesForTemplate } from '@/modules/audience/product/pageArchetypes';
import type { WorkPageGoalKey, WorkPageTypeKey } from '@/modules/engines/workPages';
import type { WorkSitemapPage } from '@/modules/audience/work/strategy/parseStrategyWork';
import type { JourneyStepProps } from '../../JourneyShell';

// ─────────────────────────────────────────────────────────────────────────────
// Tile copy — FIXED plain strings (never an internal key on screen).
// ─────────────────────────────────────────────────────────────────────────────

interface TileDef {
  key: WorkPageTypeKey;
  label: string;
  desc: string;
  locked?: boolean;
}

/** The always-offered base pages, in menu order. Home is locked on. */
const BASE_TILES: TileDef[] = [
  { key: 'home', label: 'Home', desc: 'Your promise, best work and how to reach you.', locked: true },
  { key: 'work', label: 'Work', desc: 'Your portfolio — every photo, best first.' },
  { key: 'prices', label: 'Prices', desc: 'Packages and prices, so buyers pre-qualify.' },
  { key: 'about', label: 'About', desc: 'Your story — who you are and how you shoot.' },
  { key: 'contact', label: 'Contact', desc: 'How buyers reach you — one clear way to get in touch.' },
];

/** Extra optional pages the seller can attach. */
const OPTIONAL_TILES: TileDef[] = [
  { key: 'project-story', label: 'Project story', desc: 'One project, told start to finish.' },
  { key: 'blog', label: 'Blog', desc: 'Notes and updates on their own page.' },
];

/** The promoted-group tile — rendered only when a group qualifies. */
const WORK_GROUP_TILE: TileDef = {
  key: 'work-group',
  label: 'Work group',
  desc: 'Promote one collection to its own page.',
};

export default function PlanStep(_props: JourneyStepProps) {
  const setJourneyStep = useWizardStore(selectSetJourneyStep);
  const commitRail = useWizardStore(selectCommitRail);
  const rawSitemap = useWizardStore((s) => s.sitemap);
  const briefFacts = useWizardStore(selectBriefFacts);
  const templateId = useWizardStore((s) => s.templateId);
  const hasTestimonials = useWizardStore((s) => s.proof.hasTestimonials);

  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  // The user's most recent MULTI page-set, stashed when they switch to Single so
  // switching back restores their exact choices (least-surprising).
  const multiStashRef = useRef<WorkSitemapPage[] | null>(null);

  const facts = useMemo(() => getWorkFacts(briefFacts ?? undefined), [briefFacts]);
  const contactMethod = facts?.contactMethod as WorkPageGoalKey | undefined;
  const groups = facts?.groups ?? [];

  const menu = useMemo(
    () => getPageArchetypesForTemplate(templateId ?? null) ?? [],
    [templateId]
  );

  const pages = useMemo(
    () => (Array.isArray(rawSitemap) ? (rawSitemap as WorkSitemapPage[]) : []),
    [rawSitemap]
  );

  const shape = siteShapeOf(pages);
  const proofOpts = { hasTestimonials };

  // Selected = present in the live sitemap (via the canonical alias). The tiles
  // therefore come up PRE-SELECTED to the proposal's seeded subset for free.
  const isTileSelected = (tile: WorkPageTypeKey): boolean => {
    if (tile === 'work-group') return pages.some((p) => p.archetypeKey === 'work-group');
    return pages.some((p) => TILE_ALIAS[p.archetypeKey] === tile);
  };

  // ── The one write door — commit an edited sitemap through commitRail. ────────
  async function commit(next: WorkSitemapPage[]) {
    // Read LIVE facts (never a stale closure) — commitRail is serial.
    const liveFacts = useWizardStore.getState().briefFacts;
    const out = await commitRail(buildPlanCommit(next, liveFacts));
    setError(out.ok ? null : out.error);
  }

  function liveSitemap(): WorkSitemapPage[] {
    return (useWizardStore.getState().sitemap as WorkSitemapPage[] | null) ?? [];
  }

  // ── SITE SHAPE — fold to Single / expand to Multi. ───────────────────────────
  // Single-page = EVERY section stacked on Home (the spec's rich one-pager), so we
  // fold the FULL menu expansion — NOT just the current multi subset — otherwise a
  // compact seed would silently drop prices/about content from the single page.
  // Mirrors the seed's one-pager branch exactly (foldToSinglePage(expandToMultiPage
  // (menu), …)). The user's multi tile choices are stashed so switching back
  // restores them (least-surprising; ruling 5).
  async function selectShape(next: 'single' | 'multi') {
    const current = liveSitemap();
    if (siteShapeOf(current) === next) return; // already there
    if (next === 'single') {
      multiStashRef.current = current; // remember the multi choices
      await commit(foldToSinglePage(expandToMultiPage(menu, proofOpts), proofOpts));
    } else {
      const restored = multiStashRef.current ?? expandToMultiPage(menu, proofOpts);
      await commit(restored);
    }
  }

  // ── PAGE tiles — toggle a canonical page on/off. ─────────────────────────────
  async function toggleTile(tile: WorkPageTypeKey, on: boolean) {
    const res = applyTileToggle(tile, on, liveSitemap(), {
      menu,
      contactMethod,
      hasTestimonials,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await commit(res.next);
  }

  // ── PROMOTED work-group tile — the lead group earns its own page. ────────────
  async function toggleWorkGroup(on: boolean) {
    const leadName = groups[0]?.name ?? '';
    const res = applyWorkGroupToggle(on, leadName, groups.length, liveSitemap());
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await commit(res.next);
  }

  // ── Approve → structure persisted → generation fires (STEP 05). ──────────────
  // The load-bearing invariant: the approved plan IS the generation input, so
  // `Brief.structure` MUST be persisted BEFORE we advance into STEP 05. We run ONE
  // final AWAITED `commitRail(buildPlanCommit(...))` off the LIVE sitemap —
  // idempotent (re-emits the same structure), so it also guarantees persistence
  // even if an earlier per-tap commit failed. Only a successful commit advances; a
  // failure surfaces inline and does NOT dead-drop into an ungenerated build.
  async function approve() {
    if (approving) return;
    setApproving(true);
    const current =
      (useWizardStore.getState().sitemap as WorkSitemapPage[] | null) ?? [];
    const liveFacts = useWizardStore.getState().briefFacts;
    const out = await commitRail(buildPlanCommit(current, liveFacts));
    if (!out.ok) {
      setError(out.error);
      setApproving(false);
      return;
    }
    setError(null);
    setJourneyStep(5);
  }

  const workGroupQualified = canPromoteWorkGroup(groups.length);

  return (
    <div data-testid="step-plan" data-journey-step={4} className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-app-sans text-2xl font-semibold text-app-ink">
          Here&apos;s your site
        </h1>
        <p className="font-app-sans text-sm text-app-muted max-w-xl">
          Pick how it&apos;s laid out and which pages to include. Everything is
          editable later — this is just the starting shape.
        </p>
      </div>

      {error && (
        <p
          data-testid="plan-error"
          role="alert"
          className="font-app-sans text-sm text-app-danger"
        >
          {error} — try again.
        </p>
      )}

      {pages.length === 0 ? (
        <p className="font-app-sans text-sm text-app-muted" role="status">
          Working out your pages…
        </p>
      ) : (
        <>
          {/* ── SITE SHAPE ─────────────────────────────────────────────────── */}
          <section className="space-y-3">
            <h2 className="font-app-sans text-xs font-semibold uppercase tracking-wide text-app-muted">
              Layout
            </h2>
            <div
              role="radiogroup"
              aria-label="Site shape"
              className="grid gap-3 sm:grid-cols-2"
            >
              <ShapeCard
                testid="plan-shape-multi"
                title="Multi-page"
                desc="A home page plus separate pages for your work, prices and more."
                selected={shape === 'multi'}
                onSelect={() => void selectShape('multi')}
              />
              <ShapeCard
                testid="plan-shape-single"
                title="Single-page"
                desc="One long home page — every section stacked on a single scroll."
                selected={shape === 'single'}
                onSelect={() => void selectShape('single')}
              />
            </div>
          </section>

          {/* ── PAGES — only in the multi shape ────────────────────────────── */}
          {shape === 'multi' && (
            <section className="space-y-3">
              <h2 className="font-app-sans text-xs font-semibold uppercase tracking-wide text-app-muted">
                Pages
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {BASE_TILES.map((tile) => (
                  <PageTile
                    key={tile.key}
                    tile={tile}
                    selected={tile.locked ? true : isTileSelected(tile.key)}
                    onToggle={(on) => void toggleTile(tile.key, on)}
                  />
                ))}
                {workGroupQualified && (
                  <PageTile
                    key={WORK_GROUP_TILE.key}
                    tile={WORK_GROUP_TILE}
                    selected={isTileSelected('work-group')}
                    onToggle={(on) => void toggleWorkGroup(on)}
                  />
                )}
                {OPTIONAL_TILES.map((tile) => (
                  <PageTile
                    key={tile.key}
                    tile={tile}
                    selected={isTileSelected(tile.key)}
                    onToggle={(on) => void toggleTile(tile.key, on)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <div className="space-y-2">
        <Button
          type="button"
          variant="cta"
          data-testid="plan-build"
          disabled={pages.length === 0 || approving}
          onClick={() => void approve()}
        >
          Build my site
          <AppIcon name="arrow_forward" size={16} className="ml-1.5" />
        </Button>
        <p
          data-testid="plan-footnote"
          className="font-app-sans text-xs text-app-muted"
        >
          You can change the pages anytime after — nothing&apos;s locked in.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Presentational subcomponents (no store access — pure props).
// ─────────────────────────────────────────────────────────────────────────────

function ShapeCard({
  testid,
  title,
  desc,
  selected,
  onSelect,
}: {
  testid: string;
  title: string;
  desc: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-testid={testid}
      onClick={onSelect}
      className={[
        'flex items-start gap-3 rounded-app-card border p-4 text-left transition-colors',
        selected
          ? 'border-app-primary bg-app-tint'
          : 'border-app-hairline bg-app-surface hover:border-app-primary',
      ].join(' ')}
    >
      <AppIcon
        name={selected ? 'radio_button_checked' : 'radio_button_unchecked'}
        size={18}
        className={selected ? 'text-app-primary' : 'text-app-muted'}
      />
      <span className="space-y-1">
        <span className="block font-app-sans text-sm font-semibold text-app-ink">
          {title}
        </span>
        <span className="block font-app-sans text-xs text-app-muted">{desc}</span>
      </span>
    </button>
  );
}

function PageTile({
  tile,
  selected,
  onToggle,
}: {
  tile: TileDef;
  selected: boolean;
  onToggle: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      data-testid={`plan-tile-${tile.key}`}
      aria-pressed={selected}
      disabled={tile.locked}
      onClick={() => onToggle(!selected)}
      className={[
        'flex items-start gap-3 rounded-app-card border p-3 text-left transition-colors',
        selected
          ? 'border-app-primary bg-app-tint'
          : 'border-app-hairline bg-app-surface hover:border-app-primary',
        tile.locked ? 'cursor-default' : '',
      ].join(' ')}
    >
      <AppIcon
        name={tile.locked ? 'lock' : selected ? 'check_circle' : 'add_circle'}
        size={18}
        className={selected ? 'text-app-primary' : 'text-app-muted'}
      />
      <span className="space-y-0.5">
        <span className="block font-app-sans text-sm font-medium text-app-ink">
          {tile.label}
        </span>
        <span className="block font-app-sans text-xs text-app-muted">{tile.desc}</span>
      </span>
    </button>
  );
}
