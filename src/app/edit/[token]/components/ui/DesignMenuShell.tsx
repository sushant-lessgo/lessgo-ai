"use client";

// DesignMenuShell — t14 "Design" menu chrome (editor-shell-redesign phase 5).
//
// PURE PRESENTATION. Every section arrives as children/props; this file holds no
// store reads, no handlers, no template knowledge. Consumers: ServiceThemePopover
// + VestriaThemePopover (near-twins). ThemePopover (legacy product colour system)
// deliberately does NOT use this shell — plan step 3 / scout §E ruled it not worth
// folding in, and its footer would have to lie (it DOES offer free colour editing).
//
// FIREWALL: nothing here may static-import a template module. Swatch colours are
// resolved from the already-injected `[data-palette="x"]{--accent}` CSS vars (the
// pattern the theme popovers already used), so a swatch can show a template's real
// accent without importing that template's palette config. `color` is the escape
// hatch for the legacy colour system, which has real hexes in hand.
//
// NAMING (founder ruling, decision 8b): the user-facing control is **Design**, not
// "Style". t14's internal group eyebrow STYLE (= the variant control) is kept as
// drawn — "Design ▸ Style" is an ordinary hierarchy, and the clashing "Style"
// trigger it could be confused with no longer exists.

import React from 'react';
import { AppIcon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

/**
 * t1 bar control geometry for the Design trigger — mirrors GlobalAppHeader's
 * private `BAR_BTN` (that file is out of this phase's scope, so the classes are
 * restated rather than exported from it). Ghost button, pad 7/10, radius 8,
 * label 500/13.
 */
export const DESIGN_TRIGGER_CLASS =
  'inline-flex items-center gap-1.5 rounded-app-badge px-2.5 py-[7px] text-[13px] font-medium text-app-label transition-colors hover:bg-app-hairline data-[state=open]:bg-app-track';

export interface DesignMenuTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Active palette id. When given, the `palette` glyph is tinted with that
   * palette's live `--accent` var (a swatch's worth of information in t1's
   * icon-only button). Omit for the legacy colour system.
   */
  paletteId?: string;
  /** Literal accent colour, for callers that hold a hex (legacy colour system). */
  accentColor?: string;
}

/**
 * t1's Design button: `palette` ghost icon + "Design". Must be used with
 * `<PopoverTrigger asChild>`, hence forwardRef + prop spread.
 */
export const DesignMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DesignMenuTriggerProps
>(({ paletteId, accentColor, className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label="Design"
    className={cn(DESIGN_TRIGGER_CLASS, className)}
    {...props}
  >
    <span
      data-palette={paletteId}
      style={{ color: accentColor ?? 'var(--accent, #006CFF)' }}
      className="flex-none"
    >
      <AppIcon name="palette" size={18} />
    </span>
    <span>Design</span>
  </button>
));
DesignMenuTrigger.displayName = 'DesignMenuTrigger';

export interface DesignMenuShellProps {
  /** Closes the popover (t14 header `close`). */
  onClose: () => void;
  /** The groups — compose with <DesignMenuGroup>. */
  children: React.ReactNode;
  /**
   * Footer strip. Defaults to t14's lock strip. Pass `null` for a surface where
   * the curated-set claim would be untrue.
   */
  footer?: React.ReactNode;
}

/** t14 footer strip: `lock` + the curated-set line. */
export function DesignMenuFooter({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 border-t border-app-divider bg-app-surface-sunken px-3.5 py-2.5 text-[10.5px] font-medium text-app-faint">
      <AppIcon name="lock" size={13} className="flex-none" />
      <span>{children ?? 'Curated set — no free color or background editing'}</span>
    </div>
  );
}

/**
 * t14 panel body: header (`palette` + "Design" + `close`) → groups → footer.
 * Render INSIDE an <AppPopoverPanel width={288}> (the panel owns w/radius/border/
 * shadow; this owns the internal rhythm).
 */
export function DesignMenuShell({ onClose, children, footer }: DesignMenuShellProps) {
  return (
    // Height-bounded, scrolling BODY. Found empirically (phase-5 browser probe):
    // on service/hearth (swap list + looks + style + accent) the panel is taller
    // than the viewport, and AppPopoverPanel is `overflow-hidden` — so the ACCENT
    // group was clipped and unclickable. Radix publishes the space it has as
    // --radix-popover-content-available-height; header/footer stay pinned.
    <div className="flex max-h-[var(--radix-popover-content-available-height,80vh)] flex-col">
      <div className="flex flex-none items-center gap-2 border-b border-app-divider px-3.5 py-3">
        <AppIcon name="palette" size={18} className="flex-none text-app-primary" />
        <span className="flex-1 text-[14px] font-semibold text-app-ink">Design</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 flex-none rounded-app-badge p-1 text-app-icon-muted transition-colors hover:bg-app-hairline"
        >
          <AppIcon name="close" size={18} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-3.5 py-3.5">{children}</div>

      <div className="flex-none">{footer === undefined ? <DesignMenuFooter /> : footer}</div>
    </div>
  );
}

export interface DesignMenuGroupProps {
  /** Eyebrow text — TEMPLATE / STYLE / ACCENT (rendered uppercase). */
  label: string;
  /** Right-aligned slot on the eyebrow row (t14's "Browse all"). */
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** Eyebrow (700/10, .09em) + optional trailing action + the group's body. */
export function DesignMenuGroup({ label, action, children }: DesignMenuGroupProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[.09em] text-app-faint">
          {label}
        </p>
        {action ? <span className="flex-none">{action}</span> : null}
      </div>
      {children}
    </div>
  );
}

/** t14 link affordance — "Browse all" (600/11.5, primary). */
export const DesignMenuLink = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      'text-[11.5px] font-semibold text-app-primary transition-colors hover:text-app-primary-hover',
      className
    )}
    {...props}
  />
));
DesignMenuLink.displayName = 'DesignMenuLink';

