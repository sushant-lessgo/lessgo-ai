// Tests for the shared low-level Resend send helper.
// Contract under test: env gate → skipped; payload shape; failure → Sentry-tagged
// `failed` outcome; never throws.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import { sendEmail } from './sendEmail';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const BASE = {
  to: 'owner@example.com',
  from: '"Acme" <leads@mail.lessgo.site>',
  subject: 'New Contact submission',
  text: 'body',
  html: '<p>body</p>',
  op: 'sendLeadNotification',
};

describe('sendEmail', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks(); // module mocks (Sentry) keep call history across tests
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('skips (no fetch) when RESEND_API_KEY is absent', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const outcome = await sendEmail(BASE);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(outcome).toEqual({ status: 'skipped' });
  });

  it('skips (no fetch) when there is no recipient', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');

    const outcome = await sendEmail({ ...BASE, to: '' });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(outcome).toEqual({ status: 'skipped' });
  });

  it('posts to Resend with auth + to/from/reply_to/subject/body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');

    const outcome = await sendEmail({ ...BASE, replyTo: 'visitor@example.com' });
    expect(outcome).toEqual({ status: 'sent' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer re_test');
    expect(init.headers['Content-Type']).toBe('application/json');

    const payload = JSON.parse(init.body);
    expect(payload.to).toBe('owner@example.com');
    expect(payload.from).toBe('"Acme" <leads@mail.lessgo.site>');
    expect(payload.reply_to).toBe('visitor@example.com');
    expect(payload.subject).toBe('New Contact submission');
    expect(payload.text).toBe('body');
    expect(payload.html).toBe('<p>body</p>');
  });

  it('omits reply_to when not provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');

    await sendEmail(BASE);

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.reply_to).toBeUndefined();
  });

  it('non-OK response → failed outcome + Sentry with the caller op tag', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => 'validation_error' });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');

    const outcome = await sendEmail({ ...BASE, op: 'sendVisitorAutoReply', extra: { pageId: 'page-1' } });
    expect(outcome).toEqual({ status: 'failed', error: 'Resend responded 403' });

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const [err, opts] = (Sentry.captureException as any).mock.calls[0];
    expect((err as Error).message).toContain('sendVisitorAutoReply');
    expect(opts.tags).toEqual({ area: 'email', op: 'sendVisitorAutoReply' });
    expect(opts.extra).toMatchObject({ status: 403, body: 'validation_error', pageId: 'page-1' });
  });

  it('never throws when fetch rejects (failed outcome + Sentry)', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network'));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');

    const outcome = await sendEmail(BASE);

    expect(outcome).toEqual({ status: 'failed', error: 'send failed: network' });
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const [, opts] = (Sentry.captureException as any).mock.calls[0];
    expect(opts.tags).toMatchObject({ area: 'email', op: 'sendLeadNotification' });
  });
});
