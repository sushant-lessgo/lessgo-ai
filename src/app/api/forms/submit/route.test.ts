// F30b: the /api/forms/submit path must record the lead-notification outcome on
// the FormSubmission row — notifiedAt on success, notifyError on failure — so a
// silently-failing inbox is visible in the dashboard. Everything external is
// mocked; this pins the row-flag write for each sendLeadNotification outcome and
// that a notify failure never affects the submitter's success response.
//
// pricing-v2 (phase 2): also covers the per-owner monthly form-submission cap
// (checkLimit against the current-month FormSubmission count) — over limit ⇒ 429
// with a stable error code, never a silent drop.
//
// secrets-forms-security (phase 1): pins server-side owner derivation. The request
// BODY still forges `userId: 'user_1'` on purpose — every assertion expects the
// DERIVED owner `'owner_1'` (from PublishedPage.userId) instead. That asymmetry IS
// the forged-id regression case; do not "fix" the body.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    publishedPage: { findUnique: vi.fn() },
    project: { findUnique: vi.fn() },
    formSubmission: { create: vi.fn(), update: vi.fn(), count: vi.fn() },
    blogSubscriber: { upsert: vi.fn() },
  },
}));
vi.mock('@/lib/planManager', () => ({ checkLimit: vi.fn() }));
vi.mock('@/lib/email/sendLeadNotification', () => ({ sendLeadNotification: vi.fn() }));
// lead-emails phase 1: the recipient is now the OWNER's Clerk email. Mocked so no
// real Clerk client is constructed in tests (it throws without a secret key).
vi.mock('@/lib/email/resolveOwnerEmail', () => ({ resolveOwnerEmail: vi.fn() }));
// lead-emails phase 2: the visitor auto-reply. Mocked here — its own unit test
// (src/lib/email/sendVisitorAutoReply.test.ts) covers rendering/sanitization; this
// file only pins the ROUTE's wiring (called after the owner notification, with the
// stored form config, and skipped when the owner email is unresolved).
// NOTE: only the SENDER is mocked. `pickVisitorEmail` keeps its real implementation
// because the route now uses it to resolve the owner notification's Reply-To
// (review fix 2) — mocking it away would make that test assert nothing.
vi.mock('@/lib/email/sendVisitorAutoReply', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/email/sendVisitorAutoReply')>();
  return { ...actual, sendVisitorAutoReply: vi.fn() };
});
vi.mock('@/lib/integrations/convertkit', () => ({
  ConvertKitIntegration: vi.fn(),
  mapFormDataToSubscriber: vi.fn(() => ({})),
}));
vi.mock('@/lib/rateLimit', () => ({ withFormRateLimit: (h: any) => h }));
vi.mock('@/lib/validation', () => ({
  FormSubmissionSchema: { safeParse: (b: any) => ({ success: true, data: b }) },
  sanitizeForLogging: (x: any) => x,
}));
vi.mock('@/lib/security', () => ({
  createSecureResponse: (body: any, status = 200) => ({ __body: body, __status: status }),
}));

import { prisma } from '@/lib/prisma';
import { sendLeadNotification } from '@/lib/email/sendLeadNotification';
import { resolveOwnerEmail } from '@/lib/email/resolveOwnerEmail';
import { sendVisitorAutoReply } from '@/lib/email/sendVisitorAutoReply';
import { checkLimit } from '@/lib/planManager';
import { BLOG_SUBSCRIBE_FORM_ID } from '@/lib/blog/buildBlogPages';
import { POST } from './route';

const db = prisma as any;
const notify = sendLeadNotification as unknown as ReturnType<typeof vi.fn>;
const resolveOwner = resolveOwnerEmail as unknown as ReturnType<typeof vi.fn>;
const autoReply = sendVisitorAutoReply as unknown as ReturnType<typeof vi.fn>;
const limit = checkLimit as unknown as ReturnType<typeof vi.fn>;
const OWNER_EMAIL = 'owner@example.com';

