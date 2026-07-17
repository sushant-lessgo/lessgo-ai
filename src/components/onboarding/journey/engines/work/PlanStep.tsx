'use client';

// ============================================================================
// STEP 04 — THE PLAN, the WORK ENGINE body (work-onboarding-plan E4, phase 2).
//
// Engine-OWNED (loaded via the seam's `plan.loadStep`, the founder-signed D9
// field REUSED for STEP 04 — same field STEP 02/03 use, never a new mechanism).
// The agnostic frame (`steps/StepPlan.tsx`) runs `plan.prepare` (the chargeless
// sitemap seed) and renders THIS at render time (post-confirm), so nothing here
// lands on the pre-confirm entry bundle.
//
// ── PHASE 2 SCOPE (deliberate) ──────────────────────────────────────────────
// READ-ONLY. Renders the real proposed site — one column per page, real
// ingested photos where they belong, plain-word section rows + one-line
// descriptions, a plain-language goal badge per page — and a working "Build my
// site" advance (`setJourneyStep(5)`). The tap-powers (add/remove/rename/
// reorder/change-goal/swap-lead) land in PHASE 3 through the one write door.
//
// ── ZERO INTERNAL VOCABULARY ────────────────────────────────────────────────
// Section rows are named ONLY from `workVocabulary` (userLabel + description).
// An internal section key (hero/proof/cta…) never reaches the screen — a key
// without a vocab entry is dropped rather than shown raw.
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

import { useMemo } from 'react';
import {
  useWizardStore,
  selectSetJourneyStep,
  selectBriefFacts,
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
  type WorkPageGoalKey,
} from '@/modules/engines/workPages';
import type { WorkSitemapPage } from '@/modules/audience/work/strategy/parseStrategyWork';
import type { JourneyStepProps } from '../../JourneyShell';

/** Section keys whose pages present the seller's work (⇒ show the photo strip). */
const WORK_SECTION_KEYS = new Set(['hero', 'work', 'workdetail', 'featuredWork']);

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

export default function PlanStep(_props: JourneyStepProps) {
  const setJourneyStep = useWizardStore(selectSetJourneyStep);
  const rawSitemap = useWizardStore((s) => s.sitemap);
  const briefFacts = useWizardStore(selectBriefFacts);

  const facts = useMemo(() => getWorkFacts(briefFacts ?? undefined), [briefFacts]);
  const contactMethod = facts?.contactMethod as WorkPageGoalKey | undefined;

  // The real ingested photos (committed facts only — commitRail is the writer).
  const photos = useMemo(() => photosWithUrl(facts?.groups ?? []), [facts]);

  const pages = useMemo(
    () => (Array.isArray(rawSitemap) ? (rawSitemap as WorkSitemapPage[]) : []),
    [rawSitemap]
  );

  return (
    <div data-testid="step-plan" data-journey-step={4} className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-app-sans text-2xl font-semibold text-app-ink">
          Here&apos;s your site
        </h1>
        <p className="font-app-sans text-sm text-app-muted max-w-xl">
          Every page, what&apos;s on it, and what it asks visitors to do — your real
          photos already in place.
        </p>
      </div>

      {pages.length === 0 ? (
        <p className="font-app-sans text-sm text-app-muted" role="status">
          Working out your pages…
        </p>
      ) : (
        <div
          data-testid="plan-columns"
          className="flex gap-4 overflow-x-auto pb-2"
        >
          {pages.map((page, i) => {
            const showsWork = page.sections?.some((s) => WORK_SECTION_KEYS.has(s));
            const goalKey: WorkPageGoalKey =
              page.goal ?? defaultGoalForPage(page.archetypeKey, contactMethod);
            const goalWord = workPageGoalWords[goalKey].userLabel;
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
                <h2 className="font-app-sans text-sm font-semibold text-app-ink">
                  {page.title}
                </h2>

                {/* Photos — prominent. Only when the page shows work AND we have
                    real ingested photos (no-photo path renders nothing). */}
                {showsWork && photos.length > 0 && (
                  <div
                    data-testid={`plan-photos-${i}`}
                    className="grid grid-cols-2 gap-1"
                  >
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

                {/* Goal badge — distinct, at the column foot. */}
                <div className="mt-auto pt-1">
                  <span
                    data-testid={`plan-goal-${i}`}
                    className="inline-flex items-center gap-1 rounded-app-pill bg-app-tint
                               px-2 py-1 font-app-sans text-[11px] font-medium text-app-primary"
                  >
                    <AppIcon name="ads_click" size={12} />
                    {workPageGoalBadgePrefix} {goalWord}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Button
        type="button"
        variant="cta"
        data-testid="plan-build"
        disabled={pages.length === 0}
        onClick={() => setJourneyStep(5)}
      >
        Build my site
        <AppIcon name="arrow_forward" size={16} className="ml-1.5" />
      </Button>
    </div>
  );
}
