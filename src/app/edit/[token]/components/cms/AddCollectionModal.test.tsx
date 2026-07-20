// cms-collections phase 6 — t12 schema builder CONTRACT tests.
//
// Repo convention (no @testing-library/react): react-dom/client + React.act,
// driving real DOM events. See src/components/ui/field-row-list.test.tsx.
//
// These assert BEHAVIOUR, not pixels:
//  1. the create payload (schema + roles + detailPages) actually sent to
//     POST /api/collections, incl. FIELD_ID_REGEX-valid ids — numeric-ish ids are
//     silently mangled by `coercePublishValue` at publish, so the regex is a
//     correctness gate, not a style rule;
//  2. the per-row role menu is TYPE-FILTERED (ruling #5) — a cover role must not
//     be offerable on a text field;
//  3. the greyed preset chips are PRESENT and DISABLED (ruling #1). This is a
//     contract, not decoration: the greyed-placeholder rule says ship the
//     capability visible-but-disabled with a why, never silently omit it. A test
//     that only checked "Blank exists" would let someone delete them unnoticed.
//     <Coming> greys via `aria-disabled` (NOT `disabled`, which would swallow the
//     tooltip's pointer events) — so aria-disabled IS the repo's disabled state.
//  4. the CREATES THESE PAGES tiles react to the detailPages switch (ruling #6).

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AddCollectionModal, nextFieldId, rolesForType } from './AddCollectionModal';
import { FIELD_ID_REGEX, FIELD_TYPES } from '@/lib/schemas/collection.schema';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  fetchMock = vi.fn(async () => ({
    ok: true,
    status: 201,
    json: async () => ({ collection: { id: 'col_1' } }),
  }));
  (globalThis as any).fetch = fetchMock;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

/** Dialog + popover content are portalled to document.body — query globally. */
function q<T extends Element = HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}
function must<T extends Element = HTMLElement>(selector: string): T {
  const el = q<T>(selector);
  if (!el) throw new Error(`not found: ${selector}`);
  return el;
}
function click(selector: string) {
  act(() => {
    (must(selector) as HTMLElement).click();
  });
}

function renderModal(props: Partial<React.ComponentProps<typeof AddCollectionModal>> = {}) {
  act(() =>
    root.render(
      <AddCollectionModal
        open
        onOpenChange={() => {}}
        tokenId="tok_test"
        {...props}
      />
    )
  );
}

