// Phase 1 security seam for dashboard-rollups-inbox: cross-user isolation of getAccountScope().
// The prisma singleton is mocked (no DB needed) and the helper's injectable `db` gets an in-memory
// fake that filters a two-user fixture by args.where.userId. This vitest is the AUTOMATED cross-user
// guarantee for the feature — the Playwright fixture is single-account, so no cross-user e2e exists.

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { publishedPage: { findMany: vi.fn() } },
}));

import { getAccountScope } from './accountScope';

interface FixtureRow {
  id: string;
  slug: string;
  title: string | null;
  userId: string;
  isPublished: boolean;
}

const FIXTURE: FixtureRow[] = [
  { id: 'page_a1', slug: 'alpha-one', title: 'Alpha One', userId: 'user_A', isPublished: true },
  // unpublished page of A must still be in scope (historical leads/analytics still belong to A)
  { id: 'page_a2', slug: 'alpha-two', title: null, userId: 'user_A', isPublished: false },
  { id: 'page_b1', slug: 'bravo-one', title: 'Bravo One', userId: 'user_B', isPublished: true },
];

function makeFakeDb() {
  const findMany = vi.fn(async (args: { where: { userId: string }; select: Record<string, boolean> }) => {
    return FIXTURE.filter((r) => r.userId === args.where.userId).map((r) =>
      Object.fromEntries(Object.keys(args.select).map((k) => [k, r[k as keyof FixtureRow]]))
    );
  });
  return { db: { publishedPage: { findMany } } as never, findMany };
}

describe('getAccountScope', () => {
  it('isolates each user to their own pages (both directions)', async () => {
    const a = await getAccountScope('user_A', makeFakeDb().db);
    expect(a.pageIds).toEqual(['page_a1', 'page_a2']);
    expect(a.slugs).toEqual(['alpha-one', 'alpha-two']);
    expect(a.pages).toEqual([
      { id: 'page_a1', slug: 'alpha-one', title: 'Alpha One' },
      { id: 'page_a2', slug: 'alpha-two', title: null },
    ]);
    expect(a.pageIds).not.toContain('page_b1');
    expect(a.slugs).not.toContain('bravo-one');

    const b = await getAccountScope('user_B', makeFakeDb().db);
    expect(b.pageIds).toEqual(['page_b1']);
    expect(b.slugs).toEqual(['bravo-one']);
    expect(b.pageIds).not.toContain('page_a1');
    expect(b.pageIds).not.toContain('page_a2');
  });

  it('queries with where: { userId: <clerkId> } (guards against dropping/widening the filter)', async () => {
    const { db, findMany } = makeFakeDb();
    await getAccountScope('user_A', db);

    expect(findMany).toHaveBeenCalledTimes(1);
    const args = findMany.mock.calls[0][0];
    expect(args.where).toEqual({ userId: 'user_A' });
    expect(args.select).toEqual({ id: true, slug: true, title: true });
  });

  it('returns an empty scope for a user with no pages', async () => {
    const scope = await getAccountScope('user_unknown', makeFakeDb().db);
    expect(scope).toEqual({ pages: [], pageIds: [], slugs: [] });
  });
});
