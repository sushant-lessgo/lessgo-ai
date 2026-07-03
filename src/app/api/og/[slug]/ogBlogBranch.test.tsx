// Blog (P2): OG route /blog branch. Pins the bug fix — buildPageMetadata emits
// /api/og/{slug}?path=/blog/* URLs, which used to 404 (only content.subpages was
// resolved). Prisma + next/og are mocked; assertions walk the JSX passed to
// ImageResponse to verify the rendered text.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const imageResponseSpy = vi.fn();
vi.mock('next/og', () => ({
  ImageResponse: class {
    status = 200;
    constructor(element: any) {
      imageResponseSpy(element);
    }
  },
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    publishedPage: { findUnique: vi.fn() },
    blogPost: { findUnique: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { GET } from './route';

const db = prisma as any;

const PAGE = {
  title: 'Acme',
  projectId: 'proj_1',
  themeValues: null,
  content: {
    layout: { sections: ['hero-1'], theme: { colors: { accentColor: '#3366ff' } } },
    content: { 'hero-1': { elements: { headline: { content: 'Site headline' } } } },
    subpages: { '/contact': { layout: { sections: [] }, content: {} } },
  },
};

function makeReq(path?: string) {
  const url = new URL(`https://lessgo.ai/api/og/acme${path ? `?path=${encodeURIComponent(path)}` : ''}`);
  return { nextUrl: url } as any;
}

/** Collect all string leaves of a React element tree. */
function textOf(el: any): string {
  if (el == null) return '';
  if (typeof el === 'string' || typeof el === 'number') return String(el);
  if (Array.isArray(el)) return el.map(textOf).join(' ');
  return textOf(el.props?.children);
}

beforeEach(() => {
  vi.clearAllMocks();
  db.publishedPage.findUnique.mockResolvedValue(PAGE);
});

describe('OG route /blog branch', () => {
  it('?path=/blog renders the blog index card with the site title', async () => {
    const res: any = await GET(makeReq('/blog'), { params: { slug: 'acme' } });
    expect(res.status).toBe(200);
    expect(textOf(imageResponseSpy.mock.calls[0][0])).toContain('Blog — Acme');
  });

  it('?path=/blog/{slug} renders a published post title + excerpt', async () => {
    db.blogPost.findUnique.mockResolvedValue({ title: 'Hello World', excerpt: 'A first post', status: 'published' });
    const res: any = await GET(makeReq('/blog/hello-world'), { params: { slug: 'acme' } });
    expect(res.status).toBe(200);
    expect(db.blogPost.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { projectId_slug: { projectId: 'proj_1', slug: 'hello-world' } } })
    );
    const text = textOf(imageResponseSpy.mock.calls[0][0]);
    expect(text).toContain('Hello World');
    expect(text).toContain('A first post');
  });

  it('404s a draft post', async () => {
    db.blogPost.findUnique.mockResolvedValue({ title: 'x', excerpt: null, status: 'draft' });
    const res: any = await GET(makeReq('/blog/draft-post'), { params: { slug: 'acme' } });
    expect(res.status).toBe(404);
  });

  it('404s an unknown post', async () => {
    db.blogPost.findUnique.mockResolvedValue(null);
    const res: any = await GET(makeReq('/blog/nope'), { params: { slug: 'acme' } });
    expect(res.status).toBe(404);
  });

  it('non-blog subpage lookups still work (regression)', async () => {
    const res: any = await GET(makeReq('/contact'), { params: { slug: 'acme' } });
    expect(res.status).toBe(200);
    const missing: any = await GET(makeReq('/nope'), { params: { slug: 'acme' } });
    expect(missing.status).toBe(404);
  });
});
