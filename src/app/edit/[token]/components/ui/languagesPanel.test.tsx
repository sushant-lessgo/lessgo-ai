// LanguagesPanel — language-settings phase 2 (jsdom, REAL store).
//
// The headline contract is an ABSENCE: the retired globe returned null unless
// `isMultiLocale(localeConfig)`, so a monolingual project could never declare a
// second language from the UI. Case 1 below fails the moment that gate comes
// back in any form.
//
// The rest of the file pins the sharp edges the plan calls out:
//  · the DEFAULT locale is non-removable (removeLocale would clear a non-English
//    site's whole config — i18nActions.ts:74-91 — silently relabelling a Dutch
//    project as English; the action has no guard of its own, so the UI is the
//    guard and this is its test);
//  · ruling 10 round trips (en-default ⇒ null, nl-default ⇒ declaration SURVIVES);
//  · Auto-translate is greyed and INERT (present, aria-disabled, writes nothing);
//  · the switcher control is disabled single-locale and writes when multi;
//  · the pane is reachable through SeoSettingsModal on a project with NO pages
//    (the Languages branch must precede the `!page` guard).
//
// The store is REAL (`createEditStore`) so every assertion is about actual store
// state, not a spy on a handler. Repo convention: react-dom/client + act, no
// @testing-library.

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useStore } from 'zustand';
import { createEditStore, type EditStoreInstance } from '@/stores/editStore';
import type { EditStore } from '@/types/store';

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { confirmDialog } = vi.hoisted(() => ({ confirmDialog: vi.fn() }));

let store: EditStoreInstance;

vi.mock('@/hooks/useEditStore', () => ({
  useEditStore: <T,>(selector: (s: EditStore) => T) => useStore(store, selector),
  useEditStoreApi: () => store,
}));

vi.mock('@/components/ui/ConfirmDialog', () => ({ confirmDialog }));

import { LanguagesPanel } from './LanguagesPanel';
import { SeoSettingsModal } from './SeoSettingsModal';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  store = createEditStore(`lang-panel-${Math.random()}`);
  confirmDialog.mockReset();
  confirmDialog.mockResolvedValue(true);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.innerHTML = '';
});

function setState(recipe: (s: any) => void) {
  act(() => store.setState(recipe as any));
}

function mount(node: React.ReactElement) {
  act(() => root.render(node));
}

function click(el: Element | null | undefined) {
  if (!el) throw new Error('expected element to exist');
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

/** Flush the promise chain in `onRemove` (confirmDialog is async). */
async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

/** Root of a locale card, e.g. card('nl'). */
function card(loc: string): HTMLElement | null {
  return container.querySelector(`[data-locale="${loc}"]`);
}

/** Open the add-language list and click the option for `loc`. */
function addLanguage(loc: string) {
  const trigger = Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.includes('Add language'),
  );
  if (!trigger) throw new Error('no "Add language" trigger — the monolingual gate is back?');
  click(trigger);
  const option = Array.from(
    container.querySelectorAll('[role="listbox"] [role="option"]'),
  ).find((o) => o.textContent?.includes(loc.toUpperCase()));
  if (!option) throw new Error(`no add option for ${loc}`);
  click(option);
}

/** Open a non-default card's overflow menu and hit Remove. */
async function removeLanguage(loc: string) {
  const menuBtn = card(loc)?.querySelector('button[aria-haspopup="menu"]');
  if (!menuBtn) throw new Error(`no overflow menu on the ${loc} card`);
  click(menuBtn);
  const item = container.querySelector('[role="menu"] [role="menuitem"]');
  click(item);
  await settle();
}

/** The switcher-style segmented buttons. */
function styleButtons(): HTMLButtonElement[] {
  const group = container.querySelector('[role="group"][aria-label="Switcher style"]');
  return group ? Array.from(group.querySelectorAll('button')) : [];
}

describe('LanguagesPanel — the monolingual gate is GONE', () => {
  it('a fresh monolingual project (localeConfig null) can add a language', () => {
    expect(store.getState().localeConfig).toBeNull();
    mount(<LanguagesPanel />);

    // The default-locale card is drawn from nothing but `activeLocale`.
    expect(card('en'), 'monolingual project must still see its own language').not.toBeNull();
    expect(card('en')!.textContent).toContain('English');
    expect(card('en')!.textContent).toContain('Default');

    addLanguage('nl');

    expect(store.getState().localeConfig).toEqual({
      locales: ['en', 'nl'],
      defaultLocale: 'en',
    });
    // The store actions' choreography ran (a declare-then-leave must persist).
    expect(store.getState().localeEngaged).toBe(true);
    expect(store.getState().persistence.isDirty).toBe(true);
  });

  it('a monolingual NON-English project keeps its declared language as default', () => {
    setState((s) => {
      s.localeConfig = { locales: ['nl'], defaultLocale: 'nl' };
      s.activeLocale = 'nl';
    });
    mount(<LanguagesPanel />);
    expect(card('nl')!.textContent).toContain('Default');

    addLanguage('en');
    expect(store.getState().localeConfig).toEqual({
      locales: ['nl', 'en'],
      defaultLocale: 'nl',
    });
  });

  it('renders nothing new to the store just by being looked at (zero-diff)', () => {
    mount(<LanguagesPanel />);
    expect(store.getState().localeConfig).toBeNull();
    expect(store.getState().localeEngaged).toBe(false);
    expect(store.getState().persistence.isDirty).toBe(false);
  });
});

