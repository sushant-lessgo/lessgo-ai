import { expect, type APIRequestContext } from '@playwright/test';
import { WORK_BRIEF_FIXTURE, WORK_BRIEF_EXPECTED_SERVE } from './workBriefFixture';

// Seeds a CONFIRMED, SERVED work project via the REAL authed routes
// (/api/start → /api/brief/confirm), so the journey e2e can resume the shell
// from a real DB state. Avoids importing app modules (no `@/` alias in the
// Playwright runner) — the fixture it uses is a deliberately zero-import module
// for exactly this reason.
//
// Decision 9 / landmine 13: this is SEEDED-RESUME, not mocked-entry. Mock mode
// cannot classify work (/api/v2/understand returns the agency-shaped
// ENTRY_DEMO_SIGNALS fixture), and understand/scrape-website are out of scope.
// STEP 01 is covered by Vitest (JourneyEntryStep.test.tsx) + founder QA.
//
// ⚠️ Pass `page.request`, NOT the standalone `request` fixture: the standalone
// context cannot refresh Clerk's short-lived (~60s) session JWT and 401s on
// later calls (documented in publish.spec.ts).

export interface SeededWorkProject {
  token: string;
  audienceType: string;
  templateId: string;
}

/** Mint a fresh project + token (same idiom as publish.spec.ts). */
export async function startProject(api: APIRequestContext): Promise<string> {
  const startRes = await api.get('/api/start');
  expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
  const { url } = await startRes.json();
  expect(url, 'no url from /api/start').toBeTruthy();
  const token = new URL(url).pathname.split('/').filter(Boolean).pop()!;
  expect(token, `bad token from ${url}`).toBeTruthy();
  return token;
}

/**
 * Create a project and confirm the work fixture through the authoritative serve
 * gate. Asserts the SERVE verdict here so a gate/fixture drift fails loudly at
 * the seed — not later as an unhelpful "the shell never mounted" UI timeout.
 * (The Vitest drift guard `workBriefFixture.test.ts` catches it earlier still.)
 */
export async function seedWorkBrief(api: APIRequestContext): Promise<SeededWorkProject> {
  const token = await startProject(api);

  const res = await api.post('/api/brief/confirm', {
    data: { tokenId: token, brief: WORK_BRIEF_FIXTURE },
  });
  expect(res.ok(), `/api/brief/confirm: ${res.status()} ${await res.text()}`).toBeTruthy();
  const json = await res.json();

  // work is an ENGINE: the served project is service-audience + atelier.
  expect(json.outcome, `expected serve, got ${JSON.stringify(json)}`).toBe(
    WORK_BRIEF_EXPECTED_SERVE.outcome
  );
  expect(json.redirectTo).toBe(`/onboarding/${token}`);

  return {
    token,
    audienceType: WORK_BRIEF_EXPECTED_SERVE.audienceType,
    templateId: WORK_BRIEF_EXPECTED_SERVE.templateId,
  };
}

/** Read the persisted project back (what the dispatch + stamping asserts use). */
export async function loadDraft(api: APIRequestContext, token: string) {
  const res = await api.get(`/api/loadDraft?tokenId=${encodeURIComponent(token)}`);
  expect(res.ok(), `/api/loadDraft: ${res.status()}`).toBeTruthy();
  return res.json();
}

// ── work-onboarding E2 / phase 1 ─────────────────────────────────────────────
// Photo-bearing fixtures + a HAND-SEEDED pre-bound finalContent seeder, used by
// e2e/work-binding.spec.ts to prove the reveal SURFACE renders group covers on
// the work skeleton (atelier2). The data PATH is proved by vitest; this half is
// the render proof. (Extended in P2 to drive the REAL fan-out path.)

/** Distinct, greppable cover URLs — one per seeded group. */
export const WORK_COVER_URLS = {
  weddings: 'https://e2e.test/covers/weddings-cover.jpg',
  portraits: 'https://e2e.test/covers/portraits-cover.jpg',
} as const;

