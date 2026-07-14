import { describe, it, expect } from 'vitest';
import { normalizeCopyrightYear, filterFooterColumns } from './footerHygiene';

const CURRENT = new Date().getFullYear();

describe('normalizeCopyrightYear', () => {
  it('leaves a year RANGE untouched (© 2020–2024 must NOT become © 2026–2024)', () => {
    expect(normalizeCopyrightYear('© 2020–2024 X')).toBe('© 2020–2024 X');
  });

  it('normalizes a single © year to the current year', () => {
    expect(normalizeCopyrightYear('© 2024 X')).toBe(`© ${CURRENT} X`);
  });

  it('leaves an already-current year unchanged', () => {
    expect(normalizeCopyrightYear(`© ${CURRENT} X`)).toBe(`© ${CURRENT} X`);
  });

  it('does not touch a bare year with no © marker', () => {
    expect(normalizeCopyrightYear('Studio 2024 GmbH')).toBe('Studio 2024 GmbH');
  });

  it('passes undefined through', () => {
    expect(normalizeCopyrightYear(undefined)).toBeUndefined();
  });

  it('handles &copy; and (c) markers', () => {
    expect(normalizeCopyrightYear('&copy; 2019 X')).toBe(`&copy; ${CURRENT} X`);
    expect(normalizeCopyrightYear('(c) 2019 X')).toBe(`(c) ${CURRENT} X`);
  });
});

describe('filterFooterColumns', () => {
  const resolve = (href?: string) => href;

  it('drops a dead (#) link', () => {
    const cols = [
      { id: 'a', heading: 'A', links: [{ id: '1', label: 'live', href: '/x' }, { id: '2', label: 'dead', href: '#' }] },
    ];
    const out = filterFooterColumns(cols, resolve);
    expect(out[0].links).toHaveLength(1);
    expect(out[0].links[0].href).toBe('/x');
  });

  it('drops a column emptied by the link filter', () => {
    const cols = [
      { id: 'a', heading: 'A', links: [{ id: '1', label: 'dead', href: '#' }] },
      { id: 'b', heading: 'B', links: [{ id: '2', label: 'live', href: '/y' }] },
    ];
    const out = filterFooterColumns(cols, resolve);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('b');
  });

  it('keeps the live link in a column with 1 live + 1 dead', () => {
    const cols = [
      { id: 'a', heading: 'A', links: [{ id: '1', label: 'live', href: '/z' }, { id: '2', label: 'dead', href: '#' }] },
    ];
    const out = filterFooterColumns(cols, resolve);
    expect(out).toHaveLength(1);
    expect(out[0].links).toHaveLength(1);
    expect(out[0].links[0].label).toBe('live');
  });

  it('does not mutate the input', () => {
    const cols = [
      { id: 'a', heading: 'A', links: [{ id: '1', label: 'live', href: '/z' }, { id: '2', label: 'dead', href: '#' }] },
    ];
    const snapshot = JSON.parse(JSON.stringify(cols));
    filterFooterColumns(cols, resolve);
    expect(cols).toEqual(snapshot);
    expect(cols[0].links).toHaveLength(2);
  });

  it('drops a link whose resolveHref returns falsy', () => {
    const cols = [
      { id: 'a', heading: 'A', links: [{ id: '1', label: 'x', href: 'section-missing' }, { id: '2', label: 'y', href: '/ok' }] },
    ];
    const out = filterFooterColumns(cols, (href) => (href === 'section-missing' ? undefined : href));
    expect(out[0].links).toHaveLength(1);
    expect(out[0].links[0].href).toBe('/ok');
  });
});
