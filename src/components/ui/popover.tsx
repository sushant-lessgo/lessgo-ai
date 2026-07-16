"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

/**
 * popover.tsx — Radix popover shell.
 *
 * TWO LAYERS live here, deliberately:
 *
 *  1. STOCK (Popover / PopoverTrigger / PopoverContent / PopoverAnchor) —
 *     pre-existing shadcn surface with live consumers (LinkTargetPopover, the 3
 *     theme popovers). LEFT UNTOUCHED by editor-shell-redesign phase 1: reskinning
 *     it in place would silently restyle LinkTargetPopover, which is out of scope.
 *
 *  2. APP-CHROME (AppPopover*) — the app-chrome popover primitive added by
 *     editor-shell-redesign phase 1. THE one popover for app chrome: t1 app menu,
 *     t1 Settings menu, t14 Design menu, t18 ⋯ menu, t17 confirm, theme popovers.
 *     Do NOT improvise a second one.
 *
 * Two app-chrome surfaces (scout §H):
 *   - <AppPopoverMenu>  — menu LIST (w 216–224, radius 12, shadow app-menu, pad 6)
 *                         + AppPopoverItem / AppPopoverLabel / AppPopoverSeparator.
 *   - <AppPopoverPanel> — PANEL (radius 14, deeper shadow) for t14/t17/t18 content.
 *
 * Both render through a Radix portal (outside any `.app-chrome` ancestor), so they
 * carry `font-app-sans` + `app-*` utilities explicitly — same rule as dialog/select.
 * See src/components/ui/README.md.
 *
 * APP-CHROME ONLY — never import the App* parts from templates / published renderers.
 */

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

/** STOCK surface — pre-existing consumers depend on this exact styling. Do not restyle. */
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

/* ========================================================================== */
/* App-chrome surfaces (editor-shell-redesign phase 1)                         */
/* ========================================================================== */

const appMotionClasses =
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]"

export interface AppPopoverMenuProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  /** Menu width in px. Handoff uses 216 (app menu) / 224 (Settings) / 194 (t18 ⋯). */
  width?: number
}

/**
 * Menu LIST surface — t1 app menu, t1 Settings menu, t18 ⋯ menu.
 * Compose rows with AppPopoverItem / AppPopoverLabel / AppPopoverSeparator.
 */
const AppPopoverMenu = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  AppPopoverMenuProps
>(({ className, align = "start", sideOffset = 6, width = 216, style, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      style={{ width, ...style }}
      className={cn(
        "z-50 rounded-app-input border border-app-border bg-app-surface p-1.5 font-app-sans text-app-ink shadow-app-menu outline-none",
        appMotionClasses,
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
AppPopoverMenu.displayName = "AppPopoverMenu"

export interface AppPopoverPanelProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  /** Panel width in px. Handoff: 288 (t14), 314/300/322 (t17), 344 (t18 panel). */
  width?: number
}

/**
 * PANEL surface — t14 Design menu, t17 confirm/publishing/live cards, t18 panel.
 * Unpadded on purpose: panels have their own header/body/footer rhythm.
 */
const AppPopoverPanel = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  AppPopoverPanelProps
>(({ className, align = "start", sideOffset = 6, width = 288, style, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      style={{ width, ...style }}
      className={cn(
        "z-50 overflow-hidden rounded-app-panel border border-app-border bg-app-surface font-app-sans text-app-ink shadow-app-popover outline-none",
        appMotionClasses,
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
AppPopoverPanel.displayName = "AppPopoverPanel"

export interface AppPopoverItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Active/selected row: tint-soft bg + primary-deep 600 text. */
  active?: boolean
  /** Material Symbols ligature name for the leading icon slot. */
  icon?: React.ReactNode
  /** Right-aligned slot (e.g. the Languages mono count `2`). */
  trailing?: React.ReactNode
  /** Destructive row (t18 Delete). */
  destructive?: boolean
}

/**
 * Menu row. Behavior comes from the consumer (`onClick`) — this is a styled slot.
 * For a greyed row, apply the `.app-coming` recipe (README §coming) — never
 * hand-roll a disabled style.
 */
const AppPopoverItem = React.forwardRef<HTMLButtonElement, AppPopoverItemProps>(
  ({ className, active, icon, trailing, destructive, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-active={active ? "" : undefined}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-app-badge px-2.5 py-[7px] text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/40",
        destructive
          ? "text-app-delete hover:bg-app-delete-bg"
          : active
            ? "bg-app-tint-soft font-semibold text-app-primary-deep [&_.app-icon]:text-app-primary"
            : "text-app-label hover:bg-app-hairline [&_.app-icon]:text-app-icon-muted",
        className
      )}
      {...props}
    >
      {icon ? <span className="flex-none">{icon}</span> : null}
      <span className="flex-1 truncate">{children}</span>
      {trailing ? <span className="flex-none">{trailing}</span> : null}
    </button>
  )
)
AppPopoverItem.displayName = "AppPopoverItem"

/** Eyebrow label — `SITE SETTINGS`, `TEMPLATE`, `STYLE`, `ACCENT` (700/10.5, .09em). */
const AppPopoverLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-2.5 pb-1 pt-1.5 text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint",
      className
    )}
    {...props}
  />
))
AppPopoverLabel.displayName = "AppPopoverLabel"

/** Row divider (`#f0f0f3` → app-divider). */
const AppPopoverSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    className={cn("-mx-1.5 my-1 h-px bg-app-divider", className)}
    {...props}
  />
))
AppPopoverSeparator.displayName = "AppPopoverSeparator"

export {
  // stock (pre-existing consumers)
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  // app-chrome (editor-shell-redesign)
  AppPopoverMenu,
  AppPopoverPanel,
  AppPopoverItem,
  AppPopoverLabel,
  AppPopoverSeparator,
}