function makeReq(body: any) {
  return {
    method: 'POST',
    url: 'http://localhost/api/forms/submit',
    headers: { get: () => null },
    json: async () => body,
  } as any;
}

// `userId: 'user_1'` is a FORGED owner id — the server must ignore it and use the
// page's real owner (`owner_1`) everywhere.
const BODY = { formId: 'contact', data: { email: 'a@b.com', name: 'Asha' }, userId: 'user_1', publishedPageId: 'page_1' };
const PAGE = { userId: 'owner_1', projectId: 'proj_1', publishState: 'published' };

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('/api/forms/submit — notify outcome row flag (F30b)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // lead-emails review fix 3: the route now short-circuits the whole email block
    // (Clerk lookup included) when RESEND_API_KEY is unset. These suites exercise the
    // configured path, so the key must be present.
    vi.stubEnv('RESEND_API_KEY', 're_test');
    db.publishedPage.findUnique.mockResolvedValue(PAGE);
    db.project.findUnique.mockResolvedValue(null); // no formConfig; keeps the path minimal
    db.formSubmission.create.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.update.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.count.mockResolvedValue(3); // under any cap by default
    limit.mockResolvedValue({ allowed: true, limit: 25, current: 3 });
    resolveOwner.mockResolvedValue({ email: OWNER_EMAIL });
    autoReply.mockResolvedValue({ status: 'skipped' });
  });

  it('sets notifiedAt when the notification is sent', async () => {
    notify.mockResolvedValue({ status: 'sent' });
    const res: any = await POST(makeReq(BODY));

    expect(res.__body.success).toBe(true);
    expect(db.formSubmission.update).toHaveBeenCalledTimes(1);
    const arg = db.formSubmission.update.mock.calls[0][0];
    expect(arg.where).toEqual({ id: 'sub_1' });
    expect(arg.data.notifiedAt).toBeInstanceOf(Date);
    expect(arg.data.notifyError).toBeUndefined();
  });

  it('sets notifyError when the notification fails', async () => {
    notify.mockResolvedValue({ status: 'failed', error: 'Resend responded 403' });
    const res: any = await POST(makeReq(BODY));

    // Submitter still gets success — email failure is independent of form success.
    expect(res.__body.success).toBe(true);
    expect(db.formSubmission.update).toHaveBeenCalledTimes(1);
    const arg = db.formSubmission.update.mock.calls[0][0];
    expect(arg.where).toEqual({ id: 'sub_1' });
    expect(arg.data.notifyError).toBe('Resend responded 403');
    expect(arg.data.notifiedAt).toBeUndefined();
  });

  it('leaves the row unflagged when notification is skipped (unconfigured)', async () => {
    notify.mockResolvedValue({ status: 'skipped' });
    const res: any = await POST(makeReq(BODY));

    expect(res.__body.success).toBe(true);
    expect(db.formSubmission.update).not.toHaveBeenCalled();
  });

  it('still returns success if the status-write itself throws', async () => {
    notify.mockResolvedValue({ status: 'sent' });
    db.formSubmission.update.mockRejectedValue(new Error('db down'));
    const res: any = await POST(makeReq(BODY));

    expect(res.__status).toBe(200);
    expect(res.__body.success).toBe(true);
  });
});

