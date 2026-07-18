"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { AppIcon } from "./icon"

/**
 * SegmentedControl — app-chrome pill toggle group (ui-foundation).
 *
 * Controlled `value` / `onValueChange` group matching the handoff's link-picker
 * type control: container `bg-app-canvas rounded-app-ctl p-1`, active segment
 * white + `shadow-app-card`. WAI-ARIA radiogroup pattern with roving tabindex +
 * arrow-key navigation (Left/Up = prev, Right/Down = next, Home/End = ends;
 * wraps; skips disabled).
 *
 * APP-CHROME ONLY — never import from `src/modules/templates/**` or
 * `src/components/published/**`.
 */
export interface SegmentedOption {
  value: string
  label: React.ReactNode
  /** Optional leading Material Symbols icon ligature. */
  icon?: string
  disabled?: boolean
}

export interface SegmentedControlProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "role"> {
  value: string
  onValueChange: (value: string) => void
  options: SegmentedOption[]
  "aria-label"?: string
}

const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  ({ value, onValueChange, options, className, ...props }, ref) => {
    const btnRefs = React.useRef<Array<HTMLButtonElement | null>>([])

    const enabledIndexes = options
      .map((o, i) => (o.disabled ? -1 : i))
      .filter((i) => i >= 0)

    const focusAndSelect = (index: number) => {
      const opt = options[index]
      if (!opt || opt.disabled) return
      onValueChange(opt.value)
      btnRefs.current[index]?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
      if (enabledIndexes.length === 0) return
      const pos = enabledIndexes.indexOf(currentIndex)
      let nextPos = pos
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          nextPos = (pos + 1) % enabledIndexes.length
          break
        case "ArrowLeft":
        case "ArrowUp":
          nextPos = (pos - 1 + enabledIndexes.length) % enabledIndexes.length
          break
        case "Home":
          nextPos = 0
          break
        case "End":
          nextPos = enabledIndexes.length - 1
          break
        default:
          return
      }
      e.preventDefault()
      focusAndSelect(enabledIndexes[nextPos])
    }

    return (
      <div
        ref={ref}
        role="radiogroup"
        className={cn(
          "inline-flex items-center gap-1 rounded-app-ctl bg-app-canvas p-1 font-app-sans",
          className
        )}
        {...props}
      >
        {options.map((opt, i) => {
          const selected = opt.value === value
          return (
            <button
              key={opt.value}
              ref={(el) => {
                btnRefs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={opt.disabled}
              tabIndex={selected ? 0 : -1}
              onClick={() => !opt.disabled && onValueChange(opt.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/40 disabled:pointer-events-none disabled:opacity-50",
                selected
                  ? "bg-app-surface text-app-ink shadow-app-card"
                  : "text-app-muted hover:text-app-ink"
              )}
            >
              {opt.icon ? <AppIcon name={opt.icon} size={18} /> : null}
              {opt.label}
            </button>
          )
        })}
      </div>
    )
  }
)
SegmentedControl.displayName = "SegmentedControl"

export { SegmentedControl }
