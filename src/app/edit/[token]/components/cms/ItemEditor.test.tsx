// cms-collections phase 7 — t19 item editor CONTRACT tests.
//
// Repo convention (no @testing-library/react): react-dom/client + React.act,
// driving real DOM events. See AddCollectionModal.test.tsx / field-row-list.test.tsx.
//
// What these assert, and why each one earns its keep:
//
//  1. CONTROL PER TYPE — all 9 field types render THEIR control, chosen by TYPE.
//     Name-driven controls are how a CMS grows a hidden second schema.
//
//  2. SAVE PAYLOAD — the PATCH body actually sent (values map + method + url).
//
//  3. GROUP SELECT (ruling #7) — the Category select is the group assignment, and
//     "Ungrouped" maps to `groupId: null`, not to an empty string.
//
//  4. ⚠️ EMPTY → `null` (the phase-5 carry, THE likeliest user-visible bug in
//     this phase). The Zod value schemas REJECT empty strings — DateValueSchema's
//     regex, LinkValueSchema/MediaValueSchema/ImageValueSchema's `url: min(1)` —
//     and the item PATCH deletes a key ONLY on an explicit `v === null`. So a
//     cleared date sent as `""`, a cleared link sent as `{url:"",label:""}` or a
//     media toggle sent as `{kind:'upload',url:""}` is a **400, not a clear**.
//     These tests CLEAR each affected type THROUGH THE UI and assert the payload
//     carries `null`. `tags` is the documented exemption (`[]` validates).
//     They are also checked against the real schemas, so if a value schema ever
//     starts accepting `""` (or stops), this test tracks it instead of drifting.
//
//  5. ⚠️ THE PERMALINK NEVER CHASES THE TITLE (founder ruling). An item slug is
//     derived at CREATE and then only ever moves by an explicit permalink edit.
//     `materializePublish` never re-derives slugs, so this editor is the ONLY
//     thing that can move one — an auto-follow meant a title typo-fix relocated a
//     LIVE detail page's URL and 404'd the old one with no redirect. Asserted in
//     both directions: a title change sends NO slug (locked or not), a manual
//     permalink edit DOES PATCH the slug.

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { ItemEditor, normalizeValue, buildValuesPayload, UNGROUPED } from './ItemEditor';
import {
  FIELD_TYPES,
  DateValueSchema,
  LinkValueSchema,
  MediaValueSchema,
  ImageValueSchema,
  TagsValueSchema,
} from '@/lib/schemas/collection.schema';
import { badgeVariants } from '@/components/ui/badge';
import type { CmsCollection, CmsItem, FieldDef } from '@/modules/cms/types';

// The shared media picker pulls the edit store + the template registry. This unit
// only cares THAT it is asked to open, so stub it and record the props.
const pickerProps: Array<Record<string, unknown>> = [];
vi.mock('../ui/MediaPickerModal', () => ({
  MediaPickerModal: (props: Record<string, unknown>) => {
    pickerProps.push(props);
    return null;
  },
}));

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;
let fetchMock: ReturnType<typeof vi.fn>;

const ALL_FIELDS: FieldDef[] = [
  { id: 'cover', name: 'Cover', type: 'image' },
  { id: 'shots', name: 'Shots', type: 'gallery' },
  { id: 'clip', name: 'Clip', type: 'video' },
  { id: 'track', name: 'Track', type: 'audio' },
  { id: 'title', name: 'Title', type: 'text_short' },
  { id: 'blurb', name: 'Blurb', type: 'text_long' },
  { id: 'buy', name: 'Buy', type: 'link' },
  { id: 'published', name: 'Published', type: 'date' },
  { id: 'topics', name: 'Topics', type: 'tags' },
];

function makeCollection(over: Partial<CmsCollection> = {}): CmsCollection {
  return {
    id: 'col_1',
    projectId: 'p1',
    tokenId: 'tok_test',
    name: 'Books',
    slug: 'books',
    fieldSchema: ALL_FIELDS,
    roles: { title: 'title', cover: 'cover', primaryLink: 'buy' },
    detailPages: true,
    layoutHint: null,
    order: 0,
    ...over,
  };
}

