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
// The schema builder has its own contract suite; stub it so this file is about
// the panel only (and so opening the modal cannot portal a second dialog in).
vi.mock('./AddCollectionModal', () => ({
  AddCollectionModal: ({ open }: { open: boolean }) =>
    open ? <div data-collection-modal="" /> : null,
}));

import { CmsPanel, MANAGE_COLLECTIONS_EVENT } from './CmsPanel';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
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

/** Popover content is portalled to document.body — query globally. */
function q<T extends Element = HTMLElement>(sel: string): T | null {
  return document.querySelector<T>(sel);
}
function must<T extends Element = HTMLElement>(sel: string): T {
  const el = q<T>(sel);
  if (!el) throw new Error(`not found: ${sel}`);
  return el;
}
function openMenu() {
  act(() => must<HTMLButtonElement>('button[aria-label="Collections"]').click());
}

describe('CmsPanel — listing', () => {
  it('lists the project’s collections with an item·field count', () => {
    openMenu();
    const row = must('[data-collection-row="col_1"]');
    expect(row.textContent).toContain('Books');
    expect(row.textContent).toContain('1·1'); // 1 item · 1 field
  });

  it('refreshes on OPEN, not on mount (mounting must not add a request per editor load)', () => {
    expect(refreshCmsData).not.toHaveBeenCalled();
    openMenu();
    expect(refreshCmsData).toHaveBeenCalledTimes(1);
  });

  it('places the collection on the current page via addCmsSection', () => {
    openMenu();
    act(() => must<HTMLButtonElement>('[data-collection-place="col_1"]').click());
    expect(addCmsSection).toHaveBeenCalledWith('col_1');
  });
});

describe('CmsPanel — delete is TWO writes', () => {
  async function clickDelete() {
    openMenu();
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
  it('opens on the `lessgo:manage-collections` window event the placed block fires', () => {
    expect(q('[data-collection-row="col_1"]')).toBeNull();

    act(() => {
      window.dispatchEvent(
        new CustomEvent(MANAGE_COLLECTIONS_EVENT, { detail: { collectionId: 'col_1' } })
      );
    });

    expect(q('[data-collection-row="col_1"]')).not.toBeNull();
    expect(refreshCmsData).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on unmount (no listener leak across editor remounts)', () => {
    act(() => root.unmount());
    act(() => {
      window.dispatchEvent(new CustomEvent(MANAGE_COLLECTIONS_EVENT));
    });
    expect(refreshCmsData).not.toHaveBeenCalled();

    // afterEach unmounts again; re-root so that call is harmless.
    root = createRoot(container);
  });
});
