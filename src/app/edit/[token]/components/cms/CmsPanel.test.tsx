// cms-collections — CmsPanel: the DESTRUCTIVE path + the firewall handoff.
//
// Why this file exists: CmsPanel owns the only collection-DELETE trigger in the
// app, and deleting is TWO writes that must both happen —
//   1. DELETE /api/collections/:id   (server cascade: collection → groups → items)
//   2. removeCmsSectionsForCollection(id)  (the section PLACEMENTS, which the
//      server cascade CANNOT reach — content lives in the draft, not the tables)
// Skip (2) and the page keeps a `cmscollection` block pointing at a row that no
// longer exists; it publishes as an empty block forever. Skip (1) and we sweep
// the user's sections for a collection that still exists. So both are asserted,
// and so is the ORDER-OF-GUARD: a failed DELETE must sweep NOTHING.
//
// The second contract here is the firewall handoff: the placed block is renderer
// code and must not import app chrome, so it dispatches `lessgo:manage-collections`
// on window. If this panel stops listening, the block's Manage button goes dead
// with no type error and no failing render test.
//
// Repo convention: no @testing-library/react — react-dom/client + React.act,
// per GlobalAppHeader.menus.test.tsx.
//
// ── PHASE 8B: THE HOST MOVED, THE CONTRACTS DID NOT ──────────────────────────
// CmsPanel was a popover bar-control in GlobalAppHeader; it is now the body of
// the left rail's `CMS` tab. So the list is INLINE (there is no menu to open) and
// the data refresh fires on MOUNT — LeftPanel mounts the panel only while that
// tab is selected, which is how "never a request per editor load" survives the
// move. `openMenu()` is gone, every assertion below is not: the delete ordering
// guard, the `detail.collectionId` targeting and the listener teardown are
// unchanged, and the rail integration (tab renders the panel, header does not)
// is pinned at the bottom of this file.

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// vi.mock factories are hoisted above module scope — the spies must be too.
const { refreshCmsData, addCmsSection, removeCmsSectionsForCollection, confirmDialog } =
  vi.hoisted(() => ({
    refreshCmsData: vi.fn(),
    addCmsSection: vi.fn(),
    removeCmsSectionsForCollection: vi.fn(),
    confirmDialog: vi.fn(),
  }));

const COLLECTION = {
  id: 'col_1',
  projectId: 'p1',
  tokenId: 'tok',
  name: 'Books',
  slug: 'books',
  fieldSchema: [{ id: 'text_short', name: 'Title', type: 'text_short' as const }],
  roles: {},
  detailPages: false,
  layoutHint: null,
  order: 0,
};

const storeState = {
  // Mutable per-test (the works-row gate reads it through the same selector).
  // Default = a template WITHOUT the `works` capability.
  templateId: 'meridian' as string | null,
  cmsData: {
    bundles: {
      col_1: {
        collection: COLLECTION,
        groups: [],
        items: [
          {
            id: 'it_1',
            collectionId: 'col_1',
            groupId: null,
            slug: 'a',
            values: { text_short: 'Hi' },
            order: 0,
            slugLocked: false,
          },
        ],
      },
    },
    status: 'loaded' as const,
  },
  refreshCmsData,
  addCmsSection,
  removeCmsSectionsForCollection,
};

// Matches the host's surface exactly: a selector-callable hook OBJECT that also
// carries getState (CmsPanel reads actions through `useEditStore.getState()`).
vi.mock('@/hooks/useEditStore', () => ({
  useEditStore: Object.assign((selector: (s: any) => unknown) => selector(storeState), {
    getState: () => storeState,
  }),
}));
vi.mock('@/components/ui/ConfirmDialog', () => ({ confirmDialog }));
// LeftPanel's own dependencies (the rail-integration block at the bottom of this
// file mounts it). CmsPanel itself uses none of these.
vi.mock('@/components/EditProvider', () => ({
  useEditStoreContext: () => ({
    store: { getState: () => ({ setLeftPanelWidth: () => {}, toggleLeftPanel: () => {} }) },
    tokenId: 'tok',
  }),
  useStoreState: (selector: (s: any) => unknown) =>
    selector({
      leftPanel: { activeTab: 'pageStructure', collapsed: false, width: 300 },
      sections: ['hero-abc12345'],
      selectedSection: null,
    }),
}));
vi.mock('@/hooks/useReviewState', () => ({
  useReviewState: () => ({ guideTasks: [], allComplete: true }),
}));
// The schema builder has its own contract suite; stub it so this file is about
// the panel only (and so opening the modal cannot portal a second dialog in).
vi.mock('./AddCollectionModal', () => ({
  AddCollectionModal: ({ open }: { open: boolean }) =>
    open ? <div data-collection-modal="" /> : null,
}));

