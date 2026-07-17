// app/edit/[token]/components/toolbars/ToolbarButton.tsx
//
// toolbar-standard-beta phase 1: the SHARED presentation primitives for every
// in-editor floating toolbar. Before this, ElementToolbar / SectionToolbar /
// ImageToolbar / TextToolbarMVP each hand-rolled their own button, divider and
// status chip with THREE different disabled conventions (`text-gray-300` /
// `text-gray-400` / none at all) and only ONE of them tagged `data-action`.
// Everything visual lives here now; the toolbars supply behaviour only.
//
// Look = handoff `Lessgo Editor Redesign.dc.html` t2/t2b: a dark (#191922) pill
// with 7px-radius actions. The colours are arbitrary Tailwind values rather than
// `app-*` tokens because the t2 dark-toolbar palette has no token in
// `tailwind.config.js` and that file is out of this phase's scope — see the audit.
//
// Conventions standardised here (all four toolbars now inherit them):
//   - `data-action` is REQUIRED on every button (the e2e/dispatch hook).
//   - disabled = muted colour + `cursor-not-allowed` + `aria-disabled` + a
//     `disabledTitle` tooltip (ElementToolbar's precedent, plus aria-disabled,
//     which existed nowhere before).

'use client';

import React, {
  createContext,
  useContext,
  useLayoutEffect,
  type ReactNode,
  type ButtonHTMLAttributes,
} from 'react';

export type ToolbarButtonVariant = 'default' | 'emphasis' | 'danger';

export interface ToolbarButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'title'> {
  /** Leading glyph. Icon-only buttons (no `label`) get square padding. */
  icon?: ReactNode;
  /** Optional visible label. */
  label?: string;
  /** Optional trailing glyph (chevron, lock, colour swatch…). */
  trailing?: ReactNode;
  disabled?: boolean;
  /** Tooltip shown INSTEAD of `title` when disabled — says WHY it's off. */
  disabledTitle?: string;
  variant?: ToolbarButtonVariant;
  /** Toggle-on state (bold active, open picker…). */
  active?: boolean;
  title?: string;
  /** REQUIRED — stable action id; the e2e dispatch hook + the only DOM contract. */
  'data-action': string;
}

const VARIANT_CLASSES: Record<ToolbarButtonVariant, string> = {
  // t2: idle actions read #b8b8c2, hover lifts the row to #2c2c38.
  default: 'text-[#b8b8c2] hover:bg-[#2c2c38] hover:text-white',
  // t2: the primary action of a set renders full-white on a raised chip.
  emphasis: 'text-white bg-[#23232f] hover:bg-[#2c2c38]',
  // t2: destructive = #ff7a7a on a warm-dark hover (#3a1f22).
  danger: 'text-[#ff7a7a] hover:bg-[#3a1f22]',
};

/**
 * The one toolbar action button.
 *
 * Disabled buttons keep `disabled` on the DOM node (so clicks genuinely can't
 * fire) AND carry `aria-disabled` — screen readers announced nothing before.
 * NOTE: the disabled colour is #5a5a66, not the old `text-gray-300`. The three
 * legacy conventions were written for a WHITE toolbar; on the t2 dark shell
 * gray-300 (#d1d5db) is brighter than the enabled colour and would read as the
 * most prominent button in the set. #5a5a66 is the handoff's own muted/lock tone.
 */
export const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButton(
    {
      icon,
      label,
      trailing,
      disabled = false,
      disabledTitle,
      variant = 'default',
      active = false,
      title,
      className = '',
      ...rest
    },
    ref,
  ) {
    const stateClasses = disabled
      ? 'text-[#5a5a66] cursor-not-allowed'
      : active
      ? 'bg-[#3a3a48] text-white'
      : VARIANT_CLASSES[variant];

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-disabled={disabled || undefined}
        title={disabled ? disabledTitle ?? title ?? label : title ?? label}
        className={[
          'inline-flex items-center rounded-[7px] font-app-sans text-xs font-medium',
          'transition-colors select-none whitespace-nowrap',
          label ? 'gap-1.5 px-2.5 py-1.5' : 'gap-1 p-1.5',
          stateClasses,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {icon}
        {label ? <span>{label}</span> : null}
        {trailing}
      </button>
    );
  },
);

/** t2 divider — replaces the ad-hoc `w-px h-6 bg-gray-200 mx-1` in all four toolbars. */
export function ToolbarDivider() {
  return <div aria-hidden className="mx-1 h-[18px] w-px flex-none bg-[#33333f]" />;
}

/**
 * The leading status chip (coloured dot + name, plus optional trailing badge).
 *
 * Kept as a PRIMITIVE rather than folded into the shell's chrome on purpose: its
 * content is store-derived per toolbar (SectionToolbar shows a validation-colour
 * dot + completion %, ElementToolbar shows the element key), and the shell's
 * `resolveProps`/action-set metadata are PURE functions of the selection with no
 * store access. Unifying the look here achieves the phase's goal without moving
 * store reads into the registry.
 */
export function ToolbarLabel({
  dotClassName,
  text,
  children,
}: {
  /** Tailwind bg-* class for the status dot. Omit for no dot. */
  dotClassName?: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 pl-1.5 pr-1" data-toolbar-label>
      {dotClassName ? (
        <span aria-hidden className={`h-1.5 w-1.5 flex-none rounded-full ${dotClassName}`} />
      ) : null}
      <span className="font-app-sans text-[11px] font-semibold text-[#b8b8c2] whitespace-nowrap">
        {text}
      </span>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chrome-visibility channel
// ---------------------------------------------------------------------------
//
// The shell owns the t2 chrome box, but SectionToolbar has a state in which it
// renders NO toolbar at all — while a section regenerates (and for 3s after) it
// swaps the toolbar for a fixed bottom-right progress/completion card. With the
// chrome hoisted into the shell, that state would leave an empty dark pill
// floating over the section carrying nothing but the disabled Design ▾ button —
// a visible regression against today's "toolbar disappears".
//
// So a toolbar body can ask the shell to drop the chrome for as long as it is
// rendering something that isn't a toolbar. Deliberately a context rather than
// store state: `showCompletionMessage` is LOCAL 3s state inside SectionToolbar,
// so the shell cannot derive this itself. `useLayoutEffect` = pre-paint, so
// there is no one-frame flash of empty chrome.
//
// Lives in this leaf module, NOT in ToolbarShell: SectionToolbar importing from
// ToolbarShell would close the cycle ToolbarShell → actionSets → SectionToolbar.

interface ToolbarChromeValue {
  setChromeVisible: (visible: boolean) => void;
}

export const ToolbarChromeContext = createContext<ToolbarChromeValue>({
  setChromeVisible: () => {},
});

/** Hide the shell's chrome box while `hidden` is true (see note above). */
export function useHideToolbarChrome(hidden: boolean) {
  const { setChromeVisible } = useContext(ToolbarChromeContext);
  useLayoutEffect(() => {
    setChromeVisible(!hidden);
    return () => setChromeVisible(true);
  }, [hidden, setChromeVisible]);
}
