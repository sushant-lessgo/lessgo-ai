"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

/**
 * tooltip.tsx — Radix tooltip.
 *
 * TWO LAYERS, deliberately (same pattern as popover.tsx):
 *
 *  1. STOCK (Tooltip = Radix Root, TooltipTrigger, TooltipContent, TooltipProvider)
 *     — pre-existing consumers: src/app/preview/[token]/page.tsx and
 *     src/modules/Design/ColorSystem/VariableModeIndicators.tsx. LEFT UNTOUCHED by
 *     editor-shell-redesign phase 1: `Tooltip` is the Root here, so redefining it as
 *     a wrapper would break those call sites, and app-chrome styling must not leak
 *     into a modules/Design component.
 *
 *  2. APP-CHROME (AppTooltip / AppTooltipContent) — added by editor-shell-redesign
 *     phase 1. Primary consumer is the `coming` variant (<Coming>), which needs a
 *     "why is this disabled" affordance; also for icon-only t1 bar controls.
 *
 * Portal-rendered (outside any `.app-chrome` ancestor) → the content carries
 * `font-app-sans` + `app-*` utilities explicitly. See src/components/ui/README.md.
 */

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

/* ========================================================================== */
/* App-chrome surface (editor-shell-redesign phase 1)                          */
/* ========================================================================== */

/** App-chrome tooltip bubble — dark ink surface, 11.5px medium. */
const AppTooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-w-[220px] rounded-app-badge bg-app-ink px-2.5 py-1.5 font-app-sans text-[11.5px] font-medium leading-snug text-white shadow-app-menu",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
AppTooltipContent.displayName = "AppTooltipContent"

export interface AppTooltipProps
  extends Pick<
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
    "side" | "align" | "sideOffset"
  > {
  /** Tooltip copy. Falsy → the child renders untooltipped (no wrapper, no DOM). */
  label?: React.ReactNode
  /** Delay before showing, ms. */
  delayDuration?: number
  /** The trigger. Must accept a ref + spread props (Radix `asChild`). */
  children: React.ReactElement
}

/**
 * Convenience wrapper: self-providing Root+Trigger+Content, `asChild` trigger
 * (no extra DOM node). A nested TooltipProvider is safe — the root layout already
 * mounts one; Radix allows nesting.
 *
 *   <AppTooltip label="Coming soon — page CMS"><button>…</button></AppTooltip>
 */
const AppTooltip = ({
  label,
  delayDuration = 250,
  side = "bottom",
  align = "center",
  sideOffset,
  children,
}: AppTooltipProps) => {
  if (!label) return children

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <AppTooltipContent side={side} align={align} sideOffset={sideOffset}>
          {label}
        </AppTooltipContent>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  )
}
AppTooltip.displayName = "AppTooltip"

export {
  // stock (pre-existing consumers)
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  // app-chrome (editor-shell-redesign)
  AppTooltip,
  AppTooltipContent,
}
