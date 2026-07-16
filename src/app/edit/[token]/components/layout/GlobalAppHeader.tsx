// /app/edit/[token]/components/layout/GlobalAppHeader.tsx
"use client";

// PHASE 4 — THE single editor bar (t1, decision 1).
//
// This is now the ONLY `<header>` in the editor: GlobalAppHeader's old full-width
// row and EditHeader's old nested row are collapsed into one 56px bar that spans
// the rail. Composition only — every handler below moved VERBATIM with its markup.
//
// Load-bearing details, do NOT "clean up":
//  - the mobile panel toggle calls `useEditStore.getState().toggleLeftPanel?.()`
//    (the hook object, not useEditStoreApi()). Inconsistent, deliberate, preserved.
//  - it MUST stay a `<header>` element: e2e/editor-dirty-guard.spec.ts scopes to
//    `page.locator('header')` / `header [role="status"]`, and useEditor.ts:212
//    detects header clicks with `target.closest('header')`.
//
// MENU DISMISSAL — every Popover here is CONTROLLED (local `open` state) and each
// WIRED row sets it false in its own onClick. Radix `Popover` (unlike DropdownMenu)
// does NOT close on item click, and popover.tsx exports no PopoverClose — so an
// uncontrolled menu would hang open on top of the modal it just opened. Adding a
// Close to the shared primitive is a separate call; do NOT "simplify" this away.
// Greyed <Coming> rows are inert (onClickCapture swallows the click), so they
// deliberately leave their menu open — nothing happened, nothing to dismiss.
//
// GREYED MENU ROWS — the decision-17 pattern, set here (first menu consumer):
// <Coming> renders its own `inline-flex items-center gap-1.5` span, so a greyed
// row canNOT be an <AppPopoverItem>. Rather than add a row variant to the shared
// primitive for this one case, greyed rows are <Coming> carrying AppPopoverItem's
// row geometry via `className` (COMING_ROW below) — a single const, used for every
// greyed row in this file. Colors come from `.app-coming` (which !important-wins
// anyway), so only box/typography is restated. Any later menu consumer should
// import this idea, not re-improvise it.

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditStore } from '@/hooks/useEditStore';
import Logo from '@/components/shared/Logo';
import { AppIcon } from '@/components/ui/icon';
import { Coming } from '@/components/ui/coming';
import { SegmentedControl } from '@/components/ui/segmented-control';
import {
  Popover,
  PopoverTrigger,
  AppPopoverMenu,
  AppPopoverItem,
  AppPopoverLabel,
  AppPopoverSeparator,
} from '@/components/ui/popover';
import { PageSwitcher } from './PageSwitcher';
// THE t1 bar-control class, defined once (phase 8 de-dupe: this file's private
// `BAR_BTN` and DesignMenuShell's `DESIGN_TRIGGER_CLASS` were byte-identical).
import { BAR_CTL_CLASS } from '../ui/DesignMenuShell';
import { EditorDesignControls, EditorStatusCluster } from './EditHeader';
import { EditHeaderRightPanel } from './EditHeaderRightPanel';
import { showSeoModal, showSocialModal } from '../ui/GlobalModals';

interface GlobalAppHeaderProps {
  tokenId: string;
}

/** Greyed popover row: AppPopoverItem's geometry, worn by <Coming>. See header note. */
const COMING_ROW =
  'w-full gap-2.5 rounded-app-badge px-2.5 py-[7px] text-[13px] font-medium';

/**
 * `Back to dashboard` emphasis (scout §H t1: bg #f5f9ff, arrow_back #006CFF,
 * text #003E80 600). This is the mock's EMPHASIS treatment, not a selected state:
 * the row is a navigation action, so it must not carry AppPopoverItem's `active`
 * (which also sets `data-active` — i.e. announces "this is the current item").
 * Same pixels, no selected-ness, applied as plain presentation.
 */
const EMPHASIS_ROW =
  'bg-app-tint-soft font-semibold text-app-primary-deep hover:bg-app-tint-soft [&_.app-icon]:text-app-primary';

