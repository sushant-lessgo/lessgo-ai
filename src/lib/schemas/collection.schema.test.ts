import { describe, it, expect } from 'vitest';
import {
  FIELD_TYPES,
  FieldTypeSchema,
  FieldDefSchema,
  FieldSchemaArraySchema,
  FIELD_VALUE_SCHEMAS,
  makeItemValuesSchema,
  makeRolesSchema,
  ROLE_ALLOWED_TYPES,
  COLLECTION_PURPOSES,
  PurposesSchema,
  PurposesListSchema,
  CollectionCreateSchema,
  CollectionPatchSchema,
  ItemPatchSchema,
  type FieldDef,
} from './collection.schema';

const fields: FieldDef[] = [
  { id: 'cover', name: 'Cover', type: 'image' },
  { id: 'shots', name: 'Shots', type: 'gallery' },
  { id: 'clip', name: 'Clip', type: 'video' },
  { id: 'track', name: 'Track', type: 'audio' },
  { id: 'title', name: 'Title', type: 'text_short' },
  { id: 'blurb', name: 'Blurb', type: 'text_long' },
  { id: 'buy', name: 'Buy', type: 'link' },
  { id: 'released', name: 'Released', type: 'date' },
  { id: 'tags', name: 'Tags', type: 'tags' },
  { id: 'spec', name: 'Spec', type: 'stat' },
];

describe('field type contract', () => {
  it('is closed at exactly the 10 spec types', () => {
    expect([...FIELD_TYPES].sort()).toEqual(
      [
        'audio',
        'date',
        'gallery',
        'image',
        'link',
        'tags',
        'text_long',
        'text_short',
        'video',
        'stat',
      ].sort()
    );
    expect(FieldTypeSchema.safeParse('price').success).toBe(false);
    expect(FieldTypeSchema.safeParse('richtext').success).toBe(false);
  });

  it('has a value schema for every type', () => {
    for (const t of FIELD_TYPES) expect(FIELD_VALUE_SCHEMAS[t]).toBeDefined();
  });
});

describe('field ids (coercion-proof rule 2)', () => {
  it('accepts letter-prefixed ids', () => {
    for (const id of ['a', 'cover', 'coverImage', 'cover_image', 'cover-2', 'F1']) {
      expect(FieldDefSchema.safeParse({ id, name: 'N', type: 'image' }).success).toBe(true);
    }
  });

  it('REJECTS numeric and otherwise illegal ids', () => {
    for (const id of ['1', '0', '12', '1cover', '_cover', '-cover', 'cover field', 'cøver', '']) {
      expect(FieldDefSchema.safeParse({ id, name: 'N', type: 'image' }).success).toBe(false);
    }
  });

  it('rejects duplicate field ids in a schema array', () => {
    const dup = [
      { id: 'title', name: 'A', type: 'text_short' },
      { id: 'title', name: 'B', type: 'text_short' },
    ];
    expect(FieldSchemaArraySchema.safeParse(dup).success).toBe(false);
    expect(FieldSchemaArraySchema.safeParse(fields).success).toBe(true);
  });

  it('rejects a values map with a numeric key even when the field is unknown', () => {
    const schema = makeItemValuesSchema(fields);
    expect(schema.safeParse({ '0': 'a', '1': 'b' }).success).toBe(false);
  });
});