describe('LanguagesPanel — the default locale is non-removable', () => {
  it('offers no remove affordance on the default card, and never offers it as addable', () => {
    setState((s) => {
      s.localeConfig = { locales: ['nl', 'en'], defaultLocale: 'nl' };
      s.activeLocale = 'nl';
    });
    mount(<LanguagesPanel />);

    // Default card: Default pill, NO overflow menu.
    expect(card('nl')!.textContent).toContain('Default');
    expect(
      card('nl')!.querySelector('button[aria-haspopup="menu"]'),
      'the DEFAULT locale must never expose Remove — removeLocale would clear the whole config',
    ).toBeNull();
    // Non-default card: overflow menu present.
    expect(card('en')!.querySelector('button[aria-haspopup="menu"]')).not.toBeNull();

    // Exactly one removable card, and it is not the default.
    const menus = container.querySelectorAll('button[aria-haspopup="menu"]');
    expect(menus.length).toBe(1);
    expect(menus[0].getAttribute('aria-label')).toContain('English');
  });

  it('never lists the default locale in the add list', () => {
    setState((s) => {
      s.localeConfig = { locales: ['nl'], defaultLocale: 'nl' };
      s.activeLocale = 'nl';
    });
    mount(<LanguagesPanel />);
    const trigger = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Add language'),
    )!;
    click(trigger);
    const codes = Array.from(container.querySelectorAll('[role="listbox"] [role="option"]')).map(
      (o) => o.textContent?.trim().slice(0, 2),
    );
    expect(codes).not.toContain('NL');
    expect(codes).toContain('EN');
  });
});

describe('LanguagesPanel — ruling 10 round trips', () => {
  it('en-default: add nl then remove nl ⇒ localeConfig back to null', async () => {
    mount(<LanguagesPanel />);
    addLanguage('nl');
    expect(store.getState().localeConfig).not.toBeNull();

    await removeLanguage('nl');

    expect(confirmDialog).toHaveBeenCalledTimes(1);
    expect(store.getState().localeConfig).toBeNull();
    // Still engaged, so save() sends the EXPLICIT null that CLEARS the row.
    expect(store.getState().localeEngaged).toBe(true);
  });

  it('nl-default: add en then remove en ⇒ the Dutch declaration SURVIVES', async () => {
    setState((s) => {
      s.localeConfig = { locales: ['nl'], defaultLocale: 'nl' };
      s.activeLocale = 'nl';
    });
    mount(<LanguagesPanel />);
    addLanguage('en');
    expect(store.getState().localeConfig!.locales).toEqual(['nl', 'en']);

    await removeLanguage('en');

    expect(
      store.getState().localeConfig,
      'dropping to single locale must NOT erase a non-English site language',
    ).toEqual({ locales: ['nl'], defaultLocale: 'nl' });
  });

  it('a declined confirm removes nothing', async () => {
    confirmDialog.mockResolvedValue(false);
    setState((s) => {
      s.localeConfig = { locales: ['en', 'nl'], defaultLocale: 'en' };
    });
    mount(<LanguagesPanel />);

    await removeLanguage('nl');

    expect(store.getState().localeConfig!.locales).toEqual(['en', 'nl']);
  });
});

describe('LanguagesPanel — honest subline', () => {
  it('counts authored overlay fields, and says 0 when there are none', () => {
    setState((s) => {
      s.localeConfig = { locales: ['en', 'nl'], defaultLocale: 'en' };
      s.localeContent = {
        nl: {
          'hero-1': { headline: 'Hallo', subheadline: 'Wereld' },
          'cta-1': { cta_text: 'Ga' },
        },
      };
    });
    mount(<LanguagesPanel />);
    expect(card('nl')!.textContent).toContain('3 translated fields');
    // Never the mock's "Auto-translated · 3 edits" — nothing auto-translates yet.
    expect(container.textContent).not.toContain('Auto-translated');

    setState((s) => {
      s.localeContent = {};
    });
    expect(card('nl')!.textContent).toContain('0 translated fields');
  });
});

