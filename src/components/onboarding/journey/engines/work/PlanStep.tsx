'use client';

// ============================================================================
// STEP 04 — THE PLAN, the WORK ENGINE body (work-onboarding-plan E4).
//
// Engine-OWNED (loaded via the seam's `plan.loadStep`, the founder-signed D9
// field REUSED for STEP 04 — same field STEP 02/03 use, never a new mechanism).
// The agnostic frame (`steps/StepPlan.tsx`) runs `plan.prepare` (the chargeless
// sitemap seed) and renders THIS at render time (post-confirm), so nothing here
// lands on the pre-confirm entry bundle.
//
// ── SCOPE (phase 2 read-only + phase 3 tap-powers) ──────────────────────────
// Renders the real proposed site — one column per page, real ingested photos
// where they belong, plain-word section rows + one-line descriptions, a plain-
// language goal badge per page — plus a DELIBERATELY SMALL set of tap-powers:
//   • add a page (from the designed set)      • remove a page
//   • rename a page                           • reorder pages
//   • change a page's goal                    • swap which work leads
// NO section-level rearranging. The approve→generation handoff is PHASE 4 — the
// "Build my site" button stays a plain `setJourneyStep(5)` for now.
//
// ── ONE WRITE DOOR ──────────────────────────────────────────────────────────
// Structure taps go `applyPlanEdit(edit, sitemap)` (pure validator, plan.ts) →
// `commitRail(buildPlanCommit(next, facts))`. The one facts-touching tap (swap
// which work leads = reorder `facts.work.groups`) uses the EXISTING
// `applyRailEdit({field:'groups'}) → commitRail` door (rail.ts) — the E2 pattern
// from ShowWorkStep. NO new saveDraft call / API route / store action. Optimistic
// UI + failure-revert come free from `commitRail`'s set/revert (now covering the
// sitemap too); a rejected edit surfaces inline and clears on the next success.
//
// ── ZERO INTERNAL VOCABULARY ────────────────────────────────────────────────
// Section rows are named ONLY from `workVocabulary` (userLabel + description).
// An internal section key (hero/proof/cta…) never reaches the screen — a key
// without a vocab entry is dropped rather than shown raw. Goal wording comes
// ONLY from `workPageGoalWords`.
//
// ── NO-PHOTO PATH ───────────────────────────────────────────────────────────
// The Kundius facts fixture carries groups but NO photo urls. The photo strip
// is rendered only when a page actually has photos to show, so that path is
// clean (no broken <img>, no empty frame). `blurDataUrl` is an EPHEMERAL upload
// signal (ShowWorkStep state), not a persisted fact, so it is unavailable to
// this read-only projection of the committed bag — we render by url.
//
// The shell owns the "What we understood" rail (journey-wide rule); this body
// must not hide or cover it — it renders only the plan columns + the CTA.
// ============================================================================

import { useMemo, useState } from 'react';
import {
  useWizardStore,
  selectSetJourneyStep,
  selectBriefFacts,
  selectCommitRail,
} from '@/hooks/useWizardStore';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { getWorkFacts, type WorkPhotoRef } from '@/lib/schemas/workFacts.schema';
import {
  workVocabulary,
  workPageGoalWords,
  workPageGoalBadgePrefix,
} from '@/modules/engines/workVocabulary';
import {
  defaultGoalForPage,
  addableWorkPages,
  workPageTypes,
  WORK_PAGE_GOAL_KEYS,
  type WorkPageGoalKey,
  type WorkPageTypeKey,
} from '@/modules/engines/workPages';
import { applyPlanEdit, buildPlanCommit, type PlanEdit } from '@/modules/wizard/work/plan';
import { applyRailEdit, type WorkGroupInput } from '@/modules/wizard/work/rail';
import type { WorkSitemapPage } from '@/modules/audience/work/strategy/parseStrategyWork';
import type { JourneyStepProps } from '../../JourneyShell';

/** Section keys whose pages present the seller's work (⇒ show the photo strip). */
const WORK_SECTION_KEYS = new Set(['hero', 'work', 'workdetail', 'featuredWork']);