function makeItem(over: Partial<CmsItem> = {}): CmsItem {
  return {
    id: 'item_1',
    collectionId: 'col_1',
    groupId: null,
    slug: 'deep-work',
    values: {},
    order: 0,
    slugLocked: false,
    ...over,
  };
}

beforeEach(() => {
  pickerProps.length = 0;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ item: { id: 'item_1', slug: 'deep-work', slugLocked: false } }),
  }));
  (globalThis as any).fetch = fetchMock;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

function q<T extends Element = HTMLElement>(selector: string): T | null {
  return container.querySelector<T>(selector);
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

/** React tracks the value setter, so a raw `.value =` is invisible to onChange. */
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto =
    el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')!.set!;
  act(() => {
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function typeInto(selector: string, value: string) {
  setNativeValue(must<HTMLInputElement>(selector), value);
}

function selectOption(selector: string, value: string) {
  const el = must<HTMLSelectElement>(selector);
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value'
    )!.set!;
    setter.call(el, value);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function render(props: Partial<React.ComponentProps<typeof ItemEditor>> = {}) {
  act(() =>
    root.render(
      <ItemEditor
        tokenId="tok_test"
        collection={makeCollection()}
        groups={[]}
        items={[]}
        item={null}
        {...props}
      />
    )
  );
}

/** The body of the last fetch call, parsed. */
function lastBody(): any {
  const call = fetchMock.mock.calls.at(-1);
  if (!call) throw new Error('fetch was never called');
  return JSON.parse((call[1] as RequestInit).body as string);
}
function lastUrl(): string {
  return String(fetchMock.mock.calls.at(-1)![0]);
}
function lastMethod(): string {
  return String((fetchMock.mock.calls.at(-1)![1] as RequestInit).method);
}

/* ------------------------------------------------ 1. control per field TYPE */

describe('control per field type', () => {
  it('renders a control for every one of the closed 9, keyed on TYPE', () => {
    render({ item: makeItem() });

    for (const field of ALL_FIELDS) {
      const wrapper = must(`[data-cms-field="${field.id}"]`);
      const control = wrapper.querySelector(`[data-control="${field.type}"]`);
      expect(control, `no control for ${field.id} (${field.type})`).toBeTruthy();
    }
    // Every closed type is actually exercised above — no silent gap.
    expect(new Set(ALL_FIELDS.map((f) => f.type))).toEqual(new Set(FIELD_TYPES));
  });

  it('uses a plain textarea for text_long — ruling #3, no rich-text toolbar', () => {
    render({ item: makeItem() });
    const control = must('[data-cms-field="blurb"] [data-control="text_long"]');
    expect(control.tagName).toBe('TEXTAREA');
    expect(q('[data-cms-item-editor] [data-rich-text-toolbar]')).toBeNull();
  });

  // The signature the ruling-#8 guard below matches on. A STRING scan for "Draft"
  // is not a guard: `Badge` renders a <div> (so a `button, span` scan misses it
  // entirely), and any label but exactly "Draft" sails past. These are the classes
  // EVERY `badgeVariants` variant carries, so the guard catches a status pill built
  // as a Badge with ANY variant and ANY text — which is how one would actually
  // arrive (CollectionBrowser already renders `<Badge variant="status">`).
  const BADGE_SIGNATURE = [
    'inline-flex',
    'items-center',
    'gap-1',
    'py-0.5',
    'text-xs',
    'font-semibold',
  ];
  const BADGE_VARIANTS = [
    'default',
    'secondary',
    'destructive',
    'outline',
    'status',
    'mono',
    'postBeta',
    'magic',
    'success',
    'danger',
    'saved',
  ] as const;

  it('the badge signature the ruling-#8 guard matches on still identifies EVERY Badge variant', () => {
    // Without this, a badge.tsx restyle could silently narrow the guard below to
    // matching nothing and it would sit green forever.
    for (const variant of BADGE_VARIANTS) {
      const classes = new Set(badgeVariants({ variant }).split(/\s+/));
      for (const c of BADGE_SIGNATURE) {
        expect(classes.has(c), `badge variant "${variant}" no longer carries "${c}"`).toBe(
          true
        );
      }
    }
  });

  it('does NOT render a status pill (ruling #8) or a Write-with-AI action (ruling #9)', () => {
    render({ item: makeItem() });
    const editor = must('[data-cms-item-editor]');

    // STRUCTURAL, not textual: no Badge of any variant/label exists in the editor.
    const badges = Array.from(editor.querySelectorAll<HTMLElement>('*')).filter((el) =>
      BADGE_SIGNATURE.every((c) => el.classList.contains(c))
    );
    expect(
      badges.map((b) => (b.textContent || '').trim()),
      'per-item status does not exist in v1 — a pill here would be a lie'
    ).toEqual([]);
    expect(editor.querySelector('[data-item-status]')).toBeNull();

    const labels = Array.from(editor.querySelectorAll('*')).map((n) =>
      (n.textContent || '').trim()
    );
    expect(labels.some((l) => /write with ai/i.test(l))).toBe(false);
    expect(labels.some((l) => l === 'Draft')).toBe(false);
  });

  it('image AND gallery both ask the SAME shared media picker to open', () => {
    render({ item: makeItem() });
    expect(pickerProps.at(-1)!.open).toBe(false);

    // image
    click('[data-image-add="cover"]');
    expect(pickerProps.at(-1)!.open).toBe(true);
    act(() => (pickerProps.at(-1)!.onOpenChange as (o: boolean) => void)(false));
    expect(pickerProps.at(-1)!.open).toBe(false);

    // gallery — same component, and the pick lands in the GALLERY field, which is
    // what proves the second open was the gallery's and not a leftover.
    click('[data-gallery-add]');
    expect(pickerProps.at(-1)!.open).toBe(true);
    act(() => (pickerProps.at(-1)!.onPick as (u: string) => void)('https://img.test/g.jpg'));
    expect(must<HTMLImageElement>('[data-cms-field="shots"] [data-gallery-thumb="0"]').src).toBe(
      'https://img.test/g.jpg'
    );
  });
});

/* ------------------------------------------------------- 2. save payload */

describe('save payload', () => {
  it('PATCHes the item route with the typed values', () => {
    render({ item: makeItem(), items: [makeItem()] });

    typeInto('[data-cms-field="title"] [data-control="text_short"]', 'Deep Work');
    setNativeValue(
      must<HTMLTextAreaElement>('[data-cms-field="blurb"] [data-control="text_long"]'),
      'Focus, deeply.'
    );
    typeInto('[data-cms-field="published"] [data-control="date"]', '2026-07-20');
    typeInto('[data-cms-field="buy"] [data-link-url]', 'https://example.com');
    typeInto('[data-cms-field="buy"] [data-link-label]', 'Buy');

    click('[data-item-save]');

    expect(lastMethod()).toBe('PATCH');
    expect(lastUrl()).toBe('/api/collections/col_1/items/item_1');
    const body = lastBody();
    expect(body.tokenId).toBe('tok_test');
    expect(body.values).toMatchObject({
      title: 'Deep Work',
      blurb: 'Focus, deeply.',
      published: '2026-07-20',
      buy: { url: 'https://example.com', label: 'Buy' },
    });
    // Nothing was filled for these and nothing was stored → not sent at all.
    expect(body.values).not.toHaveProperty('cover');
    expect(body.values).not.toHaveProperty('clip');
  });

  it('POSTs to the collection items route in create mode', () => {
    render({ item: null });
    typeInto('[data-cms-field="title"] [data-control="text_short"]', 'New Thing');
    click('[data-item-save]');

    expect(lastMethod()).toBe('POST');
    expect(lastUrl()).toBe('/api/collections/col_1/items');
    expect(lastBody().values).toEqual({ title: 'New Thing', topics: [] });
  });

  it('surfaces a server error verbatim (incl. the create-path slug 409)', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: 'Slug "about" conflicts with the existing page "/about".' }),
    } as any);
    render({ item: null });
    typeInto('[data-cms-field="title"] [data-control="text_short"]', 'About');
    click('[data-item-save]');
    await act(async () => {});

    expect(must('[data-cms-item-error]').textContent).toContain('conflicts with the existing page');
  });
});