describe('/api/forms/submit — monthly submission cap (pricing-v2 phase 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // lead-emails review fix 3: the route now short-circuits the whole email block
    // (Clerk lookup included) when RESEND_API_KEY is unset. These suites exercise the
    // configured path, so the key must be present.
    vi.stubEnv('RESEND_API_KEY', 're_test');
    db.publishedPage.findUnique.mockResolvedValue(PAGE);
    db.project.findUnique.mockResolvedValue(null);
    db.formSubmission.create.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.update.mockResolvedValue({ id: 'sub_1' });
    notify.mockResolvedValue({ status: 'skipped' });
    resolveOwner.mockResolvedValue({ email: OWNER_EMAIL });
    autoReply.mockResolvedValue({ status: 'skipped' });
  });

  it('counts the current calendar month for the DERIVED page owner (not the body userId)', async () => {
    db.formSubmission.count.mockResolvedValue(10);
    limit.mockResolvedValue({ allowed: true, limit: 25, current: 10 });
    await POST(makeReq(BODY));

    expect(db.formSubmission.count).toHaveBeenCalledTimes(1);
    const where = db.formSubmission.count.mock.calls[0][0].where;
    expect(where.userId).toBe('owner_1');
    expect(where.createdAt.gte).toBeInstanceOf(Date);
    // month start = first day of the current UTC month
    const gte = where.createdAt.gte as Date;
    expect(gte.getUTCDate()).toBe(1);
    expect(limit).toHaveBeenCalledWith('owner_1', 'formSubmissions', 10);
  });

  it('over limit → 429 with a stable error code, no submission stored', async () => {
    db.formSubmission.count.mockResolvedValue(25);
    limit.mockResolvedValue({ allowed: false, limit: 25, current: 25 });
    const res: any = await POST(makeReq(BODY));

    expect(res.__status).toBe(429);
    expect(res.__body.error).toBe('form_submission_limit_reached');
    expect(db.formSubmission.create).not.toHaveBeenCalled();
  });

  it('under limit → submission proceeds normally', async () => {
    db.formSubmission.count.mockResolvedValue(5);
    limit.mockResolvedValue({ allowed: true, limit: 25, current: 5 });
    const res: any = await POST(makeReq(BODY));

    expect(res.__body.success).toBe(true);
    expect(db.formSubmission.create).toHaveBeenCalledTimes(1);
  });
});

