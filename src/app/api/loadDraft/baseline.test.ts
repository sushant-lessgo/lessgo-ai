// content-baseline-split Phase 1: loadDraft `hasBaseline` flag + `?part=baseline`
// targeted fetch. Mocking pattern mirrors src/app/api/saveDraft/i18n.test.ts
// (only auth/prisma/security are mocked; the route logic is REAL). Asserts:
//   (i)  default response carries hasBaseline matching stored content,
//   (ii) ?part=baseline returns ONLY { baseline } (no other page fields),
//   (iii)?part=baseline still 401s unauthenticated / 403s non-owner,
//   (iv) legacy project (no content.baseline) → hasBaseline:false, part→null.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mutable auth/ownership controls so individual tests can flip them.
let currentUserId: string | null = 'clerk_1';
let ownershipOk = true;

vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: currentUserId }),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));
vi.mock('@/lib/security', () => ({
  createSecureResponse: (body: any, status = 200) => ({ __body: body, __status: status }),
  verifyProjectAccess: vi.fn(async () => ownershipOk),
  validateToken: () => true,
}));
vi.mock('@/lib/admin', () => ({ isAdmin: () => false }));

import { prisma } from '@/lib/prisma';
import { GET } from './route';

const db = prisma as any;
const TOKEN = 'tok_baseline';

const BASELINE = { sections: ['hero-1'], content: { 'hero-1': { headline: 'AI original' } } };

// content of the stored project row; each test seeds this.
let storedContent: any;

beforeEach(() => {
  vi.clearAllMocks();
  currentUserId = 'clerk_1';
  ownershipOk = true;
  storedContent = { onboarding: {}, baseline: BASELINE };
  db.project.findUnique.mockImplementation(async () => ({
    content: storedContent,
    themeValues: null,
    title: 'T',
    brief: null,
    userId: 'u1',
    inputText: '',
    updatedAt: new Date(),
    audienceType: 'service',
    templateId: null,
    variantId: null,
    paletteId: null,
  }));
  db.user.findUnique.mockResolvedValue({ id: 'u1' });
});

function makeGetReq(tokenId: string, part?: string) {
  const url = `http://localhost/api/loadDraft?tokenId=${tokenId}${part ? `&part=${part}` : ''}`;
  return { url } as any;
}
async function load(part?: string) {
  return (await GET(makeGetReq(TOKEN, part))) as any;
}

describe('loadDraft baseline split (Phase 1)', () => {
  // (i) default response carries hasBaseline matching stored content
  it('(i) default response includes hasBaseline:true when baseline stored (and still ships baseline)', async () => {
    const res = await load();
    expect(res.__status).toBe(200);
    expect(res.__body.hasBaseline).toBe(true);
    // Phase-1 additive: baseline field STAYS in the default response.
    expect(res.__body.baseline).toEqual(BASELINE);
  });

  // (ii) ?part=baseline returns ONLY { baseline } — no other page fields
  it('(ii) ?part=baseline returns only { baseline }', async () => {
    const res = await load('baseline');
    expect(res.__status).toBe(200);
    expect(res.__body).toEqual({ baseline: BASELINE });
    // guard against page fields leaking into the targeted response
    expect(res.__body.finalContent).toBeUndefined();
    expect(res.__body.title).toBeUndefined();
    expect(res.__body.hasBaseline).toBeUndefined();
    expect(Object.keys(res.__body)).toEqual(['baseline']);
  });

  // (iii) ?part=baseline still enforces auth: 401 unauthenticated
  it('(iii-a) ?part=baseline 401s when unauthenticated', async () => {
    currentUserId = null;
    const res = await load('baseline');
    expect(res.__status).toBe(401);
    expect(res.__body.baseline).toBeUndefined();
  });

  // (iii) ?part=baseline still enforces ownership: 403 non-owner
  it('(iii-b) ?part=baseline 403s for a non-owner', async () => {
    ownershipOk = false;
    const res = await load('baseline');
    expect(res.__status).toBe(403);
    expect(res.__body.baseline).toBeUndefined();
  });

  // (iv) legacy project (no content.baseline)
  it('(iv) legacy project → hasBaseline:false and part fetch returns baseline:null', async () => {
    storedContent = { onboarding: {} }; // no baseline key
    const dflt = await load();
    expect(dflt.__body.hasBaseline).toBe(false);
    expect(dflt.__body.baseline).toBeNull();

    const part = await load('baseline');
    expect(part.__status).toBe(200);
    expect(part.__body).toEqual({ baseline: null });
  });
});