/* ------------------------------------------------- 3. group select (ruling #7) */

describe('group assignment', () => {
  it('PATCHes the chosen group id', () => {
    render({
      item: makeItem(),
      groups: [
        { id: 'g1', collectionId: 'col_1', name: 'Fiction', order: 0 },
        { id: 'g2', collectionId: 'col_1', name: 'Essays', order: 1 },
      ],
    });

    selectOption('[data-item-group]', 'g2');
    click('[data-item-save]');
    expect(lastBody().groupId).toBe('g2');
  });

  it('maps "Ungrouped" to null, never to a string', () => {
    render({
      item: makeItem({ groupId: 'g1' }),
      groups: [{ id: 'g1', collectionId: 'col_1', name: 'Fiction', order: 0 }],
    });

    expect(must<HTMLSelectElement>('[data-item-group]').value).toBe('g1');
    selectOption('[data-item-group]', UNGROUPED);
    click('[data-item-save]');
    expect(lastBody().groupId).toBeNull();
  });
});

/* ------------------------------- 4. THE EMPTY-VALUE → null CONTRACT (debt 1) */

describe('empty values', () => {
  it('an all-empty new item sends no empty strings and no nulls', () => {
    render({ item: null });
    click('[data-item-save]');
    const values = lastBody().values;
    for (const [k, v] of Object.entries(values)) {
      expect(v, `${k} was sent empty`).not.toBe('');
      expect(v, `${k} was sent null on create`).not.toBeNull();
    }
    // tags is the exemption: `[]` is a legal stored value.
    expect(values.topics).toEqual([]);
  });

  it('the value schemas really do REJECT the empty shapes (this is why null exists)', () => {
    // If any of these ever start accepting "", the null mapping below is no longer
    // load-bearing — and this test says so instead of silently passing.
    expect(DateValueSchema.safeParse('').success).toBe(false);
    expect(LinkValueSchema.safeParse({ url: '', label: '' }).success).toBe(false);
    expect(MediaValueSchema.safeParse({ kind: 'upload', url: '' }).success).toBe(false);
    expect(ImageValueSchema.safeParse({ url: '' }).success).toBe(false);
    // …and tags' empty IS legal, which is why it is exempt.
    expect(TagsValueSchema.safeParse([]).success).toBe(true);
  });

  it('clearing a stored DATE sends null, never ""', () => {
    render({ item: makeItem({ values: { published: '2026-01-01' } }) });
    typeInto('[data-cms-field="published"] [data-control="date"]', '');
    click('[data-item-save]');
    expect(lastBody().values.published).toBeNull();
  });

  it('clearing a stored LINK sends null, never {url:"",label:""}', () => {
    render({ item: makeItem({ values: { buy: { url: 'https://x.test', label: 'Buy' } } }) });
    typeInto('[data-cms-field="buy"] [data-link-url]', '');
    click('[data-item-save]');
    expect(lastBody().values.buy).toBeNull();
  });

  it('clearing a stored VIDEO/AUDIO link sends null, never {kind,url:""}', () => {
    render({
      item: makeItem({
        values: {
          clip: { kind: 'link', url: 'https://v.test/a.mp4' },
          track: { kind: 'link', url: 'https://v.test/a.mp3' },
        },
      }),
    });
    typeInto('[data-cms-field="clip"] [data-media-link]', '');
    typeInto('[data-cms-field="track"] [data-media-link]', '');
    click('[data-item-save]');
    expect(lastBody().values.clip).toBeNull();
    expect(lastBody().values.track).toBeNull();
  });

  it('removing a stored IMAGE sends null, never {url:""}', () => {
    render({ item: makeItem({ values: { cover: { url: 'https://img.test/a.jpg' } } }) });
    click('[data-image-remove="cover"]');
    click('[data-item-save]');
    expect(lastBody().values.cover).toBeNull();
  });

  it('emptying a stored GALLERY sends null, never []', () => {
    render({ item: makeItem({ values: { shots: [{ url: 'https://img.test/a.jpg' }] } }) });
    click('[data-gallery-remove="0"]');
    click('[data-item-save]');
    expect(lastBody().values.shots).toBeNull();
  });

  it('clearing stored TEXT sends null, never ""', () => {
    render({ item: makeItem({ values: { title: 'Old', blurb: 'Old body' } }) });
    typeInto('[data-cms-field="title"] [data-control="text_short"]', '');
    setNativeValue(
      must<HTMLTextAreaElement>('[data-cms-field="blurb"] [data-control="text_long"]'),
      ''
    );
    click('[data-item-save]');
    expect(lastBody().values.title).toBeNull();
    expect(lastBody().values.blurb).toBeNull();
  });

  it('emptying TAGS sends [] (the documented exemption), not null', () => {
    render({ item: makeItem({ values: { topics: ['focus'] } }) });
    click('[data-tag-remove="focus"]');
    click('[data-item-save]');
    expect(lastBody().values.topics).toEqual([]);
  });

  it('normalizeValue maps every empty shape to null except tags', () => {
    expect(normalizeValue('date', '')).toBeNull();
    expect(normalizeValue('link', { url: '', label: '' })).toBeNull();
    expect(normalizeValue('video', { kind: 'upload', url: '' })).toBeNull();
    expect(normalizeValue('audio', { kind: 'link', url: '' })).toBeNull();
    expect(normalizeValue('image', { url: '' })).toBeNull();
    expect(normalizeValue('gallery', [])).toBeNull();
    expect(normalizeValue('text_short', '   ')).toBeNull();
    expect(normalizeValue('text_long', '')).toBeNull();
    expect(normalizeValue('tags', [])).toEqual([]);
  });

  it('buildValuesPayload only sends the delete sentinel for keys the item HAS', () => {
    const fields: FieldDef[] = [
      { id: 'a', name: 'A', type: 'text_short' },
      { id: 'b', name: 'B', type: 'text_short' },
    ];
    const out = buildValuesPayload(fields, { a: '', b: '' }, { a: 'was here' });
    expect(out).toEqual({ a: null });
  });
});

