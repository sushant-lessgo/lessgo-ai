// cms-collections phase 7 — GroupManager CONTRACT tests.
//
// Repo convention (no @testing-library/react): react-dom/client + React.act,
// driving real DOM events. See ItemEditor.test.tsx / field-row-list.test.tsx.
//
// What earns its keep here:
//
//  1. ⚠️ REORDER SENDS THE WHOLE LIST, RENUMBERED FROM 0. This is the load-bearing
//     claim in GroupManager's header and it had ZERO coverage. `PATCH /groups`
//     takes `{groups:[{id, name?, order?}]}`; sending only the two swapped rows
//     leaves gaps/ties whenever stored orders are not already 0..n-1 (they are not,
//     after a delete) — and ties render in insertion order, which looks to the user
//     exactly like the reorder silently failed. The fixture therefore uses SPARSE,
//     post-delete orders (0, 5, 9): a two-row swap would pass a "the ids moved"
//     assertion while still emitting broken orders, so these assert the FULL array.
//
//  2. Rename / delete / add payloads — including that delete is a DELETE with the
//     group in the query string, not a body.
//
//  3. A REJECTED rename REVERTS the input. The name field is uncontrolled (commit
//     on blur, never per keystroke), so the DOM holds the typed text: without an
//     explicit revert the rejected name keeps showing next to the error banner, as
//     if the server had accepted it.

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { GroupManager } from './GroupManager';
import type { CmsGroup } from '@/modules/cms/types';

// The confirm is a portalled Radix dialog; this unit only cares that delete is
// gated by it. `confirmAnswer` lets each test decide.
let confirmAnswer = true;
const confirmCalls: Array<Record<string, unknown>> = [];
vi.mock('@/components/ui/ConfirmDialog', () => ({
  confirmDialog: async (opts: Record<string, unknown>) => {
    confirmCalls.push(opts);
    return confirmAnswer;
  },
}));

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;
let fetchMock: ReturnType<typeof vi.fn>;

/** SPARSE orders on purpose — this is what the list looks like after a delete. */
const GROUPS: CmsGroup[] = [
  { id: 'g1', collectionId: 'col_1', name: 'Fiction', order: 0 },
  { id: 'g2', collectionId: 'col_1', name: 'Essays', order: 5 },
  { id: 'g3', collectionId: 'col_1', name: 'Poetry', order: 9 },
];

beforeEach(() => {
  confirmAnswer = true;
  confirmCalls.length = 0;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }));
  (globalThis as any).fetch = fetchMock;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

function must<T extends Element = HTMLElement>(selector: string): T {
  const el = container.querySelector<T>(selector);
  if (!el) throw new Error(`not found: ${selector}`);
  return el;
}
function click(selector: string) {
  act(() => {
    (must(selector) as HTMLElement).click();
  });
}

function render(props: Partial<React.ComponentProps<typeof GroupManager>> = {}) {
  act(() =>
    root.render(
      <GroupManager
        tokenId="tok_test"
        collectionId="col_1"
        groups={GROUPS}
        {...props}
      />
    )
  );
}

function lastCall() {
  const call = fetchMock.mock.calls.at(-1);
  if (!call) throw new Error('fetch was never called');
  return call;
}
function lastUrl(): string {
  return String(lastCall()[0]);
}
function lastMethod(): string {
  return String((lastCall()[1] as RequestInit).method);
}
function lastBody(): any {
  return JSON.parse((lastCall()[1] as RequestInit).body as string);
}

