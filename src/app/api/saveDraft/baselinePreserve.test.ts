// content-baseline-split Phase 4 (Deploy B) — save-path regression fence.
// The default loadDraft response no longer ships the baseline blob (clients
// fetch it via ?part=baseline). That makes it invisible to a normal edit save,
// so this test pins the two save-path guarantees the split relies on:
//   (i)  a normal edit save (NO body.baseline) leaves the stored
//        Project.content.baseline BYTE-IDENTICAL (preserved by the
//        `...existingContent` spread + the `if (body.baseline !== undefined)` guard);
//   (ii) a save WITH body.baseline REPLACES content.baseline wholesale.
// This is the fence against a future save-path edit silently dropping the guard.
// Mocking mirrors src/app/api/saveDraft/i18n.test.ts (only auth/prisma/security/
// rate-limit are mocked; the route logic + validation are REAL).
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId: 'clerk_1' }) }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    token: { upsert: vi.fn() },
    project: { findUnique: vi.fn(), upsert: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));
vi.mock('@/lib/security', () => ({
  createSecureResponse: (body: any, status = 200) => ({ __body: body, __status: status }),
  assertProjectOwner: vi.fn(async () => ({ ok: true, userRecord: { id: 'u1' } })),
  verifyProjectAccess: vi.fn(async () => true),
  validateToken: () => true,
}));
vi.mock('@/lib/admin', () => ({ isAdmin: () => false, isAdminClerkId: () => false }));
vi.mock('@/lib/rateLimit', () => ({ withDraftRateLimit: (h: any) => h }));

import { prisma } from '@/lib/prisma';
import { POST } from './route';

const db = prisma as any;
const TOKEN = 'tok_baseline_preserve';

// A known, non-trivial baseline value (mirrors the ~immutable generation snapshot).
const STORED_BASELINE = {
  sections: ['hero-1', 'cta-1'],
  content: {
    'hero-1': { elements: { headline: 'AI original headline', sub: 'AI original sub' } },
    'cta-1': { elements: { label: 'Sign up' } },
  },
};

const LEGACY_FINAL = {
  sections: ['hero-1'],
  sectionLayouts: { 'hero-1': 'centered' },
  content: { 'hero-1': { elements: { headline: 'Hi', sub: 'There' } } },
};

// Single shared in-memory project row: save writes it.
let store: { content: any };

beforeEach(() => {
  vi.clearAllMocks();
  // Seed an existing project whose content already carries a baseline.
  store = {
    content: {
      onboarding: {},
      baseline: structuredClone(STORED_BASELINE),
      finalContent: structuredClone(LEGACY_FINAL),
    },
  };
  db.token.upsert.mockResolvedValue({});
  db.project.findUnique.mockImplementation(async () => ({
    content: store.content,
    themeValues: null,
    title: 'T',
    brief: null,
    aiBaseline: null,
    templateId: null,
    audienceType: 'service',
    userId: 'u1',
    inputText: '',
    updatedAt: new Date(),
    variantId: null,
    paletteId: null,
  }));
  db.project.upsert.mockImplementation(async (args: any) => {
    store.content = args.update?.content ?? args.create?.content;
    return { updatedAt: new Date() };
  });
  db.user.findUnique.mockResolvedValue({ id: 'u1' });
});

function makePostReq(body: any) {
  return {
    method: 'POST',
    url: 'http://localhost/api/saveDraft',
    headers: { get: () => null },
    json: async () => body,
  } as any;
}
async function save(body: any) {
  return (await POST(makePostReq({ tokenId: TOKEN, ...body }))) as any;
}

describe('saveDraft baseline preservation (Phase 4 / Deploy B fence)', () => {
  // (i) normal edit save (no body.baseline) → stored baseline BYTE-IDENTICAL.
  it('(i) a save WITHOUT body.baseline leaves content.baseline byte-identical', async () => {
    const res = await save({
      finalContent: {
        ...LEGACY_FINAL,
        content: { 'hero-1': { elements: { headline: 'Edited headline', sub: 'There' } } },
      },
    });
    expect(res.__status).toBe(200);
    // The edit landed...
    expect(store.content.finalContent.content['hero-1'].elements.headline).toBe('Edited headline');
    // ...but the baseline is preserved verbatim (deep-equal to the ORIGINAL value,
    // compared against a pristine reference so a mutation would be caught).
    expect(store.content.baseline).toEqual(STORED_BASELINE);
  });

  // (i-b) even a save with NEITHER finalContent NOR baseline preserves it.
  it('(i-b) a metadata-only save (no finalContent, no baseline) preserves content.baseline', async () => {
    const res = await save({ title: 'Renamed project' });
    expect(res.__status).toBe(200);
    expect(store.content.baseline).toEqual(STORED_BASELINE);
  });

  // (ii) save WITH body.baseline → content.baseline REPLACED wholesale.
  it('(ii) a save WITH body.baseline replaces content.baseline wholesale', async () => {
    const NEW_BASELINE = {
      sections: ['hero-1'],
      content: { 'hero-1': { elements: { headline: 'Re-frozen baseline' } } },
    };
    const res = await save({ finalContent: LEGACY_FINAL, baseline: NEW_BASELINE });
    expect(res.__status).toBe(200);
    expect(store.content.baseline).toEqual(NEW_BASELINE);
    // wholesale replace: no residue from the old baseline shape.
    expect(store.content.baseline).not.toEqual(STORED_BASELINE);
    expect(store.content.baseline.sections).toEqual(['hero-1']);
  });
});
