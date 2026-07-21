// Tests for the visitor auto-reply (lead-emails phase 2).
//
// The security-critical block is "anti-spam-relay ({name} sanitization)": those
// cases feed HOSTILE visitor input and assert its ABSENCE from the serialized
// Resend payload (both the text and the html part). A test that only asserted
// "an email was sent" would sit green while relaying spam — don't weaken them
// into presence-only checks.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import { sendVisitorAutoReply } from './sendVisitorAutoReply';
import {
  DEFAULT_AUTO_REPLY_BODY,
  DEFAULT_AUTO_REPLY_SUBJECT,
  renderAutoReply,
  sanitizeNameToken,
} from './autoReplyTemplate';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const OWNER = 'owner@example.com';
const VISITOR = 'visitor@example.com';

const FIELDS = [
  { id: 'f_name', type: 'text', label: 'Your name', required: true },
  { id: 'f_email', type: 'email', label: 'Email address', required: true },
  { id: 'f_msg', type: 'textarea', label: 'Message', required: false },
] as any[];

function form(overrides: any = {}) {
  return { fields: FIELDS, ...overrides };
}

function mockFetchOk() {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** The JSON body actually handed to Resend. */
function payloadOf(fetchMock: ReturnType<typeof vi.fn>) {
  return JSON.parse(fetchMock.mock.calls[0][1].body);
}

describe('sendVisitorAutoReply', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('LEAD_NOTIFICATION_FROM', 'leads@mail.lessgo.site');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('recipient pick', () => {
    it('uses the FIRST typed email field, beating the conventional data.email', async () => {
      const fetchMock = mockFetchOk();

      const outcome = await sendVisitorAutoReply({
        form: form(),
        data: { f_email: VISITOR, email: 'wrong@example.com', f_name: 'Asha' },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      expect(outcome).toEqual({ status: 'sent' });
      expect(payloadOf(fetchMock).to).toBe(VISITOR);
    });

    it('multiple email fields → the first by `fields` order', async () => {
      const fetchMock = mockFetchOk();

      await sendVisitorAutoReply({
        form: form({
          fields: [
            { id: 'work', type: 'email', label: 'Work email' },
            { id: 'personal', type: 'email', label: 'Personal email' },
          ],
        }),
        data: { work: 'first@example.com', personal: 'second@example.com' },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      expect(payloadOf(fetchMock).to).toBe('first@example.com');
    });

    it('no stored form config (frozen form.v1 blob) → falls back to data.email', async () => {
      const fetchMock = mockFetchOk();

      const outcome = await sendVisitorAutoReply({
        data: { email: VISITOR, name: 'Asha' },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      expect(outcome).toEqual({ status: 'sent' });
      expect(payloadOf(fetchMock).to).toBe(VISITOR);
    });

    it('invalid address in the email field → skipped, nothing sent', async () => {
      const fetchMock = mockFetchOk();

      const outcome = await sendVisitorAutoReply({
        form: form(),
        data: { f_email: 'not-an-email' },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      expect(outcome).toEqual({ status: 'skipped' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('no email anywhere → skipped, nothing sent', async () => {
      const fetchMock = mockFetchOk();

      const outcome = await sendVisitorAutoReply({
        form: form({ fields: [{ id: 'f_msg', type: 'textarea', label: 'Message' }] }),
        data: { f_msg: 'hi' },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      expect(outcome).toEqual({ status: 'skipped' });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('enable / disable', () => {
    it('is ON when no autoReply config exists at all', async () => {
      const fetchMock = mockFetchOk();

      const outcome = await sendVisitorAutoReply({
        form: form(),
        data: { f_email: VISITOR },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      expect(outcome).toEqual({ status: 'sent' });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('is ON when enabled: true', async () => {
      const fetchMock = mockFetchOk();

      await sendVisitorAutoReply({
        form: form({ autoReply: { enabled: true } }),
        data: { f_email: VISITOR },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('enabled: false → skipped, nothing sent', async () => {
      const fetchMock = mockFetchOk();

      const outcome = await sendVisitorAutoReply({
        form: form({ autoReply: { enabled: false, body: 'should never send' } }),
        data: { f_email: VISITOR },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      expect(outcome).toEqual({ status: 'skipped' });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('template rendering', () => {
    it('default template: name + business substituted, tokens gone', async () => {
      const fetchMock = mockFetchOk();

      await sendVisitorAutoReply({
        form: form(),
        data: { f_email: VISITOR, f_name: 'Asha' },
        businessName: 'Naayom Farms',
        ownerEmail: OWNER,
      });

      const p = payloadOf(fetchMock);
      expect(p.subject).toBe(DEFAULT_AUTO_REPLY_SUBJECT);
      expect(p.text).toContain('Asha');
      expect(p.text).toContain('Naayom Farms');
      expect(p.text).not.toContain('{name}');
      expect(p.text).not.toContain('{business}');
      expect(p.html).toContain('Naayom Farms');
      expect(p.html).not.toContain('{business}');
    });

    it('custom owner subject + body win over the defaults, tokens still work', async () => {
      const fetchMock = mockFetchOk();

      await sendVisitorAutoReply({
        form: form({
          autoReply: {
            enabled: true,
            subject: 'Got it, {name}!',
            body: 'Hi {name}, {business} will call you back today.',
          },
        }),
        data: { f_email: VISITOR, f_name: 'Asha' },
        businessName: 'Naayom Farms',
        ownerEmail: OWNER,
      });

      const p = payloadOf(fetchMock);
      expect(p.subject).toBe('Got it, Asha!');
      expect(p.text).toBe('Hi Asha, Naayom Farms will call you back today.');
      expect(p.text).not.toContain(DEFAULT_AUTO_REPLY_BODY);
    });

    it('no name submitted → the token collapses, no dangling placeholder or double space', async () => {
      const fetchMock = mockFetchOk();

      await sendVisitorAutoReply({
        form: form(),
        data: { f_email: VISITOR },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      const p = payloadOf(fetchMock);
      expect(p.text).not.toContain('{name}');
      expect(p.text).not.toMatch(/ {2}/);
      expect(p.text.startsWith('Thanks —')).toBe(true);
    });

    it('falls back to data.name when no name-ish field is declared', async () => {
      const fetchMock = mockFetchOk();

      await sendVisitorAutoReply({
        form: form({ fields: [{ id: 'f_email', type: 'email', label: 'Email' }] }),
        data: { f_email: VISITOR, name: 'Asha' },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      expect(payloadOf(fetchMock).text).toContain('Asha');
    });
  });

  // ⚠️ Decision 7 verification. Hostile input in, ABSENCE asserted out.
  describe('anti-spam-relay: {name} sanitization', () => {
    it('strips script markup — no tag survives into text or html', async () => {
      const fetchMock = mockFetchOk();
      const hostile = '<script>alert("xss")</script>';

      await sendVisitorAutoReply({
        form: form(),
        data: { f_email: VISITOR, f_name: hostile },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      const raw = fetchMock.mock.calls[0][1].body as string;
      const p = JSON.parse(raw);
      expect(p.text).not.toContain('<script');
      expect(p.text).not.toContain('</script');
      expect(p.html).not.toContain('<script');
      expect(p.html).not.toContain('</script');
      // not smuggled through an entity either
      expect(p.text).not.toContain('&lt;script');
      expect(raw).not.toContain('alert(\\"xss\\")');
    });

    it('strips links — no URL, domain or scheme reaches the payload', async () => {
      const fetchMock = mockFetchOk();

      await sendVisitorAutoReply({
        form: form(),
        data: {
          f_email: VISITOR,
          f_name: 'Buy now http://spam.example/cheap and www.evil.xyz or evil.tk',
        },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      const raw = fetchMock.mock.calls[0][1].body as string;
      expect(raw).not.toContain('http://');
      expect(raw).not.toContain('spam.example');
      expect(raw).not.toContain('www.evil');
      expect(raw).not.toContain('evil.xyz');
      expect(raw).not.toContain('evil.tk');
      // the harmless words survive, proving we sent the body (not just an empty one)
      expect(JSON.parse(raw).text).toContain('Buy now');
    });

    it('strips newlines (no header/paragraph injection)', async () => {
      const fetchMock = mockFetchOk();

      await sendVisitorAutoReply({
        form: form(),
        data: { f_email: VISITOR, f_name: 'Asha\r\nBcc: victim@example.com\nFREE MONEY' },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      const p = payloadOf(fetchMock);
      const line = p.text.split('\n')[0];
      // whole body is one line: the injected breaks were removed
      expect(p.text.split('\n').length).toBe(1);
      expect(line).toContain('Asha');
      expect(p.text).not.toContain('\r');
      // the injected header text is now inert inline copy, not a header
      expect(p.text.startsWith('Thanks Asha Bcc:')).toBe(true);
    });

    it('caps a 500-character name at 80 characters', async () => {
      const fetchMock = mockFetchOk();
      const long = 'A'.repeat(500);

      await sendVisitorAutoReply({
        form: form(),
        data: { f_email: VISITOR, f_name: long },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      const p = payloadOf(fetchMock);
      expect(p.text).not.toContain('A'.repeat(81));
      expect(p.text).toContain('A'.repeat(80));
      expect(p.text.length).toBeLessThan(200);
    });

    it('the visitor MESSAGE never appears in the body (only the name token can)', async () => {
      const fetchMock = mockFetchOk();

      await sendVisitorAutoReply({
        form: form(),
        data: {
          f_email: VISITOR,
          f_name: 'Asha',
          f_msg: 'CLAIM YOUR PRIZE AT spam-site.example',
        },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      const raw = fetchMock.mock.calls[0][1].body as string;
      expect(raw).not.toContain('CLAIM YOUR PRIZE');
      expect(raw).not.toContain('spam-site');
    });

    it('a visitor-typed {business} token is NOT substituted or re-expanded', async () => {
      const fetchMock = mockFetchOk();

      await sendVisitorAutoReply({
        form: form(),
        data: { f_email: VISITOR, f_name: '{business}{name}' },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      const p = payloadOf(fetchMock);
      expect(p.text).not.toContain('{business}');
      expect(p.text).not.toContain('{name}');
      // braces stripped ⇒ the literal words remain, but no second Acme substitution
      expect(p.text.match(/Acme/g)?.length).toBe(1);
    });
  });

  describe('headers + envelope', () => {
    it('Reply-To is the OWNER and From carries the business name at our address', async () => {
      const fetchMock = mockFetchOk();

      await sendVisitorAutoReply({
        form: form(),
        data: { f_email: VISITOR, f_name: 'Asha' },
        businessName: 'Naayom Farms',
        ownerEmail: OWNER,
      });

      const p = payloadOf(fetchMock);
      expect(p.reply_to).toBe(OWNER);
      expect(p.from).toBe('"Naayom Farms" <leads@mail.lessgo.site>');
      expect(p.to).toBe(VISITOR);
    });

    it('honours an explicit fromAddress override', async () => {
      const fetchMock = mockFetchOk();

      await sendVisitorAutoReply({
        form: form(),
        data: { f_email: VISITOR },
        businessName: 'Acme',
        ownerEmail: OWNER,
        fromAddress: 'hello@mail.lessgo.site',
      });

      expect(payloadOf(fetchMock).from).toBe('"Acme" <hello@mail.lessgo.site>');
    });

    it('a hostile business name cannot inject a header', async () => {
      const fetchMock = mockFetchOk();

      await sendVisitorAutoReply({
        form: form(),
        data: { f_email: VISITOR },
        businessName: 'Evil" <attacker@evil.com>\r\nBcc: victim@evil.com',
        ownerEmail: OWNER,
      });

      const from = payloadOf(fetchMock).from as string;
      expect(from).not.toContain('\r');
      expect(from).not.toContain('\n');
      expect((from.match(/"/g) || []).length).toBe(2);
      expect(from.endsWith('<leads@mail.lessgo.site>')).toBe(true);
    });

    it('an invalid owner email is dropped rather than sent as Reply-To', async () => {
      const fetchMock = mockFetchOk();

      await sendVisitorAutoReply({
        form: form(),
        data: { f_email: VISITOR },
        businessName: 'Acme',
        ownerEmail: 'not-an-email',
      });

      expect(payloadOf(fetchMock).reply_to).toBeUndefined();
    });
  });

  describe('failure behaviour', () => {
    it('no RESEND_API_KEY → skipped, no network call', async () => {
      vi.unstubAllEnvs();
      const fetchMock = mockFetchOk();

      const outcome = await sendVisitorAutoReply({
        form: form(),
        data: { f_email: VISITOR },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      expect(outcome).toEqual({ status: 'skipped' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('non-OK Resend response → failed + Sentry tagged with the auto-reply op', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 422, text: async () => 'bad' })
      );

      const outcome = await sendVisitorAutoReply({
        form: form(),
        data: { f_email: VISITOR },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      expect(outcome.status).toBe('failed');
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
      const ctx = (Sentry.captureException as any).mock.calls[0][1];
      expect(ctx.tags).toEqual({ area: 'email', op: 'sendVisitorAutoReply' });
    });

    it('never throws when fetch rejects', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

      const outcome = await sendVisitorAutoReply({
        form: form(),
        data: { f_email: VISITOR },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      expect(outcome.status).toBe('failed');
    });

    it('never throws on a garbage form config', async () => {
      const fetchMock = mockFetchOk();

      const outcome = await sendVisitorAutoReply({
        form: { fields: 'not-an-array' } as any,
        data: { email: VISITOR },
        businessName: 'Acme',
        ownerEmail: OWNER,
      });

      expect(outcome.status).not.toBe(undefined);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});

// Pure helpers — client-safe module, no mocking needed.
describe('autoReplyTemplate helpers', () => {
  it('sanitizeNameToken: non-strings and empties collapse to ""', () => {
    expect(sanitizeNameToken(undefined)).toBe('');
    expect(sanitizeNameToken(null)).toBe('');
    expect(sanitizeNameToken(42)).toBe('');
    expect(sanitizeNameToken('   ')).toBe('');
  });

  it('sanitizeNameToken: ordinary names survive intact', () => {
    expect(sanitizeNameToken('Asha')).toBe('Asha');
    expect(sanitizeNameToken('  Anna-Maria  O Brien ')).toBe('Anna-Maria O Brien');
  });

  it('renderAutoReply: unknown tokens are left LITERAL (no eval, no lookup)', () => {
    const out = renderAutoReply('Hi {name}, {business}, {email} {__proto__}', {
      name: 'Asha',
      business: 'Acme',
    });
    expect(out).toBe('Hi Asha, Acme, {email} {__proto__}');
  });

  it('renderAutoReply: empty template falls back to an empty string, never throws', () => {
    expect(renderAutoReply('', { name: 'Asha', business: 'Acme' })).toBe('');
    expect(renderAutoReply(undefined as any, { business: 'Acme' })).toBe('');
  });
});