export function GlobalAppHeader({ tokenId }: GlobalAppHeaderProps) {
  const router = useRouter();

  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showAppMenu, setShowAppMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const handleLogoClick = () => {
    // Navigate to dashboard or home
    router.push('/dashboard');
  };

  return (
    <header className="relative z-[60] flex h-14 w-full flex-none items-center gap-3 border-b border-app-border-frame bg-app-surface px-3.5">
      {/* ── Left cluster ─────────────────────────────────────────────────── */}
      {/* Logo = app menu (t1). The dashboard navigation that used to be the
          logo's own onClick is now the `Back to dashboard` row — same handler. */}
      <Popover open={showAppMenu} onOpenChange={setShowAppMenu}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex flex-none items-center gap-1 rounded-app-ctl-sm px-1.5 py-1 transition-colors hover:bg-app-hairline data-[state=open]:bg-app-hairline"
            aria-label="Site menu"
          >
            {/* t1: logo h22. <Logo> passes `size` to next/image as BOTH width and
                height, so the height is constrained via className instead — a
                bare `size` would reserve a square box far taller than the bar. */}
            <Logo size={110} className="h-[22px] w-auto" />
            <AppIcon name="expand_more" size={18} className="text-app-icon-faint" />
          </button>
        </PopoverTrigger>
        <AppPopoverMenu width={216} align="start">
          <AppPopoverItem
            className={EMPHASIS_ROW}
            icon={<AppIcon name="arrow_back" size={18} />}
            onClick={() => {
              setShowAppMenu(false);
              handleLogoClick();
            }}
          >
            Back to dashboard
          </AppPopoverItem>
          <Coming what="a sites list inside the editor" side="right" className={COMING_ROW}>
            <AppIcon name="grid_view" size={18} />
            My sites
          </Coming>
          <AppPopoverSeparator />
          <Coming what="renaming a site from the editor" side="right" className={COMING_ROW}>
            <AppIcon name="edit" size={18} />
            Rename site
          </Coming>
          <Coming what="site duplication" side="right" className={COMING_ROW}>
            <AppIcon name="content_copy" size={18} />
            Duplicate
          </Coming>
          <AppPopoverSeparator />
          {/* Works today — reskinned, never greyed (decision 11). Opens the same
              help menu the old help button opened; that button is its anchor.
              MUST close this menu first: two popovers on two anchors would
              otherwise overlap. */}
          <AppPopoverItem
            icon={<AppIcon name="help" size={18} />}
            onClick={() => {
              setShowAppMenu(false);
              setShowHelpMenu(true);
            }}
          >
            Help & support
          </AppPopoverItem>
        </AppPopoverMenu>
      </Popover>

      <div className="app-divider" />

      {/* Multi-page switcher */}
      <PageSwitcher />

      {/* Design-system popover + i18n controls (moved from the old EditHeader row) */}
      <EditorDesignControls />

      {/* Settings menu (t1). Rows dispatch to the EXISTING GlobalModals singleton
          callers — the two modal systems stay separate (decision 7). */}
      <Popover open={showSettingsMenu} onOpenChange={setShowSettingsMenu}>
        <PopoverTrigger asChild>
          <button type="button" className={BAR_CTL_CLASS} aria-label="Site settings">
            <AppIcon name="tune" size={18} className="text-app-icon-muted" />
            <span>Settings</span>
            <AppIcon name="expand_more" size={18} className="text-app-icon-faint" />
          </button>
        </PopoverTrigger>
        <AppPopoverMenu width={224} align="start">
          <AppPopoverLabel>Site settings</AppPopoverLabel>
          {/* Domain has no editor entry point today (it lives in the publish flow),
              so it renders greyed rather than omitted. Phase 6 builds the t16 pane. */}
          <Coming what="domain settings in the editor" side="right" className={COMING_ROW}>
            <AppIcon name="public" size={18} />
            Domain
          </Coming>
          <AppPopoverItem
            icon={<AppIcon name="search" size={18} />}
            onClick={() => {
              setShowSettingsMenu(false);
              showSeoModal();
            }}
          >
            SEO
          </AppPopoverItem>
          {/* WIRED TODAY — never grey this (decision 10). Handler moved verbatim
              from the old `Social` bar button. */}
          <AppPopoverItem
            icon={<AppIcon name="share" size={18} />}
            onClick={() => {
              setShowSettingsMenu(false);
              showSocialModal();
            }}
          >
            Social &amp; sharing
          </AppPopoverItem>
        </AppPopoverMenu>
      </Popover>

      {/* Help menu — CONTROLLED, so the app menu's `Help & support` row can open
          it while this button remains its anchor. Reskinned; its four rows have
          never been wired, so each is individually greyed (decision 9). */}
      <Popover open={showHelpMenu} onOpenChange={setShowHelpMenu}>
        <PopoverTrigger asChild>
          {/* No own onClick / aria-expanded: PopoverTrigger already toggles
              `open` and sets aria-expanded. The old hand-rolled toggle beside it
              only survived because Radix preventDefault()s a re-entrant trigger
              click — a coincidence, not a design. Same behavior, on purpose. */}
          <button
            type="button"
            className={BAR_CTL_CLASS}
            aria-label="Help and support"
          >
            <AppIcon name="help" size={18} className="text-app-icon-muted" />
          </button>
        </PopoverTrigger>
        {/* onFocusOutside preventDefault — NOT cruft, do not remove. The app
            menu's `Help & support` row unmounts the app-menu content and opens
            THIS one in the same handler. On unmount Radix's FocusScope fires
            AUTOFOCUS_ON_UNMOUNT in a setTimeout(0); the non-modal popover's
            default onCloseAutoFocus then focuses the app menu's trigger (the
            logo button). By then this menu is mounted with its focusin listener
            live, and the logo button is outside it → onFocusOutside → dismiss.
            Help would flash open and vanish. Preventing focus-outside dismissal
            is exactly what Radix's own MODAL popover does. Outside-pointerdown
            and Escape still dismiss (covered in GlobalAppHeader.menus.test.tsx). */}
        <AppPopoverMenu
          width={224}
          align="start"
          onFocusOutside={(e) => e.preventDefault()}
        >
          <AppPopoverLabel>Help &amp; support</AppPopoverLabel>
          {/* ICON SUBSTITUTES — PENDING A FONT REGENERATION (phase-8 carry, NOT a
              style choice). The handoff wants `menu_book` / `smart_display` /
              `keyboard`; the committed subset font has none of them, and an absent
              ligature renders as its literal NAME, not a glyph. Phase 8 added the
              four missing names to ./public/fonts/material-symbols-rounded/icons.txt
              (the authoritative want-list) but could NOT regenerate the woff2 — the
              NOTICE's toolchain (python + fontTools, subsetting the ~5.3MB upstream
              font, which is deliberately not committed) is not available here, and
              hand-editing or guessing at font binaries is forbidden. So the nearest
              PRESENT glyphs stand in. AFTER someone regenerates per the NOTICE:
              auto_stories → menu_book, subtitles → smart_display, smart_button →
              keyboard. Until then, do NOT "fix" these names — you'd ship text. */}
          <Coming what="the editor guide" side="right" className={COMING_ROW}>
            <AppIcon name="auto_stories" size={18} />
            Editor Guide
          </Coming>
          <Coming what="video tutorials" side="right" className={COMING_ROW}>
            <AppIcon name="subtitles" size={18} />
            Video Tutorials
          </Coming>
          <Coming what="live chat support" side="right" className={COMING_ROW}>
            <AppIcon name="chat" size={18} />
            Live Chat Support
          </Coming>
          <AppPopoverSeparator />
          <Coming what="the keyboard shortcuts sheet" side="right" className={COMING_ROW}>
            <AppIcon name="smart_button" size={18} />
            Keyboard Shortcuts
          </Coming>
        </AppPopoverMenu>
      </Popover>

      {/* Mobile nav toggle. PRESERVED VERBATIM: mutates the store through the
          hook object, not useEditStoreApi(). Do not "fix" — behavior change. */}
      <button
        className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-app-badge text-app-icon-muted transition-colors hover:bg-app-hairline lg:hidden"
        onClick={() => useEditStore.getState().toggleLeftPanel?.()}
        aria-label="Toggle navigation menu"
      >
        <AppIcon name="menu" size={18} />
      </button>

      {/* ── Center: device segmented (t1) ────────────────────────────────── */}
      {/* GREYED slot (decision 12): ui/DeviceToggle.tsx is mounted nowhere, so
          wiring this would be new behavior. Inertness comes from <Coming>'s
          onClickCapture + the no-op onValueChange — NOT from `disabled`, which
          would swallow the tooltip's pointer events (phase-3 precedent). */}
      {/* ICON SUBSTITUTE — PENDING A FONT REGENERATION (same carry as the Help
          menu's three above; see that note for the full why). The handoff draws
          `smartphone`; the committed subset woff2 has no working ligature for it,
          so it rendered the literal TEXT "smartphone" (measured 144px wide at 24px
          vs 24px for a real glyph — a visibly broken top bar). `phone` is the only
          phone-ish glyph actually PRESENT in the subset (verified against the
          woff2's GSUB ligature table, NOT icons.txt — that manifest is unreliable
          in both directions: `smartphone` is listed there yet was silently DROPPED
          by the subset build, and `phone` is absent there yet present in the font).
          AFTER someone regenerates per public/fonts/material-symbols-rounded/NOTICE:
          swap `phone` → `smartphone` here. Do NOT restore `smartphone` before that
          — you'd ship text. */}
      <div className="ml-auto flex-none">
        <SegmentedControl
          aria-label="Preview device"
          value="desktop"
          onValueChange={() => {}}
          options={[
            {
              value: 'desktop',
              label: (
                <Coming what="device previews">
                  <AppIcon name="desktop_windows" size={19} />
                </Coming>
              ),
            },
            {
              value: 'tablet',
              label: (
                <Coming what="device previews">
                  <AppIcon name="tablet_mac" size={19} />
                </Coming>
              ),
            },
            {
              value: 'phone',
              label: (
                <Coming what="device previews">
                  {/* substitute pending font regeneration → `smartphone` */}
                  <AppIcon name="phone" size={19} />
                </Coming>
              ),
            },
          ]}
        />
      </div>

      {/* ── Right cluster ────────────────────────────────────────────────── */}
      <div className="ml-auto flex flex-none items-center gap-2">
        {/* Score + review pills + save-state chip (moved from the old EditHeader) */}
        <EditorStatusCluster />

        <div className="app-divider" />

        {/* Regen / undo / redo / reset / Edit-Preview / Publish */}
        <EditHeaderRightPanel tokenId={tokenId} />

        {/* NO avatar / Clerk UserButton here (decision 8b — founder ruling at the
            phase-4 gate, REVERSING decision 8's "keep it, it's the only in-editor
            sign-out path"): account actions incl. sign-out live on the DASHBOARD,
            reachable from the logo menu's `Back to dashboard` row. t1 draws no
            avatar, so the bar now matches the handoff exactly. Do not re-add. */}
      </div>
    </header>
  );
}
