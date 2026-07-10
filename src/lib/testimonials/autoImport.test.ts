// proof-truth phase 3: confirm-time auto-import coverage. Prisma is mocked (repo
// convention, repo.test.ts): no migration, no rows written to shared dev.
// Proves dedup idempotency, normalization, source/status/projectId correctness,
// blank author fields, and that empty/absent input writes zero rows.

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    testimonial: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { importScrapedTestimonials, normalizeQuote } from './autoImport';

const db = prisma.testimonial as unknown as Record<'create' | 'findMany', ReturnType<typeof vi.fn>>;

// Testimonial-shaped factory (only fields the helper reads).
const row = (over: Partial<Record<string, unknown>> = {}) =>
  ({
    id: 'id',
    userId: 'user_1',
    projectId: 'proj_1',
    authorName: '',
    quote: 'Great product',
    status: 'approved',
    source: 'imported',
    ...over,
  }) as never;

beforeEach(() => {
  vi.clearAllMocks();
  // Default: create echoes back a row-shaped object.
  db.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({ id: 'new', ...data }),
  );
});

describe('normalizeQuote', () => {
  it('trims, collapses internal whitespace, lowercases', () => {
    expect(normalizeQuote('  Cut   Setup\tTime  ')).toBe('cut setup time');
  });
});

describe('importScrapedTestimonials', () => {
  it('creates a row per new quote with source=imported/status=approved/projectId/blank author', async () => {
    db.findMany.mockResolvedValue([]);
    await importScrapedTestimonials('user_1', 'proj_1', ['Cut setup from days to minutes.']);

    expect(db.create).toHaveBeenCalledTimes(1);
    const data = db.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      userId: 'user_1',
      projectId: 'proj_1',
      quote: 'Cut setup from days to minutes.',
      status: 'approved',
      source: 'imported',
      authorName: '',
      authorRole: null,
      authorCompany: null,
    });
  });

  it('is idempotent: re-import of the same quotes writes zero new rows', async () => {
    db.findMany.mockResolvedValue([row({ quote: 'Cut setup from days to minutes.' })]);
    await importScrapedTestimonials('user_1', 'proj_1', ['Cut setup from days to minutes.']);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('dedupes normalized variants (whitespace + case) vs existing rows', async () => {
    db.findMany.mockResolvedValue([row({ quote: 'Cut setup from days to minutes.' })]);
    await importScrapedTestimonials('user_1', 'proj_1', ['  cut   SETUP from days to minutes.  ']);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('dedupes normalized variants WITHIN one batch', async () => {
    db.findMany.mockResolvedValue([]);
    await importScrapedTestimonials('user_1', 'proj_1', [
      'Loved it.',
      '  LOVED   it. ',
      'Shipped in a day.',
    ]);
    expect(db.create).toHaveBeenCalledTimes(2);
    const quotes = db.create.mock.calls.map((c) => c[0].data.quote);
    expect(quotes).toEqual(['Loved it.', 'Shipped in a day.']);
  });

  it('skips blank / whitespace-only quotes', async () => {
    db.findMany.mockResolvedValue([]);
    await importScrapedTestimonials('user_1', 'proj_1', ['', '   ', 'Real quote.']);
    expect(db.create).toHaveBeenCalledTimes(1);
    expect(db.create.mock.calls[0][0].data.quote).toBe('Real quote.');
  });

  it('empty input → zero writes, returns existing approved rows', async () => {
    db.findMany.mockResolvedValue([row({ id: 'e1' }), row({ id: 'e2', status: 'pending' })]);
    const result = await importScrapedTestimonials('user_1', 'proj_1', []);
    expect(db.create).not.toHaveBeenCalled();
    // returns only the approved existing row
    expect(result.map((r) => r.id)).toEqual(['e1']);
  });

  it('scopes the existing-rows read by userId + projectId', async () => {
    db.findMany.mockResolvedValue([]);
    await importScrapedTestimonials('user_1', 'proj_1', ['x']);
    expect(db.findMany.mock.calls[0][0].where).toMatchObject({
      userId: 'user_1',
      projectId: 'proj_1',
    });
  });

  it('rejects missing userId / projectId', async () => {
    await expect(importScrapedTestimonials('', 'proj_1', ['x'])).rejects.toThrow(/userId/i);
    await expect(importScrapedTestimonials('user_1', '', ['x'])).rejects.toThrow(/projectId/i);
    expect(db.create).not.toHaveBeenCalled();
  });
});
