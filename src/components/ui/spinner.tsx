"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Spinner — app-chrome ring spinner (editor-shell-redesign phase 1).
 *
 * Handoff t17 state B: 40px ring, 3px `#e6eefc` track with an `app-primary` top
 * edge, spinning at `.8s linear infinite` (`animate-app-spin` — stock
 * `animate-spin` is 1s, so it is NOT a substitute).
 *
 * Presentation only; the consumer owns when it renders.
 * APP-CHROME ONLY — never import from templates / published renderers.
 *
 *   <Spinner size={40} />                       // t17 publishing card
 *   <Spinner size={16} thickness={2} />         // inline in a button
 */

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Outer diameter in px. Handoff t17 state B = 40. */
  size?: number
  /** Ring thickness in px. Handoff = 3. */
  thickness?: number
  /** Accessible label; omit for a purely decorative spinner beside its own text. */
  label?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 40, thickness = 3, label, style, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "inline-block flex-none animate-app-spin rounded-full border-app-tint-ring border-t-app-primary",
        // Respect reduced-motion: keep the ring, drop the rotation.
        "motion-reduce:animate-none",
        className
      )}
      style={{
        width: size,
        height: size,
        borderWidth: thickness,
        borderStyle: "solid",
        ...style,
      }}
      {...props}
    />
  )
)
Spinner.displayName = "Spinner"

export { Spinner }