/* ------------------------------- 5. the permalink NEVER chases the title (debt 2) */

describe('permalink', () => {
  it('is hidden when the collection has no detail pages', () => {
    render({ collection: makeCollection({ detailPages: false }), item: makeItem() });
    expect(q('[data-slug-segment]')).toBeNull();
  });

  it('editing the permalink PATCHes the slug (the route then locks it)', () => {
    render({ item: makeItem({ slug: 'deep-work' }), items: [makeItem()] });
    typeInto('[data-slug-segment]', 'deep-work-2e');
    click('[data-item-save]');
    expect(lastBody().slug).toBe('deep-work-2e');
  });

  it('a title change alone sends NO slug — an UNLOCKED permalink still does not move', () => {
    // THE founder ruling. `materializePublish` never re-derives slugs, so this
    // editor is the only thing that can move an item slug: an auto-follow made a
    // title typo-fix relocate a LIVE detail page's URL, 404ing the old one.
    render({ item: makeItem({ slug: 'deep-work', slugLocked: false }) });
    typeInto('[data-cms-field="title"] [data-control="text_short"]', 'Shallow Work');
    expect(must<HTMLInputElement>('[data-slug-segment]').value).toBe('deep-work');
    click('[data-item-save]');
    expect(lastBody()).not.toHaveProperty('slug');
  });

  it('a LOCKED permalink NEVER moves when the title changes', () => {
    render({ item: makeItem({ slug: 'custom-url', slugLocked: true }) });
    typeInto('[data-cms-field="title"] [data-control="text_short"]', 'Totally New Title');
    expect(must<HTMLInputElement>('[data-slug-segment]').value).toBe('custom-url');
    click('[data-item-save]');
    expect(lastBody()).not.toHaveProperty('slug');
  });

  it('a manual permalink edit survives later title edits and is the thing that PATCHes', () => {
    render({ item: makeItem({ slug: 'deep-work', slugLocked: false }) });
    typeInto('[data-slug-segment]', 'my-choice');
    typeInto('[data-cms-field="title"] [data-control="text_short"]', 'Another Title');
    expect(must<HTMLInputElement>('[data-slug-segment]').value).toBe('my-choice');
    click('[data-item-save]');
    expect(lastBody().slug).toBe('my-choice');
  });

  it('does not send a slug when nothing about it changed', () => {
    render({ item: makeItem({ slug: 'deep-work', slugLocked: true }) });
    click('[data-item-save]');
    expect(lastBody()).not.toHaveProperty('slug');
  });

  it('never calls a derived permalink "custom" — the hint is true in BOTH states', () => {
    // The old copy said "Custom permalink — it stays put when you rename this
    // item" for a slug the user never chose, and promised the unlocked one would
    // chase the title. Both were false.
    render({ item: makeItem({ slug: 'deep-work', slugLocked: false }) });
    const derived = must('[data-cms-item-editor]').textContent || '';
    expect(derived).not.toMatch(/custom permalink/i);
    expect(derived).not.toMatch(/follows the title/i);
    expect(derived).toMatch(/made from the title/i);

    render({ item: makeItem({ id: 'item_2', slug: 'my-choice', slugLocked: true }) });
    expect(must('[data-cms-item-editor]').textContent || '').toMatch(
      /you set this permalink/i
    );
  });
});