describe('LanguagesPanel — greyed placeholders (present, inert)', () => {
  it('Auto-translate renders greyed + aria-disabled with the toggle OFF, and writes nothing', () => {
    setState((s) => {
      s.localeConfig = { locales: ['en', 'nl'], defaultLocale: 'en' };
    });
    mount(<LanguagesPanel />);

    const greyed = Array.from(container.querySelectorAll('[aria-disabled="true"]')).find((el) =>
      el.textContent?.includes('Auto-translate'),
    );
    expect(greyed, 'Auto-translate must be rendered greyed, not omitted').toBeTruthy();
    expect(greyed!.className).toContain('app-coming');

    const toggle = greyed!.querySelector('button[role="switch"]');
    expect(toggle, 'the handoff draws a toggle — it must be present, just dead').not.toBeNull();
    expect(toggle!.getAttribute('data-state')).toBe('unchecked');
    expect(toggle!.hasAttribute('disabled')).toBe(true);

    const before = JSON.stringify(store.getState().localeConfig);
    click(toggle);
    expect(store.getState().localeConfig).toEqual(JSON.parse(before));
    expect(store.getState().persistence.isDirty).toBe(false);
  });

  it('the change-site-language affordance on the default card is greyed', () => {
    setState((s) => {
      s.localeConfig = { locales: ['en', 'nl'], defaultLocale: 'en' };
    });
    mount(<LanguagesPanel />);
    expect(card('en')!.querySelector('[aria-disabled="true"].app-coming')).not.toBeNull();
  });
});

describe('LanguagesPanel — switcher style', () => {
  it('is disabled (and writes nothing) on a single-locale project', () => {
    mount(<LanguagesPanel />);
    const [dropdown, none] = styleButtons();
    expect(dropdown.hasAttribute('disabled')).toBe(true);
    expect(none.hasAttribute('disabled')).toBe(true);
    // Default reads as Dropdown = today's published behavior.
    expect(dropdown.getAttribute('aria-pressed')).toBe('true');

    click(none);
    expect(store.getState().localeConfig).toBeNull();
    expect(store.getState().persistence.isDirty).toBe(false);
  });

  it('writes switcherStyle on a multi-locale project', () => {
    setState((s) => {
      s.localeConfig = { locales: ['en', 'nl'], defaultLocale: 'en' };
    });
    mount(<LanguagesPanel />);
    const [dropdown, none] = styleButtons();
    expect(none.hasAttribute('disabled')).toBe(false);

    click(none);
    expect(store.getState().localeConfig!.switcherStyle).toBe('none');
    expect(none.getAttribute('aria-pressed')).toBe('true');

    click(dropdown);
    expect(store.getState().localeConfig!.switcherStyle).toBe('dropdown');
  });
});

describe('SeoSettingsModal — the Languages pane', () => {
  const origFetch = global.fetch;
  beforeEach(() => {
    // The modal fetches the plan for its Pro gate; keep it deterministic.
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ features: { trackingPixels: false } }),
    }) as any;
  });
  afterEach(() => {
    global.fetch = origFetch;
  });

  /** The modal portals into document.body, not `container`. */
  function railRow(label: string): HTMLElement | null {
    return (
      Array.from(document.body.querySelectorAll('nav[aria-label="Site settings"] button')).find(
        (b) => b.textContent?.includes(label),
      ) as HTMLElement | undefined
    ) ?? null;
  }

  it('is reachable on a project with NO pages (branch precedes the "No pages found" guard)', async () => {
    setState((s) => {
      s.pages = {};
    });
    mount(<SeoSettingsModal onClose={() => {}} />);
    await settle();

    expect(document.body.textContent).toContain('No pages found.');

    click(railRow('Languages'));

    expect(
      document.body.textContent,
      'a page-less project must still reach Languages',
    ).not.toContain('No pages found.');
    expect(document.body.textContent).toContain('Offer your site in more than one language.');
    expect(document.body.textContent).toContain('Site settings · Languages');
  });

  it('shows the declared-locale count on the rail row and does not reuse the Domain glyph', async () => {
    setState((s) => {
      s.pages = {};
      s.localeConfig = { locales: ['en', 'nl'], defaultLocale: 'en' };
    });
    mount(<SeoSettingsModal onClose={() => {}} />);
    await settle();

    expect(railRow('Languages')!.textContent).toContain('2');

    // Icon collision: `language` belongs to the Languages row; Domain moved to
    // `public`. Two rail rows sharing a glyph reads as a bug.
    const nav = document.body.querySelector('nav[aria-label="Site settings"]')!;
    const domain = Array.from(nav.children).find((el) => el.textContent?.includes('Domain'))!;
    expect(domain.textContent).toContain('public');
    expect(domain.textContent).not.toContain('language');
  });
});
