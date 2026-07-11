import { describe, it, expect } from 'vitest';
import { resolveAlt } from './altText';

describe('resolveAlt — fallback chain', () => {
  it('string metadata wins over the sibling fallback', () => {
    expect(resolveAlt('authored alt', undefined, 'sibling title')).toBe('authored alt');
  });

  it('record + itemId returns the per-item value', () => {
    const meta = { a: 'alt A', b: 'alt B' };
    expect(resolveAlt(meta, 'b', 'sibling')).toBe('alt B');
  });

  it('record but missing itemId falls back to sibling', () => {
    const meta = { a: 'alt A' };
    expect(resolveAlt(meta, 'zzz', 'sibling title')).toBe('sibling title');
    // no itemId at all
    expect(resolveAlt(meta, undefined, 'sibling title')).toBe('sibling title');
  });

  it('empty-string string metadata is unset → sibling fallback', () => {
    expect(resolveAlt('', undefined, 'sibling title')).toBe('sibling title');
  });

  it('empty-string per-item metadata is unset → sibling fallback', () => {
    expect(resolveAlt({ a: '' }, 'a', 'sibling title')).toBe('sibling title');
  });

  it('no metadata + no fallback → empty string', () => {
    expect(resolveAlt(undefined, undefined, undefined)).toBe('');
    expect(resolveAlt(undefined, 'a', '')).toBe('');
  });

  it('undefined metadata with a sibling fallback returns the sibling', () => {
    expect(resolveAlt(undefined, undefined, 'sibling title')).toBe('sibling title');
  });
});
