// Tests for the lead-notification email helper.
// Post lead-emails phase 1: the recipient is the PAGE OWNER's email, passed in as
// `to` — NOT the legacy fixed LEAD_NOTIFICATION_EMAIL inbox. The From display name
// is the business name (owner-typed ⇒ header-injection sanitized).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import { sendLeadNotification } from './sendLeadNotification';
import type { MVPFormField } from '@/types/core/forms';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const FIELDS: MVPFormField[] = [
  { id: 'name', type: 'text', label: 'Name', required: true },
  { id: 'email', type: 'email', label: 'Email', required: false },
  { id: 'chambers', type: 'select', label: 'Number of chambers', required: false, options: ['1–2', '3–5'] },
];

const DATA = { name: 'Asha', email: 'asha@farm.com', chambers: '3–5', empty: '' };
const OWNER = 'owner@example.com';

describe('sendLeadNotification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does NOT call fetch when env is unconfigured (returns skipped)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    // no RESEND_API_KEY
    const outcome = await sendLeadNotification({ formName: 'Contact', data: DATA, fields: FIELDS, to: OWNER });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(outcome).toEqual({ status: 'skipped' });
  });

  it('does NOT call fetch when there is no recipient at all', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');
    const outcome = await sendLeadNotification({ formName: 'Contact', data: DATA, fields: FIELDS });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(outcome).toEqual({ status: 'skipped' });
  });

  it('sends to the OWNER address, never to LEAD_NOTIFICATION_EMAIL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');
    // The retired founder inbox is still set in env — it must be ignored.
    vi.stubEnv('LEAD_NOTIFICATION_EMAIL', 'founder@lessgo.ai');
    vi.stubEnv('LEAD_NOTIFICATION_FROM', 'leads@mail.lessgo.site');

    const outcome = await sendLeadNotification({
      formName: 'Contact',
      data: DATA,
      fields: FIELDS,
      replyTo: DATA.email,
      pageId: 'page-1',
      to: OWNER,
      businessName: 'Naayom Farms',
    });
    expect(outcome).toEqual({ status: 'sent' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer re_test');

    const payload = JSON.parse(init.body);
    expect(payload.to).toBe(OWNER);
    expect(payload.to).not.toBe('founder@lessgo.ai');
    expect(JSON.stringify(payload)).not.toContain('founder@lessgo.ai');
    expect(payload.from).toBe('"Naayom Farms" <leads@mail.lessgo.site>');
    expect(payload.reply_to).toBe('asha@farm.com');
    // label mapping + value present; empty values dropped
    expect(payload.text).toContain('Number of chambers: 3–5');
    expect(payload.html).toContain('Number of chambers');
    expect(payload.text).not.toContain('empty:');
  });

  it('defaults the From address when LEAD_NOTIFICATION_FROM is unset, and omits reply_to when invalid', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');

    await sendLeadNotification({ formName: 'Contact', data: { name: 'Asha' }, fields: FIELDS, replyTo: undefined, to: OWNER });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.reply_to).toBeUndefined();
    expect(payload.from).toBe('onboarding@resend.dev'); // default sender, no display name
  });

  it('emits a bare From address when no business name is supplied', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('LEAD_NOTIFICATION_FROM', 'leads@mail.lessgo.site');

    await sendLeadNotification({ formName: 'Contact', data: DATA, to: OWNER });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.from).toBe('leads@mail.lessgo.site');
  });

  it('sanitizes a hostile business name out of the From header (no injection)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('LEAD_NOTIFICATION_FROM', 'leads@mail.lessgo.site');

    await sendLeadNotification({
      formName: 'Contact',
      data: DATA,
      to: OWNER,
      businessName: 'Evil" <attacker@evil.com>\r\nBcc: victim@evil.com',
    });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    // The injected quote/CRLF are gone: exactly one quoted display name + our address.
    expect(payload.from).toBe('"Evil <attacker@evil.com> Bcc: victim@evil.com" <leads@mail.lessgo.site>');
    expect(payload.from).not.toContain('\r');
    expect(payload.from).not.toContain('\n');
    expect(payload.from.match(/"/g)).toHaveLength(2);
    expect(payload.from.endsWith('<leads@mail.lessgo.site>')).toBe(true);
  });

  it('caps an absurdly long business name', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('LEAD_NOTIFICATION_FROM', 'leads@mail.lessgo.site');

    await sendLeadNotification({ formName: 'Contact', data: DATA, to: OWNER, businessName: 'A'.repeat(500) });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    const display = payload.from.slice(1, payload.from.indexOf('" <'));
    expect(display.length).toBeLessThanOrEqual(78);
  });

  it('captures a non-OK Resend response to Sentry (F30 observability)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => 'validation_error' });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');

    const outcome = await sendLeadNotification({ formName: 'Contact', data: DATA, fields: FIELDS, pageId: 'page-1', to: OWNER });
    expect(outcome).toEqual({ status: 'failed', error: 'Resend responded 403' });

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const [, opts] = (Sentry.captureException as any).mock.calls[0];
    expect(opts.tags).toMatchObject({ area: 'email', op: 'sendLeadNotification' });
    expect(opts.extra).toMatchObject({ status: 403, pageId: 'page-1' });
  });

  it('never throws when fetch rejects (returns failed outcome)', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network'));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');

    const outcome = await sendLeadNotification({ formName: 'Contact', data: DATA, fields: FIELDS, to: OWNER });
    expect(outcome).toEqual({ status: 'failed', error: 'send failed: network' });
  });

  it('legacy founder-notify caller (no `to`) still uses LEAD_NOTIFICATION_EMAIL', async () => {
    // /api/demand-lead passes no `to` — that path is out of scope for phase 1 and
    // must keep working unchanged.
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('LEAD_NOTIFICATION_EMAIL', 'founder@lessgo.ai');

    const outcome = await sendLeadNotification({ formName: 'Demand lead', data: DATA });
    expect(outcome).toEqual({ status: 'sent' });
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.to).toBe('founder@lessgo.ai');
  });
});
