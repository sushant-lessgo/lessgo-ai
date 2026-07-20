// src/app/api/publish/publish.authz.test.ts
// ============================================================================
// MANDATORY authz regression for the ownership gate ADDED to /api/publish
// (cms-collections plan phase 3, step 1).
//
// WHY THIS EXISTS
// ---------------
// Until this phase /api/publish never checked the body-supplied `tokenId`:
// `verifyProjectAccess` was imported and never called, and the only owner
// comparison (`existing.userId !== userId`) sits ~150 lines further down and only
// runs when the target slug ALREADY exists. The CMS materializer reads a tenant's
// private Collection tables by that tokenId — without a gate, any authenticated
// user could publish someone else's CMS content onto their own page.
//
// WHY IT IS SHAPED THIS WAY (the inert-assertion trap)
// ----------------------------------------------------
// `assertProjectOwner` returns a RESULT object. It does NOT throw and does NOT
// 403 by itself, so a handler that calls it and drops the result ships a gate
// that enforces nothing. A test asserting only "the materializer wasn't called"
// would sit GREEN through exactly that bug (the materializer is mocked here!).
// Therefore every denial case asserts:
//     * the STATUS (403/401), AND
//     * the ERROR BODY, AND
//     * that the materializer was never invoked (no table read before denial).
// The REAL `assertProjectOwner` runs — only `createSecureResponse` is faked, so
// the 403 comes from the real gate, never from a mock we told to deny.
//
// The `allowMissing: true` regression is covered too: publish tolerates a missing
// Project row today (`projectId: project?.id || null`), and a plain
// `assertProjectOwner` without that flag would turn those into NEW 404s.
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const TOKEN_A = 'tok_project_a';
const TOKEN_ORPHANLESS = 'tok_no_project_row';
const CLERK_OWNER_A = 'clerk_owner_a';
const CLERK_OWNER_B = 'clerk_owner_b';
const USER_A = 'u_a';
const USER_B = 'u_b';

const authFn = vi.hoisted(() => vi.fn());
const materializeFn = vi.hoisted(() => vi.fn(async () => 0));
const db = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  projectFindUnique: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: (...a: unknown[]) => authFn(...a) }));

vi.mock('@/lib/admin', () => ({ isAdmin: () => false, logAdminOverride: vi.fn() }));

// The materializer is the thing the gate protects — mocked so we can prove it is
// NEVER reached on a denial (and IS reached, with the verified token, on a pass).
vi.mock('@/modules/cms/materializePublish', () => ({
  materializeCmsForPublish: (...a: unknown[]) => materializeFn(...(a as [])),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: (...a: any[]) => db.userFindUnique(...a) },
    project: {
      findUnique: (...a: any[]) => db.projectFindUnique(...a),
      upsert: vi.fn(async () => ({})),
    },
    publishedPage: {
      findUnique: vi.fn(async () => null),
      count: vi.fn(async () => 0),
      create: vi.fn(async () => ({})),
      update: vi.fn(async () => ({})),
    },
    token: { upsert: vi.fn(async () => ({})) },
  },
}));

// Rate limiter passes the handler straight through under test.
vi.mock('@/lib/rateLimit', () => ({
  withPublishRateLimit: (h: any) => h,
}));

vi.mock('@/lib/planManager', () => ({
  getUserPlan: async () => ({ tier: 'FREE' }),
  checkLimit: async () => ({ allowed: true, limit: 1 }),
  hasTrackingPixels: async () => false,
  getPlanConfig: () => ({ features: { removeBranding: false } }),
  PlanTier: {},
}));

// jsdom-hostile / irrelevant collaborators.
vi.mock('@/lib/publishSanitizer', () => ({
  sanitizeContentHtml: () => {},
  sanitizeLocaleOverlay: (v: unknown) => v,
}));
vi.mock('@sentry/nextjs', () => ({ setUser: () => {}, captureException: () => {} }));

vi.mock('@/lib/security', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/security')>();
  return {
    ...actual,
    createSecureResponse: (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
  };
});

import { POST } from './route';

// ── helpers ─────────────────────────────────────────────────────────────────