describe('per-type value shapes', () => {
  const schema = makeItemValuesSchema(fields);
  const ok = (values: Record<string, unknown>) => schema.safeParse(values).success;

  it('image accepts {url, assetId?} and rejects a bare string (TRAP 1)', () => {
    expect(ok({ cover: { url: '/a.webp' } })).toBe(true);
    expect(ok({ cover: { url: '/a.webp', assetId: 'ck1' } })).toBe(true);
    expect(ok({ cover: '/a.webp' })).toBe(false);
    expect(ok({ cover: { assetId: 'ck1' } })).toBe(false);
  });

  it('gallery accepts an array of image values', () => {
    expect(ok({ shots: [{ url: '/a.webp' }, { url: '/b.webp', assetId: 'x' }] })).toBe(true);
    expect(ok({ shots: [] })).toBe(true);
    expect(ok({ shots: ['/a.webp'] })).toBe(false);
    expect(ok({ shots: { url: '/a.webp' } })).toBe(false);
  });

  it('video/audio accept {kind, url} with a closed kind', () => {
    expect(ok({ clip: { kind: 'upload', url: '/v.mp4' } })).toBe(true);
    expect(ok({ track: { kind: 'link', url: 'https://x/y.mp3' } })).toBe(true);
    expect(ok({ clip: { kind: 'embed', url: '/v.mp4' } })).toBe(false);
    expect(ok({ clip: { url: '/v.mp4' } })).toBe(false);
  });

  it('video/audio values never carry a string `type` + `content` pair (coercion rule 1)', () => {
    // The discriminator is `kind`; a {type, content} pair must not validate.
    expect(ok({ clip: { type: 'upload', content: '/v.mp4' } })).toBe(false);
  });

  it('text_short / text_long accept strings and reject non-strings', () => {
    expect(ok({ title: 'Dune', blurb: 'A long blurb.' })).toBe(true);
    expect(ok({ title: 42 })).toBe(false);
    expect(ok({ blurb: { content: 'x' } })).toBe(false);
  });

  it('link accepts {url, label} and requires a url', () => {
    expect(ok({ buy: { url: 'https://shop', label: 'Buy' } })).toBe(true);
    expect(ok({ buy: { url: 'mailto:me@x.com', label: 'Email me' } })).toBe(true);
    expect(ok({ buy: { url: '#anchor', label: '' } })).toBe(true);
    expect(ok({ buy: 'https://shop' })).toBe(false);
    expect(ok({ buy: { label: 'Buy' } })).toBe(false);
  });

  it('date accepts ISO strings and rejects junk', () => {
    expect(ok({ released: '2026-07-20' })).toBe(true);
    expect(ok({ released: '2026-07-20T10:00:00.000Z' })).toBe(true);
    expect(ok({ released: '20/07/2026' })).toBe(false);
    expect(ok({ released: 'soon' })).toBe(false);
    expect(ok({ released: '2026-13-45' })).toBe(false);
  });

  it('tags accepts string[] and rejects a comma string', () => {
    expect(ok({ tags: ['a', 'b'] })).toBe(true);
    expect(ok({ tags: [] })).toBe(true);
    expect(ok({ tags: 'a,b' })).toBe(false);
    expect(ok({ tags: [1, 2] })).toBe(false);
  });

  // ── stat (amendment 2026-07-20, item 1) ───────────────────────────────────

  it('stat accepts a {key, value} pair and rejects other shapes', () => {
    expect(ok({ spec: { key: 'Weight', value: '1.2 kg' } })).toBe(true);
    expect(ok({ spec: 'Weight: 1.2 kg' })).toBe(false);
    expect(ok({ spec: { key: 'Weight' } })).toBe(false);
    expect(ok({ spec: { value: '1.2 kg' } })).toBe(false);
    expect(ok({ spec: [{ key: 'Weight', value: '1.2 kg' }] })).toBe(false);
    expect(ok({ spec: { key: 1, value: 2 } })).toBe(false);
  });

  it('stat allows BOTH halves empty (the all-values-optional law)', () => {
    // Unlike date/link/media, `stat` needs no empty→null mapping in the caller.
    expect(ok({ spec: { key: '', value: '' } })).toBe(true);
    expect(ok({ spec: { key: 'Weight', value: '' } })).toBe(true);
    expect(ok({ spec: { key: '', value: '1.2 kg' } })).toBe(true);
  });

  it('stat carries NO key that sanitizeContentHtml would rewrite to "#"', () => {
    // The phase-3 publish bug, pinned at the contract: `sanitizeContentHtml`
    // rewrites any string under a key ending in href|url|link|slug. Renaming
    // `key`/`value` to e.g. `specLink` must fail HERE, not on a live page.
    const res = schema.safeParse({ spec: { key: 'Weight', value: '1.2 kg' } });
    expect(res.success).toBe(true);
    if (res.success) {
      for (const k of Object.keys(res.data.spec as Record<string, unknown>)) {
        expect(/(href|url|link|slug)$/i.test(k), `illegal stat key "${k}"`).toBe(false);
      }
    }
  });

  it('every one of the 10 closed types round-trips a sample value', () => {
    const samples: Record<string, unknown> = {
      cover: { url: '/a.webp' },
      shots: [{ url: '/a.webp' }],
      clip: { kind: 'upload', url: '/v.mp4' },
      track: { kind: 'link', url: 'https://x/y.mp3' },
      title: 'Dune',
      blurb: 'A long blurb.',
      buy: { url: 'https://shop', label: 'Buy' },
      released: '2026-07-20',
      tags: ['a'],
      spec: { key: 'Weight', value: '1.2 kg' },
    };
    // Anti-vacuity: the sample map must exercise EVERY closed type, not a subset.
    expect(new Set(fields.map((f) => f.type))).toEqual(new Set(FIELD_TYPES));
    expect(Object.keys(samples).sort()).toEqual(fields.map((f) => f.id).sort());

    const res = schema.safeParse(samples);
    expect(res.success, JSON.stringify(res.success ? {} : res.error.issues)).toBe(true);
    if (res.success) expect(res.data).toEqual(samples);
  });

  it('reports the offending field id in the issue path', () => {
    const res = schema.safeParse({ cover: 'nope' });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.issues[0].path[0]).toBe('cover');
  });
});

