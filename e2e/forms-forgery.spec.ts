import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

/**
 * M8 regression gate: POST /api/forms/submit must NEVER trust a client-supplied `userId`.
 *
 * THE BUG THIS PINS: `data-owner-id` (the owner's Clerk id) used to be printed into every
 * published page's HTML, and the submit route read the body `userId` straight from the
 * client. Anyone who viewed source could forge submissions under any owner — fake leads on
 * their dashboard, their ConvertKit key fired, their monthly submission cap burned. After
 * phase 1 the owner is derived server-side from `publishedPageId` → `PublishedPage.userId`,
 * and the body `userId` is accepted-and-ignored (never rejected: immutable published blobs
 * ship the frozen form.v1.js, which sends it forever).
 *
 * WHAT THIS SPEC HONESTLY COVERS: the route's identity contract as the DB actually records
 * it — the forged-owner case asserts the persisted `FormSubmission.userId` row, not just a
 * status code. A 200 alone would be worthless here; a forged submit ALWAYS 200'd, that was
 * the whole problem. The rejection matrix (unknown / missing / draft / unpublishing) is
 * pinned alongside it because those branches are the derivation gate itself.
 *
 * WHAT IT DOES *NOT* COVER (do not read more into a green run):
 *  - The markup/asset half (phase 3): `data-owner-id` removal + the form.v2.js bump. This
 *    spec is server-contract only and stays green across that phase BY DESIGN.
 *  - ConvertKit / lead-notification integration firing. The seeded project has no
 *    `content.forms`, so config lookup finds nothing → formName 'Unknown Form', no
 *    integrations. That is the deliberate minimal path; integrations are phase 4 QA.
 *  - The serving states that fail OPEN (`publishing`/`failed`/legacy-null). Pinned by the
 *    route unit test (`src/app/api/forms/submit/route.test.ts`), which can fabricate them
 *    without a real publish.
 *
 * Seeds directly with Prisma: the route is PUBLIC (middleware `isPublicRoute`), so no Clerk
 * session is needed, but a victim OWNER must exist and be someone other than the caller —
 * which is exactly what no API can set up here.
 *
 * Rate limit: `withFormRateLimit` = FORM_SUBMISSION preset, 10 requests / 60s, keyed per-IP
 * for an anonymous caller (`RATE_LIMIT_PRESETS`, src/lib/rateLimit.ts). This spec makes
 * exactly 6 POSTs from one IP — under the limit, so NO sleeps/pacing are needed and the run
 * stays deterministic. If cases are ever added here, keep the total under 10 or the 11th POST
 * starts 429ing and this gate goes flaky.
 */
test.describe.configure({ mode: 'serial' });

const db = new PrismaClient();

const RUN = randomUUID().slice(0, 8);
const VICTIM_CLERK_ID = `e2e_forgery_victim_${RUN}`;
const FORGED_CLERK_ID = 'attacker_forged_id';
const TOKEN_VALUE = `e2e-forgery-${RUN}`;
const SLUG = `e2e-forgery-${RUN}`;
const FORM_ID = 'e2eForgeryForm';

let victimPageId: string;

test.beforeAll(async () => {
  // FK chain: Token ← Project → User. PublishedPage.userId is the CLERK id (external,
  // not an FK); Project.userId is the User row id. Getting those two crossed is the
  // classic seeding bug here — the route derives the CLERK id, so that is what the
  // FormSubmission row must carry.
  const victim = await db.user.create({
    data: { clerkId: VICTIM_CLERK_ID, email: `${VICTIM_CLERK_ID}@e2e.local` },
  });
  await db.token.create({ data: { value: TOKEN_VALUE } });
  const project = await db.project.create({
    data: {
      tokenId: TOKEN_VALUE,
      userId: victim.id,
      title: 'Forgery victim project',
      // `content.forms` intentionally empty: form config is OPTIONAL — the submission is
      // still stored (formName 'Unknown Form'). Identity is what's under test, not config.
      content: {},
    },
  });
  const page = await db.publishedPage.create({
    data: {
      userId: VICTIM_CLERK_ID,
      slug: SLUG,
      // projectId is nullable in the schema, but SET here: a null would silently skip the
      // project-scoped form-config lookup and test a weaker path than production runs.
      projectId: project.id,
      htmlContent: '<html></html>',
      publishState: 'published',
    },
  });
  victimPageId = page.id;
});

test.afterAll(async () => {
  // Leaked rows across runs are how this gate rots: the victim clerk id is run-scoped, so a
  // leak would not collide, but the FormSubmission rows would accumulate forever and the
  // owner's monthly cap (FREE = 25) would eventually 429 a future run's first POST.
  await db.formSubmission.deleteMany({ where: { userId: { in: [VICTIM_CLERK_ID, FORGED_CLERK_ID] } } });
  await db.publishedPage.deleteMany({ where: { slug: SLUG } });
  await db.project.deleteMany({ where: { tokenId: TOKEN_VALUE } });
  await db.token.deleteMany({ where: { value: TOKEN_VALUE } });
  await db.user.deleteMany({ where: { clerkId: VICTIM_CLERK_ID } });
  await db.$disconnect();
});