/** archetypeKey → page-type key (for the add-menu present-set + non-parametric map). */
const ARCHETYPE_TO_PAGE_KEY: Record<string, WorkPageTypeKey> = (() => {
  const out: Record<string, WorkPageTypeKey> = {};
  for (const key of Object.keys(workPageTypes) as WorkPageTypeKey[]) {
    out[workPageTypes[key].key] = key;
  }
  return out;
})();

/** Every photo carrying a url, across a group's flat photos AND its sub-items. */
function photosWithUrl(
  groups: ReadonlyArray<{ photos?: WorkPhotoRef[]; items?: { photos?: WorkPhotoRef[] }[] }>
): WorkPhotoRef[] {
  const out: WorkPhotoRef[] = [];
  for (const g of groups) {
    for (const p of g.photos ?? []) if (p.url) out.push(p);
    for (const it of g.items ?? []) for (const p of it.photos ?? []) if (p.url) out.push(p);
  }
  // Cover photos first — the deliberate best-first placement (read-only preview).
  return out.sort((a, b) => Number(Boolean(b.cover)) - Number(Boolean(a.cover)));
}

/** One buyer-facing section row, or null when the key has no vocab (never shown raw). */
function sectionRow(key: string): { label: string; description: string } | null {
  const entry = workVocabulary[key];
  if (!entry) return null;
  return { label: entry.userLabel, description: entry.description };
}

function isHome(page: WorkSitemapPage): boolean {
  return page.archetypeKey === workPageTypes.home.key;
}

