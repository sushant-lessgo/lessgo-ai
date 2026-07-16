import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-app-badge border px-2.5 py-0.5 text-xs font-app-sans font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-app-primary/40",
  {
    variants: {
      variant: {
        // existing keys (restyled onto app-* tokens — keys unchanged)
        default:
          "border-transparent bg-app-primary text-white hover:bg-app-primary-hover",
        secondary:
          "border-transparent bg-app-tint text-app-primary-deep",
        destructive:
          "border-transparent bg-app-danger text-white",
        outline: "border-app-border text-app-ink",
        // added handoff variants
        status:
          "rounded-app-pill border-transparent bg-app-canvas text-app-muted",
        mono:
          "border-transparent bg-app-ink text-white font-app-mono uppercase tracking-wide",
        postBeta:
          "rounded-app-pill border-[#ecdcc2] bg-[#f1e6d8] text-[#9a6a1f] font-app-mono uppercase tracking-wide",
        magic:
          "rounded-app-pill border-transparent bg-app-cta text-white",
        success:
          "rounded-app-pill border-transparent bg-app-success-bg text-app-success",
        danger:
          "rounded-app-pill border-transparent bg-app-danger-bg text-app-danger",
        saved:
          "border-transparent bg-transparent px-0 text-app-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }