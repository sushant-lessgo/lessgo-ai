// src/modules/collections/registry.test.ts
// collections-entry-capture phase 3 — `collectionKeysForBusinessType` lookup.
// Guards the 7b node's engine-key union: each collection-capable businessType
// resolves (via its `extractionSchemaKey`) to its extraction family's collection
// keys; unknown/undefined bt ⇒ [] (rung A stays present-only, no empty nodes).

import { describe, it, expect } from 'vitest';
import { collectionKeysForBusinessType } from './registry';

describe('collectionKeysForBusinessType', () => {
  it('saas → [products] (thing family)', () => {
    expect(collectionKeysForBusinessType('saas')).toEqual(['products']);
  });

  it('app → [products] (thing family)', () => {
    expect(collectionKeysForBusinessType('app')).toEqual(['products']);
  });

  it('consultant → [services, case-studies] (trust family)', () => {
    expect(collectionKeysForBusinessType('consultant')).toEqual([
      'services',
      'case-studies',
    ]);
  });

  it('photographer → [services, works] (work family)', () => {
    expect(collectionKeysForBusinessType('photographer')).toEqual([
      'services',
      'works',
    ]);
  });

  it('manufacturer → [products]', () => {
    expect(collectionKeysForBusinessType('manufacturer')).toEqual(['products']);
  });

  it('unknown bt → []', () => {
    expect(collectionKeysForBusinessType('not-a-real-type')).toEqual([]);
  });

  it('null / undefined bt → []', () => {
    expect(collectionKeysForBusinessType(null)).toEqual([]);
    expect(collectionKeysForBusinessType(undefined)).toEqual([]);
  });
});
