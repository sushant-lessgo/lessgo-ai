// Phase 1 foundation coverage for the testimonial repo. Prisma is mocked (per PO review):
// the test needs no migration applied to shared dev and writes no rows. Proves owner-scoping,
// default lifecycle values, and repo-layer status/source/rating validation (the DB has no enum).

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    testimonial: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import {
  createTestimonial,
  listTestimonialsByOwner,
  updateTestimonialStatus,
  deleteTestimonial,
} from './repo';

const db = prisma.testimonial as unknown as Record<'create' | 'findMany' | 'findUnique' | 'update' | 'delete', ReturnType<typeof vi.fn>>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createTestimonial', () => {
  const valid = { userId: 'user_1', authorName: 'Ada', quote: 'Cut setup from days to minutes.' };

  it('defaults status=pending and source=manual, normalizes optionals to null', async () => {
    db.create.mockResolvedValue({ id: 't1' });
    await createTestimonial(valid);

    expect(db.create).toHaveBeenCalledTimes(1);
    const data = db.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      userId: 'user_1',
      authorName: 'Ada',
      quote: 'Cut setup from days to minutes.',
      status: 'pending',
      source: 'manual',
      projectId: null,
      authorRole: null,
      rating: null,
    });
  });

  it('rejects invalid status / source / rating without touching the DB', () => {
    expect(() => createTestimonial({ ...valid, status: 'live' as never })).toThrow(/status/i);
    expect(() => createTestimonial({ ...valid, source: 'zapier' as never })).toThrow(/source/i);
    expect(() => createTestimonial({ ...valid, rating: 9 })).toThrow(/rating/i);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects missing required fields', () => {
    expect(() => createTestimonial({ ...valid, authorName: '  ' })).toThrow(/authorName/i);
    expect(() => createTestimonial({ ...valid, quote: '' })).toThrow(/quote/i);
    expect(() => createTestimonial({ ...valid, userId: '' })).toThrow(/userId/i);
  });
});

describe('listTestimonialsByOwner', () => {
  it('scopes by userId and orders newest first', async () => {
    db.findMany.mockResolvedValue([]);
    await listTestimonialsByOwner('user_1');
    expect(db.findMany).toHaveBeenCalledWith({
      where: { userId: 'user_1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('applies the status filter when provided', async () => {
    db.findMany.mockResolvedValue([]);
    await listTestimonialsByOwner('user_1', { status: 'approved' });
    expect(db.findMany.mock.calls[0][0].where).toEqual({ userId: 'user_1', status: 'approved' });
  });

  it('rejects an invalid status filter', () => {
    expect(() => listTestimonialsByOwner('user_1', { status: 'nope' as never })).toThrow(/status/i);
  });
});

describe('updateTestimonialStatus', () => {
  it('updates on a valid status', async () => {
    db.update.mockResolvedValue({ id: 't1', status: 'approved' });
    await updateTestimonialStatus('t1', 'approved');
    expect(db.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { status: 'approved' } });
  });

  it('throws on an invalid status', () => {
    expect(() => updateTestimonialStatus('t1', 'spam' as never)).toThrow(/status/i);
    expect(db.update).not.toHaveBeenCalled();
  });
});

describe('deleteTestimonial', () => {
  it('deletes by id', async () => {
    db.delete.mockResolvedValue({ id: 't1' });
    await deleteTestimonial('t1');
    expect(db.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
  });
});