describe('item values are all-optional and orphan-tolerant', () => {
  const schema = makeItemValuesSchema(fields);

  it('accepts an empty values map', () => {
    expect(schema.safeParse({}).success).toBe(true);
  });

  it('accepts any subset of fields', () => {
    expect(schema.safeParse({ title: 'Only a title' }).success).toBe(true);
  });

  it('tolerates AND PRESERVES unknown (orphaned) keys', () => {
    const res = schema.safeParse({ title: 'x', removedField: 'orphan value' });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.removedField).toBe('orphan value');
  });

  it('treats null/undefined as unfilled, not invalid', () => {
    expect(schema.safeParse({ cover: null, title: undefined }).success).toBe(true);
  });
});

describe('roles are type-filtered against the field schema', () => {
  const roles = makeRolesSchema(fields);

  it('exposes the closed role → type map', () => {
    expect(Object.keys(ROLE_ALLOWED_TYPES).sort()).toEqual(['cover', 'primaryLink', 'title']);
  });

  it('accepts correctly typed roles', () => {
    expect(
      roles.safeParse({ title: 'title', cover: 'cover', primaryLink: 'buy' }).success
    ).toBe(true);
    // cover may also be a gallery field
    expect(roles.safeParse({ cover: 'shots' }).success).toBe(true);
  });

  it('accepts an empty / partial roles object', () => {
    expect(roles.safeParse({}).success).toBe(true);
    expect(roles.safeParse({ title: 'title' }).success).toBe(true);
  });

  it('rejects a role pointing at the wrong field type', () => {
    expect(roles.safeParse({ title: 'blurb' }).success).toBe(false); // text_long
    expect(roles.safeParse({ cover: 'title' }).success).toBe(false); // text_short
    expect(roles.safeParse({ primaryLink: 'cover' }).success).toBe(false); // image
  });

  it('rejects a role pointing at an unknown field', () => {
    expect(roles.safeParse({ title: 'ghost' }).success).toBe(false);
  });

  it('rejects unknown role keys', () => {
    expect(roles.safeParse({ subtitle: 'title' }).success).toBe(false);
  });
});

// ── Amendment 2026-07-20: purposes + the two new booleans ───────────────────