/** The seeded work groups WITH photos (mirror of what STEP 02 upload commits). */
export const WORK_GROUPS_WITH_PHOTOS = [
  {
    name: 'Weddings',
    slug: 'weddings',
    photos: [
      { id: 'wed-1', url: WORK_COVER_URLS.weddings, cover: true },
      { id: 'wed-2', url: 'https://e2e.test/covers/weddings-2.jpg' },
    ],
  },
  {
    name: 'Portraits',
    slug: 'portraits',
    photos: [{ id: 'por-1', url: WORK_COVER_URLS.portraits }],
  },
] as const;

const sid = (type: string): string => `${type}-${Math.random().toString(36).slice(2, 10)}`;

/** A minimal atelier2 single-page work finalContent with a work-gallery whose
 *  group cards carry stamped covers/hrefs — the exact shape the P1 binding
 *  produces (covers + /works/<slug> links + an item page carrying the photos). */
function buildBoundAtelier2FinalContent(token: string): any {
  const heroId = sid('hero');
  const workId = sid('work');
  const footerId = sid('footer');
  const headerId = sid('header');

  const groups = WORK_GROUPS_WITH_PHOTOS.map((g, i) => ({
    id: `g${i}`,
    name: g.name,
    cover_image: (g.photos.find((p) => (p as any).cover) ?? g.photos[0]).url,
    href: `/works/${g.slug}`,
  }));

  const section = (id: string, type: string, layout: string, elements: any) => ({
    id, type, layout, elements, isVisible: true, backgroundType: 'theme',
    aiMetadata: { aiGenerated: true, lastGenerated: Date.now(), isCustomized: false, aiGeneratedElements: [], excludedElements: [] },
  });

  const header = section(headerId, 'header', 'workheader', { logo_text: 'Kundius Studio' });
  const hero = section(heroId, 'hero', 'workherocenter', { heading: 'Kundius Studio', lead: 'Documentary wedding photography' });
  const work = section(workId, 'work', 'workgallerygrid', { eyebrow: 'Selected work', heading: 'The work', lead: 'Recent commissions.', groups });
  const footer = section(footerId, 'footer', 'workfooter', { wordmark: 'Kundius Studio' });

  const bodySections = [heroId, workId];
  const bodyContent = { [heroId]: hero, [workId]: work };
  const bodyLayouts = { [heroId]: 'workherocenter', [workId]: 'workgallerygrid' };

  const chrome = {
    header: { id: headerId, layout: 'workheader', data: header },
    footer: { id: footerId, layout: 'workfooter', data: footer },
  };

  // /works/<slug> item pages carrying VERBATIM photos (the fan-out output).
  const pages: Record<string, any> = {
    home: {
      id: 'home', archetypeKey: 'home', pathSlug: '/', title: 'Home', order: 0,
      sections: bodySections, sectionLayouts: bodyLayouts, sectionSpacing: {}, content: bodyContent,
    },
  };
  for (const g of WORK_GROUPS_WITH_PHOTOS) {
    const itId = sid('workdetail');
    pages[`page-${g.slug}`] = {
      id: `page-${g.slug}`, archetypeKey: 'work-detail', pathSlug: `/works/${g.slug}`,
      title: g.name, order: 1, kind: 'collectionItem', collectionKey: 'works',
      sections: [itId], sectionLayouts: { [itId]: 'workdetail' }, sectionSpacing: {},
      content: { [itId]: section(itId, 'workdetail', 'workdetail', { name: g.name, client: '', problem: '', result: '', photos: g.photos.map((p) => ({ ...p, alt: '', cover: (p as any).cover ?? false })) }) },
    };
  }

  return {
    layout: { sections: [headerId, ...bodySections, footerId], sectionLayouts: { [headerId]: 'workheader', ...bodyLayouts, [footerId]: 'workfooter' }, theme: {}, globalSettings: {} },
    content: { [headerId]: header, ...bodyContent, [footerId]: footer },
    meta: { id: token, title: 'Kundius Studio', slug: '', lastUpdated: Date.now(), version: 1, tokenId: token },
    onboardingData: { oneLiner: 'Documentary wedding photography', productName: 'Kundius Studio' },
    generatedAt: Date.now(),
    chrome,
    pages,
    homeId: 'home',
    currentPageId: 'home',
  };
}

