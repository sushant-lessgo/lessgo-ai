"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * DateField — the CMS `date` field type (spec type #8).
 *
 * A native `<input type="date">` styled onto the app-chrome input tokens. No
 * new dependency and no custom calendar: the native picker is keyboard- and
 * screen-reader-complete on every target browser, and its value is already the
 * ISO `YYYY-MM-DD` string the collection schema stores.
 *
 * Value contract: ISO `YYYY-MM-DD`, or `""` for empty. `onValueChange` emits
 * exactly what the input holds — clearing the field emits `""`, which the item
 * editor turns into the explicit-null clear (phase 1 carry: a field cannot be
 * cleared by omission).
 *
 * APP-CHROME ONLY — never import from `src/modules/templates/**`,
 * `src/modules/generatedLanding/**`, or `src/components/published/**`.
 */
export interface DateFieldProps
  extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  value?: string
  onValueChange?: (value: string) => void
}

const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  ({ className, value, onValueChange, onBlur, ...props }, ref) => {
    return (
      <input
        {...props}
        ref={ref}
        type="date"
        value={value ?? ""}
        onChange={(e) => onValueChange?.(e.target.value)}
        onBlur={onBlur}
        className={cn(
          "flex h-10 w-full rounded-app-input border border-app-border-input bg-app-surface px-3 py-2 text-sm font-app-sans text-app-ink transition-colors placeholder:text-app-placeholder focus-visible:border-app-primary focus-visible:bg-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          // the native indicator is the only affordance, so keep it visible + clickable
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100",
          className
        )}
      />
    )
  }
)
DateField.displayName = "DateField"

export { DateField }
