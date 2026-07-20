// Tests for THE single CMS data feed. The load-bearing assertions:
//   - hostile URLs nested where the publish walker cannot reach are dropped HERE
//   - mailto:/tel:/#anchor CTA links SURVIVE (wide predicate on link/video/audio)
//   - nothing in the model carries the `{content:string, type:string}` pair that
//     coercePublishValue silently collapses at publish time

import { describe, it, expect } from 'vitest';
import { toRenderModel, type CmsRenderModel } from './toRenderModel';
import type { CmsCollectionBundle, FieldDef } from '../types';

const FIELDS: FieldDef[] = [
  { id: 'cover', name: 'Cover', type: 'image' },
  { id: 'title', name: 'Title', type: 'text_short' },
  { id: 'blurb', name: 'Blurb', type: 'text_long' },
  { id: 'shots', name: 'Shots', type: 'gallery' },
  { id: 'clip', name: 'Clip', type: 'video' },
  { id: 'track', name: 'Track', type: 'audio' },
  { id: 'buy', name: 'Buy', type: 'link' },
  { id: 'released', name: 'Released', type: 'date' },
  { id: 'tags', name: 'Tags', type: 'tags' },
];

function bundle(over: Partial<CmsCollectionBundle> = {}): CmsCollectionBundle {
  return {
    collection: {
      id: 'col1',
      projectId: 'proj1',
      tokenId: 'tok1',
      name: 'Books',
      slug: 'books',
      fieldSchema: FIELDS,
      roles: {},
      detailPages: false,
      layoutHint: null,
      order: 0,
    },
    groups: [],
    items: [],
    ...over,
  };
}

const item = (id: string, values: Record<string, unknown>, extra: Record<string, any> = {}) => ({
  id,
  collectionId: 'col1',
  groupId: null,
  slug: id,
  values,
  order: 0,
  slugLocked: false,
  ...extra,
});

describe('toRenderModel — roles', () => {
  it('uses explicit roles when they point at an allowed-type field', () => {
    const m = toRenderModel(
      bundle({
        collection: {
          ...bundle().collection,
          roles: { title: 'title', cover: 'shots', primaryLink: 'buy' },
        },
      })
    );
    expect(m.roles).toEqual({ title: 'title', cover: 'shots', primaryLink: 'buy' });
  });

  it('falls back to the first field of an allowed type, in schema order', () => {
    const m = toRenderModel(bundle());
    expect(m.roles).toEqual({ title: 'title', cover: 'cover', primaryLink: 'buy' });
  });

  it('ignores an explicit role whose field type is not allowed', () => {
    const m = toRenderModel(
      bundle({
        collection: { ...bundle().collection, roles: { title: 'blurb' } }, // text_long ≠ text_short
      })
    );
    expect(m.roles.title).toBe('title'); // fallback, not 'blurb'
  });

  it('ignores an explicit role pointing at a deleted field', () => {
    const m = toRenderModel(
      bundle({ collection: { ...bundle().collection, roles: { cover: 'gone' } } })
    );
    expect(m.roles.cover).toBe('cover');
  });

  it('is null when no eligible field exists', () => {
    const m = toRenderModel(
      bundle({
        collection: {
          ...bundle().collection,
          fieldSchema: [{ id: 'blurb', name: 'Blurb', type: 'text_long' }],
        },
      })
    );
    expect(m.roles).toEqual({ title: null, cover: null, primaryLink: null });
  });
});

