// /app/edit/[token]/components/layout/EditHeaderRightPanel.tsx
"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';
import { UndoRedoButtons } from '../ui/UndoRedoButtons';
import { ResetButton } from '../ui/ResetButton';
import { DeviceToggle } from '../ui/DeviceToggle';
import { usePublishFlow } from '../publish/usePublishFlow';
import { PublishSuccessCard } from '../publish/PublishSuccessCard';
import { SlugModal } from '@/components/SlugModal';
import CustomDomainModal from '@/components/CustomDomainModal';
import { AppIcon } from '@/components/ui/icon';
import { Coming } from '@/components/ui/coming';

interface EditHeaderRightPanelProps {
  tokenId: string;
}

function RegenCopyConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  // Kept as a plain conditional overlay (not the Radix Dialog primitive): this
  // modal is rendered from inside the bar and driven by local `showConfirm`
  // state, and swapping the mount model would change focus/scroll behavior —
  // beyond the presentation line. Restyled to the app-chrome card language.
  //
  // No `.app-chrome` class here: `fixed` moves the box, not the DOM position, so
  // this subtree still sits inside the bar's `.app-chrome` wrapper and inherits
  // the app font. Adding the class would also override the scrim/card background
  // (app-chrome.css loads after globals.css → it beats a co-located `bg-*`).
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-app-panel border border-app-border-hairline bg-app-surface shadow-app-popover">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex-none">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-app-nudge-bg">
                <AppIcon name="info" size={22} className="text-app-review-text" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-[15px] font-semibold text-app-ink">
                Regenerate All Copy
              </h3>
              <p className="mb-4 text-[13px] text-app-muted">
                This will regenerate all page copy using the same inputs and strategy. Your text edits will be lost.
              </p>
              <button
                onClick={onConfirm}
                className="w-full rounded-app-row border border-app-nudge-border bg-app-nudge-bg px-4 py-3 text-left transition-colors hover:bg-app-review-bg"
              >
                <div className="text-[13px] font-semibold text-app-nudge-text">Regenerate Copy</div>
                <div className="text-[12px] text-app-nudge-text/80">All section text will be rewritten</div>
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end border-t border-app-divider bg-app-canvas px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-app-badge px-4 py-2 text-[13px] font-medium text-app-label transition-colors hover:bg-app-hairline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditHeaderRightPanel({ tokenId }: EditHeaderRightPanelProps) {
  // Render-read: aiGeneration (spinner/progress/toast), sections (total count),
  // activeLocale + localeConfig (regen-lock). regenerateAllContent is handler-only.
  const { aiGeneration, sections, activeLocale, localeConfig } = useEditStore(
    useShallow((s) => ({
      aiGeneration: s.aiGeneration,
      sections: s.sections,
      activeLocale: s.activeLocale,
      localeConfig: s.localeConfig,
    })),
  );
  // Edit/Preview segmented control drives the real editor mode. Single-scalar
  // selector (no whole-store subscription); setMode via the store API.
  const mode = useEditStore((s) => s.mode);
  const storeApi = useEditStoreApi();
  const [showConfirm, setShowConfirm] = useState(false);
  // editor-route-consolidation phase 6: the Publish split-button now runs the REAL
  // publish flow IN-PLACE (SlugModal → /api/publish → success card → domain upsell)
  // via the SHARED `usePublishFlow` hook — the exact same implementation `/preview`
  // uses, so the two surfaces can never diverge. No more hop to `/preview`; the old
  // tab-manager preview-navigation hook is retired. The dropdown half stays greyed:
  // the handoff never defines its contents.
  const publish = usePublishFlow(tokenId);

  const isGenerating = aiGeneration?.isGenerating ?? false;
  // i18n-phase-1 (Phase 4): regen only writes the DEFAULT-locale base copy
  // (store guard no-ops it elsewhere). Disable the entry point on a non-default
  // locale so the author isn't offered a silent no-op.
  const regenLocaleLocked =
    !!localeConfig && activeLocale !== localeConfig.defaultLocale;
  const progress = aiGeneration?.progress ?? 0;
  const totalSections = sections?.length ?? 0;
  const completedSections = Math.round((progress / 100) * totalSections);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const prevGenerating = useRef(isGenerating);

  // Detect regen completion → show toast
  useEffect(() => {
    if (prevGenerating.current && !isGenerating) {
      const hasErrors = (aiGeneration?.errors?.length ?? 0) > 0;
      setToast({
        type: hasErrors ? 'error' : 'success',
        message: hasErrors ? 'Some sections failed to regenerate' : 'Copy regenerated',
      });
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
    prevGenerating.current = isGenerating;
  }, [isGenerating, aiGeneration?.errors]);

  const handleRegenConfirm = useCallback(async () => {
    setShowConfirm(false);
    try {
      await storeApi.getState().regenerateAllContent();
    } catch {
      // Error handled by store
    }
  }, [storeApi]);

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Regen Copy. t1 does not draw this control, but it works today — so it
            is reskinned in place, not dropped. Handler/disabled/title verbatim. */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isGenerating || regenLocaleLocked}
          className={`inline-flex items-center gap-1.5 rounded-app-badge px-2.5 py-[7px] text-[13px] font-medium text-app-label transition-colors hover:bg-app-hairline disabled:cursor-not-allowed disabled:opacity-50 ${isGenerating ? 'animate-pulse bg-app-nudge-bg' : ''}`}
          title={regenLocaleLocked ? 'Switch to the default language to regenerate.' : 'Regenerate all page copy'}
        >
          <AppIcon
            name={isGenerating ? 'progress_activity' : 'auto_awesome'}
            size={18}
            className={isGenerating ? 'animate-spin text-app-icon-muted' : 'text-app-icon-muted'}
          />
          <span>{isGenerating
            ? (progress > 0 && totalSections > 0
                ? `Regenerating ${completedSections}/${totalSections}...`
                : 'Regenerating...')
            : 'Regen Copy'}</span>
        </button>

        {/* Not in t1 either; both work today, so both stay. UndoRedoButtons and
            ResetButton are outside this phase's Files touched — they keep their
            current styling, which is a known visual gap for a later sweep. */}
        <UndoRedoButtons />
        <ResetButton />

        {/* Edit / Preview segmented (t1). Real mode toggle: each half calls
            setMode; aria-current follows the live `mode`. setMode('preview')
            already clears selection + hides the toolbar (coreActions). The
            active segment wears the raised chip; the inactive is a ghost. */}
        <div
          role="group"
          aria-label="Edit or preview"
          className="inline-flex flex-none items-center gap-1 rounded-app-ctl-sm bg-app-track p-[3px]"
        >
          <button
            type="button"
            aria-current={mode !== 'preview'}
            onClick={() => storeApi.getState().setMode('edit')}
            className={`inline-flex items-center rounded-[7px] px-3 py-1 text-[13px] font-medium transition-colors ${
              mode !== 'preview'
                ? 'bg-app-surface text-app-ink shadow-app-card'
                : 'text-app-muted hover:text-app-ink'
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            aria-current={mode === 'preview'}
            onClick={() => storeApi.getState().setMode('preview')}
            className={`inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1 text-[13px] font-medium transition-colors ${
              mode === 'preview'
                ? 'bg-app-surface text-app-ink shadow-app-card'
                : 'text-app-muted hover:text-app-ink'
            }`}
            title="Preview your landing page"
          >
            <AppIcon name="visibility" size={16} />
            <span>Preview</span>
          </button>
        </div>

        {/* Device toggle (phase 4) — only in preview mode. Desktop keeps the
            inline canvas; Mobile swaps it for a true-viewport iframe of the
            chromeless sub-route (EditLayout). Absent in edit mode (no device
            switching while editing). */}
        {mode === 'preview' && <DeviceToggle />}

        {/* Publish split-button (t1) — built INLINE here on purpose: single
            consumer, so phase 1 explicitly declined to make it a primitive. */}
        <div className="inline-flex flex-none items-center rounded-app-ctl-sm bg-app-primary shadow-app-btn-publish transition-colors hover:bg-app-primary-hover">
          <button
            type="button"
            data-testid="editor-publish-trigger"
            onClick={publish.openPublish}
            disabled={publish.publishing}
            className="inline-flex items-center gap-1.5 rounded-l-app-ctl-sm py-[7px] pl-2.5 pr-2 text-[13px] font-semibold text-white disabled:cursor-wait disabled:opacity-70"
            title="Publish your page"
          >
            <AppIcon name="rocket_launch" filled size={17} />
            <span>{publish.publishing ? 'Publishing…' : 'Publish'}</span>
          </button>
          {/* hairline, per t1: rgba(255,255,255,.3) 1x16 */}
          <span aria-hidden className="h-4 w-px flex-none bg-white/30" />
          <Coming what="publish options" className="rounded-r-app-ctl-sm py-[7px] pl-1 pr-2">
            <AppIcon name="expand_more" size={17} />
          </Coming>
        </div>
      </div>

      <RegenCopyConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleRegenConfirm}
      />

      {/* Publish flow (phase 6) — the SAME modals/card `/preview` renders, driven by
          the shared usePublishFlow hook. In-editor overlays, no route hop. */}
      {publish.showSlugModal && (
        <SlugModal
          slug={publish.customSlug}
          onChange={publish.setCustomSlug}
          title={publish.publishTitle}
          onTitleChange={publish.setPublishTitle}
          onCancel={() => publish.setShowSlugModal(false)}
          onConfirm={publish.doPublish}
          loading={publish.publishing}
          error={publish.publishError}
          existingPublished={publish.existingPublished}
          analyticsEnabled={publish.analyticsEnabled}
          onAnalyticsChange={publish.setAnalyticsEnabled}
          // t17-A "Review" nudge. Unlike `/preview` (where it navigated back to the
          // editor), we're ALREADY in the editor — so it just closes the dialog and
          // drops into edit mode to fix the flagged guide tasks. Never a gate.
          onReview={() => {
            publish.setShowSlugModal(false);
            storeApi.getState().setMode('edit');
          }}
        />
      )}

      {publish.showDomainModal && publish.existingPublished?.slug && (
        <CustomDomainModal
          slug={publish.existingPublished.slug}
          open={publish.showDomainModal}
          onClose={() => publish.setShowDomainModal(false)}
        />
      )}

      {publish.publishSuccess && (
        <PublishSuccessCard
          publishedUrl={publish.publishedUrl}
          existingPublished={publish.existingPublished}
          onClose={() => publish.setPublishSuccess(false)}
          onConnectDomain={() => {
            publish.setPublishSuccess(false);
            publish.setShowDomainModal(true);
          }}
        />
      )}

      {/* No `.app-chrome` on the toast: `fixed` moves the box, not the DOM
          position — it still renders inside the bar's `.app-chrome` wrapper and
          inherits the app font. Putting the class on it would also override its
          own background (app-chrome.css wins on the same element). */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-app-row border px-4 py-2.5 text-[13px] font-medium shadow-app-float transition-opacity ${
          toast.type === 'success'
            ? 'border-app-success/30 bg-app-success-bg text-app-success'
            : 'border-app-danger/30 bg-app-danger-bg text-app-danger'
        }`}>
          {toast.message}
        </div>
      )}
    </>
  );
}