import { CmsPanel, MANAGE_COLLECTIONS_EVENT } from './CmsPanel';
import { LeftPanel } from '../layout/LeftPanel';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  storeState.templateId = 'meridian'; // reset the works-row gate between tests
  confirmDialog.mockResolvedValue(true);
  fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }));
  (globalThis as any).fetch = fetchMock;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<CmsPanel tokenId="tok" />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** The browser dialog is portalled to document.body — query globally. */
function q<T extends Element = HTMLElement>(sel: string): T | null {
  return document.querySelector<T>(sel);
}
function must<T extends Element = HTMLElement>(sel: string): T {
  const el = q<T>(sel);
  if (!el) throw new Error(`not found: ${sel}`);
  return el;
}

describe('CmsPanel — listing', () => {
  it('lists the project’s collections with an item·field count', () => {
    const row = must('[data-collection-row="col_1"]');
    expect(row.textContent).toContain('Books');
    expect(row.textContent).toContain('1·1'); // 1 item · 1 field
  });

  // Same invariant as the phase-6 popover version ("never a request per editor
  // load"), now upheld by the HOST: LeftPanel mounts this panel only while the
  // CMS tab is selected, so mounting IS opening — and it must fetch exactly once.
  it('refreshes ONCE on mount (mount == the user opening the CMS tab)', () => {
    expect(refreshCmsData).toHaveBeenCalledTimes(1);
  });

  it('places the collection on the current page via addCmsSection', () => {
    act(() => must<HTMLButtonElement>('[data-collection-place="col_1"]').click());
    expect(addCmsSection).toHaveBeenCalledWith('col_1');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// THE WORKS DEEP-LINK ROW (section-background phase 5 / D1)
//
// The dashboard board shipped this row; the editor rail omitted it, so the two
// halves of the same system did not read as one. Both DIRECTIONS are pinned: an
// always-rendered row and an always-hidden row would each pass a one-sided test.
// ────────────────────────────────────────────────────────────────────────────
describe('CmsPanel — works library deep link', () => {
  const remount = () => {
    act(() => root.render(<CmsPanel tokenId="tok" />));
  };
  const link = () => q<HTMLAnchorElement>('[data-testid="cms-works-link"]');

  it('renders the deep link for a works-capable template', () => {
    storeState.templateId = 'atelier';
    remount();

    const a = link();
    expect(a).not.toBeNull();
    expect(a!.getAttribute('href')).toBe('/dashboard/tok/work');
    expect(a!.textContent).toContain('Works library');
  });

  it('does NOT render it for a template without the works capability', () => {
    storeState.templateId = 'meridian'; // real template, no `works` capability
    remount();
    expect(link()).toBeNull();
  });

  it('does NOT render it when the project has no templateId at all', () => {
    storeState.templateId = null;
    remount();
    expect(link()).toBeNull();
  });
});

describe('CmsPanel — delete is TWO writes', () => {
  async function clickDelete() {
    await act(async () => {
      must<HTMLButtonElement>('[data-collection-delete="col_1"]').click();
    });
  }

  it('confirms, DELETEs the row, THEN sweeps the section placements', async () => {
    await clickDelete();

    expect(confirmDialog).toHaveBeenCalledTimes(1);
    expect(confirmDialog.mock.calls[0][0]).toMatchObject({ destructive: true });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/collections/col_1');
    expect(url).toContain('tokenId=tok');
    expect(init.method).toBe('DELETE');

    // The half the server cannot do. Without it the page keeps a dead block.
    expect(removeCmsSectionsForCollection).toHaveBeenCalledWith('col_1');
    expect(refreshCmsData).toHaveBeenCalled();
  });

  it('cancelling deletes NOTHING — no request, no sweep', async () => {
    confirmDialog.mockResolvedValueOnce(false);
    await clickDelete();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(removeCmsSectionsForCollection).not.toHaveBeenCalled();
  });

  it('a FAILED delete does not sweep (never destroy sections for a live collection)', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    await clickDelete();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(removeCmsSectionsForCollection).not.toHaveBeenCalled();
  });
});

describe('CmsPanel — firewall handoff', () => {
  // In the rail the list is ALREADY on screen, so "opens" collapses to "refreshes
  // and targets". The refresh half still matters: the block's Manage button is
  // fired from the canvas, where the panel's cache may be minutes stale.
  it('refreshes on the `lessgo:manage-collections` window event the placed block fires', () => {
    expect(refreshCmsData).toHaveBeenCalledTimes(1); // the mount fetch

    act(() => {
      window.dispatchEvent(
        new CustomEvent(MANAGE_COLLECTIONS_EVENT, { detail: { collectionId: 'col_1' } })
      );
    });

    expect(q('[data-collection-row="col_1"]')).not.toBeNull();
    expect(refreshCmsData).toHaveBeenCalledTimes(2);
  });

  // The mount-time half of the two-listener handoff: when the event arrives while
  // the CMS tab is NOT selected, this panel does not exist to hear it — LeftPanel
  // switches tabs and forwards the id, and the panel must open ON that collection
  // from its very first render. Ignoring the prop would silently reduce every
  // canvas "Manage items" click (the common path) to "the list, go find it".
  it('opens the browser on `initialCollectionId` given at mount', () => {
    act(() => root.unmount());
    container.remove();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<CmsPanel tokenId="tok" initialCollectionId="col_1" />));

    const browser = must('[data-cms-browser]');
    expect(browser.textContent).toContain('Books');
  });

  // The event carries `{collectionId}`. Ignoring it (the pre-phase-7 behaviour)
  // made "Manage items" on a placed block open a GENERIC collection list — the
  // user had to hunt, in a menu, for the collection they had just clicked on.
  // Both surfaces are real now: the list still opens (pinned above), and with an
  // id the browser opens ON that collection.
  it('opens the item browser on the collection named in `detail.collectionId`', () => {
    act(() => {
      window.dispatchEvent(
        new CustomEvent(MANAGE_COLLECTIONS_EVENT, { detail: { collectionId: 'col_1' } })
      );
    });

    const browser = must('[data-cms-browser]');
    // The right collection, not merely "a browser": its name and ITS item.
    expect(browser.textContent).toContain('Books');
    expect(q('[data-item-card="it_1"]')).not.toBeNull();
  });

  it('a detail-less event opens the list ONLY (no browser to dismiss)', () => {
    act(() => {
      window.dispatchEvent(new CustomEvent(MANAGE_COLLECTIONS_EVENT));
    });

    expect(q('[data-collection-row="col_1"]')).not.toBeNull();
    expect(q('[data-cms-browser]')).toBeNull();
  });

  it('unsubscribes on unmount (no listener leak across editor remounts)', () => {
    act(() => root.unmount());
    refreshCmsData.mockClear(); // discard the mount fetch
    act(() => {
      window.dispatchEvent(new CustomEvent(MANAGE_COLLECTIONS_EVENT));
    });
    expect(refreshCmsData).not.toHaveBeenCalled();

    // afterEach unmounts again; re-root so that call is harmless.
    root = createRoot(container);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// RAIL INTEGRATION (phase 8B) — the CMS entry point is the rail tab, and there
// is exactly ONE of them.
//
// What this defends: phase 6 shipped a greyed "CMS — coming soon" rail tab AND a
// working Collections button in the header. Either half regressing (the tab going
// back to <Coming>, or a second entry reappearing) is invisible to every other
// test in the repo — GlobalAppHeader.menus.test.tsx never knew about CmsPanel.
// ────────────────────────────────────────────────────────────────────────────

describe('LeftPanel — the CMS rail tab is the CMS entry point', () => {
  let railContainer: HTMLDivElement;
  let railRoot: Root;

  const mountRail = () => {
    railContainer = document.createElement('div');
    document.body.appendChild(railContainer);
    railRoot = createRoot(railContainer);
    act(() => railRoot.render(<LeftPanel />));
  };

  const tab = (label: string) =>
    Array.from(railContainer.querySelectorAll<HTMLButtonElement>('[role="radio"]')).find(
      (b) => (b.textContent || '').trim() === label
    );

  beforeEach(mountRail);
  afterEach(() => {
    act(() => railRoot.unmount());
    railContainer.remove();
  });

  it('renders a LIVE CMS tab — not the greyed <Coming> placeholder', () => {
    const cms = tab('Content');
    expect(cms).toBeTruthy();
    // <Coming> marks its child aria-disabled and swallows clicks. If the tab
    // regressed to a placeholder, this is what would come back.
    expect(cms!.getAttribute('aria-disabled')).toBeNull();
    expect(cms!.querySelector('[aria-disabled="true"]')).toBeNull();
    expect(cms!.disabled).toBe(false);
  });

  it('selecting the CMS tab renders the collections panel; Sections does not', () => {
    expect(railContainer.querySelector('[data-cms-panel]')).toBeNull();

    act(() => tab('Content')!.click());
    expect(railContainer.querySelector('[data-cms-panel]')).not.toBeNull();
    expect(railContainer.querySelector('[data-collection-row="col_1"]')).not.toBeNull();

    act(() => tab('Sections')!.click());
    expect(railContainer.querySelector('[data-cms-panel]')).toBeNull();
  });

  /** The rendered `Sections` list row for the mocked `hero-abc12345` section. */
  const sectionRow = () =>
    Array.from(railContainer.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      (b.textContent || '').includes('Hero')
    );

  it('Pages / Theme stay inert — clicking them never swaps the body', () => {
    for (const label of ['Pages', 'Theme']) {
      const t = tab(label);
      expect(t, label).toBeTruthy();
      act(() => t!.click());
      // The body must STILL be the sections list. Asserting only "no CMS panel"
      // would also pass if Pages went live with a body of its own — which is not
      // what this test claims to check.
      expect(sectionRow(), label).toBeTruthy();
      expect(railContainer.querySelector('[data-cms-panel]'), label).toBeNull();
    }
  });

  // Phase 6 shipped the same family of bug with `editing`: a one-shot cue that is
  // never cleared re-fires on every later mount. Here, `cmsTarget` survived the
  // mount that consumed it, so leaving CMS and coming back re-opened the item
  // browser the user had already closed.
  it('the "Manage items" target is consumed ONCE — returning to CMS shows the list', () => {
    // The file-level standalone CmsPanel hears the same window event and portals
    // its OWN browser dialog to document.body; unmount it so the assertions below
    // can only be about the RAIL's panel. (afterEach unmounts again — re-rooted
    // at the end, per the teardown test above.)
    act(() => root.unmount());

    act(() => {
      window.dispatchEvent(
        new CustomEvent(MANAGE_COLLECTIONS_EVENT, { detail: { collectionId: 'col_1' } })
      );
    });
    // The browser renders in a portal, so it is document- not rail-scoped
    // (same query as the targeting test above).
    expect(document.querySelector('[data-cms-browser]')).not.toBeNull();

    act(() => tab('Sections')!.click());
    act(() => tab('Content')!.click());

    expect(railContainer.querySelector('[data-cms-panel]')).not.toBeNull();
    expect(document.querySelector('[data-cms-browser]')).toBeNull();
    expect(railContainer.querySelector('[data-collection-row="col_1"]')).not.toBeNull();

    root = createRoot(container);
  });

  // The block's "Manage items" button fires this from the CANVAS, where the rail
  // is almost always on the Sections tab — so the rail has to switch itself.
  it('a `lessgo:manage-collections` event switches to CMS and targets the collection', () => {
    expect(railContainer.querySelector('[data-cms-panel]')).toBeNull();

    act(() => {
      window.dispatchEvent(
        new CustomEvent(MANAGE_COLLECTIONS_EVENT, { detail: { collectionId: 'col_1' } })
      );
    });

    expect(railContainer.querySelector('[data-cms-panel]')).not.toBeNull();
    expect(document.querySelector('[data-cms-browser]')!.textContent).toContain('Books');
  });
});