describe('toRenderModel — empty-value drops', () => {
  it('drops absent, blank and wrong-shaped values, keeps filled ones', () => {
    const m = toRenderModel(
      bundle({
        items: [
          item('i1', {
            title: '  Real  ',
            blurb: '   ',
            tags: [],
            shots: [],
            released: null,
            buy: { url: '', label: 'x' },
            clip: 'not-an-object',
          }),
        ],
      })
    );
    const fields = m.groups[0].items[0].fields;
    expect(fields.map((f) => f.fieldId)).toEqual(['title']);
    expect(fields[0].value).toBe('Real'); // trimmed
  });

  it('ignores orphaned value keys from removed fields', () => {
    const m = toRenderModel(bundle({ items: [item('i1', { title: 'A', removedField: 'x' })] }));
    expect(m.groups[0].items[0].fields.map((f) => f.fieldId)).toEqual(['title']);
  });

  it('keeps fields in collection schema order regardless of value insertion order', () => {
    const m = toRenderModel(
      bundle({ items: [item('i1', { tags: ['a'], title: 'T', cover: { url: '/c.png' } })] })
    );
    expect(m.groups[0].items[0].fields.map((f) => f.fieldId)).toEqual(['cover', 'title', 'tags']);
  });
});

describe('toRenderModel — group ordering', () => {
  const g = (id: string, name: string, order: number) => ({
    id,
    collectionId: 'col1',
    name,
    order,
  });

  it('orders groups by `order` and items by `order` within a group', () => {
    const m = toRenderModel(
      bundle({
        groups: [g('gB', 'B', 1), g('gA', 'A', 0)],
        items: [
          item('i2', { title: 'second' }, { groupId: 'gA', order: 1 }),
          item('i1', { title: 'first' }, { groupId: 'gA', order: 0 }),
          item('i3', { title: 'third' }, { groupId: 'gB', order: 0 }),
        ],
      })
    );
    expect(m.groups.map((x) => x.name)).toEqual(['A', 'B']);
    expect(m.groups[0].items.map((x) => x.itemId)).toEqual(['i1', 'i2']);
  });

  it('drops empty groups and appends the ungrouped bucket last when groups exist', () => {
    const m = toRenderModel(
      bundle({
        groups: [g('gA', 'A', 0), g('gEmpty', 'Empty', 1)],
        items: [
          item('i1', { title: 'grouped' }, { groupId: 'gA' }),
          item('i2', { title: 'loose' }),
        ],
      })
    );
    expect(m.groups.map((x) => x.groupId)).toEqual(['gA', null]);
    expect(m.groups[1].name).toBeNull();
  });

  it('puts the ungrouped bucket first when the collection has no groups', () => {
    const m = toRenderModel(bundle({ items: [item('i1', { title: 'a' })] }));
    expect(m.groups).toHaveLength(1);
    expect(m.groups[0].groupId).toBeNull();
  });
});

describe('toRenderModel — URL sanitization (the gate the publish walker cannot reach)', () => {
  it('drops a javascript: URL nested inside a gallery value', () => {
    const m = toRenderModel(
      bundle({
        items: [
          item('i1', {
            shots: [
              { url: 'https://cdn.test/ok.png' },
              { url: 'javascript:alert(1)' },
              { url: 'JaVaScRiPt:alert(2)' },
              { url: ' java\tscript:alert(3)' },
            ],
          }),
        ],
      })
    );
    const gallery = m.groups[0].items[0].fields.find((f) => f.fieldId === 'shots');
    expect(gallery).toBeTruthy();
    expect(gallery!.value).toEqual([{ url: 'https://cdn.test/ok.png' }]);
    expect(JSON.stringify(m).toLowerCase()).not.toContain('javascript:');
  });

  it('drops the whole gallery field when every entry is hostile', () => {
    const m = toRenderModel(
      bundle({ items: [item('i1', { shots: [{ url: 'javascript:alert(1)' }] })] })
    );
    expect(m.groups[0].items[0].fields).toHaveLength(0);
  });

  it('applies the NARROW predicate to image src (rejects mailto:/#)', () => {
    const m = toRenderModel(
      bundle({
        items: [
          item('i1', { cover: { url: 'mailto:a@b.com' } }),
          item('i2', { cover: { url: '#frag' } }),
          item('i3', { cover: { url: '/local.png', assetId: 'a1' } }),
        ],
      })
    );
    const [f1, f2, f3] = m.groups[0].items.map((i) => i.fields);
    expect(f1).toHaveLength(0);
    expect(f2).toHaveLength(0);
    expect(f3[0].value).toEqual({ url: '/local.png', assetId: 'a1' });
  });

  it('WIDE predicate: mailto:, tel: and #anchor link values SURVIVE', () => {
    const m = toRenderModel(
      bundle({
        items: [
          item('i1', { buy: { url: 'mailto:hi@acme.com', label: 'Email me' } }),
          item('i2', { buy: { url: 'tel:+15551234', label: 'Call us' } }),
          item('i3', { buy: { url: '#contact', label: 'Jump' } }),
          item('i4', { buy: { url: 'javascript:alert(1)', label: 'Bad' } }),
        ],
      })
    );
    const values = m.groups[0].items.map((i) => i.fields[0]?.value);
    expect(values[0]).toEqual({ url: 'mailto:hi@acme.com', label: 'Email me' });
    expect(values[1]).toEqual({ url: 'tel:+15551234', label: 'Call us' });
    expect(values[2]).toEqual({ url: '#contact', label: 'Jump' });
    expect(values[3]).toBeUndefined(); // hostile → field dropped
  });

  it('WIDE predicate applies to video/audio too', () => {
    const m = toRenderModel(
      bundle({
        items: [
          item('i1', {
            clip: { kind: 'link', url: 'https://youtu.be/x' },
            track: { kind: 'link', url: 'mailto:a@b.com' },
          }),
          item('i2', { clip: { kind: 'upload', url: 'javascript:alert(1)' } }),
        ],
      })
    );
    expect(m.groups[0].items[0].fields.map((f) => f.fieldId)).toEqual(['clip', 'track']);
    expect(m.groups[0].items[1].fields).toHaveLength(0);
  });
});

