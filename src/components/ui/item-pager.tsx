"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { AppIcon } from "./icon"

/**
 * ItemPager — t19's "Item 3 of 24" strip with prev/next.
 *
 * Controlled: `index` is ZERO-BASED, the label is one-based. Emitting the
 * absolute target index (not a delta) keeps the caller's bounds logic single —
 * the caller never has to re-derive where a `+1` landed.
 *
 * Bounds are enforced HERE, natively (`disabled`), and again in the handler:
 * a disabled button that still fires on a synthetic click would let the item
 * editor navigate to item -1.
 *
 * Left/Right arrows on the strip move too — the pager is a small target and
 * this is the cheap keyboard win.
 *
 * APP-CHROME ONLY — never import from `src/modules/templates/**`,
 * `src/modules/generatedLanding/**`, or `src/components/published/**`.
 */
export interface ItemPagerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Zero-based current index. */
  index: number
  /** Total item count. */
  total: number
  /** Emits the new ZERO-BASED index. */
  onIndexChange: (nextIndex: number) => void
  /** Singular noun in the label, e.g. "Item". */
  noun?: string
}

const ItemPager = React.forwardRef<HTMLDivElement, ItemPagerProps>(
  ({ index, total, onIndexChange, noun = "Item", className, ...props }, ref) => {
    const canPrev = total > 0 && index > 0
    const canNext = total > 0 && index < total - 1

    const go = (next: number) => {
      if (next < 0 || next > total - 1) return
      if (next === index) return
      onIndexChange(next)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        go(index - 1)
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        go(index + 1)
      }
    }

    return (
      <div
        ref={ref}
        role="group"
        aria-label={`${noun} navigation`}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex items-center justify-between gap-2 rounded-app-ctl bg-app-surface-alt px-2 py-1 font-app-sans",
          className
        )}
        {...props}
      >
        <button
          type="button"
          data-pager-prev=""
          aria-label={`Previous ${noun.toLowerCase()}`}
          disabled={!canPrev}
          onClick={() => go(index - 1)}
          className="flex h-7 w-7 flex-none items-center justify-center rounded-app-ctl-sm text-app-icon-muted hover:bg-app-hover hover:text-app-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/40 disabled:pointer-events-none disabled:opacity-40"
        >
          <AppIcon name="chevron_left" size={18} />
        </button>

        <span
          data-pager-label=""
          aria-live="polite"
          className="truncate text-xs font-semibold text-app-muted"
        >
          {total > 0 ? `${noun} ${index + 1} of ${total}` : `No ${noun.toLowerCase()}s`}
        </span>

        <button
          type="button"
          data-pager-next=""
          aria-label={`Next ${noun.toLowerCase()}`}
          disabled={!canNext}
          onClick={() => go(index + 1)}
          className="flex h-7 w-7 flex-none items-center justify-center rounded-app-ctl-sm text-app-icon-muted hover:bg-app-hover hover:text-app-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/40 disabled:pointer-events-none disabled:opacity-40"
        >
          <AppIcon name="chevron_right" size={18} />
        </button>
      </div>
    )
  }
)
ItemPager.displayName = "ItemPager"

export { ItemPager }