function publishReq(tokenId: string, extra: Record<string, unknown> = {}) {
  return new Request('http://localhost/api/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', host: 'localhost:3000' },
    body: JSON.stringify({
      slug: 'my-page',
      title: 'My page',
      tokenId,
      content: {
        layout: { sections: ['hero-abc12345'] },
        content: {
          'hero-abc12345': {
            id: 'hero-abc12345',
            layout: 'leftCopyRightImage',
            elements: { headline: 'Hi' },
          },
        },
      },
      ...extra,
    }),
  }) as any;
}

const run = async (tokenId: string) => {
  const res = await (POST as any)(publishReq(tokenId));
  return { status: res.status, body: await res.json() };
};

beforeEach(() => {
  vi.clearAllMocks();
  materializeFn.mockResolvedValue(0);

  db.userFindUnique.mockImplementation(async ({ where }: any) =>
    where.clerkId === CLERK_OWNER_A
      ? { id: USER_A }
      : where.clerkId === CLERK_OWNER_B
        ? { id: USER_B }
        : null
  );

  // TOKEN_A → owned by USER_A. TOKEN_ORPHANLESS → no Project row at all.
  db.projectFindUnique.mockImplementation(async ({ where }: any) => {
    if (where.tokenId === TOKEN_A) {
      return {
        id: 'p_a',
        userId: USER_A,
        audienceType: 'product',
        templateId: null,
        variantId: null,
        paletteId: null,
        themeValues: null,
        content: null,
      };
    }
    return null;
  });
});

// ── 1. foreign tokenId → 403 before anything is read ────────────────────────

describe('/api/publish — ownership gate on the body tokenId', () => {
  it('user B publishing with user A’s tokenId → 403 WITH an error body', async () => {
    authFn.mockResolvedValue({ userId: CLERK_OWNER_B });
    const { status, body } = await run(TOKEN_A);

    // Status AND body: a discarded ownership result would sail past both.
    expect(status).toBe(403);
    expect(body).toEqual({ error: 'Access denied' });
  });

  it('…and no Collection read / materializer call happened on that denial', async () => {
    authFn.mockResolvedValue({ userId: CLERK_OWNER_B });
    await run(TOKEN_A);
    expect(materializeFn).not.toHaveBeenCalled();
  });

  it('unauthenticated → 401, materializer untouched', async () => {
    authFn.mockResolvedValue({ userId: null });
    const { status, body } = await run(TOKEN_A);
    expect(status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(materializeFn).not.toHaveBeenCalled();
  });

  it('an unknown clerk user (no DB record) → 404, materializer untouched', async () => {
    authFn.mockResolvedValue({ userId: 'clerk_ghost' });
    const { status, body } = await run(TOKEN_A);
    expect(status).toBe(404);
    expect(body).toEqual({ error: 'User not found' });
    expect(materializeFn).not.toHaveBeenCalled();
  });
});

// ── 2. the owner still gets through (incl. the allowMissing regression) ─────

describe('/api/publish — owners are NOT blocked by the new gate', () => {
  it('the owner passes the gate and the materializer runs with the VERIFIED token', async () => {
    authFn.mockResolvedValue({ userId: CLERK_OWNER_A });
    const { status } = await run(TOKEN_A);

    expect(status).not.toBe(403);
    expect(status).not.toBe(401);
    expect(materializeFn).toHaveBeenCalledTimes(1);
    expect(materializeFn.mock.calls[0][0]).toBe(TOKEN_A);
    // …and it got the publish snapshot to mutate.
    expect(materializeFn.mock.calls[0][1]).toMatchObject({ layout: { sections: ['hero-abc12345'] } });
  });

  it('allowMissing:true — an owner publishing a token with NO Project row is not 404ed', async () => {
    // This is the regression the flag exists for: publish tolerates a missing
    // Project row today (`projectId: project?.id || null`), and a gate without
    // `allowMissing: true` would turn every such publish into a NEW 404.
    authFn.mockResolvedValue({ userId: CLERK_OWNER_A });
    const { status, body } = await run(TOKEN_ORPHANLESS);

    expect(status).not.toBe(404);
    expect(status).not.toBe(403);
    expect(body).not.toEqual({ error: 'Project not found' });
    expect(materializeFn).toHaveBeenCalledTimes(1);
    expect(materializeFn.mock.calls[0][0]).toBe(TOKEN_ORPHANLESS);
  });
});
