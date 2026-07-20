"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { AppIcon } from "./icon"

/**
 * TagInput — the CMS `tags` field type (spec type #9): a `string[]` pill
 * multi-input. Type + Enter (or comma) adds; ✕ or Backspace-on-empty removes.
 *
 * CONTROLLED ONLY: it never holds the tag array itself, so the item editor's
 * save payload and the rendered pills cannot drift. The draft text of the
 * not-yet-committed tag IS local state — that is not part of the value.
 *
 * Duplicates are dropped silently (a tag list is a set); blank/whitespace input
 * is ignored. Escape clears the draft without touching the value.
 *
 * APP-CHROME ONLY — never import from `src/modules/templates/**`,
 * `src/modules/generatedLanding/**`, or `src/components/published/**`.
 */
export interface TagInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value: string[]
  onValueChange: (next: string[]) => void
  placeholder?: string
  disabled?: boolean
  /** Accessible name for the inner text input. */
  inputAriaLabel?: string
}

const TagInput = React.forwardRef<HTMLDivElement, TagInputProps>(
  (
    {
      value,
      onValueChange,
      placeholder = "Add a tag…",
      disabled,
      inputAriaLabel = "Add a tag",
      className,
      ...props
    },
    ref
  ) => {
    const [draft, setDraft] = React.useState("")
    const inputRef = React.useRef<HTMLInputElement>(null)

    const commit = (raw: string) => {
      const tag = raw.trim()
      setDraft("")
      if (!tag) return
      if (value.includes(tag)) return
      onValueChange([...value, tag])
    }

    const removeAt = (index: number) => {
      onValueChange(value.filter((_, i) => i !== index))
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault()
        commit(draft)
      } else if (e.key === "Escape") {
        e.preventDefault()
        setDraft("")
      } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
        e.preventDefault()
        removeAt(value.length - 1)
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full flex-wrap items-center gap-1.5 rounded-app-input border border-app-border-input bg-app-surface px-2 py-1.5 font-app-sans transition-colors focus-within:border-app-primary focus-within:bg-white",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        onClick={() => inputRef.current?.focus()}
        {...props}
      >
        {value.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            data-tag={tag}
            className="inline-flex items-center gap-1 rounded-app-pill bg-app-tint px-2 py-0.5 text-xs font-semibold text-app-primary-deep"
          >
            {tag}
            <button
              type="button"
              data-tag-remove={tag}
              aria-label={`Remove ${tag}`}
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation()
                removeAt(index)
              }}
              className="inline-flex items-center text-app-primary-deep/70 hover:text-app-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/40"
            >
              <AppIcon name="close" size={14} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={draft}
          disabled={disabled}
          aria-label={inputAriaLabel}
          data-tag-draft=""
          placeholder={value.length === 0 ? placeholder : ""}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          // Committing on blur too: an unlabelled leftover draft that silently
          // vanishes on Save is the classic "my last tag didn't save" bug.
          onBlur={() => commit(draft)}
          className="min-w-[6rem] flex-1 bg-transparent px-1 py-0.5 text-sm text-app-ink outline-none placeholder:text-app-placeholder disabled:cursor-not-allowed"
        />
      </div>
    )
  }
)
TagInput.displayName = "TagInput"

export { TagInput }
