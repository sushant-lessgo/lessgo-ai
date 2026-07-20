"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { AppIcon } from "./icon"
import { Button } from "./button"
import { Input } from "./input"
import { SegmentedControl } from "./segmented-control"

/**
 * MediaOrLinkField — the CMS `video` / `audio` field types (spec types #3, #4).
 *
 * Ruling #11: undesigned in the handoff, so this invents ONE control with an
 * upload/link toggle. Value contract mirrors the stored shape exactly:
 * `{kind: 'upload' | 'link', url: string}`.
 *
 * PICKER-AGNOSTIC BY CONTRACT — the upload side calls `onPickRequest()` and the
 * CALLER opens the shared `MediaPickerModal`. This component must NOT import
 * the picker: the picker lives in the editor tree and pulling it in here would
 * drag editor state into a `components/ui` primitive and break this directory's
 * isolation rule (no imports from `modules/templates/**`,
 * `modules/generatedLanding/**`, `components/published/**`).
 *
 * ⚠️ EMPTY → `null` IS THE CALLER'S JOB. An emptied link input emits
 * `{kind: 'link', url: ""}`, and toggling to a kind with nothing remembered
 * emits e.g. `{kind: 'upload', url: ""}`. Both are correct control output, but
 * `MediaValueSchema` requires `url: z.string().min(1)`, and the item PATCH merge
 * deletes a field ONLY on `v === null` — so PATCHing either empty shape is a
 * 400, not a clear. The caller MUST map an empty url to `null` before the write.
 *
 * TOGGLING IS NON-DESTRUCTIVE: the url last seen for each kind is remembered
 * locally, so an accidental toggle does not silently wipe a pasted link. The
 * emitted value is always `{kind, url}` for the NEWLY active kind — an uploaded
 * asset url is never re-emitted as a user-typed link, and vice versa.
 */
export type MediaOrLinkKind = "upload" | "link"

export interface MediaOrLinkValue {
  kind: MediaOrLinkKind
  url: string
}

export interface MediaOrLinkFieldProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value: MediaOrLinkValue
  onValueChange: (next: MediaOrLinkValue) => void
  /** Caller opens the shared media picker; it writes back via `onValueChange`. */
  onPickRequest: () => void
  linkPlaceholder?: string
  uploadLabel?: string
  disabled?: boolean
  "aria-label"?: string
}

const MediaOrLinkField = React.forwardRef<HTMLDivElement, MediaOrLinkFieldProps>(
  (
    {
      value,
      onValueChange,
      onPickRequest,
      linkPlaceholder = "https://…",
      uploadLabel = "Choose file",
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    // Per-kind memory of the last url, seeded from the incoming value.
    const remembered = React.useRef<Record<MediaOrLinkKind, string>>({
      upload: value.kind === "upload" ? value.url : "",
      link: value.kind === "link" ? value.url : "",
    })
    remembered.current[value.kind] = value.url

    const switchKind = (next: string) => {
      const kind = next as MediaOrLinkKind
      if (kind === value.kind) return
      onValueChange({ kind, url: remembered.current[kind] ?? "" })
    }

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-2 font-app-sans", className)}
        {...props}
      >
        <SegmentedControl
          aria-label={props["aria-label"] ?? "Media source"}
          value={value.kind}
          onValueChange={switchKind}
          options={[
            { value: "upload", label: "Upload", icon: "upload", disabled },
            { value: "link", label: "Link", icon: "link", disabled },
          ]}
        />

        {value.kind === "upload" ? (
          <div
            data-media-upload=""
            className="flex items-center gap-2 rounded-app-input border border-app-border-input bg-app-surface px-2 py-1.5"
          >
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-app-ctl-sm bg-app-thumb-bg text-app-icon-muted">
              <AppIcon name="perm_media" size={18} />
            </span>
            <span
              data-media-upload-value=""
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                value.url ? "text-app-ink" : "text-app-placeholder"
              )}
            >
              {value.url || "No file chosen"}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              data-media-pick=""
              disabled={disabled}
              onClick={onPickRequest}
            >
              {value.url ? "Replace" : uploadLabel}
            </Button>
          </div>
        ) : (
          <Input
            type="text"
            inputMode="url"
            data-media-link=""
            aria-label="Media link URL"
            value={value.url}
            disabled={disabled}
            placeholder={linkPlaceholder}
            onChange={(e) => onValueChange({ kind: "link", url: e.target.value })}
          />
        )}
      </div>
    )
  }
)
MediaOrLinkField.displayName = "MediaOrLinkField"

export { MediaOrLinkField }
