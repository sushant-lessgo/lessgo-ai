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
import { describe, it, expect, beforeEach, vi } from 'vitest';

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
import { checkLimit } from '@/lib/planManager';
import { POST } from './route';

const db = prisma as any;
const notify = sendLeadNotification as unknown as ReturnType<typeof vi.fn>;
const limit = checkLimit as unknown as ReturnType<typeof vi.fn>;

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

describe('/api/forms/submit — notify outcome row flag (F30b)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.publishedPage.findUnique.mockResolvedValue(PAGE);
    db.project.findUnique.mockResolvedValue(null); // no formConfig; keeps the path minimal
    db.formSubmission.create.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.update.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.count.mockResolvedValue(3); // under any cap by default
    limit.mockResolvedValue({ allowed: true, limit: 25, current: 3 });
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
    db.publishedPage.findUnique.mockResolvedValue(PAGE);
    db.project.findUnique.mockResolvedValue(null);
    db.formSubmission.create.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.update.mockResolvedValue({ id: 'sub_1' });
    notify.mockResolvedValue({ status: 'skipped' });
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
    db.publishedPage.findUnique.mockResolvedValue(PAGE);
    db.project.findUnique.mockResolvedValue(null);
    db.formSubmission.create.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.update.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.count.mockResolvedValue(3);
    limit.mockResolvedValue({ allowed: true, limit: 25, current: 3 });
    notify.mockResolvedValue({ status: 'skipped' });
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
    // is an incidental wire-cost narrowing — kept here only because this is an exact match.
    expect(db.project.findUnique).toHaveBeenCalledWith({
      where: { id: 'proj_1' },
      select: { content: true },
    });
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
