// src/modules/cms/values.test.ts
//
// Direct tests for the shared empty-value → `null` contract. This mapping used to
// exist twice (site editor + dashboard board) and drift between the copies would be
// invisible until a user cleared a field on one surface and not the other, so the
// contract is pinned HERE, at its single definition — not only through its two
// consumers.
//
// `ItemEditor.test.tsx` still exercises the same helpers through its own re-export;
// that is deliberate belt-and-braces, not a duplicate of this file's job.

import { describe, it, expect } from 'vitest';

import { normalizeValue, buildValuesPayload } from './values';
import type { FieldDef, FieldType } from './types';

const field = (id: string, type: FieldType): FieldDef =>
  ({ id, type, name: id } as FieldDef);

describe('normalizeValue — every empty shape becomes null', () => {
  it('maps empty text to null', () => {
    expect(normalizeValue('text_short', '')).toBeNull();
    expect(normalizeValue('text_short', '   ')).toBeNull();
    expect(normalizeValue('text_long', '')).toBeNull();
    expect(normalizeValue('text_short', undefined)).toBeNull();
  });

  it('maps an empty date to null (the regex would reject "")', () => {
    expect(normalizeValue('date', '')).toBeNull();
    expect(normalizeValue('date', '2026-07-20')).toBe('2026-07-20');
  });

  it('maps an empty link to null (url is min(1))', () => {
    expect(normalizeValue('link', { url: '', label: '' })).toBeNull();
    expect(normalizeValue('link', undefined)).toBeNull();
    expect(normalizeValue('link', { url: 'https://x.dev' })).toEqual({
      url: 'https://x.dev',
      label: '',
    });
  });

  it('maps empty media to null and normalizes the kind', () => {
    expect(normalizeValue('video', { kind: 'upload', url: '' })).toBeNull();
    expect(normalizeValue('audio', { kind: 'link', url: '' })).toBeNull();
    expect(normalizeValue('video', { kind: 'link', url: 'u' })).toEqual({
      kind: 'link',
      url: 'u',
    });
    // Anything that isn't 'link' collapses to 'upload'.
    expect(normalizeValue('audio', { kind: 'nonsense', url: 'u' })).toEqual({
      kind: 'upload',
      url: 'u',
    });
  });

  it('maps empty images/galleries to null and keeps assetId only when present', () => {
    expect(normalizeValue('image', { url: '' })).toBeNull();
    expect(normalizeValue('image', undefined)).toBeNull();
    expect(normalizeValue('image', { url: 'u' })).toEqual({ url: 'u' });
    expect(normalizeValue('image', { url: 'u', assetId: 'a1' })).toEqual({
      url: 'u',
      assetId: 'a1',
    });

    expect(normalizeValue('gallery', [])).toBeNull();
    expect(normalizeValue('gallery', [{ url: '' }])).toBeNull();
    expect(normalizeValue('gallery', 'not-an-array')).toBeNull();
    expect(normalizeValue('gallery', [{ url: 'a' }, { url: '' }, { url: 'b' }])).toEqual([
      { url: 'a' },
      { url: 'b' },
    ]);
  });

  it('maps an all-empty stat pair to null but KEEPS a half-filled one', () => {
    expect(normalizeValue('stat', { key: '', value: '' })).toBeNull();
    expect(normalizeValue('stat', { key: '  ', value: '  ' })).toBeNull();
    expect(normalizeValue('stat', undefined)).toBeNull();
    expect(normalizeValue('stat', { key: 'Weight', value: '' })).toEqual({
      key: 'Weight',
      value: '',
    });
    expect(normalizeValue('stat', { key: '', value: '4.2 kg' })).toEqual({
      key: '',
      value: '4.2 kg',
    });
  });

  it('EXEMPTS tags — [] is legal stored data, never a delete sentinel', () => {
    expect(normalizeValue('tags', [])).toEqual([]);
    expect(normalizeValue('tags', undefined)).toEqual([]);
    expect(normalizeValue('tags', ['a', '  ', 'b', 42])).toEqual(['a', 'b']);
  });
});

describe('buildValuesPayload — the delete sentinel', () => {
  const fields = [field('a', 'text_short'), field('b', 'text_short')];

  it('sends null ONLY for keys the stored row actually holds', () => {
    const out = buildValuesPayload(fields, { a: '', b: '' }, { a: 'was here' });
    expect(out).toEqual({ a: null });
    // Anti-vacuity: `b` is absent entirely, not present-and-undefined.
    expect(Object.prototype.hasOwnProperty.call(out, 'b')).toBe(false);
  });

  it('omits every empty on CREATE (stored === null — nothing to delete)', () => {
    expect(buildValuesPayload(fields, { a: '', b: '' }, null)).toEqual({});
  });

  it('always sends non-empty values', () => {
    expect(buildValuesPayload(fields, { a: 'x', b: '' }, null)).toEqual({ a: 'x' });
  });
});

describe('buildValuesPayload — the editableTypes narrowing (dashboard board)', () => {
  const fields = [field('title', 'text_short'), field('cover', 'image')];
  const stored = { title: 'Oak House', cover: { url: 'https://cdn/x.jpg' } };

  it('SKIPS non-editable types instead of null-deleting them', () => {
    // The board never drafts media. Without the narrowing, `cover` would normalize
    // to null and — because `stored` holds the key — be sent as a DELETE, silently
    // wiping an image the board cannot even display. This is the regression.
    const out = buildValuesPayload(fields, { title: 'Oak House II' }, stored, {
      editableTypes: ['text_short'],
    });
    expect(out).toEqual({ title: 'Oak House II' });
    expect(Object.prototype.hasOwnProperty.call(out, 'cover')).toBe(false);
  });

  it('still deletes an editable field that was cleared', () => {
    const out = buildValuesPayload(fields, { title: '' }, stored, {
      editableTypes: ['text_short'],
    });
    expect(out).toEqual({ title: null });
  });

  it('without the option, EVERY field is processed (the site editor)', () => {
    // Mutation guard on the branch above: same inputs, no narrowing → cover IS
    // deleted. If the option stopped being honoured, the previous test would pass
    // vacuously and this one would fail.
    const out = buildValuesPayload(fields, { title: 'Oak House II' }, stored);
    expect(out).toEqual({ title: 'Oak House II', cover: null });
  });
});

describe('the module stays store-free and prisma-free', () => {
  it('has ZERO runtime imports (type-only)', async () => {
    // The whole reason this module exists is that the dashboard board can import it
    // without pulling in the edit store. A value import here would be a back door,
    // so bite on the import lines themselves rather than trusting the docblock.
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const src = readFileSync(join(process.cwd(), 'src/modules/cms/values.ts'), 'utf8');

    const importLines = src.split('\n').filter((l) => /^\s*import\s/.test(l));
    // Anti-vacuity: there IS at least one import line to inspect.
    expect(importLines.length).toBeGreaterThan(0);
    for (const line of importLines) {
      expect(line).toMatch(/^\s*import\s+type\s/);
    }
    expect(src).not.toMatch(/require\(/);
    // Bite on module SPECIFIERS, not prose — the docblock above names
    // `src/hooks/editStore/**` on purpose, to explain why it is banned.
    const specifiers = [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    expect(specifiers.length).toBeGreaterThan(0);
    for (const s of specifiers) {
      expect(s).not.toContain('editStore');
      expect(s).not.toContain('useEditStore');
      expect(s).not.toContain('prisma');
    }
  });
});
