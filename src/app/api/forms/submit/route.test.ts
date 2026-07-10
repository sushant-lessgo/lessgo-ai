// F30b: the /api/forms/submit path must record the lead-notification outcome on
// the FormSubmission row — notifiedAt on success, notifyError on failure — so a
// silently-failing inbox is visible in the dashboard. Everything external is
// mocked; this pins the row-flag write for each sendLeadNotification outcome and
// that a notify failure never affects the submitter's success response.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: { findMany: vi.fn() },
    formSubmission: { create: vi.fn(), update: vi.fn() },
    blogSubscriber: { upsert: vi.fn() },
  },
}));
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
import { POST } from './route';

const db = prisma as any;
const notify = sendLeadNotification as unknown as ReturnType<typeof vi.fn>;

function makeReq(body: any) {
  return {
    method: 'POST',
    url: 'http://localhost/api/forms/submit',
    headers: { get: () => null },
    json: async () => body,
  } as any;
}

const BODY = { formId: 'contact', data: { email: 'a@b.com', name: 'Asha' }, userId: 'user_1', publishedPageId: 'page_1' };

describe('/api/forms/submit — notify outcome row flag (F30b)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.project.findMany.mockResolvedValue([]); // no formConfig; keeps the path minimal
    db.formSubmission.create.mockResolvedValue({ id: 'sub_1' });
    db.formSubmission.update.mockResolvedValue({ id: 'sub_1' });
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