describe('/api/forms/submit — server-side owner derivation (secrets-forms-security phase 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // lead-emails review fix 3: the route now short-circuits the whole email block
    // (Clerk lookup included) when RESEND_API_KEY is unset. These suites exercise the
    // configured path, so the key must be present.
    vi.stubEnv('RESEND_API_KEY', 're_test');
    db.publishedPage.findUnique.mockResolvedValue(PAGE);
    db.project.findUnique.mockResolvedValue(null);
    db.formSubmission.create.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.update.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.count.mockResolvedValue(3);
    limit.mockResolvedValue({ allowed: true, limit: 25, current: 3 });
    notify.mockResolvedValue({ status: 'skipped' });
    resolveOwner.mockResolvedValue({ email: OWNER_EMAIL });
    autoReply.mockResolvedValue({ status: 'skipped' });
  });

  it('stores the DERIVED owner, never the forged body userId', async () => {
    const res: any = await POST(makeReq(BODY));

    expect(res.__body.success).toBe(true);
    expect(db.publishedPage.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'page_1' } })
    );
    const created = db.formSubmission.create.mock.calls[0][0].data;
    expect(created.userId).toBe('owner_1');
    expect(created.userId).not.toBe('user_1');
  });

  it('scopes the form-config lookup to the page’s OWN project', async () => {
    await POST(makeReq(BODY));

    // The `where` clause is the security-relevant half: the lookup must be pinned to
    // page.projectId (closes the same-owner cross-project confused-deputy). The `select`
    // stays a narrow allow-list (wire cost): `content` (form config) + `title`
    // (lead-email business name) and nothing else — no blanket fetch of the JSON columns.
    expect(db.project.findUnique).toHaveBeenCalledWith({
      where: { id: 'proj_1' },
      select: expect.objectContaining({ content: true, title: true }),
    });
    const select = db.project.findUnique.mock.calls[0][0].select;
    expect(Object.keys(select).sort()).toEqual(['content', 'title']);
  });

  it('page with a null projectId → skips the form-config lookup, still stores the lead', async () => {
    db.publishedPage.findUnique.mockResolvedValue({ ...PAGE, projectId: null });
    const res: any = await POST(makeReq(BODY));

    expect(res.__body.success).toBe(true);
    expect(db.project.findUnique).not.toHaveBeenCalled();
    const created = db.formSubmission.create.mock.calls[0][0].data;
    expect(created.userId).toBe('owner_1');
    expect(created.formName).toBe('Unknown Form');
    expect(res.__body.integrations).toEqual([]);
  });

  it('unknown publishedPageId → 404 unknown_page, nothing stored', async () => {
    db.publishedPage.findUnique.mockResolvedValue(null);
    const res: any = await POST(makeReq(BODY));

    expect(res.__status).toBe(404);
    expect(res.__body.error).toBe('unknown_page');
    expect(db.formSubmission.create).not.toHaveBeenCalled();
  });

  it('missing publishedPageId → 400 missing_page_id, no page lookup', async () => {
    const { publishedPageId, ...noPageId } = BODY;
    const res: any = await POST(makeReq(noPageId));

    expect(res.__status).toBe(400);
    expect(res.__body.error).toBe('missing_page_id');
    expect(db.publishedPage.findUnique).not.toHaveBeenCalled();
    expect(db.formSubmission.create).not.toHaveBeenCalled();
  });

  it.each(['draft', 'unpublishing'])('publishState %s → 404 unknown_page', async (publishState) => {
    db.publishedPage.findUnique.mockResolvedValue({ ...PAGE, publishState });
    const res: any = await POST(makeReq(BODY));

    expect(res.__status).toBe(404);
    expect(res.__body.error).toBe('unknown_page');
    expect(db.formSubmission.create).not.toHaveBeenCalled();
  });

  it.each(['publishing', 'failed'])('publishState %s → accepted (page still live)', async (publishState) => {
    db.publishedPage.findUnique.mockResolvedValue({ ...PAGE, publishState });
    const res: any = await POST(makeReq(BODY));

    expect(res.__body.success).toBe(true);
  });

  it('legacy null publishState → accepted (fail-open via isServingPublishState)', async () => {
    db.publishedPage.findUnique.mockResolvedValue({ ...PAGE, publishState: null });
    const res: any = await POST(makeReq(BODY));

    expect(res.__body.success).toBe(true);
    expect(db.formSubmission.create.mock.calls[0][0].data.userId).toBe('owner_1');
  });

  it('omitted body userId + valid page → 200, attributed to the page owner', async () => {
    const { userId, ...noUserId } = BODY;
    const res: any = await POST(makeReq(noUserId));

    expect(res.__body.success).toBe(true);
    expect(db.formSubmission.create.mock.calls[0][0].data.userId).toBe('owner_1');
  });
});