test('forged body userId is IGNORED — the row is attributed to the page owner', async ({
  request,
}) => {
  const res = await request.post('/api/forms/submit', {
    data: {
      formId: FORM_ID,
      data: { email: `forged-${RUN}@e2e.local`, name: 'Forged Submitter' },
      publishedPageId: victimPageId,
      userId: FORGED_CLERK_ID, // ← the attack: whatever the attacker read out of page source
    },
  });

  // Accepted-and-ignored, NOT rejected (locked decision 1): old blobs send this forever.
  expect(res.status(), `forged submit: ${await res.text()}`).toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);

  // THE assertion. A 200 proves nothing on its own — the vulnerable route 200'd too. What
  // matters is which owner the DB row landed under.
  const row = await db.formSubmission.findUnique({ where: { id: body.submissionId } });
  expect(row, 'submission not persisted').not.toBeNull();
  expect(row!.userId, 'row attributed to the FORGED id — client body is still trusted').toBe(
    VICTIM_CLERK_ID
  );
  expect(row!.userId, 'forged id reached the database').not.toBe(FORGED_CLERK_ID);
  expect(row!.publishedPageId).toBe(victimPageId);
});

test('omitted userId still resolves to the page owner (derivation, not fallback)', async ({
  request,
}) => {
  // Post-phase-3 first-party senders stop sending `userId` at all. If derivation ever
  // regressed into "trust the body, fall back to the page", this case would still pass while
  // the forged case above failed — they are complementary, not redundant.
  const res = await request.post('/api/forms/submit', {
    data: {
      formId: FORM_ID,
      data: { email: `clean-${RUN}@e2e.local` },
      publishedPageId: victimPageId,
    },
  });

  expect(res.status(), `clean submit: ${await res.text()}`).toBe(200);
  const body = await res.json();
  const row = await db.formSubmission.findUnique({ where: { id: body.submissionId } });
  expect(row!.userId).toBe(VICTIM_CLERK_ID);
});

test('unknown publishedPageId → 404 unknown_page', async ({ request }) => {
  const res = await request.post('/api/forms/submit', {
    data: {
      formId: FORM_ID,
      data: { email: `ghost-${RUN}@e2e.local` },
      // A well-formed but nonexistent id. Shape mimics a cuid so the failure is the
      // findUnique miss, not a validation quirk.
      publishedPageId: `cl${randomUUID().replace(/-/g, '').slice(0, 23)}`,
      userId: FORGED_CLERK_ID,
    },
  });

  expect(res.status()).toBe(404);
  // Stable machine-readable code (not a zod issues array) — the embedded form handler
  // surfaces it to the visitor, so a silent rename is a user-visible regression.
  expect((await res.json()).error).toBe('unknown_page');
});

test('missing publishedPageId → 400 missing_page_id', async ({ request }) => {
  // Also the editor/preview pre-publish path: no page row exists yet, so a clean 400 is the
  // contract (matches pre-change behaviour, which 400'd on the absent owner id).
  const res = await request.post('/api/forms/submit', {
    data: {
      formId: FORM_ID,
      data: { email: `nopage-${RUN}@e2e.local` },
      userId: FORGED_CLERK_ID,
    },
  });

  expect(res.status()).toBe(400);
  expect((await res.json()).error).toBe('missing_page_id');
});

test('unpublished page (draft) → 404 unknown_page, no lead captured', async ({ request }) => {
  await db.publishedPage.update({ where: { id: victimPageId }, data: { publishState: 'draft' } });
  try {
    const res = await request.post('/api/forms/submit', {
      data: {
        formId: FORM_ID,
        data: { email: `draft-${RUN}@e2e.local` },
        publishedPageId: victimPageId,
      },
    });

    // Same body as the unknown-page case ON PURPOSE: existence is not disclosed.
    expect(res.status()).toBe(404);
    expect((await res.json()).error).toBe('unknown_page');

    // The 404 is a real reject, not a cosmetic status on a stored row.
    expect(
      await db.formSubmission.count({
        where: { publishedPageId: victimPageId, data: { path: ['email'], equals: `draft-${RUN}@e2e.local` } },
      }),
      'rejected submission was stored anyway'
    ).toBe(0);
  } finally {
    await db.publishedPage.update({
      where: { id: victimPageId },
      data: { publishState: 'published' },
    });
  }
});

test('stuck teardown (unpublishing) → 404 unknown_page', async ({ request }) => {
  // `unpublishing` is written by teardown.ts and can STICK permanently if teardown crashes.
  // Its KV routes + blob are already gone and /p/{slug} 404s it, so rejecting its leads is
  // the honest behaviour — this pins the 5th state of the matrix (the one a naive
  // `publishState !== 'published'` check would get right but a `!== 'draft'` check would not).
  await db.publishedPage.update({
    where: { id: victimPageId },
    data: { publishState: 'unpublishing' },
  });
  try {
    const res = await request.post('/api/forms/submit', {
      data: {
        formId: FORM_ID,
        data: { email: `stuck-${RUN}@e2e.local` },
        publishedPageId: victimPageId,
      },
    });

    expect(res.status()).toBe(404);
    expect((await res.json()).error).toBe('unknown_page');
  } finally {
    await db.publishedPage.update({
      where: { id: victimPageId },
      data: { publishState: 'published' },
    });
  }
});