/** t14's 40×30 faux-preview thumb (no real thumbnails exist yet). */
export function DesignTemplateThumb() {
  return (
    <span
      aria-hidden
      className="flex h-[30px] w-10 flex-none flex-col justify-center gap-[3px] rounded-[5px] bg-app-thumb-bg px-1.5"
    >
      <span className="block h-[3px] w-full rounded-full bg-app-thumb-bar" />
      <span className="block h-[2px] w-3/4 rounded-full bg-app-thumb-bar-soft" />
      <span className="block h-[2px] w-1/2 rounded-full bg-app-thumb-bar-soft" />
    </span>
  );
}

export interface DesignTemplateRowProps {
  name: string;
  subtitle?: string;
  /** Renders the row as the current template (non-interactive when no onClick). */
  active?: boolean;
  onClick?: () => void;
  trailing?: React.ReactNode;
}

/** t14 TEMPLATE row: bordered (radius 11) mini-thumb + name + subtitle. */
export function DesignTemplateRow({
  name,
  subtitle,
  active,
  onClick,
  trailing,
}: DesignTemplateRowProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick, 'aria-pressed': !!active } : {})}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-app-row border p-2 text-left transition-colors',
        active
          ? 'border-app-primary bg-app-tint-soft'
          : 'border-app-border-hairline',
        onClick && !active && 'hover:border-app-border-soft hover:bg-app-hover'
      )}
    >
      <DesignTemplateThumb />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold text-app-ink">
          {name}
        </span>
        {subtitle ? (
          <span className="block truncate text-[10.5px] font-normal text-app-faint">
            {subtitle}
          </span>
        ) : null}
      </span>
      {trailing ? <span className="flex-none">{trailing}</span> : null}
    </Tag>
  );
}

export interface DesignSegmentedOption {
  id: string;
  label: string;
  /** Tooltip/`title` text (the variant blurb). */
  blurb?: string;
  /** Optional leading node (e.g. the vestria mood dot). */
  leading?: React.ReactNode;
}

export interface DesignSegmentedProps {
  options: DesignSegmentedOption[];
  value?: string;
  onChange: (id: string) => void;
  'aria-label'?: string;
}

/**
 * t14 STYLE segmented — active `#fff` chip + `#006CFF` 600/11.5 on an
 * `app-track` rail. Local to the Design menu rather than the shared
 * `SegmentedControl`: that primitive's active segment is ink-coloured at
 * `text-sm`, and re-tuning a shared primitive for one panel is out of scope.
 */
export function DesignSegmented({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
}: DesignSegmentedProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex items-center gap-1 rounded-app-ctl-sm bg-app-track p-[3px]"
    >
      {options.map((o) => {
        const selected = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            title={o.blurb}
            onClick={() => onChange(o.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-[7px] px-2 py-[5px] text-[11.5px] transition-colors',
              selected
                ? 'bg-app-surface font-semibold text-app-primary shadow-[0_1px_2px_rgba(0,0,0,.07)]'
                : 'font-medium text-app-dim hover:text-app-ink'
            )}
          >
            {o.leading ? <span className="flex-none">{o.leading}</span> : null}
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export interface DesignSwatchProps {
  /** Palette id → colour resolves from the injected `[data-palette]{--accent}`. */
  paletteId?: string;
  /** Literal colour (legacy colour system, which holds real hexes). */
  color?: string;
  selected?: boolean;
  onClick: () => void;
  title?: string;
  /** Extra content (e.g. the legacy custom-accent `+`). */
  children?: React.ReactNode;
}

/** t14 ACCENT swatch — 26×26, radius 8, double-ring selection. */
export function DesignSwatch({
  paletteId,
  color,
  selected,
  onClick,
  title,
  children,
}: DesignSwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={!!selected}
      data-palette={paletteId}
      className={cn(
        'flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg transition-shadow',
        !selected && 'hover:shadow-[0_0_0_2px_#fff,0_0_0_3.5px_#cdcdd4]'
      )}
      style={{
        background: color ?? 'var(--accent, #ccc)',
        // t14 double ring. Inline rather than an arbitrary class: the ring is
        // two comma-separated shadows over the swatch's own background, and
        // tailwind.config.js is out of this phase's scope (no new token key).
        // #fff = app-surface, #006CFF = app-primary (existing tokens, restated).
        boxShadow: selected ? '0 0 0 2px #fff, 0 0 0 3.5px #006CFF' : undefined,
      }}
    >
      {children}
    </button>
  );
}

/** Wrapping 26px swatch row. */
export function DesignSwatchRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}