// lead-emails phase 1: the notification goes to the PAGE OWNER's Clerk email with the
// business name in the From display name — no more single fixed founder inbox.
describe('/api/forms/submit — owner-email routing (lead-emails phase 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // lead-emails review fix 3: the route now short-circuits the whole email block
    // (Clerk lookup included) when RESEND_API_KEY is unset. These suites exercise the
    // configured path, so the key must be present.
    vi.stubEnv('RESEND_API_KEY', 're_test');
    db.publishedPage.findUnique.mockResolvedValue({ ...PAGE, title: 'Naayom Farms' });
    db.project.findUnique.mockResolvedValue({ content: null, title: 'Naayom' });
    db.formSubmission.create.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.update.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.count.mockResolvedValue(3);
    limit.mockResolvedValue({ allowed: true, limit: 25, current: 3 });
    notify.mockResolvedValue({ status: 'sent' });
    resolveOwner.mockResolvedValue({ email: OWNER_EMAIL });
    autoReply.mockResolvedValue({ status: 'skipped' });
  });

  it('resolves the DERIVED owner and sends to that address with the page title as business name', async () => {
    const res: any = await POST(makeReq(BODY));

    expect(res.__body.success).toBe(true);
    expect(resolveOwner).toHaveBeenCalledWith('owner_1');
    expect(notify).toHaveBeenCalledTimes(1);
    const arg = notify.mock.calls[0][0];
    expect(arg.to).toBe(OWNER_EMAIL);
    expect(arg.businessName).toBe('Naayom Farms');
    expect(arg.replyTo).toBe('a@b.com'); // visitor email
    expect(arg.pageId).toBe('page_1');
    // notifiedAt still written on success
    expect(db.formSubmission.update.mock.calls[0][0].data.notifiedAt).toBeInstanceOf(Date);
  });

  it('falls back to the project title when the page has no title', async () => {
    db.publishedPage.findUnique.mockResolvedValue({ ...PAGE, title: null });
    await POST(makeReq(BODY));

    expect(notify.mock.calls[0][0].businessName).toBe('Naayom');
  });

  it('treats the default "Untitled Project" as a non-name and falls through', async () => {
    db.publishedPage.findUnique.mockResolvedValue({ ...PAGE, title: null });
    db.project.findUnique.mockResolvedValue({ content: null, title: 'Untitled Project' });
    await POST(makeReq(BODY));

    expect(notify.mock.calls[0][0].businessName).toBe('Your website');
  });

  it('owner email unresolved → lead still saved, notifyError written, NO send attempted (and no auto-reply)', async () => {
    resolveOwner.mockResolvedValue({ error: 'owner lookup failed: clerk down' });
    const res: any = await POST(makeReq(BODY));

    // Visitor still succeeds and the lead row exists — email is never load-bearing.
    expect(res.__body.success).toBe(true);
    expect(db.formSubmission.create).toHaveBeenCalledTimes(1);
    expect(db.formSubmission.create.mock.calls[0][0].data.userId).toBe('owner_1');
    // No send without a recipient.
    expect(notify).not.toHaveBeenCalled();
    // …but the failure is recorded on the row (F30 observability).
    expect(db.formSubmission.update).toHaveBeenCalledTimes(1);
    const arg = db.formSubmission.update.mock.calls[0][0];
    expect(arg.where).toEqual({ id: 'sub_1' });
    expect(arg.data.notifyError).toBe('owner lookup failed: clerk down');
    expect(arg.data.notifiedAt).toBeUndefined();
    // No owner Reply-To target ⇒ the visitor auto-reply is skipped too.
    expect(autoReply).not.toHaveBeenCalled();
  });
});

