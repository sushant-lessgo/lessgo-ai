// Blog (P2): subscriber notification sender. Fetch + prisma mocked. Pins:
// env-gate no-op, per-subscriber send with personal unsubscribe token link,
// HTML escaping of user strings, and never-throws on Resend failure.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { blogSubscriber: { findMany: vi.fn() } },
}));

import { prisma } from '@/lib/prisma';
import { sendBlogPostNotification } from './sendBlogPostNotification';

const db = prisma as any;
const fetchMock = vi.fn();

const ARGS = {
  publishedPageId: 'page_1',
  siteTitle: 'Acme',
  canonicalHost: 'acme.com',
  post: { slug: 'hello', title: 'Hello <World>', excerpt: 'A & B' },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue({ ok: true });
  process.env.RESEND_API_KEY = 'test-key';
  db.blogSubscriber.findMany.mockResolvedValue([
    { email: 'a@x.com', token: 'tok-a' },
    { email: 'b@x.com', token: 'tok-b' },
  ]);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.RESEND_API_KEY;
});

describe('sendBlogPostNotification', () => {
  it('no-ops without RESEND_API_KEY', async () => {
    delete process.env.RESEND_API_KEY;
    await sendBlogPostNotification(ARGS);
    expect(db.blogSubscriber.findMany).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends one email per subscribed reader with a personal unsubscribe link', async () => {
    await sendBlogPostNotification(ARGS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const payloads = fetchMock.mock.calls.map((c) => JSON.parse(c[1].body));
    expect(payloads.map((p) => p.to).sort()).toEqual(['a@x.com', 'b@x.com']);
    const first = payloads.find((p) => p.to === 'a@x.com')!;
    expect(first.subject).toBe('Hello <World>');
    expect(first.text).toContain('https://acme.com/blog/hello');
    expect(first.text).toContain('/api/blog/unsubscribe?token=tok-a');
    expect(first.html).toContain('/api/blog/unsubscribe?token=tok-a');
    // user strings escaped in HTML
    expect(first.html).toContain('Hello &lt;World&gt;');
    expect(first.html).toContain('A &amp; B');
    expect(first.from).toContain('Acme');
  });

  it('sends nothing when the list is empty', async () => {
    db.blogSubscriber.findMany.mockResolvedValue([]);
    await sendBlogPostNotification(ARGS);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('queries only subscribed readers of the page', async () => {
    await sendBlogPostNotification(ARGS);
    expect(db.blogSubscriber.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publishedPageId: 'page_1', status: 'subscribed' },
      })
    );
  });

  it('never throws — Resend 500s and fetch rejections are swallowed', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });
    await expect(sendBlogPostNotification(ARGS)).resolves.toBeUndefined();

    fetchMock.mockRejectedValue(new Error('network down'));
    await expect(sendBlogPostNotification(ARGS)).resolves.toBeUndefined();

    db.blogSubscriber.findMany.mockRejectedValue(new Error('db down'));
    await expect(sendBlogPostNotification(ARGS)).resolves.toBeUndefined();
  });
});
