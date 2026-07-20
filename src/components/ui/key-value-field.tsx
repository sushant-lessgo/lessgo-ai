"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "./input"

/**
 * KeyValueField — the CMS `stat` field type (the 10th type, added by the
 * 2026-07-20 spec amendment: Naayom specs, Scalifix metrics).
 *
 * Modelled on `link-pair-field.tsx`: two labelled inputs in one row, whose value
 * contract mirrors the stored shape `{key, value}` exactly — the item editor
 * hands the stored object straight in and straight out, so the pair cannot drift
 * from the schema.
 *
 * ⚠️ EMPTY → `null` IS THE CALLER'S JOB (the same contract link-pair-field
 * carries). Clearing both inputs emits `{key: "", value: ""}` — correct for a
 * controlled input, and `StatValueSchema` even ACCEPTS it, because every CMS
 * value is optional-empty. But the item PATCH merge deletes a field ONLY on
 * `v === null`, so PATCHing `{key:"",value:""}` STORES an empty pair rather than
 * clearing the field. `ItemEditor.normalizeValue` maps the all-empty pair to
 * `null` before the write; a new caller must do the same.
 *
 * (Note the difference from link/date/media: those 400 on an empty write. `stat`
 * does not — it silently stores junk instead. Same required mapping, quieter
 * failure mode, which is why it is spelled out here rather than assumed.)
 *
 * NO validation here. `key` and `value` are free text; neither is a URL, and
 * neither PROPERTY NAME ends in `href|url|link|slug`, so the publish walker's
 * key-suffix dispatch cannot rewrite either half to `'#'`. Renaming these two
 * properties is a publish-correctness change, not a cosmetic one.
 *
 * APP-CHROME ONLY — never import from `src/modules/templates/**`,
 * `src/modules/generatedLanding/**`, or `src/components/published/**`.
 */
export interface KeyValuePairValue {
  key: string
  value: string
}

export interface KeyValueFieldProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value: KeyValuePairValue
  onValueChange: (next: KeyValuePairValue) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
  keyLabel?: string
  valueLabel?: string
  disabled?: boolean
}

const KeyValueField = React.forwardRef<HTMLDivElement, KeyValueFieldProps>(
  (
    {
      value,
      onValueChange,
      keyPlaceholder = "Weight",
      valuePlaceholder = "4.2 kg",
      keyLabel = "Spec",
      valueLabel = "Value",
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
            {keyLabel}
          </span>
          <Input
            type="text"
            data-stat-key=""
            value={value.key}
            disabled={disabled}
            placeholder={keyPlaceholder}
            onChange={(e) => onValueChange({ ...value, key: e.target.value })}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-app-label">
            {valueLabel}
          </span>
          <Input
            type="text"
            data-stat-value=""
            value={value.value}
            disabled={disabled}
            placeholder={valuePlaceholder}
            onChange={(e) => onValueChange({ ...value, value: e.target.value })}
          />
        </label>
      </div>
    )
  }
)
KeyValueField.displayName = "KeyValueField"

export { KeyValueField }