// lead-emails phase 2: the ROUTE's auto-reply wiring. Rendering/sanitization is
// covered by the helper's own unit test; here we pin who it is called with, that a
// failure is never load-bearing, and that no DB column is written for it.
describe('/api/forms/submit — visitor auto-reply wiring (lead-emails phase 2)', () => {
  const STORED_FORM = {
    id: 'contact',
    name: 'Contact',
    fields: [{ id: 'email', type: 'email', label: 'Email' }],
    autoReply: { enabled: true, body: 'Custom {name}' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // lead-emails review fix 3: the route now short-circuits the whole email block
    // (Clerk lookup included) when RESEND_API_KEY is unset. These suites exercise the
    // configured path, so the key must be present.
    vi.stubEnv('RESEND_API_KEY', 're_test');
    db.publishedPage.findUnique.mockResolvedValue({ ...PAGE, title: 'Naayom Farms' });
    db.project.findUnique.mockResolvedValue({ content: null, title: 'Naayom' });
    db.formSubmission.create.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.update.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.count.mockResolvedValue(3);
    limit.mockResolvedValue({ allowed: true, limit: 25, current: 3 });
    notify.mockResolvedValue({ status: 'sent' });
    resolveOwner.mockResolvedValue({ email: OWNER_EMAIL });
    autoReply.mockResolvedValue({ status: 'sent' });
  });

  it('sends the auto-reply with the submitted data, business name and owner Reply-To', async () => {
    const res: any = await POST(makeReq(BODY));

    expect(res.__body.success).toBe(true);
    expect(autoReply).toHaveBeenCalledTimes(1);
    const arg = autoReply.mock.calls[0][0];
    expect(arg.data).toEqual(BODY.data);
    expect(arg.businessName).toBe('Naayom Farms');
    expect(arg.ownerEmail).toBe(OWNER_EMAIL);
  });

  it('passes the stored form definition from finalContent.forms (where the editor writes it)', async () => {
    db.project.findUnique.mockResolvedValue({
      content: { finalContent: { forms: { contact: STORED_FORM } } },
      title: 'Naayom',
    });

    await POST(makeReq(BODY));

    expect(autoReply.mock.calls[0][0].form).toEqual(STORED_FORM);
  });

  it('also accepts the legacy top-level content.forms location', async () => {
    db.project.findUnique.mockResolvedValue({
      content: { forms: { contact: STORED_FORM } },
      title: 'Naayom',
    });

    await POST(makeReq(BODY));

    expect(autoReply.mock.calls[0][0].form).toEqual(STORED_FORM);
  });

  it('no stored config → form is null, the helper falls back to data.email', async () => {
    await POST(makeReq(BODY));

    expect(autoReply.mock.calls[0][0].form).toBeNull();
  });

  it('writes NO row flag for the auto-reply (notifiedAt/notifyError stay owner-only)', async () => {
    notify.mockResolvedValue({ status: 'skipped' });
    autoReply.mockResolvedValue({ status: 'failed', error: 'Resend responded 422' });

    const res: any = await POST(makeReq(BODY));

    expect(res.__body.success).toBe(true);
    expect(db.formSubmission.update).not.toHaveBeenCalled();
  });

  it('an auto-reply that throws never affects the visitor response or the lead row', async () => {
    autoReply.mockRejectedValue(new Error('boom'));

    const res: any = await POST(makeReq(BODY));

    expect(res.__status).toBe(200);
    expect(res.__body.success).toBe(true);
    expect(db.formSubmission.create).toHaveBeenCalledTimes(1);
    // the owner notification still happened
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('runs AFTER the owner notification (owner is never delayed by the visitor mail)', async () => {
    const order: string[] = [];
    notify.mockImplementation(async () => {
      order.push('owner');
      return { status: 'sent' };
    });
    autoReply.mockImplementation(async () => {
      order.push('visitor');
      return { status: 'sent' };
    });

    await POST(makeReq(BODY));

    expect(order).toEqual(['owner', 'visitor']);
  });
});

// ── Review-round fixes ──────────────────────────────────────────────────────────

// REVIEW FIX 1 (blocking regression). The blog-subscribe form is synthesized into
// the published blob only (buildBlogPages), so it never exists in the project's
// forms map — the ON-by-default rule would fire and send a NEWSLETTER subscriber
// "…received your message and will reply soon", with no owner-facing switch to turn
// it off (it never appears in FormBuilder). The blog pilot is live on a custom
// domain, so this must stay pinned.
describe('/api/forms/submit — blog-subscribe never gets a lead auto-reply (review fix 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('RESEND_API_KEY', 're_test');
    db.publishedPage.findUnique.mockResolvedValue({ ...PAGE, title: 'Naayom Farms' });
    db.project.findUnique.mockResolvedValue({ content: null, title: 'Naayom' });
    db.formSubmission.create.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.update.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.count.mockResolvedValue(3);
    db.blogSubscriber.upsert.mockResolvedValue({});
    limit.mockResolvedValue({ allowed: true, limit: 25, current: 3 });
    notify.mockResolvedValue({ status: 'sent' });
    resolveOwner.mockResolvedValue({ email: OWNER_EMAIL });
    autoReply.mockResolvedValue({ status: 'sent' });
  });

  it('does NOT auto-reply to a blog-subscribe submission', async () => {
    const res: any = await POST(
      makeReq({ ...BODY, formId: BLOG_SUBSCRIBE_FORM_ID, data: { email: 'reader@example.com' } })
    );

    expect(res.__body.success).toBe(true);
    expect(autoReply).not.toHaveBeenCalled();
    // …while everything else about a subscribe is untouched:
    expect(db.blogSubscriber.upsert).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledTimes(1); // owner notification unchanged
    expect(db.formSubmission.create).toHaveBeenCalledTimes(1);
  });

  it('DOES auto-reply to an ordinary form submission (the guard is formId-scoped)', async () => {
    const res: any = await POST(makeReq(BODY));

    expect(res.__body.success).toBe(true);
    expect(autoReply).toHaveBeenCalledTimes(1);
    expect(db.blogSubscriber.upsert).not.toHaveBeenCalled();
  });
});

