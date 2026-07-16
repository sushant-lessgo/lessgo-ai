'use client';

import { useEffect, useRef, useState } from 'react';
import { AppIcon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { useReviewState } from '@/hooks/useReviewState';

/**
 * SlugModal — the publish CONFIRM step (t17 state A) + the publishing card (t17 state B).
 *
 * editor-shell-redesign phase 7 reskin. PRESENTATION ONLY:
 *  - every prop, the slug sanitiser (`onChange`), the `isChangingSlug` derivation,
 *    the submit gate (`loading || !slug`) and `onConfirm`/`onCancel` are UNCHANGED.
 *  - `loading` (driven by the preview page's `publishing` state) now renders the
 *    t17-B card in place of the confirm body. Same WHEN, different WHAT.
 *
 * `.app-chrome` is attached via the phase-3/4 `app-chrome contents` pattern
 * (display:contents — inherits Onest/ink WITHOUT painting the class's #f7f8fa
 * background over the card's white). Never attached to anything containing the
 * editor canvas (the preview page renders the canvas as a sibling of this modal).
 */

type SlugModalProps = {
  slug: string;
  onChange: (val: string) => void;
  title: string;
  onTitleChange: (val: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
  error?: string;
  // Phase 8: `publishedAt` dropped. It became a dead prop when the t17 reskin
  // replaced "Last updated: <date>" with the live-target row — typed, passed,
  // never read. The preview page's fetch/state still carries the field (that
  // status fetch is NO-TOUCH); this type just stops claiming to need it.
  existingPublished?: {
    slug: string;
    title: string;
  } | null;
  analyticsEnabled?: boolean;
  onAnalyticsChange?: (enabled: boolean) => void;
  /**
   * t17-A soft Review nudge target. Optional slot (presentation): when omitted the
   * nudge renders without a link. NEVER gates publishing — handoff rule: "Soft
   * nudge, not a gate … 'Publish now' always works."
   */
  onReview?: () => void;
};

const FIELD_CLASS =
  'w-full rounded-[9px] border border-app-border-hairline bg-white px-3 py-[9px] text-[12.5px] text-app-ink outline-none transition-colors placeholder:text-app-placeholder focus:border-app-primary';

export function SlugModal({
  slug,
  onChange,
  title,
  onTitleChange,
  onCancel,
  onConfirm,
  loading,
  error,
  existingPublished,
  analyticsEnabled,
  onAnalyticsChange,
  onReview,
}: SlugModalProps) {
  const [isChangingSlug, setIsChangingSlug] = useState(false);
  const slugInputRef = useRef<HTMLInputElement>(null);

  // t17-A soft nudge. Read-only; mirrors ReviewPill's self-hide (`allComplete`).
  const remainingCount = useReviewState((s) => s.remainingCount);
  const allComplete = useReviewState((s) => s.allComplete);

  // Detect if user changes slug from existing
  useEffect(() => {
    if (existingPublished && slug !== existingPublished.slug) {
      setIsChangingSlug(true);
    } else {
      setIsChangingSlug(false);
    }
  }, [slug, existingPublished]);

  // The live target = what the world hits today when the page is already
  // published, else the URL this publish will create.
  const liveTarget = `${existingPublished?.slug ?? (slug || '…')}.lessgo.site`;

  return (
    <div className="app-chrome contents">
      {/* Overlay tone matches the Radix dialog primitive's (`bg-app-ink/60`) so
          the app's two modal treatments read as one. The SHELL stays hand-rolled
          on purpose — swapping in Radix Dialog would add a focus trap + body
          scroll lock, i.e. a behavior change (phase 7 note). */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-ink/60 px-4">
        <div
          data-testid="publish-confirm-card"
          className="relative w-full max-w-[380px] rounded-app-panel border border-app-border-hairline bg-white shadow-app-popover"
        >
        {loading ? (
          /* ── t17 · B — publishing ─────────────────────────────────────── */
          <div
            data-testid="publish-publishing-card"
            className="flex flex-col items-center px-5 py-[34px] text-center"
          >
            <Spinner size={40} label="Publishing" />
            <p className="mt-4 text-[14px] font-semibold text-app-ink">Publishing your changes…</p>
            <p className="mt-1 text-[11.5px] font-normal text-app-muted">
              Usually takes a few seconds
            </p>
          </div>
        ) : (
          <>
            {/* ── t17 · A — confirm ──────────────────────────────────────── */}
            <div className="flex items-center justify-between border-b border-[#f0f0f3] px-4 py-3">
              <h2 className="text-[14px] font-semibold text-app-ink">Publish changes</h2>
              <button
                type="button"
                onClick={onCancel}
                aria-label="Close"
                className="flex h-6 w-6 items-center justify-center rounded-app-badge text-app-faint transition-colors hover:bg-app-hover hover:text-app-ink"
              >
                <AppIcon name="close" size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 px-4 py-3.5">
              {/* Live-target row */}
              <div className="flex items-center gap-2.5 rounded-[9px] bg-app-surface-alt px-3 py-2.5">
                <AppIcon name="public" size={18} className="text-app-faint" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-semibold text-app-ink">{liveTarget}</p>
                  <p className="text-[10.5px] font-normal text-app-faint">Live target</p>
                </div>
                <button
                  type="button"
                  onClick={() => slugInputRef.current?.focus()}
                  className="flex-none text-[11.5px] font-semibold text-app-primary hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Soft Review nudge — never a gate */}
              {!allComplete && (
                <div
                  data-testid="publish-review-nudge"
                  className="flex items-center gap-2 rounded-[9px] border border-app-nudge-border bg-app-nudge-bg px-3 py-2.5"
                >
                  <AppIcon name="flag" size={16} className="text-app-cta" />
                  <p className="min-w-0 flex-1 text-[11px] font-medium text-app-nudge-text">
                    {remainingCount} setup {remainingCount === 1 ? 'step' : 'steps'} left — you can
                    publish anyway.
                  </p>
                  {onReview && (
                    <button
                      type="button"
                      onClick={onReview}
                      className="flex-none text-[11px] font-semibold text-app-review-text hover:underline"
                    >
                      Review
                    </button>
                  )}
                </div>
              )}

              {/* Changing an existing URL is destructive — keep warning it. */}
              {isChangingSlug && existingPublished && (
                <div className="rounded-[9px] border border-app-nudge-border bg-app-nudge-bg px-3 py-2.5">
                  <p className="text-[11.5px] font-semibold text-app-nudge-text">
                    Changing your URL
                  </p>
                  <p className="mt-0.5 text-[11px] font-normal text-app-nudge-text">
                    {existingPublished.slug}.lessgo.site will stop working and any links you&apos;ve
                    shared will break.
                  </p>
                </div>
              )}

              {/* URL field */}
              <div>
                <label
                  htmlFor="publish-slug"
                  className="mb-1.5 block text-[11.5px] font-semibold text-app-label"
                >
                  Page URL
                </label>
                <div className="flex items-center gap-1">
                  <span className="flex-none font-app-mono text-[11.5px] text-app-faint">
                    https://
                  </span>
                  <input
                    id="publish-slug"
                    ref={slugInputRef}
                    data-testid="publish-slug-input"
                    className={`${FIELD_CLASS} min-w-0 flex-1 font-app-mono`}
                    value={slug}
                    onChange={(e) =>
                      // Keep a trailing hyphen while typing — the old `-+$` strip ran
                      // on every keystroke, so an internal hyphen could never be typed
                      // ("aureon-audio" collapsed to "aureonaudio", QA vestria K4).
                      // The final trim happens on Publish (onConfirm below).
                      onChange(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]+/g, '-')
                          .replace(/-{2,}/g, '-')
                          .replace(/^-+/, '')
                      )
                    }
                  />
                  <span className="flex-none font-app-mono text-[11.5px] text-app-faint">
                    .lessgo.site
                  </span>
                </div>
              </div>

              {/* Title field */}
              <div>
                <label
                  htmlFor="publish-title"
                  className="mb-1.5 block text-[11.5px] font-semibold text-app-label"
                >
                  Page title
                </label>
                <input
                  id="publish-title"
                  data-testid="publish-title-input"
                  className={FIELD_CLASS}
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  maxLength={100}
                  placeholder="e.g., Design Tools for Social Media Marketers"
                />
                <p
                  className={`mt-1 font-app-mono text-[10.5px] ${
                    title.length > 60 ? 'text-app-review-text' : 'text-app-faint'
                  }`}
                >
                  {title.length} / 60
                </p>
              </div>

              {/* Analytics opt-in */}
              <label className="flex cursor-pointer items-start gap-2.5 rounded-[9px] bg-app-surface-alt px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={analyticsEnabled || false}
                  onChange={(e) => onAnalyticsChange?.(e.target.checked)}
                  className="mt-[3px] h-3.5 w-3.5 flex-none accent-app-primary"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] font-semibold text-app-ink">
                    Enable analytics tracking
                  </span>
                  <span className="mt-0.5 block text-[11px] font-normal text-app-muted">
                    Pageviews, CTA clicks and form submissions. No personal data collected.
                  </span>
                </span>
              </label>

              {error && (
                <p data-testid="publish-error" className="text-[11.5px] font-medium text-app-danger">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 border-t border-[#f0f0f3] px-4 py-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-none rounded-[9px] border border-app-border-hairline bg-white px-3.5 py-2 text-[12.5px] font-semibold text-app-ink transition-colors hover:bg-app-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                // UNCHANGED submit gate. The Review nudge above never contributes
                // to it — an empty slug simply has nothing to publish to.
                disabled={loading || !slug.replace(/^-+|-+$/g, '')}
                className="flex-1 rounded-[9px] bg-app-primary px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-app-btn-publish transition-colors hover:bg-app-primary-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                Publish now
              </button>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