export default function PlanStep(_props: JourneyStepProps) {
  const setJourneyStep = useWizardStore(selectSetJourneyStep);
  const commitRail = useWizardStore(selectCommitRail);
  const rawSitemap = useWizardStore((s) => s.sitemap);
  const briefFacts = useWizardStore(selectBriefFacts);

  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<number | null>(null);
  const [addKey, setAddKey] = useState<WorkPageTypeKey | ''>('');
  const [approving, setApproving] = useState(false);

  const facts = useMemo(() => getWorkFacts(briefFacts ?? undefined), [briefFacts]);
  const contactMethod = facts?.contactMethod as WorkPageGoalKey | undefined;
  const groups = facts?.groups ?? [];

  // The real ingested photos (committed facts only — commitRail is the writer).
  const photos = useMemo(() => photosWithUrl(groups), [groups]);

  const pages = useMemo(
    () => (Array.isArray(rawSitemap) ? (rawSitemap as WorkSitemapPage[]) : []),
    [rawSitemap]
  );

  const addable = useMemo(() => {
    const present = pages
      .map((p) => ARCHETYPE_TO_PAGE_KEY[p.archetypeKey])
      .filter((k): k is WorkPageTypeKey => k !== undefined);
    return addableWorkPages(present);
  }, [pages]);

  // ── The one write door for structure taps ───────────────────────────────────
  async function runPlanEdit(edit: PlanEdit) {
    // Read the LIVE sitemap (never a stale render closure) — commitRail is serial.
    const current = (useWizardStore.getState().sitemap as WorkSitemapPage[] | null) ?? [];
    const res = applyPlanEdit(edit, current);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const liveFacts = useWizardStore.getState().briefFacts;
    const out = await commitRail(buildPlanCommit(res.next, liveFacts));
    setError(out.ok ? null : out.error);
  }

  // ── Swap which work leads = reorder facts.work.groups (chosen group first) ──
  async function makeLead(groupIndex: number) {
    if (groupIndex <= 0) return; // already leads
    const liveFacts = useWizardStore.getState().briefFacts;
    const live = getWorkFacts(liveFacts ?? undefined)?.groups ?? [];
    if (groupIndex >= live.length) return;
    const reordered: WorkGroupInput[] = [
      live[groupIndex],
      ...live.filter((_, i) => i !== groupIndex),
    ];
    const commit = applyRailEdit({ field: 'groups', value: reordered }, liveFacts);
    if (!commit.ok) {
      setError(commit.error);
      return;
    }
    const out = await commitRail(commit);
    setError(out.ok ? null : out.error);
  }

  function submitRename(index: number, title: string) {
    setRenaming(null);
    void runPlanEdit({ type: 'renamePage', index, title });
  }

  // ── Approve → structure → fire (PHASE 4). ────────────────────────────────────
  // The load-bearing invariant: the approved plan IS the generation input, so
  // `Brief.structure` MUST be persisted BEFORE we advance into STEP 05. We run
  // ONE final AWAITED `commitRail(buildPlanCommit(...))` off the LIVE sitemap —
  // idempotent (re-emits the same structure), so it also guarantees persistence
  // even if an earlier per-tap commit failed. Only a successful commit advances;
  // a failure surfaces inline and does NOT dead-drop into an ungenerated build.
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

  return (
    <div data-testid="step-plan" data-journey-step={4} className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-app-sans text-2xl font-semibold text-app-ink">
          Here&apos;s your site
        </h1>
        <p className="font-app-sans text-sm text-app-muted max-w-xl">
          Every page, what&apos;s on it, and what it asks visitors to do — your real
          photos already in place. Add, remove, rename or reorder pages below.
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

      {/* Add a page — from the designed set only. */}
      {addable.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            data-testid="plan-add-select"
            aria-label="Add a page"
            className="rounded-app-input border border-app-hairline bg-app-surface px-2 py-1
                       font-app-sans text-sm text-app-ink"
            value={addKey}
            onChange={(e) => setAddKey(e.target.value as WorkPageTypeKey | '')}
          >
            <option value="">Add a page…</option>
            {addable.map((key) => (
              <option key={key} value={key}>
                {workPageTypes[key].title}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="plan-add-button"
            disabled={!addKey}
            onClick={() => {
              if (!addKey) return;
              void runPlanEdit({ type: 'addPage', pageKey: addKey, contactMethod });
              setAddKey('');
            }}
          >
            <AppIcon name="add" size={14} className="mr-1" />
            Add
          </Button>
        </div>
      )}

      {pages.length === 0 ? (
        <p className="font-app-sans text-sm text-app-muted" role="status">
          Working out your pages…
        </p>
      ) : (
        <div data-testid="plan-columns" className="flex gap-4 overflow-x-auto pb-2">
          {pages.map((page, i) => {
            const home = isHome(page);
            const showsWork = page.sections?.some((s) => WORK_SECTION_KEYS.has(s));
            const goalKey: WorkPageGoalKey =
              page.goal ?? defaultGoalForPage(page.archetypeKey, contactMethod);
            const rows = (page.sections ?? [])
              .map(sectionRow)
              .filter((r): r is { label: string; description: string } => r !== null);

            return (
              <div
                key={`${page.pathSlug}-${i}`}
                data-testid={`plan-column-${i}`}
                className="flex w-56 shrink-0 flex-col gap-3 rounded-app-card border
                           border-app-hairline bg-app-surface p-3"
              >
                {/* Title + per-page controls. */}
                <div className="flex items-start justify-between gap-1">
                  {renaming === i ? (
                    <input
                      autoFocus
                      data-testid={`plan-rename-input-${i}`}
                      defaultValue={page.title}
                      className="w-full rounded-app-input border border-app-hairline
                                 bg-app-surface px-1.5 py-0.5 font-app-sans text-sm text-app-ink"
                      onBlur={(e) => submitRename(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename(i, e.currentTarget.value);
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                    />
                  ) : (
                    <h2 className="font-app-sans text-sm font-semibold text-app-ink">
                      {page.title}
                    </h2>
                  )}
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      data-testid={`plan-rename-${i}`}
                      aria-label={`Rename ${page.title}`}
                      className="text-app-muted hover:text-app-ink"
                      onClick={() => setRenaming(i)}
                    >
                      <AppIcon name="edit" size={14} />
                    </button>
                    <button
                      type="button"
                      data-testid={`plan-move-left-${i}`}
                      aria-label={`Move ${page.title} earlier`}
                      className="text-app-muted hover:text-app-ink disabled:opacity-30"
                      disabled={home || i <= 1}
                      onClick={() => void runPlanEdit({ type: 'movePage', index: i, dir: -1 })}
                    >
                      <AppIcon name="chevron_left" size={14} />
                    </button>
                    <button
                      type="button"
                      data-testid={`plan-move-right-${i}`}
                      aria-label={`Move ${page.title} later`}
                      className="text-app-muted hover:text-app-ink disabled:opacity-30"
                      disabled={home || i >= pages.length - 1}
                      onClick={() => void runPlanEdit({ type: 'movePage', index: i, dir: 1 })}
                    >
                      <AppIcon name="chevron_right" size={14} />
                    </button>
                    {!home && (
                      <button
                        type="button"
                        data-testid={`plan-remove-${i}`}
                        aria-label={`Remove ${page.title}`}
                        className="text-app-muted hover:text-app-danger"
                        onClick={() => void runPlanEdit({ type: 'removePage', index: i })}
                      >
                        <AppIcon name="close" size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Photos — prominent. Only when the page shows work AND we have
                    real ingested photos (no-photo path renders nothing). */}
                {showsWork && photos.length > 0 && (
                  <div data-testid={`plan-photos-${i}`} className="grid grid-cols-2 gap-1">
                    {photos.slice(0, 4).map((p, pi) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={p.id ?? `${p.url}-${pi}`}
                        src={p.url}
                        alt={p.alt ?? page.title}
                        className="aspect-square w-full rounded-app-input object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}

                {/* Section rows — small, plain words, one-line descriptions. */}
                <ul className="space-y-1.5">
                  {rows.map((row, ri) => (
                    <li
                      key={`${row.label}-${ri}`}
                      data-testid={`plan-row-${i}-${ri}`}
                      className="leading-tight"
                    >
                      <span className="font-app-sans text-xs font-medium text-app-ink">
                        {row.label}
                      </span>
                      <span className="block font-app-sans text-[11px] text-app-placeholder">
                        {row.description}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Goal — distinct badge + a change control (change a page's goal). */}
                <div className="mt-auto space-y-1 pt-1">
                  <span
                    data-testid={`plan-goal-${i}`}
                    className="inline-flex items-center gap-1 rounded-app-pill bg-app-tint
                               px-2 py-1 font-app-sans text-[11px] font-medium text-app-primary"
                  >
                    <AppIcon name="ads_click" size={12} />
                    {workPageGoalBadgePrefix} {workPageGoalWords[goalKey].userLabel}
                  </span>
                  <select
                    data-testid={`plan-goal-select-${i}`}
                    aria-label={`Goal for ${page.title}`}
                    className="block w-full rounded-app-input border border-app-hairline
                               bg-app-surface px-1.5 py-0.5 font-app-sans text-[11px] text-app-ink"
                    value={goalKey}
                    onChange={(e) =>
                      void runPlanEdit({
                        type: 'setGoal',
                        index: i,
                        goal: e.target.value as WorkPageGoalKey,
                      })
                    }
                  >
                    {WORK_PAGE_GOAL_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {workPageGoalWords[key].userLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Swap which work leads — reorder the groups (first = leads). */}
      {groups.length > 1 && (
        <div className="space-y-2">
          <p className="font-app-sans text-xs font-medium text-app-muted">
            Which work leads?
          </p>
          <div data-testid="plan-lead-groups" className="flex flex-wrap gap-2">
            {groups.map((g, gi) => (
              <button
                type="button"
                key={`${g.name}-${gi}`}
                data-testid={`plan-lead-${gi}`}
                disabled={gi === 0}
                onClick={() => void makeLead(gi)}
                className="inline-flex items-center gap-1 rounded-app-pill border
                           border-app-hairline px-2.5 py-1 font-app-sans text-xs
                           text-app-ink disabled:bg-app-tint disabled:text-app-primary
                           disabled:opacity-100"
              >
                {gi === 0 && <AppIcon name="star" size={12} />}
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
}
