// i18n-phase-1 Phase 2: saveDraft/loadDraft must become locale-aware WITHOUT
// changing single-locale behavior. These tests exercise the REAL DraftSaveSchema
// and the REAL merge logic in the save/load routes against a shared in-memory
// project store (only auth/prisma/security/rate-limit are mocked). They pin the
// two distinct merge mechanisms (D1 spread-ride for `localeContent`, D4 top-level
// wholesale-replace for `localeConfig`) and the back-compat / zero-locale-keys law.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- Mocks: everything external. Keep validation + brief.schema REAL. ---
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
vi.mock('@/lib/admin', () => ({ isAdmin: () => false }));
vi.mock('@/lib/rateLimit', () => ({ withDraftRateLimit: (h: any) => h }));

import { prisma } from '@/lib/prisma';
import { POST } from './route';
import { GET as loadDraftGET } from '../loadDraft/route';

const db = prisma as any;
const TOKEN = 'tok_i18n';

// Single shared in-memory project row: save writes it, load reads it.
let store: { content: any };

beforeEach(() => {
  vi.clearAllMocks();
  store = { content: { onboarding: {} } };
  db.token.upsert.mockResolvedValue({});
  db.project.findUnique.mockImplementation(async () => ({
    content: store.content,
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
function makeGetReq(tokenId: string) {
  return { url: `http://localhost/api/loadDraft?tokenId=${tokenId}` } as any;
}
async function save(body: any) {
  const res: any = await POST(makePostReq({ tokenId: TOKEN, ...body }));
  return res;
}
async function load() {
  const res: any = await loadDraftGET(makeGetReq(TOKEN));
  return res.__body;
}

// Deep recursive key scan: returns every occurrence of any target key anywhere
// in the object tree (not a shallow top-level check).
function deepFindKeys(obj: any, targets: string[]): string[] {
  const found: string[] = [];
  const walk = (v: any) => {
    if (v && typeof v === 'object') {
      for (const k of Object.keys(v)) {
        if (targets.includes(k)) found.push(k);
        walk(v[k]);
      }
    }
  };
  walk(obj);
  return found;
}

// strip the route-stamped lastSaved marker for byte-identical comparisons
function stripLastSaved(fc: any) {
  const { lastSaved, ...rest } = fc ?? {};
  return rest;
}

const LEGACY_FINAL = {
  sections: ['hero-1'],
  sectionLayouts: { 'hero-1': 'centered' },
  content: { 'hero-1': { elements: { headline: 'Hi', sub: 'There' } } },
};

// NL overlay fixture (text-only, D1 shape: locale → section → elementKey → text)
const NL_OVERLAY = { nl: { 'hero-1': { headline: 'Hallo' } } };

describe('saveDraft/loadDraft i18n (Phase 2)', () => {
  // (a) legacy payload without locale fields round-trips byte-identical
  it('(a) legacy payload round-trips byte-identical (back-compat)', async () => {
    await save({ finalContent: LEGACY_FINAL });
    const loaded = await load();
    expect(stripLastSaved(loaded.finalContent)).toEqual(LEGACY_FINAL);
    expect(loaded.localeConfig).toBeNull();
  });

  // (b) automated ZERO-LOCALE-KEYS law over a full save→load→save cycle
  it('(b) legacy project never grows locale keys across save→load→save', async () => {
    await save({ finalContent: LEGACY_FINAL });
    const loaded = await load();
    // Re-save from the loaded shape, exactly as a legacy store would re-export:
    // localeConfig is null → the store omits the key entirely (never sends null).
    await save({ finalContent: loaded.finalContent });
    const keys = deepFindKeys(store.content, ['localeContent', 'localeConfig']);
    expect(keys).toEqual([]);
  });

  // (c) only-EN edit carrying the FULL map does not strip the NL overlay
  it('(c) EN edit with full localeContent map keeps existing NL overlay', async () => {
    // seed the NL overlay
    await save({ finalContent: { ...LEGACY_FINAL, localeContent: NL_OVERLAY } });
    // EN edit; per the store invariant the payload carries the COMPLETE map (nl included)
    await save({
      finalContent: {
        ...LEGACY_FINAL,
        content: { 'hero-1': { elements: { headline: 'Hi (edited)', sub: 'There' } } },
        localeContent: NL_OVERLAY,
      },
    });
    expect(store.content.finalContent.localeContent.nl['hero-1'].headline).toBe('Hallo');
    expect(store.content.finalContent.content['hero-1'].elements.headline).toBe('Hi (edited)');
  });

  // (d) SAFETY-CRITICAL: payload MISSING localeContent preserves the stored overlay
  it('(d) payload omitting localeContent preserves stored overlay (spread semantics)', async () => {
    await save({ finalContent: { ...LEGACY_FINAL, localeContent: NL_OVERLAY } });
    // A save that does not mention localeContent at all (e.g. a structural-only autosave).
    await save({
      finalContent: {
        sections: ['hero-1'],
        sectionLayouts: { 'hero-1': 'left' }, // structural change only
        content: LEGACY_FINAL.content,
      },
    });
    expect(store.content.finalContent.localeContent).toBeDefined();
    expect(store.content.finalContent.localeContent.nl['hero-1'].headline).toBe('Hallo');
  });

  // (e) localeConfig wholesale-replace + absent-preserves (mirrors baseline)
  it('(e) localeConfig replaces wholesale; absent leaves stored value intact', async () => {
    await save({ finalContent: LEGACY_FINAL, localeConfig: { locales: ['en', 'nl'], defaultLocale: 'en' } });
    expect(store.content.localeConfig).toEqual({ locales: ['en', 'nl'], defaultLocale: 'en' });

    // new config → wholesale replace
    await save({ localeConfig: { locales: ['en', 'nl', 'de'], defaultLocale: 'en' } });
    expect(store.content.localeConfig).toEqual({ locales: ['en', 'nl', 'de'], defaultLocale: 'en' });

    // save with NO localeConfig key → preserved via ...existingContent spread (baseline rule)
    await save({ finalContent: LEGACY_FINAL });
    expect(store.content.localeConfig).toEqual({ locales: ['en', 'nl', 'de'], defaultLocale: 'en' });

    // and it survives a load round-trip
    const loaded = await load();
    expect(loaded.localeConfig).toEqual({ locales: ['en', 'nl', 'de'], defaultLocale: 'en' });
  });

  // (f) multi-page + multi-locale round-trip fixture (route-side; Phase 3a plugs
  // its store-side flush into these assertions). Overlays for a root section AND a
  // subpage section both ride the single complete localeContent map.
  it('(f) multi-page multi-locale full map round-trips both pages\' overlays', async () => {
    const MP_FINAL = {
      sections: ['hero-root'],
      content: { 'hero-root': { elements: { headline: 'Home' } } },
      // Fixture models the working-copy park boundary: the flushed COMPLETE map
      // carries overlays for a root section and a parked subpage section together.
      localeContent: {
        nl: {
          'hero-root': { headline: 'Thuis' },
          'hero-sub': { headline: 'Sub NL' },
        },
      },
    };
    await save({ finalContent: MP_FINAL, localeConfig: { locales: ['en', 'nl'], defaultLocale: 'en' } });
    // full save→load→save cycle
    const loaded = await load();
    await save({ finalContent: loaded.finalContent, localeConfig: loaded.localeConfig });

    const ov = store.content.finalContent.localeContent.nl;
    expect(ov['hero-root'].headline).toBe('Thuis');
    expect(ov['hero-sub'].headline).toBe('Sub NL');

    // (scaffold) partial/empty-map detectability — the store-side flush (3a) will
    // assert against exactly this shape before it is allowed to send a payload.
    const declaredLocalesFullyPresent = (config: any, lc: any) =>
      (config.locales as string[])
        .filter((l) => l !== config.defaultLocale)
        .every((l) => lc?.[l] && Object.keys(lc[l]).length > 0);

    const cfg = { locales: ['en', 'nl'], defaultLocale: 'en' };
    expect(declaredLocalesFullyPresent(cfg, store.content.finalContent.localeContent)).toBe(true);
    // an empty/partial map would be caught (this wipes an authored locale):
    expect(declaredLocalesFullyPresent(cfg, { nl: {} })).toBe(false);
    expect(declaredLocalesFullyPresent(cfg, {})).toBe(false);
  });
});
