"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * slug-input — two shapes of the same handoff idea: a slug rendered in mono
 * INSIDE the field rather than on a separate line.
 *
 *  • `SlugInput` (t12) — NAME text input with a live, READ-ONLY mono slug
 *    suffix ("/products") sitting inside the same bordered box. The suffix is
 *    derived by the caller (`src/modules/cms/slug.ts` is the one slugify
 *    authority — this control must not grow a second one).
 *
 *  • `EditableSlugInput` (t19) — the permalink line: a read-only mono prefix
 *    ("/products/") followed by an EDITABLE mono slug segment. Editing it is
 *    what sets `slugLocked` on the item (phase 4 plumbing) — that flag is the
 *    caller's to send; this control only reports the new segment.
 *
 * APP-CHROME ONLY — never import from `src/modules/templates/**`,
 * `src/modules/generatedLanding/**`, or `src/components/published/**`.
 */

const BOX =
  "flex h-10 w-full items-center rounded-app-input border border-app-border-input bg-app-surface px-3 font-app-sans transition-colors focus-within:border-app-primary focus-within:bg-white"

export interface SlugInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  /** The NAME the user types. */
  value: string
  onValueChange: (value: string) => void
  /** Derived slug shown in mono inside the field, e.g. "products". */
  slug: string
  /** Rendered before the slug. Default "/". */
  slugPrefix?: string
}

const SlugInput = React.forwardRef<HTMLInputElement, SlugInputProps>(
  ({ value, onValueChange, slug, slugPrefix = "/", className, disabled, ...props }, ref) => {
    return (
      <div className={cn(BOX, disabled && "cursor-not-allowed opacity-50", className)}>
        <input
          {...props}
          ref={ref}
          type="text"
          value={value}
          disabled={disabled}
          data-slug-name=""
          onChange={(e) => onValueChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-app-ink outline-none placeholder:text-app-placeholder disabled:cursor-not-allowed"
        />
        {slug ? (
          <span
            data-slug-suffix=""
            aria-hidden="true"
            className="ml-2 flex-none truncate font-app-mono text-xs text-app-dim"
          >
            {slugPrefix}
            {slug}
          </span>
        ) : null}
      </div>
    )
  }
)
SlugInput.displayName = "SlugInput"

export interface EditableSlugInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  /** Read-only leading path, e.g. "/books/". */
  prefix: string
  /** The editable slug segment. */
  value: string
  onValueChange: (value: string) => void
}

const EditableSlugInput = React.forwardRef<HTMLInputElement, EditableSlugInputProps>(
  ({ prefix, value, onValueChange, className, disabled, ...props }, ref) => {
    return (
      <div className={cn(BOX, disabled && "cursor-not-allowed opacity-50", className)}>
        <span
          data-slug-prefix=""
          className="flex-none font-app-mono text-xs text-app-dim"
        >
          {prefix}
        </span>
        <input
          {...props}
          ref={ref}
          type="text"
          value={value}
          disabled={disabled}
          data-slug-segment=""
          onChange={(e) => onValueChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent py-2 font-app-mono text-xs text-app-ink outline-none placeholder:text-app-placeholder disabled:cursor-not-allowed"
        />
      </div>
    )
  }
)
EditableSlugInput.displayName = "EditableSlugInput"

export { SlugInput, EditableSlugInput }