/** React tracks the value setter, so a raw `.value =` is invisible to onChange. */
function setNativeValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )!.set!;
  act(() => {
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

/** Uncontrolled input: type then commit. `focusout` — `blur` does not bubble. */
function typeAndBlur(selector: string, value: string) {
  const el = must<HTMLInputElement>(selector);
  setNativeValue(el, value);
  act(() => {
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  });
}

/* ------------------------------------------------------------- 1. reorder */

describe('reorder', () => {
  it('renders groups in stored order', () => {
    render();
    const names = Array.from(
      container.querySelectorAll<HTMLElement>('[data-group-row]')
    ).map((n) => n.getAttribute('data-group-row'));
    expect(names).toEqual(['g1', 'g2', 'g3']);
  });

  it('moving DOWN sends the whole list renumbered from 0', () => {
    render();
    click('[data-group-down="g1"]');

    expect(lastMethod()).toBe('PATCH');
    expect(lastUrl()).toBe('/api/collections/col_1/groups');
    // Not just "g2 is before g1" — the ORDERS are the point. The stored ones were
    // 0/5/9; anything that forwards those, or renumbers only the swapped pair,
    // leaves ties or gaps and the reorder appears to do nothing.
    expect(lastBody()).toEqual({
      tokenId: 'tok_test',
      groups: [
        { id: 'g2', order: 0 },
        { id: 'g1', order: 1 },
        { id: 'g3', order: 2 },
      ],
    });
  });

  it('moving UP sends the whole list renumbered from 0', () => {
    render();
    click('[data-group-up="g3"]');
    expect(lastBody().groups).toEqual([
      { id: 'g1', order: 0 },
      { id: 'g3', order: 1 },
      { id: 'g2', order: 2 },
    ]);
  });

  it('cannot move the first up or the last down', () => {
    render();
    expect(must<HTMLButtonElement>('[data-group-up="g1"]').disabled).toBe(true);
    expect(must<HTMLButtonElement>('[data-group-down="g3"]').disabled).toBe(true);
    expect(must<HTMLButtonElement>('[data-group-up="g3"]').disabled).toBe(false);
    expect(must<HTMLButtonElement>('[data-group-down="g1"]').disabled).toBe(false);
  });

  it('sorts by stored order before renumbering, not by array position', () => {
    // Same rows, shuffled as the API might hand them back.
    render({ groups: [GROUPS[2], GROUPS[0], GROUPS[1]] });
    click('[data-group-down="g1"]');
    expect(lastBody().groups).toEqual([
      { id: 'g2', order: 0 },
      { id: 'g1', order: 1 },
      { id: 'g3', order: 2 },
    ]);
  });
});

/* -------------------------------------------------------------- 2. rename */

describe('rename', () => {
  it('PATCHes just the renamed group, by id', () => {
    render();
    typeAndBlur('[data-group-name="g2"]', 'Long Reads');
    expect(lastMethod()).toBe('PATCH');
    expect(lastBody()).toEqual({
      tokenId: 'tok_test',
      groups: [{ id: 'g2', name: 'Long Reads' }],
    });
  });

  it('does not write when the name is unchanged or blank', () => {
    render();
    typeAndBlur('[data-group-name="g2"]', 'Essays');
    typeAndBlur('[data-group-name="g1"]', '   ');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('REVERTS the input when the server rejects the rename', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: 'A group called "Essays" already exists.' }),
    } as any);
    render();

    typeAndBlur('[data-group-name="g1"]', 'Essays');
    await act(async () => {});

    // The banner alone is not enough: the field is uncontrolled, so leaving the
    // rejected text in it reads as "saved".
    expect(must('[data-cms-group-error]').textContent).toContain('already exists');
    expect(must<HTMLInputElement>('[data-group-name="g1"]').value).toBe('Fiction');
  });

  it('REVERTS the input when the network fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    render();

    typeAndBlur('[data-group-name="g1"]', 'Whatever');
    await act(async () => {});

    expect(must('[data-cms-group-error]').textContent).toContain('Network error');
    expect(must<HTMLInputElement>('[data-group-name="g1"]').value).toBe('Fiction');
  });
});

/* -------------------------------------------------------------- 3. delete */

describe('delete', () => {
  it('confirms, then DELETEs with the group in the query string', async () => {
    render();
    click('[data-group-delete="g2"]');
    await act(async () => {});

    expect(confirmCalls).toHaveLength(1);
    // The confirm must say items survive — `groupId` is onDelete: SetNull.
    expect(String(confirmCalls[0].message)).toMatch(/ungrouped/i);

    expect(lastMethod()).toBe('DELETE');
    expect(lastUrl()).toBe('/api/collections/col_1/groups?tokenId=tok_test&groupId=g2');
    expect((lastCall()[1] as RequestInit).body).toBeUndefined();
  });

  it('writes nothing when the confirm is declined', async () => {
    confirmAnswer = false;
    render();
    click('[data-group-delete="g2"]');
    await act(async () => {});
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

/* ----------------------------------------------------------------- 4. add */

describe('add', () => {
  it('POSTs the trimmed name and clears the field', async () => {
    render();
    setNativeValue(must<HTMLInputElement>('[data-group-new-name]'), '  Reviews  ');
    click('[data-group-add]');
    await act(async () => {});

    expect(lastMethod()).toBe('POST');
    expect(lastUrl()).toBe('/api/collections/col_1/groups');
    expect(lastBody()).toEqual({ tokenId: 'tok_test', name: 'Reviews' });
    expect(must<HTMLInputElement>('[data-group-new-name]').value).toBe('');
  });

  it('cannot add an empty group', () => {
    render();
    expect(must<HTMLButtonElement>('[data-group-add]').disabled).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------ 5. onChanged */

describe('onChanged', () => {
  it('fires only after the server accepts', async () => {
    const onChanged = vi.fn();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as any);
    render({ onChanged });

    click('[data-group-down="g1"]');
    await act(async () => {});
    expect(onChanged).not.toHaveBeenCalled();

    click('[data-group-down="g1"]');
    await act(async () => {});
    expect(onChanged).toHaveBeenCalledTimes(1);
  });
});
