// Route tests for POST /api/leads/[id]/draft-reply (phase 2).
// Asserts on mock CALL COUNTS + which branch fired (not just status codes —
// inert-assertion lesson). Everything external is mocked; the ownership scope,
// message gate, credit check/consume split, and generation retry are the unit.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: 'clerk_123' })),
}));

vi.mock('@/lib/security', () => ({
  createSecureResponse: (body: unknown, status = 200) => ({ body, status }),
}));

vi.mock('@/lib/rateLimit', () => ({
  // Pass-through: withAIRateLimit(handler)(req) === handler(req).
  withAIRateLimit: (fn: (r: unknown) => unknown) => (req: unknown) => fn(req),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    formSubmission: { findUnique: vi.fn() },
    publishedPage: { findUnique: vi.fn() },
    project: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/dashboard/accountScope', () => ({
  getAccountScope: vi.fn(async () => ({ pageIds: ['page_owned'], pages: [], slugs: [] })),
}));

vi.mock('@/lib/aiClient', () => ({ generateRawJson: vi.fn() }));

vi.mock('@/lib/creditSystem', () => ({
  CREDIT_COSTS: { LEAD_REPLY: 1 },
  UsageEventType: { LEAD_REPLY_GENERATION: 'lead_reply_generation' },
  checkCredits: vi.fn(),
  consumeCredits: vi.fn(),
}));

import { POST } from './route';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getAccountScope } from '@/lib/dashboard/accountScope';
import { generateRawJson } from '@/lib/aiClient';
import { checkCredits, consumeCredits } from '@/lib/creditSystem';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const scopeMock = getAccountScope as unknown as ReturnType<typeof vi.fn>;
const genMock = generateRawJson as unknown as ReturnType<typeof vi.fn>;
const checkMock = checkCredits as unknown as ReturnType<typeof vi.fn>;
const consumeMock = consumeCredits as unknown as ReturnType<typeof vi.fn>;
const db = prisma as any;

const MESSAGE_DATA = { name: 'Ada', email: 'ada@x.com', message: 'Do you ship to Berlin and what does it cost?' };
const CONTACT_ONLY_DATA = { name: 'Ada', email: 'ada@x.com', phone: '+49 555 111222' };

function makeReq() {
  return { json: async () => ({}) } as any;
}
const ctx = { params: { id: 'sub_1' } };

const OLD_ENV = { ...process.env };

/** Default: owned submission, has message, brief project, credits ok, gen ok, consume ok. */
function primeHappyPath() {
  db.formSubmission.findUnique
    .mockResolvedValueOnce({ publishedPageId: 'page_owned' }) // ownership select
    .mockResolvedValueOnce({ data: MESSAGE_DATA }); // data select
  db.publishedPage.findUnique.mockResolvedValue({ projectId: 'proj_1', title: 'Acme' });
  db.project.findUnique.mockResolvedValue({ brief: null, title: 'Acme' });
  scopeMock.mockResolvedValue({ pageIds: ['page_owned'], pages: [], slugs: [] });
  checkMock.mockResolvedValue({ allowed: true, remaining: 5, required: 1 });
  genMock.mockResolvedValue({ reply: 'Hi Ada — yes, we ship to Berlin!' });
  consumeMock.mockResolvedValue({ success: true, remaining: 4 });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...OLD_ENV };
  delete process.env.NEXT_PUBLIC_LEAD_REPLY_DISABLED;
  authMock.mockResolvedValue({ userId: 'clerk_123' });
});

describe('kill-switch', () => {
  it('returns 404 not_found and touches no prisma/AI when disabled', async () => {
    process.env.NEXT_PUBLIC_LEAD_REPLY_DISABLED = 'true';
    const res: any = await POST(makeReq(), ctx);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not_found');
    expect(db.formSubmission.findUnique).not.toHaveBeenCalled();
    expect(genMock).not.toHaveBeenCalled();
    expect(consumeMock).not.toHaveBeenCalled();
  });
});

describe('auth', () => {
  it('returns 401 and touches no prisma/AI when unauthenticated', async () => {
    authMock.mockResolvedValue({ userId: null });
    const res: any = await POST(makeReq(), ctx);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
    expect(db.formSubmission.findUnique).not.toHaveBeenCalled();
    expect(genMock).not.toHaveBeenCalled();
    expect(consumeMock).not.toHaveBeenCalled();
  });
});

describe('ownership', () => {
  it('cross-scope publishedPageId → 404; AI never called, no brief read, no data fetch', async () => {
    db.formSubmission.findUnique.mockResolvedValueOnce({ publishedPageId: 'page_OTHER' });
    scopeMock.mockResolvedValue({ pageIds: ['page_owned'], pages: [], slugs: [] });

    const res: any = await POST(makeReq(), ctx);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not_found');
    // Only the ownership select ran — never the data select.
    expect(db.formSubmission.findUnique).toHaveBeenCalledTimes(1);
    expect(db.publishedPage.findUnique).not.toHaveBeenCalled();
    expect(db.project.findUnique).not.toHaveBeenCalled();
    expect(genMock).not.toHaveBeenCalled();
    expect(consumeMock).not.toHaveBeenCalled();
  });

  it('null publishedPageId → 404 (ownership refusal, not light-context)', async () => {
    db.formSubmission.findUnique.mockResolvedValueOnce({ publishedPageId: null });

    const res: any = await POST(makeReq(), ctx);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not_found');
    expect(db.formSubmission.findUnique).toHaveBeenCalledTimes(1);
    expect(genMock).not.toHaveBeenCalled();
    expect(consumeMock).not.toHaveBeenCalled();
  });

  it('missing submission → 404', async () => {
    db.formSubmission.findUnique.mockResolvedValueOnce(null);

    const res: any = await POST(makeReq(), ctx);

    expect(res.status).toBe(404);
    expect(genMock).not.toHaveBeenCalled();
    expect(consumeMock).not.toHaveBeenCalled();
  });
});

