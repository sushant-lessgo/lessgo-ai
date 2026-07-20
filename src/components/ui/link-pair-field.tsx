"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "./input"

/**
 * LinkPairField — the CMS `link` field type (spec type #7).
 *
 * Ruling #10: the handoff never designed a control for link/button fields, so
 * this invents one on t19's existing side-by-side short-pair pattern: URL +
 * label, two labelled inputs in one row.
 *
 * Value contract mirrors the stored shape `{url, label}` exactly — the item
 * editor hands the stored object straight in and straight out; no adapter, no
 * chance of the pair drifting from the schema.
 *
 * ⚠️ EMPTY → `null` IS THE CALLER'S JOB. Clearing both inputs emits
 * `{url: "", label: ""}` (correct for a controlled input). But `LinkValueSchema`
 * requires `url: z.string().min(1)`, and the item PATCH merge deletes a field
 * ONLY on `v === null` — so PATCHing `{url: "", label: ""}` is a 400, not a
 * clear. The caller MUST map an empty url to `null` before the write.
 *
 * NOTE: no URL validation here. The single sanitization authority for CMS
 * values is `toRenderModel` (`src/modules/cms/render/toRenderModel.ts`) —
 * duplicating a URL predicate in a form control creates a second, drifting
 * source of truth and would reject legitimate `mailto:`/`tel:`/`#` CTAs.
 *
 * APP-CHROME ONLY — never import from `src/modules/templates/**`,
 * `src/modules/generatedLanding/**`, or `src/components/published/**`.
 */
export interface LinkPairValue {
  url: string
  label: string
}

export interface LinkPairFieldProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value: LinkPairValue
  onValueChange: (next: LinkPairValue) => void
  urlPlaceholder?: string
  labelPlaceholder?: string
  urlLabel?: string
  labelLabel?: string
  disabled?: boolean
}

const LinkPairField = React.forwardRef<HTMLDivElement, LinkPairFieldProps>(
  (
    {
      value,
      onValueChange,
      urlPlaceholder = "https://…",
      labelPlaceholder = "Button label",
      urlLabel = "URL",
      labelLabel = "Label",
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn("grid grid-cols-2 gap-2 font-app-sans", className)}
        {...props}
      >
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-app-label">
            {urlLabel}
          </span>
          <Input
            type="text"
            inputMode="url"
            data-link-url=""
            value={value.url}
            disabled={disabled}
            placeholder={urlPlaceholder}
            onChange={(e) => onValueChange({ ...value, url: e.target.value })}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-app-label">
            {labelLabel}
          </span>
          <Input
            type="text"
            data-link-label=""
            value={value.label}
            disabled={disabled}
            placeholder={labelPlaceholder}
            onChange={(e) => onValueChange({ ...value, label: e.target.value })}
          />
        </label>
      </div>
    )
  }
)
LinkPairField.displayName = "LinkPairField"

export { LinkPairField }