describe('toRenderModel — coercion-proof shape', () => {
  function deepWalk(node: unknown, visit: (o: Record<string, unknown>) => void) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((n) => deepWalk(n, visit));
      return;
    }
    const obj = node as Record<string, unknown>;
    visit(obj);
    Object.values(obj).forEach((v) => deepWalk(v, visit));
  }

  const fullModel = (): CmsRenderModel =>
    toRenderModel(
      bundle({
        groups: [{ id: 'gA', collectionId: 'col1', name: 'A', order: 0 }],
        items: [
          item(
            'i1',
            {
              cover: { url: '/c.png' },
              title: 'T',
              blurb: 'Body',
              shots: [{ url: '/s.png' }],
              clip: { kind: 'link', url: 'https://v.test/a' },
              track: { kind: 'upload', url: '/a.mp3' },
              buy: { url: 'https://buy.test', label: 'Buy' },
              released: '2026-01-02',
              tags: ['x', 'y'],
            },
            { groupId: 'gA' }
          ),
        ],
      })
    );

  it('no object carries BOTH a string `content` and a string `type` key', () => {
    let offenders = 0;
    deepWalk(fullModel(), (o) => {
      if (typeof o.content === 'string' && typeof o.type === 'string') offenders += 1;
    });
    expect(offenders).toBe(0);
  });

  it('no object has all-numeric keys (the string-spread reassembly trap)', () => {
    let offenders = 0;
    deepWalk(fullModel(), (o) => {
      const keys = Object.keys(o);
      if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k))) offenders += 1;
    });
    expect(offenders).toBe(0);
  });

  it('per-field shape is {fieldType, value} — never {type, content}', () => {
    const fields = fullModel().groups[0].items[0].fields;
    expect(fields).toHaveLength(9);
    for (const f of fields) {
      expect(Object.keys(f).sort()).toEqual(['fieldId', 'fieldType', 'name', 'value']);
      expect((f as any).type).toBeUndefined();
      expect((f as any).content).toBeUndefined();
    }
  });

  it('carries collection meta through unchanged', () => {
    const m = toRenderModel(
      bundle({
        collection: { ...bundle().collection, detailPages: true, layoutHint: 'grid' },
      })
    );
    expect(m.collectionId).toBe('col1');
    expect(m.collectionSlug).toBe('books');
    expect(m.detailPages).toBe(true);
    expect(m.layoutHint).toBe('grid');
  });
});
