import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * ImagePlaceholder — app-chrome "image goes here" region (ui-foundation).
 *
 * A diagonally-striped box (`bg-app-stripes`) matching the handoff's universal
 * media placeholder. Presentational only (no hooks) — safe as a server
 * component. Pass `aspect` (CSS aspect-ratio, e.g. "16 / 9") or size via
 * className; `rounded` overrides the default `rounded-app-card`.
 *
 * APP-CHROME ONLY — never import from `src/modules/templates/**` or
 * `src/components/published/**` (templates ship their own media placeholders).
 */
export interface ImagePlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** CSS aspect-ratio value, e.g. "16 / 9" or "1 / 1". */
  aspect?: string
  /** Tailwind radius class; defaults to `rounded-app-card`. */
  rounded?: string
}

const ImagePlaceholder = React.forwardRef<HTMLDivElement, ImagePlaceholderProps>(
  ({ aspect, rounded = "rounded-app-card", className, style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden={children ? undefined : true}
        className={cn(
          "flex items-center justify-center border border-app-border bg-app-stripes text-app-placeholder",
          rounded,
          className
        )}
        style={{ aspectRatio: aspect, ...style }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ImagePlaceholder.displayName = "ImagePlaceholder"

export { ImagePlaceholder }