describe('purposes (amendment item 2 — stored, validated, READ BY NOTHING)', () => {
  it('exposes a CLOSED vocabulary of exactly offer/proof/price', () => {
    expect([...COLLECTION_PURPOSES].sort()).toEqual(['offer', 'price', 'proof']);
  });

  it('accepts members of the closed vocab', () => {
    expect(PurposesSchema.parse(['offer'])).toEqual(['offer']);
    expect(PurposesSchema.parse(['offer', 'proof', 'price'])).toEqual([
      'offer',
      'proof',
      'price',
    ]);
    expect(PurposesSchema.parse([])).toEqual([]);
  });

  it('REJECTS anything outside the closed vocab', () => {
    for (const bad of ['case-study', 'Offer', 'proofs', '', 'price ']) {
      expect(PurposesSchema.safeParse([bad]).success, `accepted "${bad}"`).toBe(false);
    }
    // a valid member alongside an invalid one still fails
    expect(PurposesSchema.safeParse(['offer', 'nope']).success).toBe(false);
    // wrong container
    expect(PurposesSchema.safeParse('offer').success).toBe(false);
    expect(PurposesSchema.safeParse([1]).success).toBe(false);
  });

  it('DEDUPES (set semantics), preserving first-seen order', () => {
    expect(PurposesSchema.parse(['proof', 'offer', 'proof', 'offer'])).toEqual([
      'proof',
      'offer',
    ]);
    expect(PurposesListSchema.parse(['price', 'price', 'price'])).toEqual(['price']);
  });

  it('defaults to [] when absent — never null/undefined', () => {
    expect(PurposesSchema.parse(undefined)).toEqual([]);
    const created = CollectionCreateSchema.parse({
      tokenId: 't',
      name: 'Books',
      fieldSchema: [{ id: 'title', name: 'Title', type: 'text_short' }],
    });
    expect(created.purposes).toEqual([]);
  });

  it('is optional (not defaulted) on PATCH — omission means "leave it alone"', () => {
    const patched = CollectionPatchSchema.parse({ tokenId: 't', name: 'Books' });
    expect(patched.purposes).toBeUndefined();
    expect(CollectionPatchSchema.parse({ tokenId: 't', purposes: ['proof', 'proof'] }).purposes)
      .toEqual(['proof']);
  });
});

describe('listingPage / featuredOnHome booleans', () => {
  const minimalCreate = {
    tokenId: 't',
    name: 'Books',
    fieldSchema: [{ id: 'title', name: 'Title', type: 'text_short' }],
  };

  it('listingPage defaults to FALSE on create (never on-by-default)', () => {
    expect(CollectionCreateSchema.parse(minimalCreate).listingPage).toBe(false);
    expect(CollectionCreateSchema.parse({ ...minimalCreate, listingPage: true }).listingPage)
      .toBe(true);
  });

  it('detailPages still defaults to FALSE (unchanged by the amendment)', () => {
    expect(CollectionCreateSchema.parse(minimalCreate).detailPages).toBe(false);
  });

  it('listingPage is optional on PATCH and rejects non-booleans', () => {
    expect(CollectionPatchSchema.parse({ tokenId: 't', name: 'X' }).listingPage).toBeUndefined();
    expect(CollectionPatchSchema.parse({ tokenId: 't', listingPage: true }).listingPage).toBe(true);
    expect(CollectionPatchSchema.safeParse({ tokenId: 't', listingPage: 'yes' }).success).toBe(
      false
    );
  });

  it('featuredOnHome is accepted on item PATCH (reserved column, unwired)', () => {
    expect(ItemPatchSchema.parse({ tokenId: 't', featuredOnHome: true }).featuredOnHome).toBe(true);
    expect(ItemPatchSchema.parse({ tokenId: 't', slug: 'a' }).featuredOnHome).toBeUndefined();
    expect(ItemPatchSchema.safeParse({ tokenId: 't', featuredOnHome: 'yes' }).success).toBe(false);
  });
});
