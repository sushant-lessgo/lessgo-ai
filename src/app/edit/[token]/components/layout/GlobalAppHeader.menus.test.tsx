// editor-shell-redesign phase 4 (fix pass) — t1 header menu open/dismiss semantics.
//
// REGRESSION THIS PINS: `Logo → Help & support` closes the app menu and opens the
// help menu in one handler. Radix FocusScope fires AUTOFOCUS_ON_UNMOUNT in a
// setTimeout(0) when the app-menu content unmounts; the non-modal popover's default
// onCloseAutoFocus then focuses the app-menu trigger (the logo button), which is
// OUTSIDE the freshly-mounted help content → focusin → onFocusOutside → dismiss.
// Help flashed open and vanished. The fix is `onFocusOutside={e => e.preventDefault()}`
// on the help AppPopoverMenu — so this test MUST flush timers before asserting,
// otherwise the focus-return never runs and the test can never go red.
//
// No @testing-library/react in the repo — react-dom/client + React.act, per
// src/components/ui/segmented-control.test.tsx.

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// vi.hoisted: vi.mock factories are hoisted above module scope, so the spies they
// close over must be created there too.
const { push, showSeoModal, showSocialModal } = vi.hoisted(() => ({
  push: vi.fn(),
  showSeoModal: vi.fn(),
  showSocialModal: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
// Partial Clerk stub. `useAuth` is NOT unused — GlobalAppHeader mounts <CreditBadge>
// (billing-beta phase 5), which calls useAuth() and would throw without it. Keeping
// isSignedIn:false (consistent with useUser above) makes CreditBadge return null
// BEFORE its /api/credits/balance fetch + 30s poll interval start — so this suite
// needs no fetch stub. If a future test needs the badge rendered, flip this to
// signed-in AND stub fetch; the afterEach unmount clears the poll interval, so the
// only requirement is stubbing fetch.
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ isSignedIn: false }),
  useAuth: () => ({ isSignedIn: false }),
  UserButton: () => null,
}));
vi.mock('@/hooks/useEditStore', () => ({
  useEditStore: Object.assign(() => undefined, {
    getState: () => ({ toggleLeftPanel: vi.fn() }),
  }),
}));
vi.mock('@/components/shared/Logo', () => ({
  default: () => <span data-testid="logo" />,
}));
vi.mock('./PageSwitcher', () => ({ PageSwitcher: () => null }));
vi.mock('./EditHeader', () => ({
  EditorDesignControls: () => null,
  EditorStatusCluster: () => null,
}));
vi.mock('./EditHeaderRightPanel', () => ({ EditHeaderRightPanel: () => null }));
vi.mock('../ui/GlobalModals', () => ({ showSeoModal, showSocialModal }));

// Imported after the mocks are registered.
import { GlobalAppHeader } from './GlobalAppHeader';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.clearAllMocks();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<GlobalAppHeader tokenId="tok" />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** Popover content is portalled to document.body — query globally, not in `container`. */
function trigger(label: string): HTMLButtonElement {
  const el = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  if (!el) throw new Error(`no trigger: ${label}`);
  return el;
}

function row(text: string): HTMLElement {
  const el = Array.from(document.querySelectorAll<HTMLElement>('[data-radix-popper-content-wrapper] button, [data-radix-popper-content-wrapper] span')).find(
    (n) => n.textContent?.trim() === text
  );
  if (!el) throw new Error(`no open menu row: ${text}`);
  return el;
}

function menuOpen(label: string) {
  return trigger(label).getAttribute('data-state') === 'open';
}

/** Let the AUTOFOCUS_ON_UNMOUNT setTimeout(0) + Radix's dismiss path settle. */
async function settle() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 200));
  });
}

describe('GlobalAppHeader menus', () => {
  it('app menu → Help & support opens the help menu and it STAYS open', async () => {
    act(() => trigger('Site menu').click());
    expect(menuOpen('Site menu')).toBe(true);

    act(() => row('Help & support').click());
    await settle();

    // The regression: help flashed open then Radix dismissed it on focus-return.
    expect(menuOpen('Help and support')).toBe(true);
    expect(menuOpen('Site menu')).toBe(false);
  });

  it('help menu still dismisses on outside pointerdown', async () => {
    act(() => trigger('Help and support').click());
    // Radix attaches its `pointerdown` listener in a setTimeout(0) — dispatching
    // before that flushes would pass vacuously.
    await settle();
    expect(menuOpen('Help and support')).toBe(true);

    act(() => {
      // jsdom has no PointerEvent constructor; MouseEvent carries everything
      // Radix's usePointerDownOutside reads (target + pointerType undefined).
      document.body.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, cancelable: true })
      );
      document.body.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await settle();

    expect(menuOpen('Help and support')).toBe(false);
  });

  it('help menu still dismisses on Escape', async () => {
    act(() => trigger('Help and support').click());
    expect(menuOpen('Help and support')).toBe(true);

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    await settle();

    expect(menuOpen('Help and support')).toBe(false);
  });

  it('app menu → Back to dashboard navigates and closes the menu', async () => {
    act(() => trigger('Site menu').click());
    act(() => row('Back to dashboard').click());
    await settle();

    expect(push).toHaveBeenCalledWith('/dashboard');
    expect(menuOpen('Site menu')).toBe(false);
  });

  it('Settings → SEO opens the SEO modal and closes the menu', async () => {
    act(() => trigger('Site settings').click());
    act(() => row('SEO').click());
    await settle();

    expect(showSeoModal).toHaveBeenCalledTimes(1);
    // language-settings phase 2b: SEO must stay a no-arg call — the window
    // defaults to the SEO pane, so this row's behavior is unchanged.
    expect(showSeoModal.mock.calls[0]).toEqual([]);
    expect(menuOpen('Site settings')).toBe(false);
  });

  // language-settings phase 2b (founder request at the phase-2 gate).
  it('Settings → Languages opens the settings window ON the Languages pane', async () => {
    act(() => trigger('Site settings').click());
    act(() => row('Languages').click());
    await settle();

    expect(showSeoModal).toHaveBeenCalledTimes(1);
    // The whole point of the row: WITHOUT the section argument it would land on
    // SEO, which is the SEO row's job. Drop the arg and this goes red.
    expect(showSeoModal).toHaveBeenCalledWith({ section: 'languages' });
    expect(showSocialModal).not.toHaveBeenCalled();
    expect(menuOpen('Site settings')).toBe(false);
  });

  it('Settings → Social & sharing opens the social modal and closes the menu', async () => {
    act(() => trigger('Site settings').click());
    act(() => row('Social & sharing').click());
    await settle();

    expect(showSocialModal).toHaveBeenCalledTimes(1);
    expect(menuOpen('Site settings')).toBe(false);
  });

  // B3: the dead "coming soon" device SegmentedControl stub used to render here
  // (aria-label "Preview device") alongside the real DeviceToggle in
  // EditHeaderRightPanel → two toggles, one inert. EditHeaderRightPanel is mocked
  // to null in this suite, so the stub is the ONLY possible "Preview device" node.
  it('does NOT render the dead device-preview stub (B3)', () => {
    expect(container.querySelector('[aria-label="Preview device"]')).toBeNull();
  });
});
