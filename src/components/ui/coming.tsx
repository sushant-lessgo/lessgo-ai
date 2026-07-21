"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { AppTooltip } from "./tooltip"

/**
 * coming.tsx — THE one "not yet wired" (greyed) control. Decisions 2 + 15.
 *
 * WHY A COMPONENT AND NOT JUST THE CLASS:
 * phase 1 shipped `.app-coming` (src/styles/app-chrome.css) plus a documented
 * THREE-PART recipe — class + `aria-disabled="true"` + a "Coming soon — <what>"
 * tooltip. A recipe is convention, and convention gets two-thirds-applied: drop
 * the tooltip and the user gets a dead grey control with no explanation; drop
 * `aria-disabled` and screen readers announce it as actionable. Phase 1's own
 * audit flagged this (deviation 2). Orchestrator ruling: wrap the recipe so
 * consumers CANNOT get it wrong.
 *
 * Phases 3-8: use <Coming>, never the bare `.app-coming` class.
 *
 *   <Coming what="page CMS"><span>CMS</span></Coming>
 *   → greyed, aria-disabled, click/keyboard inert, tooltip "Coming soon — page CMS"
 *
 * NEVER grey something that works today (decision 10 — `Social & sharing` is
 * wired; also Design, SEO, Languages, undo/redo, Edit/Preview, Publish, Back to
 * dashboard, Help & support, page switcher, mobile panel toggle, UserButton).
 * This component is for controls the handoff draws but nothing implements —
 * "render greyed, never omitted".
 *
 * Two corrections to that list (language-settings phase 2): `Domain` has NO
 * entry point in the editor and IS greyed (SeoSettingsModal's rail row).
 * `Languages` is wired — the rail row and the LanguagesPanel work — but two
 * controls INSIDE that panel are greyed here: Auto-translate (nothing translates
 * anything until Spec 2; the designer's mock draws it live and ON) and the
 * change-site-language affordance on the default-locale card.
 */

export interface ComingProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /**
   * WHAT is coming — the tooltip reads "Coming soon — {what}". Required: an
   * unexplained grey control is the failure mode this component exists to
   * prevent. Lowercase noun phrase, e.g. "page CMS", "site duplication".
   */
  what: string
  /** Which side the tooltip opens on. */
  side?: React.ComponentProps<typeof AppTooltip>["side"]
  /** The greyed control's contents (label, icon, whatever the handoff draws). */
  children: React.ReactNode
}

/**
 * Renders its children inside an inert, greyed, tooltipped wrapper.
 *
 * Deliberately a `<span>` and NOT a `<button>`:
 *  - `disabled` on a real button swallows the pointer events the tooltip needs,
 *    so the "why" affordance would never show — hence `aria-disabled`, per the
 *    phase-1 recipe.
 *  - A non-button also can't be submitted, focused into a form flow, or
 *    accidentally wired to an onClick later without someone noticing.
 * The wrapper is `inline-flex` so it drops into the t1 bar / rail rows / menu
 * lists without disturbing their flex layout.
 */
export function Coming({ what, side = "bottom", className, children, ...props }: ComingProps) {
  return (
    <AppTooltip label={`Coming soon — ${what}`} side={side}>
      <span
        {...props}
        // Not `disabled` — see the note above. This is the whole reason the
        // 3-part recipe exists, now enforced in one place.
        aria-disabled="true"
        // Unreachable by keyboard: it does nothing, so it must not be a tab stop.
        tabIndex={-1}
        className={cn("app-coming inline-flex items-center gap-1.5 select-none", className)}
        // Belt-and-braces: even if a consumer nests something clickable, the
        // gesture dies here rather than firing a half-wired handler.
        onClickCapture={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {children}
      </span>
    </AppTooltip>
  )
}
Coming.displayName = "Coming"
