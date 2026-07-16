// dashboard-lifecycle-actions phase 7: `loadBlogSsr`'s DD0 serving gate and its ONE
// sanctioned opt-out. Public blog SSR must 404 on an unpublished site; the owner-only
// draft preview (`(blog-preview)/dashboard/blog/[slug]/[postId]/preview`) must NOT —
// it is authed + ownership-checked, and unpublish demotes every post to draft (DD2b),
// so gating it there would lock the owner out of their own drafts.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { publishedPage: { findUnique: vi.fn() } },
}));
vi.mock('@/lib/staticExport/buildPageMetadata', () => ({
  flattenContent: vi.fn(() => ({ flat: true })),
}));
vi.mock('@/lib/domains/liveHosts', () => ({
  liveHostsForPage: vi.fn(() => ({ canonicalDomain: 'x.lessgo.site' })),
}));

import { prisma } from '@/lib/prisma';
import { loadBlogSsr } from '../ssr';

const db = prisma as any;

const pageRow = (publishState: string) => ({
  id: 'pp_1',
  slug: 'acme',
  projectId: 'proj_1',
  content: { sections: [] },
  audienceType: 'service',
  templateId: 'hearth',
  publishState,
});

describe('loadBlogSsr — DD0 serving gate', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('default (public blog SSR routes)', () => {
    it.each(['published', 'publishing', 'failed'])('serves a %s page', async (state) => {
      db.publishedPage.findUnique.mockResolvedValue(pageRow(state));
      expect(await loadBlogSsr('acme')).not.toBeNull();
    });

    it.each(['draft', 'unpublishing'])('404s a %s page (unpublished site)', async (state) => {
      db.publishedPage.findUnique.mockResolvedValue(pageRow(state));
      expect(await loadBlogSsr('acme')).toBeNull();
    });
  });

  describe('requireServing: false (owner-only draft preview)', () => {
    it.each(['draft', 'unpublishing'])(
      'still loads a %s page — preview survives unpublish',
      async (state) => {
        db.publishedPage.findUnique.mockResolvedValue(pageRow(state));
        const ctx = await loadBlogSsr('acme', { requireServing: false });
        expect(ctx).not.toBeNull();
        expect(ctx!.page.publishState).toBe(state);
      },
    );

    it('does NOT bypass the non-publish-state guards', async () => {
      // The opt-out relaxes the serving predicate ONLY: a missing row, missing content
      // or a detached project still yield null.
      db.publishedPage.findUnique.mockResolvedValue(null);
      expect(await loadBlogSsr('acme', { requireServing: false })).toBeNull();

      db.publishedPage.findUnique.mockResolvedValue({ ...pageRow('draft'), content: null });
      expect(await loadBlogSsr('acme', { requireServing: false })).toBeNull();

      db.publishedPage.findUnique.mockResolvedValue({ ...pageRow('draft'), projectId: null });
      expect(await loadBlogSsr('acme', { requireServing: false })).toBeNull();
    });
  });
});