/**
 * Seed a SERVED work project, then hand-seed a pre-bound atelier2 finalContent
 * (covers stamped + /works item pages) via /api/saveDraft — flipping the
 * persisted templateId to atelier2. Returns the token + the cover URLs the
 * reveal must render.
 */
export async function seedBoundAtelier2Preview(
  api: APIRequestContext
): Promise<{ token: string; coverUrls: string[]; workSlugs: string[] }> {
  const { token } = await seedWorkBrief(api);
  const finalContent = buildBoundAtelier2FinalContent(token);
  const res = await api.post('/api/saveDraft', {
    data: { tokenId: token, title: 'Kundius Studio', templateId: 'atelier2', finalContent },
  });
  expect(res.ok(), `/api/saveDraft: ${res.status()} ${await res.text()}`).toBeTruthy();
  return {
    token,
    coverUrls: [WORK_COVER_URLS.weddings, WORK_COVER_URLS.portraits],
    workSlugs: WORK_GROUPS_WITH_PHOTOS.map((g) => g.slug),
  };
}

// ── work-onboarding E2 / phase 2 — the REAL fan-out path on atelier2 ──────────
// Unlike seedBoundAtelier2Preview (which HAND-SEEDS the bound finalContent), this
// seeds a PHOTO-BEARING brief on an atelier2 project and lets the journey's STEP-05
// generation drive the ACTUAL fan-out (works flip live) — the covers + /works item
// pages are produced by runWorksFanOut, not hand-written. The binding is pure code,
// so mock copy suffices (deterministic). The seed sets templateId directly (the env
// override WORK_JOURNEY_TEMPLATE_OVERRIDE is only for manual dev journeys).

/** Photo-bearing work groups (brief facts.work.groups shape: kind + price + photos). */
const REAL_FANOUT_GROUPS = [
  {
    name: 'Wedding day coverage',
    kind: 'category',
    price: { mode: 'on-request' },
    photos: [
      { id: 'rf-wed-1', url: WORK_COVER_URLS.weddings, cover: true },
      { id: 'rf-wed-2', url: 'https://e2e.test/covers/weddings-2.jpg' },
    ],
  },
  {
    name: 'Engagement session',
    kind: 'category',
    price: { mode: 'on-request' },
    photos: [{ id: 'rf-eng-1', url: WORK_COVER_URLS.portraits, cover: true }],
  },
] as const;

/**
 * Seed a SERVED, PHOTO-BEARING work project and flip it onto the atelier2 skeleton
 * pilot, ready for the journey to drive a REAL STEP-05 fan-out. Returns the token,
 * the cover URLs the home reveal must paint, and the code-derived work slugs whose
 * `/works/<slug>` item pages the fan-out must produce (slugify of the group name).
 */
export async function seedRealFanoutAtelier2(
  api: APIRequestContext
): Promise<{ token: string; coverUrls: string[]; workSlugs: string[] }> {
  const token = await startProject(api);

  // Confirm a photo-bearing brief (still serves atelier — photos are extra data).
  const brief = {
    ...WORK_BRIEF_FIXTURE,
    facts: {
      ...WORK_BRIEF_FIXTURE.facts,
      work: { ...WORK_BRIEF_FIXTURE.facts.work, groups: REAL_FANOUT_GROUPS },
    },
  };
  const confirm = await api.post('/api/brief/confirm', { data: { tokenId: token, brief } });
  expect(confirm.ok(), `/api/brief/confirm: ${confirm.status()} ${await confirm.text()}`).toBeTruthy();
  expect((await confirm.json()).outcome).toBe('serve');

  // Flip the persisted templateId onto atelier2 (the works-flipped skeleton pilot).
  const flip = await api.post('/api/saveDraft', {
    data: { tokenId: token, title: 'Kundius Studio', templateId: 'atelier2' },
  });
  expect(flip.ok(), `/api/saveDraft flip: ${flip.status()} ${await flip.text()}`).toBeTruthy();

  return {
    token,
    coverUrls: [WORK_COVER_URLS.weddings, WORK_COVER_URLS.portraits],
    // slugify('Wedding day coverage') / slugify('Engagement session').
    workSlugs: ['wedding-day-coverage', 'engagement-session'],
  };
}