function typeName(value: string) {
  const input = must<HTMLInputElement>('[data-slug-name]');
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

/** Open the "+ Add field" menu and pick a type. */
function addField(type: string) {
  click('[data-add-field-trigger]');
  click(`[data-add-field-type="${type}"]`);
}

function bodyOfLastFetch() {
  const call = fetchMock.mock.calls.at(-1)!;
  return JSON.parse((call[1] as RequestInit).body as string);
}

describe('nextFieldId (pure) — coercion-proof ids', () => {
  it('mints letter-prefixed ids that satisfy FIELD_ID_REGEX', () => {
    expect(nextFieldId('text_short', [])).toBe('text_short');
    expect(nextFieldId('text_short', ['text_short'])).toBe('text_short_2');
    expect(nextFieldId('text_short', ['text_short', 'text_short_2'])).toBe('text_short_3');
    for (const id of ['text_short', 'text_short_2', nextFieldId('image', [])]) {
      expect(FIELD_ID_REGEX.test(id)).toBe(true);
    }
  });

  // Previously only text_short/image were pinned — a type whose name started with
  // a digit (or that minted a bare-number suffix) would have slipped through and
  // been mangled by `coercePublishValue` at publish time only.
  it('satisfies FIELD_ID_REGEX for ALL 10 types, fresh / clamped / unique', () => {
    expect(FIELD_TYPES).toHaveLength(10);
    for (const type of FIELD_TYPES) {
      const fresh = nextFieldId(type, []);
      const clamped = nextFieldId(type, [type, `${type}_2`]);
      const unique = nextFieldId(type, [type], { unique: true });
      for (const id of [fresh, clamped, unique]) {
        expect(FIELD_ID_REGEX.test(id), `${type} → ${id}`).toBe(true);
      }
      expect(clamped).toBe(`${type}_3`);
      expect(unique).not.toBe(type);
    }
  });

  it('never mints an id that is already reserved (unique mode included)', () => {
    // The whole point of the reserved set: an id an ITEM holds a value under is
    // off-limits even though it is no longer in the schema.
    expect(nextFieldId('text_short', ['text_short'])).not.toBe('text_short');
    for (let i = 0; i < 50; i++) {
      const id = nextFieldId('text_short', ['text_short', 'text_short_2'], {
        unique: true,
      });
      expect(id).not.toBe('text_short');
      expect(id).not.toBe('text_short_2');
      expect(FIELD_ID_REGEX.test(id)).toBe(true);
    }
  });
});

describe('rolesForType (pure) — ruling #5 type filter', () => {
  it('offers each role only on the types the schema allows', () => {
    expect(rolesForType('text_short')).toEqual(['title']);
    expect(rolesForType('image')).toEqual(['cover']);
    expect(rolesForType('gallery')).toEqual(['cover']);
    expect(rolesForType('link')).toEqual(['primaryLink']);
    // types with no role at all
    expect(rolesForType('date')).toEqual([]);
    expect(rolesForType('text_long')).toEqual([]);
  });
});

describe('AddCollectionModal — create payload', () => {
  it('POSTs the schema, roles and detailPages the user actually built', async () => {
    renderModal();
    typeName('Books');

    addField('image');
    addField('text_short');
    addField('link');

    // roles, via the per-row menus
    click('[data-role-trigger="image"]');
    click('[data-role-option="image:cover"]');
    click('[data-role-trigger="text_short"]');
    click('[data-role-option="text_short:title"]');
    click('[data-role-trigger="link"]');
    click('[data-role-option="link:primaryLink"]');

    // detailPages ON
    click('[data-detail-pages]');

    await act(async () => {
      (must('[data-cms-modal-save]') as HTMLButtonElement).click();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/collections');
    expect(init.method).toBe('POST');

    const body = bodyOfLastFetch();
    expect(body.tokenId).toBe('tok_test');
    expect(body.name).toBe('Books');
    expect(body.detailPages).toBe(true);
    expect(body.fieldSchema.map((f: any) => f.type)).toEqual([
      'image',
      'text_short',
      'link',
    ]);
    expect(body.roles).toEqual({
      cover: 'image',
      title: 'text_short',
      primaryLink: 'link',
    });
    // Every id letter-prefixed — the publish-time coercion gate.
    for (const f of body.fieldSchema) {
      expect(FIELD_ID_REGEX.test(f.id)).toBe(true);
    }
  });

  it('keeps detailPages false when the switch is untouched', async () => {
    renderModal();
    typeName('Team');
    addField('text_short');

    await act(async () => {
      (must('[data-cms-modal-save]') as HTMLButtonElement).click();
    });

    expect(bodyOfLastFetch().detailPages).toBe(false);
  });

  it('cannot be saved with a name but no fields (or fields but no name)', () => {
    renderModal();
    expect(must<HTMLButtonElement>('[data-cms-modal-save]').disabled).toBe(true);

    typeName('Books');
    expect(must<HTMLButtonElement>('[data-cms-modal-save]').disabled).toBe(true);

    addField('text_short');
    expect(must<HTMLButtonElement>('[data-cms-modal-save]').disabled).toBe(false);
  });

  it('drops a role when its field is deleted (never ships a dangling role)', async () => {
    renderModal();
    typeName('Books');
    addField('text_short');
    click('[data-role-trigger="text_short"]');
    click('[data-role-option="text_short:title"]');

    addField('image');
    click('[data-field-delete="text_short"]');

    await act(async () => {
      (must('[data-cms-modal-save]') as HTMLButtonElement).click();
    });

    const body = bodyOfLastFetch();
    expect(body.roles.title).toBeUndefined();
    expect(body.fieldSchema).toHaveLength(1);
  });
});

describe('AddCollectionModal — role menu is type-filtered (ruling #5)', () => {
  it('offers title on a text field and NEVER cover or primaryLink', () => {
    renderModal();
    addField('text_short');
    click('[data-role-trigger="text_short"]');

    expect(q('[data-role-option="text_short:title"]')).not.toBeNull();
    expect(q('[data-role-option="text_short:cover"]')).toBeNull();
    expect(q('[data-role-option="text_short:primaryLink"]')).toBeNull();
  });

  it('offers cover on an image field and NEVER title', () => {
    renderModal();
    addField('image');
    click('[data-role-trigger="image"]');

    expect(q('[data-role-option="image:cover"]')).not.toBeNull();
    expect(q('[data-role-option="image:title"]')).toBeNull();
  });

  it('shows no role trigger at all on a type that can hold no role', () => {
    renderModal();
    addField('date');
    expect(q('[data-role-trigger="date"]')).toBeNull();
    // …but the row itself exists (the field was added, only the role slot is empty)
    expect(q('[data-field-row="date"]')).not.toBeNull();
  });
});

describe('AddCollectionModal — greyed presets (ruling #1, greyed-placeholder contract)', () => {
  it('renders Products/Team/Portfolio/Blog PRESENT and DISABLED, Blank enabled', () => {
    renderModal();

    for (const id of ['products', 'team', 'portfolio', 'blog']) {
      const chip = q(`[data-preset-chip="${id}"]`);
      expect(chip, `preset chip "${id}" must not be omitted`).not.toBeNull();
      // <Coming>'s disabled state: aria-disabled + not a tab stop + not a button.
      expect(chip!.getAttribute('aria-disabled')).toBe('true');
      expect(chip!.tagName).not.toBe('BUTTON');
      expect(chip!.getAttribute('tabindex')).toBe('-1');
    }

    const blank = must('[data-preset-chip="blank"]');
    expect(blank.tagName).toBe('BUTTON');
    expect(blank.getAttribute('aria-disabled')).toBeNull();
  });

  it('clicking a greyed preset changes nothing (it is inert, not half-wired)', () => {
    renderModal();
    click('[data-preset-chip="products"]');
    // no preset seeded any fields
    expect(document.querySelectorAll('[data-field-row]')).toHaveLength(0);
    expect(must<HTMLButtonElement>('[data-cms-modal-save]').disabled).toBe(true);
  });
});

describe('AddCollectionModal — CREATES THESE PAGES tiles are reactive (ruling #6 + phase 8B)', () => {
  // Both toggles default OFF (the listing page is a founder-ruled opt-in, NOT
  // designer t12's "two pages, always"), so the honest starting state is "no
  // pages of its own" — and saying that in words beats an empty box.
  it('shows NO tiles and an explanatory line when both toggles are off', () => {
    renderModal();
    typeName('Books');

    expect(q('[data-page-tile="listing"]')).toBeNull();
    expect(q('[data-page-tile="item"]')).toBeNull();
    const none = q('[data-page-tile-none]');
    expect(none).not.toBeNull();
    expect(none!.textContent).toContain('only where you');
  });

  it('reacts to EACH toggle independently, in both directions', () => {
    renderModal();
    typeName('Books');

    click('[data-listing-page]');
    expect(q('[data-page-tile="listing"]')).not.toBeNull();
    expect(q('[data-page-tile="item"]')).toBeNull();
    expect(q('[data-page-tile-none]')).toBeNull();

    click('[data-detail-pages]');
    expect(q('[data-page-tile="listing"]')).not.toBeNull();
    expect(q('[data-page-tile="item"]')).not.toBeNull();

    click('[data-listing-page]');
    expect(q('[data-page-tile="listing"]')).toBeNull();
    expect(q('[data-page-tile="item"]')).not.toBeNull();

    click('[data-detail-pages]');
    expect(q('[data-page-tile-none]')).not.toBeNull();
  });

  it('the listing tile carries the LEADING-SLASH path the publisher will use', () => {
    renderModal();
    typeName('Case studies');
    click('[data-listing-page]');
    expect(q('[data-page-tile="listing"]')!.textContent).toContain('/case-studies');
  });
});

describe('AddCollectionModal — listingPage + purposes payload (phase 8B)', () => {
  it('defaults listingPage to false and purposes to [] when untouched', async () => {
    renderModal();
    typeName('Team');
    addField('text_short');

    await act(async () => {
      (must('[data-cms-modal-save]') as HTMLButtonElement).click();
    });

    const body = bodyOfLastFetch();
    expect(body.listingPage).toBe(false);
    expect(body.purposes).toEqual([]);
  });

  it('POSTs listingPage:true and the chosen purposes', async () => {
    renderModal();
    typeName('Products');
    addField('text_short');
    click('[data-listing-page]');
    click('[data-purpose-chip="offer"]');
    click('[data-purpose-chip="price"]');

    await act(async () => {
      (must('[data-cms-modal-save]') as HTMLButtonElement).click();
    });

    const body = bodyOfLastFetch();
    expect(body.listingPage).toBe(true);
    expect(body.purposes).toEqual(['offer', 'price']);
  });

  it('purposes chips toggle OFF again (a set, not an append-only list)', async () => {
    renderModal();
    typeName('Products');
    addField('text_short');
    click('[data-purpose-chip="proof"]');
    click('[data-purpose-chip="proof"]');

    await act(async () => {
      (must('[data-cms-modal-save]') as HTMLButtonElement).click();
    });

    expect(bodyOfLastFetch().purposes).toEqual([]);
  });

  // Amendment item 2 is DATA-ONLY by ruling. The control must not promise a
  // rendering effect that does not exist — if someone later deletes this note
  // without shipping per-purpose renderers, that is a user-facing lie.
  it('labels purposes as not-yet-affecting-rendering', () => {
    renderModal();
    const note = q('[data-purposes-note]');
    expect(note).not.toBeNull();
    expect(note!.textContent).toMatch(/does not change how the collection looks/i);
  });

  // Phase 8A hid `stat` behind PICKER_FIELD_TYPES because it had no control and
  // no renderer. 8B shipped both, so the picker is the full closed set again.
  it('offers ALL 10 field types in the picker, `stat` included', () => {
    renderModal();
    click('[data-add-field-trigger]');
    for (const type of FIELD_TYPES) {
      expect(q(`[data-add-field-type="${type}"]`), type).not.toBeNull();
    }
    expect(q('[data-add-field-type="stat"]')).not.toBeNull();
  });
});

describe('AddCollectionModal — edit mode', () => {
  const EXISTING = {
    id: 'col_9',
    projectId: 'p1',
    tokenId: 'tok_test',
    name: 'Books',
    slug: 'books',
    fieldSchema: [
      { id: 'text_short', name: 'Title', type: 'text_short' as const },
      { id: 'image', name: 'Cover', type: 'image' as const },
    ],
    roles: { title: 'text_short' },
    detailPages: true,
    layoutHint: null,
    order: 0,
  };

  it('seeds from the collection and PATCHes that collection on save', async () => {
    renderModal({ collection: EXISTING });

    expect(document.querySelectorAll('[data-field-row]')).toHaveLength(2);
    expect(q('[data-page-tile="item"]')).not.toBeNull(); // detailPages seeded ON

    addField('tags');

    await act(async () => {
      (must('[data-cms-modal-save]') as HTMLButtonElement).click();
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/collections/col_9');
    expect(init.method).toBe('PATCH');

    const body = bodyOfLastFetch();
    const ids = body.fieldSchema.map((f: any) => f.id);
    // Stored fields keep their ids; the NEW field gets a fresh, non-recycling id
    // (edit mode mints a random suffix — see the never-recycle note in the source).
    expect(ids.slice(0, 2)).toEqual(['text_short', 'image']);
    expect(ids[2]).toMatch(/^tags_/);
    expect(FIELD_ID_REGEX.test(ids[2])).toBe(true);
    expect(body.roles).toEqual({ title: 'text_short' });
    expect(body.detailPages).toBe(true);
  });
});

// ── THE ORPHAN-RESURRECTION REGRESSION ───────────────────────────────────────
// Field deletion is deliberately NON-DESTRUCTIVE: the PATCH route leaves every
// item's `values[fieldId]` untouched. So after "delete Subtitle", every item is
// still carrying `values.text_short = "…"`. If the next added text field could
// take the id `text_short` back, `toRenderModel` (`values[f.id]`) would print the
// old Subtitle copy under the new field's label — editor AND published output.
//
// NON-VACUITY: reverting `nextFieldId` to the draft-only clamp (`nextFieldId(type,
// prev.map(f => f.id))`, no reserved set, no unique mode) makes the first test
// below fail with `expected 'text_short' not to be 'text_short'`.
describe('AddCollectionModal — a new field NEVER inherits orphaned item values', () => {
  const WITH_ITEMS = {
    id: 'col_orphan',
    projectId: 'p1',
    tokenId: 'tok_test',
    name: 'Books',
    slug: 'books',
    fieldSchema: [
      { id: 'text_short', name: 'Subtitle', type: 'text_short' as const },
      { id: 'image', name: 'Cover', type: 'image' as const },
    ],
    roles: {},
    detailPages: false,
    layoutHint: null,
    order: 0,
  };
  const ITEMS = [
    {
      id: 'it_1',
      collectionId: 'col_orphan',
      groupId: null,
      slug: 'a',
      values: { text_short: 'An old subtitle', image: { url: '/a.png' } },
      order: 0,
      slugLocked: false,
    },
    {
      id: 'it_2',
      collectionId: 'col_orphan',
      groupId: null,
      slug: 'b',
      values: { text_short: 'Another old subtitle' },
      order: 1,
      slugLocked: false,
    },
  ] as any;

  it('delete a valued field then add the same TYPE → the id differs from the orphan key', async () => {
    renderModal({ collection: WITH_ITEMS, items: ITEMS });

    click('[data-field-delete="text_short"]'); // items KEEP values.text_short
    addField('text_short'); // "Author"

    await act(async () => {
      (must('[data-cms-modal-save]') as HTMLButtonElement).click();
    });

    const body = bodyOfLastFetch();
    const added = body.fieldSchema.find((f: any) => f.type === 'text_short');
    expect(added).toBeDefined();
    expect(added.id).not.toBe('text_short');
    expect(FIELD_ID_REGEX.test(added.id)).toBe(true);
  });

  it('reserves an ORPHAN key present only on items (gone from the stored schema)', async () => {
    // The across-sessions case: the delete was already saved, so `text_short` is
    // no longer in fieldSchema — only the item rows remember it. A draft-local or
    // schema-only clamp cannot see it; the item `values` keys can.
    const savedSchema = {
      ...WITH_ITEMS,
      fieldSchema: [{ id: 'image', name: 'Cover', type: 'image' as const }],
    };
    renderModal({ collection: savedSchema, items: ITEMS });

    addField('text_short');

    await act(async () => {
      (must('[data-cms-modal-save]') as HTMLButtonElement).click();
    });

    const added = bodyOfLastFetch().fieldSchema.find((f: any) => f.type === 'text_short');
    expect(added.id).not.toBe('text_short');
  });

  it('warns inline when a field with item values is removed, and never rewrites items', () => {
    renderModal({ collection: WITH_ITEMS, items: ITEMS });
    expect(q('[data-cms-field-drop-warning]')).toBeNull();

    click('[data-field-delete="text_short"]');

    const warning = must('[data-cms-field-drop-warning]');
    expect(warning.textContent).toContain('Subtitle');
    // The contract the warning states: hidden, not deleted.
    expect(warning.textContent).toContain('not deleted');
    // …and nothing was written anywhere — deletion is draft-local until Save.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does NOT warn for a removed field no item holds a value for', () => {
    const noValues = [
      { ...ITEMS[0], values: { image: { url: '/a.png' } } },
      { ...ITEMS[1], values: {} },
    ];
    renderModal({ collection: WITH_ITEMS, items: noValues as any });

    click('[data-field-delete="text_short"]');
    expect(q('[data-cms-field-drop-warning]')).toBeNull();
  });

  it('does not warn in CREATE mode (no stored field can have values)', () => {
    renderModal();
    addField('text_short');
    click('[data-field-delete="text_short"]');
    expect(q('[data-cms-field-drop-warning]')).toBeNull();
  });
});

describe('AddCollectionModal — write failures', () => {
  it('surfaces the server error and does NOT close the modal', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: 'Slug "books" is already used in this project' }),
    } as any);
    const onOpenChange = vi.fn();

    renderModal({ onOpenChange });
    typeName('Books');
    addField('text_short');

    await act(async () => {
      (must('[data-cms-modal-save]') as HTMLButtonElement).click();
    });

    expect(must('[data-cms-modal-error]').textContent).toContain('already used');
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