describe('message gate', () => {
  it('contact-only data → 400; AI + consume never called', async () => {
    db.formSubmission.findUnique
      .mockResolvedValueOnce({ publishedPageId: 'page_owned' })
      .mockResolvedValueOnce({ data: CONTACT_ONLY_DATA });
    scopeMock.mockResolvedValue({ pageIds: ['page_owned'], pages: [], slugs: [] });

    const res: any = await POST(makeReq(), ctx);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('no_replyable_message');
    expect(checkMock).not.toHaveBeenCalled();
    expect(genMock).not.toHaveBeenCalled();
    expect(consumeMock).not.toHaveBeenCalled();
  });
});

describe('credit gate (upfront)', () => {
  it('insufficient checkCredits → 402; AI never called', async () => {
    primeHappyPath();
    checkMock.mockResolvedValue({ allowed: false, remaining: 0, required: 1 });

    const res: any = await POST(makeReq(), ctx);

    expect(res.status).toBe(402);
    expect(res.body.error).toBe('insufficient_credits');
    expect(res.body.remaining).toBe(0);
    expect(genMock).not.toHaveBeenCalled();
    expect(consumeMock).not.toHaveBeenCalled();
  });
});

describe('generation', () => {
  it('both attempts fail → 500 generation_failed; consumeCredits NEVER called', async () => {
    primeHappyPath();
    genMock.mockRejectedValue(new Error('model down'));

    const res: any = await POST(makeReq(), ctx);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('generation_failed');
    // Retry-once contract: two attempts.
    expect(genMock).toHaveBeenCalledTimes(2);
    expect(consumeMock).not.toHaveBeenCalled();
  });

  it('first attempt fails, second succeeds → 200 (retry recovered)', async () => {
    primeHappyPath();
    genMock
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce({ reply: 'recovered draft' });

    const res: any = await POST(makeReq(), ctx);

    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('recovered draft');
    expect(genMock).toHaveBeenCalledTimes(2);
    expect(consumeMock).toHaveBeenCalledTimes(1);
  });
});

describe('success', () => {
  it('→ 200; consumeCredits called EXACTLY once with LEAD_REPLY_GENERATION / cost 1', async () => {
    primeHappyPath();

    const res: any = await POST(makeReq(), ctx);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reply).toBe('Hi Ada — yes, we ship to Berlin!');
    expect(res.body.grounding).toBe('light'); // brief: null → light
    expect(res.body.remaining).toBe(4);
    expect(consumeMock).toHaveBeenCalledTimes(1);
    expect(consumeMock).toHaveBeenCalledWith(
      'clerk_123',
      'lead_reply_generation',
      1,
      { metadata: { submissionId: 'sub_1', grounding: 'light' } },
    );
  });
});

describe('B2 consume-failure split', () => {
  it('B2a — charge-conflict race after gen success → recoverable 500 (NOT 402)', async () => {
    primeHappyPath();
    consumeMock.mockResolvedValue({ success: false, remaining: 5, error: 'charge_conflict' });

    const res: any = await POST(makeReq(), ctx);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('charge_failed');
    expect(res.body.recoverable).toBe(true);
    // Distinguishable from generation_failed.
    expect(res.body.error).not.toBe('generation_failed');
    expect(genMock).toHaveBeenCalledTimes(1);
    expect(consumeMock).toHaveBeenCalledTimes(1);
  });

  it('B2b — genuine Insufficient credits after gen success → 402', async () => {
    primeHappyPath();
    consumeMock.mockResolvedValue({
      success: false,
      remaining: 0,
      error: 'Insufficient credits. Required: 1, Available: 0',
    });

    const res: any = await POST(makeReq(), ctx);

    expect(res.status).toBe(402);
    expect(res.body.error).toBe('insufficient_credits');
    expect(genMock).toHaveBeenCalledTimes(1);
    expect(consumeMock).toHaveBeenCalledTimes(1);
  });
});

describe('light-context grounding', () => {
  it('thin/absent brief → 200; prompt to AI mock carries site name, not brief claims', async () => {
    db.formSubmission.findUnique
      .mockResolvedValueOnce({ publishedPageId: 'page_owned' })
      .mockResolvedValueOnce({ data: MESSAGE_DATA });
    db.publishedPage.findUnique.mockResolvedValue({ projectId: 'proj_1', title: 'Acme Widgets' });
    db.project.findUnique.mockResolvedValue({ brief: {}, title: 'Acme Widgets' }); // thin brief → light
    scopeMock.mockResolvedValue({ pageIds: ['page_owned'], pages: [], slugs: [] });
    checkMock.mockResolvedValue({ allowed: true, remaining: 5, required: 1 });
    genMock.mockResolvedValue({ reply: 'ok' });
    consumeMock.mockResolvedValue({ success: true, remaining: 4 });

    const res: any = await POST(makeReq(), ctx);

    expect(res.status).toBe(200);
    expect(res.body.grounding).toBe('light');
    const promptArg = genMock.mock.calls[0][1] as string;
    expect(promptArg).toContain('Acme Widgets'); // site name embedded
    expect(promptArg).toContain('Only minimal brand context is available'); // light header
    expect(promptArg).not.toContain('No specific brand facts'); // banned fallback sentence absent
  });
});