/* ------------------- 6. `stored` is the SERVER's row, not a stale prop (debt 3) */

describe('stale stored values', () => {
  it('computes the delete sentinel against the SAVE RESPONSE, not the item prop', async () => {
    // The `item` prop only freshens when the host's `refreshCmsCollection` lands,
    // and that refresh is fire-and-forget with a swallowed failure. If `stored`
    // came from the prop, this sequence would send NO null on the clear, the
    // server would keep "Deep Work", and the editor would show the field empty —
    // silent editor↔published divergence.
    const staleProp = makeItem({ values: {} }); // the refresh never landed

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        item: {
          id: 'item_1',
          slug: 'deep-work',
          slugLocked: false,
          values: { title: 'Deep Work' },
        },
      }),
    } as any);

    render({ item: staleProp, items: [staleProp] });

    typeInto('[data-cms-field="title"] [data-control="text_short"]', 'Deep Work');
    click('[data-item-save]');
    await act(async () => {});
    expect(lastBody().values.title).toBe('Deep Work');

    // …the prop is STILL `values: {}` here — nothing re-rendered it.
    typeInto('[data-cms-field="title"] [data-control="text_short"]', '');
    click('[data-item-save]');
    await act(async () => {});
    expect(lastBody().values.title, 'the clear was dropped').toBeNull();
  });

  it('leaves server-truth alone when a response carries no values object', async () => {
    // Ambiguous response ≠ "the row is empty". Treating it as empty would drop the
    // NEXT clear — the exact bug the ref closes.
    render({ item: makeItem({ values: { title: 'Old' } }) });
    click('[data-item-save]'); // default mock: `item` without `values`
    await act(async () => {});

    typeInto('[data-cms-field="title"] [data-control="text_short"]', '');
    click('[data-item-save]');
    await act(async () => {});
    expect(lastBody().values.title).toBeNull();
  });
});
