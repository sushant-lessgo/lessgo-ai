"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"
import { AppIcon } from "./icon"

/**
 * NavItem — app-chrome sidebar/nav row primitive (ui-foundation).
 *
 * Icon + label row matching the Dashboard nav in the handoff:
 *   active   = text `#003E80` on tint `#e6f0ff` (`text-app-primary-deep bg-app-tint`)
 *   idle     = muted-slate text, hover `bg-app-canvas`
 *
 * `activeBar` (editor-shell-redesign phase 1, scout gap G.6) adds the handoff's
 * left active bar — `box-shadow: inset 2px 0 0 #006CFF` — used by the t1 left rail
 * section rows and the t16 settings left nav. OFF by default: the dashboard nav
 * (the original consumer) has no bar, so existing call sites are unchanged.
 *
 * Polymorphic: pass `href` to render an `<a>`, or `asChild` to merge onto a
 * consumer element (e.g. Next `<Link>`). When `asChild`, the consumer supplies
 * the full inner content (icon + label); otherwise pass `icon`/`label`.
 *
 * APP-CHROME ONLY — never import from `src/modules/templates/**` or
 * `src/components/published/**` (pulls the Material Symbols font via AppIcon).
 */
const navItemClasses = (active?: boolean, activeBar?: boolean) =>
  cn(
    "flex w-full items-center gap-3 rounded-app-ctl px-3 py-2 text-left text-sm font-app-sans font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/40",
    active
      ? "bg-app-tint text-app-primary-deep"
      : "text-app-slate hover:bg-app-canvas hover:text-app-ink",
    // inset 2px 0 0 #006CFF — the handoff's left active bar (t1 rail, t16 nav).
    active && activeBar && "font-semibold shadow-[inset_2px_0_0_#006CFF]"
  )

export interface NavItemProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Render onto the single child element (e.g. a Next `<Link>`) instead of a button/anchor. */
  asChild?: boolean
  /** Active/selected row styling. */
  active?: boolean
  /** Add the `inset 2px 0 0 #006CFF` left active bar (t1 rail / t16 nav). Only renders when `active`. */
  activeBar?: boolean
  /** When set (and not `asChild`), renders an `<a href>`. */
  href?: string
  /** Material Symbols ligature name for the leading icon. */
  icon?: string
  /** Use the filled icon variant. */
  iconFilled?: boolean
  /** Row label (alternative to `children` when not `asChild`). */
  label?: React.ReactNode
}

const NavItem = React.forwardRef<HTMLElement, NavItemProps>(
  (
    { asChild, active, activeBar, href, icon, iconFilled, label, className, children, ...props },
    ref
  ) => {
    const classes = cn(navItemClasses(active, activeBar), className)

    if (asChild) {
      return (
        <Slot ref={ref as React.Ref<HTMLElement>} className={classes} {...props}>
          {children}
        </Slot>
      )
    }

    const Comp = (href ? "a" : "button") as React.ElementType
    const extraProps = href
      ? { href }
      : { type: "button" as const }

    return (
      <Comp
        ref={ref}
        className={classes}
        aria-current={active ? "page" : undefined}
        {...extraProps}
        {...props}
      >
        {icon ? <AppIcon name={icon} filled={iconFilled} size={20} /> : null}
        {label ?? children}
      </Comp>
    )
  }
)
NavItem.displayName = "NavItem"

export { NavItem, navItemClasses }
