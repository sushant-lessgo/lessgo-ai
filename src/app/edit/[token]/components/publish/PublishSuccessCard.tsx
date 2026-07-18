// /app/edit/[token]/components/publish/PublishSuccessCard.tsx
"use client";

import React from 'react';
import { AppIcon } from '@/components/ui/icon';
import { Coming } from '@/components/ui/coming';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * "You're live!" success card — lifted VERBATIM from the old preview page's inline
 * success JSX (t17 · C). Prop-driven: depends only on `publishedUrl`,
 * `existingPublished` (domain-upsell precondition) and two setters. Shared by both
 * publish surfaces so the success UX can never diverge. Layout/CSS unchanged.
 */

interface PublishSuccessCardProps {
  publishedUrl: string;
  existingPublished: { slug: string } | null;
  onClose: () => void;
  /** Close the card + open the custom-domain modal (same handoff the preview action bar used). */
  onConnectDomain: () => void;
}

export function PublishSuccessCard({
  publishedUrl,
  existingPublished,
  onClose,
  onConnectDomain,
}: PublishSuccessCardProps) {
  return (
    <div className="app-chrome contents">
      {/* Same overlay tone as the Radix dialog primitive + SlugModal — see the
          note there; the hand-rolled shell is deliberate. */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-ink/60 px-4">
        <div
          data-testid="publish-live-card"
          className="relative w-full max-w-[322px] rounded-app-panel border border-app-border-hairline bg-white shadow-app-popover"
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-app-badge text-app-faint transition-colors hover:bg-app-hover hover:text-app-ink"
          >
            <AppIcon name="close" size={18} />
          </button>

          <div className="flex flex-col items-center px-5 pb-4 pt-7 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-success-bg">
              <AppIcon name="check" filled size={26} className="text-app-success" />
            </div>
            <h2 className="mt-3.5 text-[18px] font-bold tracking-[-.3px] text-app-ink">
              You&apos;re live!
            </h2>
            <p className="mt-1 text-[12px] font-normal text-app-muted">
              Your changes are now public.
            </p>

            {/* URL row */}
            <div className="mt-4 flex w-full items-center gap-2 rounded-[10px] border border-app-border-hairline px-2.5 py-2">
              <AppIcon name="lock" size={15} className="flex-none text-app-success" />
              <span
                data-testid="publish-live-url"
                className="min-w-0 flex-1 truncate text-left font-app-mono text-[12px] font-medium text-app-ink"
              >
                {publishedUrl}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(publishedUrl)}
                aria-label="Copy link"
                className="flex h-6 w-6 flex-none items-center justify-center rounded-app-badge text-app-faint transition-colors hover:bg-app-hover hover:text-app-ink"
              >
                <AppIcon name="content_copy" size={15} />
              </button>
            </div>

            {/* Actions */}
            <div className="mt-3 flex w-full items-center gap-2">
              {/* Decision 17: `Coming` renders its OWN inline-flex span, so the
                  row geometry must go on IT via className — putting these classes
                  on a child leaves the wrapper unsized (a live probe measured the
                  child pattern at 80px/19.2px instead of a flex-1 12.5px button). */}
              <Coming
                what="one-click sharing"
                side="top"
                className="flex-1 justify-center rounded-[9px] border border-app-border-hairline px-3.5 py-2 text-[12.5px] font-semibold"
              >
                <AppIcon name="share" size={15} />
                Share
              </Coming>
              <a
                href={publishedUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-app-primary px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-app-btn-publish transition-colors hover:bg-app-primary-hover"
              >
                <span>View site</span>
                <AppIcon name="open_in_new" size={15} />
              </a>
            </div>

            <p className="mt-3 text-[10.5px] font-normal text-app-faint">
              Version saved · restore anytime
            </p>
          </div>

          {/* Domain upsell → the EXISTING custom-domain path (same setter the
              action bar's Custom Domain button uses). CustomDomainModal only
              renders for an already-published slug, so this row carries the
              same precondition + tooltip the action-bar button already has —
              it is a real, wired control, not a `Coming` stub. */}
          <div className="px-4 pb-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <button
                      onClick={onConnectDomain}
                      disabled={!existingPublished?.slug}
                      className="flex w-full items-center gap-2 rounded-[9px] border border-app-tint-edge bg-app-tint-soft px-3 py-2.5 text-[11.5px] font-semibold text-app-primary-deep transition-colors hover:brightness-[.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="min-w-0 flex-1 truncate text-left">
                        Connect your own domain
                      </span>
                      <AppIcon name="arrow_forward" size={15} className="flex-none" />
                    </button>
                  </div>
                </TooltipTrigger>
                {!existingPublished?.slug && (
                  <TooltipContent side="top">
                    <p>Reopen preview after publishing to attach a custom domain</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