// REVIEW FIX 2. FormBuilder-authored fields get generated ids (`field-1699…`), so
// the previous `replyTo: data.email` resolved to undefined and the owner's lead mail
// had NO Reply-To. The route now reuses the auto-reply's `pickVisitorEmail` (real
// implementation — see the module mock at the top of this file).
describe('/api/forms/submit — owner Reply-To for builder-made forms (review fix 2)', () => {
  const BUILDER_FORM = {
    id: 'contact',
    name: 'Contact',
    fields: [
      { id: 'field-1699000000001', type: 'text', label: 'Your name' },
      { id: 'field-1699000000002', type: 'email', label: 'Email address' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('RESEND_API_KEY', 're_test');
    db.publishedPage.findUnique.mockResolvedValue({ ...PAGE, title: 'Naayom Farms' });
    db.formSubmission.create.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.update.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.count.mockResolvedValue(3);
    limit.mockResolvedValue({ allowed: true, limit: 25, current: 3 });
    notify.mockResolvedValue({ status: 'sent' });
    resolveOwner.mockResolvedValue({ email: OWNER_EMAIL });
    autoReply.mockResolvedValue({ status: 'skipped' });
  });

  it('resolves Reply-To from the typed email field when its id is NOT "email"', async () => {
    db.project.findUnique.mockResolvedValue({
      content: { finalContent: { forms: { contact: BUILDER_FORM } } },
      title: 'Naayom',
    });

    await POST(
      makeReq({
        ...BODY,
        // No conventional `email` key at all — exactly what FormBuilder produces.
        data: { 'field-1699000000001': 'Asha', 'field-1699000000002': 'visitor@typed.com' },
      })
    );

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0][0].replyTo).toBe('visitor@typed.com');
  });

  it('is unchanged for forms with a literal "email" key and no stored config', async () => {
    db.project.findUnique.mockResolvedValue({ content: null, title: 'Naayom' });

    await POST(makeReq(BODY));

    expect(notify.mock.calls[0][0].replyTo).toBe('a@b.com');
  });
});

// REVIEW FIX 3. With RESEND_API_KEY unset nothing can be sent, so the route must not
// spend a live Clerk getUser per submission — and a Clerk failure must not stamp
// notifyError on rows in an environment where email is deliberately switched off.
describe('/api/forms/submit — email switched off (review fix 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('RESEND_API_KEY', '');
    db.publishedPage.findUnique.mockResolvedValue({ ...PAGE, title: 'Naayom Farms' });
    db.project.findUnique.mockResolvedValue({ content: null, title: 'Naayom' });
    db.formSubmission.create.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.update.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.count.mockResolvedValue(3);
    limit.mockResolvedValue({ allowed: true, limit: 25, current: 3 });
    resolveOwner.mockResolvedValue({ email: OWNER_EMAIL });
  });

  it('never calls Clerk, never sends, and leaves the row unflagged', async () => {
    const res: any = await POST(makeReq(BODY));

    expect(res.__body.success).toBe(true);
    expect(db.formSubmission.create).toHaveBeenCalledTimes(1);
    expect(resolveOwner).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
    expect(autoReply).not.toHaveBeenCalled();
    expect(db.formSubmission.update).not.toHaveBeenCalled();
  });

  it('a Clerk outage cannot write notifyError while email is off', async () => {
    resolveOwner.mockResolvedValue({ error: 'owner lookup failed: clerk down' });

    const res: any = await POST(makeReq(BODY));

    expect(res.__body.success).toBe(true);
    expect(db.formSubmission.update).not.toHaveBeenCalled();
  });
});
