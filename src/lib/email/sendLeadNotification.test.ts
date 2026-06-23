// Tests for the env-gated lead-notification email helper.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendLeadNotification } from './sendLeadNotification';
import type { MVPFormField } from '@/types/core/forms';

const FIELDS: MVPFormField[] = [
  { id: 'name', type: 'text', label: 'Name', required: true },
  { id: 'email', type: 'email', label: 'Email', required: false },
  { id: 'chambers', type: 'select', label: 'Number of chambers', required: false, options: ['1–2', '3–5'] },
];

const DATA = { name: 'Asha', email: 'asha@farm.com', chambers: '3–5', empty: '' };

describe('sendLeadNotification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does NOT call fetch when env is unconfigured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    // no RESEND_API_KEY / LEAD_NOTIFICATION_EMAIL
    await sendLeadNotification({ formName: 'Contact', data: DATA, fields: FIELDS });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does NOT call fetch when only the API key is set (no recipient)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');
    await sendLeadNotification({ formName: 'Contact', data: DATA, fields: FIELDS });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts to Resend with correct auth, to/from, reply_to and labelled body when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('LEAD_NOTIFICATION_EMAIL', 'owner@naayom.com');
    vi.stubEnv('LEAD_NOTIFICATION_FROM', 'leads@naayom.com');

    await sendLeadNotification({ formName: 'Contact', data: DATA, fields: FIELDS, replyTo: DATA.email, pageId: 'page-1' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer re_test');

    const payload = JSON.parse(init.body);
    expect(payload.to).toBe('owner@naayom.com');
    expect(payload.from).toBe('leads@naayom.com');
    expect(payload.reply_to).toBe('asha@farm.com');
    // label mapping + value present; empty values dropped
    expect(payload.text).toContain('Number of chambers: 3–5');
    expect(payload.html).toContain('Number of chambers');
    expect(payload.text).not.toContain('empty:');
  });

  it('omits reply_to when the email is missing/invalid', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('LEAD_NOTIFICATION_EMAIL', 'owner@naayom.com');

    await sendLeadNotification({ formName: 'Contact', data: { name: 'Asha' }, fields: FIELDS, replyTo: undefined });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.reply_to).toBeUndefined();
    expect(payload.from).toBe('onboarding@resend.dev'); // default sender
  });

  it('never throws when fetch rejects', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network'));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('LEAD_NOTIFICATION_EMAIL', 'owner@naayom.com');

    await expect(
      sendLeadNotification({ formName: 'Contact', data: DATA, fields: FIELDS })
    ).resolves.toBeUndefined();
  });
});
