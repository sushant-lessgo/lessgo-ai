import { test, expect } from '@playwright/test';
import { seedWorkBrief, startProject, loadDraft } from './helpers/seedWorkBrief';

// ============================================================================
// The work onboarding journey — SEEDED-RESUME e2e (decision 9 / landmine 13).
//
// Mock mode CANNOT classify work, so every spec here SEEDS a confirmed work
// brief through the REAL serve gate and resumes the shell. The real
// classify → STEP 01 entry is covered by Vitest (JourneyEntryStep.test.tsx) +
// P7 founder QA — nothing here fakes it.
//
// Authed: the flow needs a Clerk session (registered in the `authed` project).
// Serial for the same reason as publish.spec.ts — one shared test user.
//
// P2b scope: dispatch + resume-mount + legacy-unchanged. The rail (P3), steps
// (P4), generation (P5) and reveal (P6) add their assertions to this file.
// ============================================================================

test.describe.configure({ mode: 'serial' });

/** Clerk's session JWT is ~60s — refresh it, then use `page.request`. */
async function authedApi(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, {
    timeout: 30_000,
  });
  return page.request;
}

test('served work brief resumes the JOURNEY shell at STEP 02 (not WizardShell)', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  // The serve gate stamps the project (landmine 3: saveDraft never writes
  // audienceType — /api/brief/confirm is the only writer).
  const draft = await loadDraft(api, token);
  // work is an ENGINE, never an audience: a served work brief is a
  // SERVICE-audience atelier project whose BRIEF carries copyEngine 'work'.
  expect(draft.audienceType).toBe('service');
  expect(draft.templateId).toBe('atelier');
  expect(draft.brief.copyEngine).toBe('work');

  await page.goto(`/onboarding/${token}`);

  // Load-detection → isJourneyEligible(work, atelier) → JourneyShell, mounted at
  // the resume step (02).
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });

  // Dot progress is the journey's chrome signature.
  await expect(page.getByTestId('journey-dot-2')).toHaveAttribute('data-state', 'active');

  // NOT the legacy wizard.
  await expect(page.getByText('Basics', { exact: true })).toHaveCount(0);
});

// ⚠️ Scope narrowed in P5 (deliberate, not a weakening): this walk used to run
// 02 → 06 with the generic nav. STEP 05 is no longer a passive frame — mounting
// it DRIVES generation and then advances itself to 06 — so walking THROUGH it
// with the nav buttons would fan out a real generation and race its own
// assertions. Steps 05 → 06 are covered by the P5 generation spec below, which
// enters through STEP 04's "Build my site" CTA — the real door.
test('the journey step machine walks 02 → 04 and back', async ({ page }) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });

  const next = page.getByTestId('journey-next');
  for (const testId of ['step-questions', 'step-plan']) {
    await next.click();
    await expect(page.getByTestId(testId)).toBeVisible();
  }

  // 02 is the floor.
  await page.getByTestId('journey-back').click();
  await expect(page.getByTestId('step-questions')).toBeVisible();
  await page.getByTestId('journey-back').click();
  await expect(page.getByTestId('step-show-work')).toBeVisible();
  await expect(page.getByTestId('journey-back')).toBeDisabled();
});

// ============================================================================
// P3 — the "What we understood" rail, over a REAL persisted project.
//
// These are the assertions unit tests structurally cannot make: that a rail
// belief actually reaches Postgres through /api/saveDraft's brief merge, and
// that it does so WITHOUT dropping `facts.entry` (landmine 4) or breaking the
// group `kind` invariant that STEP-05 generation depends on (landmine 6).
// ============================================================================

test('the rail projects the seeded brief and its edits SURVIVE a reload', async ({ page }) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('understood-rail')).toBeVisible({ timeout: 30_000 });

  // Projected from the seeded facts.work — not typed in by this test.
  await expect(page.getByTestId('rail-value-name')).toHaveText('Kundius Studio');
  await expect(page.getByTestId('rail-value-descriptor')).toHaveText(
    'Documentary wedding photography'
  );
  await expect(page.getByTestId('rail-chip-g0')).toHaveText('Wedding day coverage');
  await expect(page.getByTestId('rail-chip-g1')).toHaveText('Engagement session');

  // ── Edit #1: NAME ────────────────────────────────────────────────────────
  await page.getByTestId('rail-edit-name').click();
  await page.getByTestId('rail-input-name').fill('Kundius Photography');
  await page.getByTestId('rail-save-name').click();
  await expect(page.getByTestId('rail-value-name')).toHaveText('Kundius Photography');

  // ── Edit #2, immediately after: DESCRIPTOR (lost-update guard) ────────────
  // Edit #2 re-emits the FULL bag from the snapshot edit #1 wrote. If commitRail
  // did not sync briefFacts in the same `set` as the save, this would re-emit
  // stale facts and silently revert edit #1.
  await page.getByTestId('rail-edit-descriptor').click();
  await page.getByTestId('rail-input-descriptor').fill('Wedding & portrait photographer');
  await page.getByTestId('rail-save-descriptor').click();
  await expect(page.getByTestId('rail-value-descriptor')).toHaveText(
    'Wedding & portrait photographer'
  );

  // ── Edit #3: RENAME a group chip (the id-join, end to end) ────────────────
  await page.getByTestId('rail-edit-groups').click();
  await page.getByTestId('rail-chip-input-0').fill('Wedding days');
  await page.getByTestId('rail-chips-save').click();
  await expect(page.getByTestId('rail-chip-g0')).toHaveText('Wedding days');

  // ── Note ─────────────────────────────────────────────────────────────────
  await page.getByTestId('rail-note-input').fill('The prices are wrong');
  await page.getByTestId('rail-note-submit').click();
  await expect(page.getByTestId('rail-note-input')).toHaveValue('', { timeout: 10_000 });

  // ── The real assertion: it is in the DB, and nothing else was dropped ─────
  const draft = await loadDraft(api, token);
  const work = draft.brief.facts.work;
  expect(work.identity.name).toBe('Kundius Photography');
  expect(work.identity.descriptor).toBe('Wedding & portrait photographer'); // BOTH edits
  expect(work.groups.map((g: { name: string }) => g.name)).toEqual([
    'Wedding days',
    'Engagement session',
  ]);
  // The renamed group is still kind-valid — a kind-less group nulls
  // getWorkFacts and dead-ends STEP 05 with an unrecoverable 400.
  for (const g of work.groups) expect(g.kind).toBe('category');
  expect(work.userNotes).toEqual(['The prices are wrong']);

  // Sibling facts survived every full-facts re-emit (landmine 4).
  expect(draft.brief.facts.entry.businessName).toBe('Kundius Studio');
  // And the serve-gate stamps are untouched by rail writes (landmine 3).
  expect(draft.audienceType).toBe('service');
  expect(draft.templateId).toBe('atelier');
  expect(draft.brief.copyEngine).toBe('work');

  // Reload: the rail re-projects from the DB, not from client memory.
  await page.reload();
  await expect(page.getByTestId('rail-value-name')).toHaveText('Kundius Photography', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('rail-chip-g0')).toHaveText('Wedding days');
});

// ============================================================================
// P4 — the THIN steps 02 → 04, over a REAL persisted project.
//
// What only e2e can prove: a STEP 03 answer reaches Postgres through the rail
// adapter STILL `kind`-valid (landmine 6 — a `kind`-less group nulls
// `getWorkFacts`, 400s the work strategy, and PERSISTS, so a retry never
// recovers), and that STEP 04's plan seeding is idempotent across back-nav
// (landmine 8).
// ============================================================================

test('the journey walks 02 → 04: answers land in the rail and in the DB, kind-valid', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });

  // ── 02: the stub + Skip (E1: no upload pipeline — ingestion is E2) ────────
  await expect(page.getByTestId('show-work-dropzone')).toBeVisible();
  await page.getByTestId('show-work-skip').click();
  await expect(page.getByTestId('step-questions')).toBeVisible();

  // ── 03 ask-if: the seeded brief has a name AND groups, so neither is asked —
  // only the optional price.
  await expect(page.getByTestId('question-name')).toHaveCount(0);
  await expect(page.getByTestId('question-groups')).toHaveCount(0);
  await expect(page.getByTestId('question-price')).toBeVisible();

  // Empty the seeded groups from the RAIL, so the group question becomes real
  // (the fixture is deliberately well-seeded; this is how a sparse classify
  // lands). The question must then appear — ask-if is driven by the projection.
  await page.getByTestId('rail-edit-groups').click();
  await page.getByTestId('rail-chip-remove-1').click();
  await page.getByTestId('rail-chip-remove-0').click();
  await page.getByTestId('rail-chips-save').click();
  await expect(page.getByTestId('rail-field-groups')).toHaveAttribute('data-skeleton', 'true');

  await expect(page.getByTestId('question-groups')).toBeVisible();
  await expect(page.getByTestId('question-price')).toHaveCount(0); // nothing to price yet

  // ── The answer: it appears IN THE RAIL (the journey's core promise) ───────
  await page.getByTestId('question-input-groups').fill('Newborn sessions');
  await page.getByTestId('question-save-groups').click();
  await expect(page.getByTestId('rail-chip-g0')).toHaveText('Newborn sessions');
  // …and the price question now has something to price.
  await expect(page.getByTestId('question-price')).toBeVisible();

  // Default is "On request" (always valid); "From" needs an amount — the Save
  // stays disabled without one, and the seam refuses it anyway.
  await page.getByTestId('question-price-mode-price').getByRole('radio', { name: 'From' }).click();
  await page.getByTestId('question-price-amount-price').fill('900');
  await page.getByTestId('question-save-price').click();

  // ── The real assertion: it is in the DB, and it is generation-valid ───────
  // Polled, not slept: the price answer has no rail field of its own to watch
  // (PRICE POSITION is a derived BAND, and it is already non-null from the
  // group answer's on-request default — asserting on it would pass before the
  // save landed).
  await expect
    .poll(async () => (await loadDraft(api, token)).brief.facts.work.groups[0].price.mode, {
      timeout: 15_000,
    })
    .toBe('from');

  const draft = await loadDraft(api, token);
  const groups = draft.brief.facts.work.groups;
  expect(groups.map((g: { name: string }) => g.name)).toEqual(['Newborn sessions']);
  // A question answer routed through the rail adapter is NEVER kind-less.
  expect(groups[0].kind).toBe('category');
  expect(groups[0].price).toEqual({ mode: 'from', amount: 900 });
  expect(draft.brief.facts.entry.businessName).toBe('Kundius Studio'); // landmine 4
  expect(draft.audienceType).toBe('service');
  expect(draft.templateId).toBe('atelier');

  // ── 04: the plan, seeded chargelessly ────────────────────────────────────
  await page.getByTestId('journey-next').click();
  await expect(page.getByTestId('step-plan')).toBeVisible();
  const cards = page.getByTestId('plan-items').getByRole('listitem');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  // Back-nav must not re-seed (landmine 8 — the guard lives in fetchStrategy).
  await page.getByTestId('journey-back').click();
  await expect(page.getByTestId('step-questions')).toBeVisible();
  await page.getByTestId('journey-next').click();
  await expect(page.getByTestId('step-plan')).toBeVisible();
  await expect(page.getByTestId('plan-items').getByRole('listitem')).toHaveCount(count);
});

// ============================================================================
// P5 — STEP 05: generation, over a REAL project (mock LLM).
//
// This is the ONLY gate that catches the P5 trap. `resumeStep.test.ts`
// fabricates its `loaded` objects, so the `finalContent`-based resume rules go
// GREEN there whether or not anything actually PASSES `finalContent` — which
// nothing did until P5 widened /api/loadDraft → page.tsx → JourneyShell. The
// reload assertion below is the only thing standing between that chain and a
// silent "resumes at STEP 02 forever" regression.
//
// It also pins landmine 7: `finalizeMultiPageGeneration` DELETES
// `generationProgress`. If a future refactor drops finalize, the draft stays
// "resumable" and the reload lands on STEP 05, not 06 — this test fails loudly
// instead of the editor silently treating a finished site as mid-generation.
//
// The seeded fixture's persisted `kind`-valid `facts.work` is what makes work
// generation runnable at all here (preflight's second gate).
//
// ⚠️ THE RATE-LIMIT RETRY BELOW IS NOT TEST SCAFFOLDING — IT IS A REAL FINDING.
// A work multipage run is 1 strategy call + 1 copy call PER PAGE, back to back.
// atelier seeds FIVE default pages (`ATELIER_PAGE_ARCHETYPES`, all
// `defaultIncluded`) ⇒ SIX AI requests within seconds. `withAIRateLimit` allows
// FIVE per minute on the FREE tier (`TIER_RATE_LIMITS`, src/lib/rateLimit.ts) —
// so the last page 429s DETERMINISTICALLY for any free-tier user, not just here.
// It is recoverable (the driver persists per page and resumes on
// `completedPageKeys`; STEP 05 offers "Try again"), but the founder meets it on
// the very first pilot run. Fixing it means touching `rateLimit.ts` / the work
// routes — outside P5's Files-touched — so it is REPORTED, and this loop both
// keeps the gate honest and proves the resume path works. See the audit.
// ============================================================================

// ============================================================================
// P6 — STEP 06: the reveal → editor handoff.
//
// The reveal assertions are APPENDED to the P5 generation test rather than given
// their own spec, deliberately: reaching STEP 06 honestly costs a full work
// fan-out (1 strategy + 5 copy calls) AND, on the free tier, a 61s rate-limit
// wait (Bug A). A second spec would double that for zero extra coverage — the
// generation path is identical. So this ONE test is the full-journey gate:
// 02 → 06 → the real site in the iframe → the editor.
// ============================================================================

test('STEP 05 generates the site (mock), STEP 06 reveals it, and the editor opens', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });

  // 02 → 03 → 04 (the fixture answers 03's ask-ifs already; price is optional).
  await page.getByTestId('show-work-skip').click();
  await expect(page.getByTestId('step-questions')).toBeVisible();
  await page.getByTestId('journey-next').click();
  await expect(page.getByTestId('step-plan')).toBeVisible();

  // 04's CTA is the ONLY door into generation.
  await page.getByTestId('plan-build').click();
  await expect(page.getByTestId('step-building')).toBeVisible();

  // The flag is ON in webServer.env — so this is the REAL drive, not the
  // engine-disabled state (landmine 2's explicit error would be here instead).
  await expect(page.getByTestId('building-error-engine-disabled')).toHaveCount(0);
  await expect(page.getByTestId('building-stages')).toBeVisible();
  // NOT asserted here: the top bar's "Building…" slot. Mock generation finishes
  // in ~2s, so any assertion on an in-flight-only element is a RACE — it passed
  // and failed run to run. A test that flakes gets retried into meaninglessness;
  // the transient chrome is a founder-QA item (P7) instead. What IS asserted
  // below is that it's gone once we're done.

  // The free-tier AI rate limit bites on the 6th call (see the header). Retry
  // through it — ONLY for that specific error, and only while the drive is
  // making progress: any OTHER error must still fail this test loudly.
  for (let i = 0; i < 3; i++) {
    const settled = await Promise.race([
      page
        .getByTestId('step-reveal')
        .waitFor({ state: 'visible', timeout: 90_000 })
        .then(() => 'done' as const),
      page
        .getByTestId('building-error-error')
        .waitFor({ state: 'visible', timeout: 90_000 })
        .then(() => 'error' as const),
    ]);
    if (settled === 'done') break;
    const message = await page.getByTestId('step-building').innerText();
    expect(message, 'STEP 05 failed for a reason other than the AI rate limit').toMatch(
      /too many requests/i
    );
    // The window is 60s. The retry RESUMES (completedPageKeys skip) — it does
    // not re-generate the pages already persisted.
    await page.waitForTimeout(61_000);
    await page.getByTestId('building-retry').click();
  }

  // Success ⇒ journeyStep 6. NO router.push — the reveal owns forward motion,
  // so we must still be on /onboarding/{token}, not /edit/{token} (the
  // driver's own redirectTo is deliberately dropped by the seam).
  await expect(page.getByTestId('step-reveal')).toBeVisible({ timeout: 120_000 });
  expect(new URL(page.url()).pathname).toBe(`/onboarding/${token}`);
  await expect(page.getByTestId('journey-dot-6')).toHaveAttribute('data-state', 'active');
  await expect(page.getByTestId('topbar-building')).toHaveCount(0);

  // ── The DB: content exists AND the in-progress marker is gone ─────────────
  const draft = await loadDraft(api, token);
  expect(draft.finalContent, 'no finalContent — generation did not persist').toBeTruthy();
  expect(Object.keys(draft.finalContent.pages ?? {}).length).toBeGreaterThan(0);
  // Every planned page was written.
  //
  // ⚠️ TRIPWIRE — THIS ASSERTION IS EXPECTED TO FAIL WHEN BUG B IS FIXED. ⚠️
  // It only passes because of Bug B (see below + the audit): `generationProgress`
  // is SUPPOSED to be gone from the DB by now — `finalizeMultiPageGeneration`
  // deletes it — but the deletion never reaches Postgres, because /api/saveDraft
  // shallow-spreads the incoming finalContent over the stored one
  // (route.ts:194-199), so a client-side `delete` is merely an ABSENT key and the
  // stored value survives. We are therefore asserting on a stale marker.
  //
  // The day someone gives /api/saveDraft tombstone support, `generationProgress`
  // becomes undefined here ⇒ `?? []` ⇒ length 0 vs 5 ⇒ this line fails, and it
  // will look like a real regression to whoever is holding the saveDraft fix.
  // IT IS NOT. That failure is the FIX LANDING. When it happens, replace this
  // with the assertion it was always standing in for:
  //
  //     expect(draft.finalContent.generationProgress).toBeUndefined();
  //
  // Kept (not deleted) meanwhile because it is the only thing pinning "every
  // planned page was written" — and it is a useful canary for the saveDraft fix.
  expect(draft.finalContent.generationProgress?.completedPageKeys ?? []).toHaveLength(
    Object.keys(draft.finalContent.pages).length
  );

  // ⚠️ NOT ASSERTED (REPORTED INSTEAD — see the audit): that the in-progress
  // marker is GONE from the DB. It isn't, and NOT because finalize was skipped —
  // `runWorkLLMGeneration` does call `finalizeMultiPageGeneration`, which
  // `delete`s `fc.generationProgress`. The deletion cannot REACH Postgres:
  // `/api/saveDraft` shallow-SPREADS the incoming finalContent over the stored
  // one (`{...existingContent.finalContent, ...finalContent}`, route.ts:194-199),
  // so a key deleted client-side survives from the earlier per-page save.
  // It predates this phase — every multi-page LLM run (thing included) is
  // affected. Fixing it means touching `/api/saveDraft` (or having the driver
  // send an explicit tombstone), both outside this feature's Files-touched.
  //
  // ⟳ SEVERITY CORRECTED DOWN (P6 review — P5's wording overstated it).
  // Landmine 7's stated symptom, "the editor treats a finished site as
  // mid-generation", is NOT what happens: NO editor code reads
  // `generationProgress` (only `isResumableGeneration`, the work/thing
  // skip-loops, `resumeStep.ts`, and `editDelta/capture.ts:98`, where it is
  // explicitly skip-listed). The real consequence is the brief STEP-05 flash on
  // reload asserted below, which re-drives CHARGELESSLY (every page is already
  // in `completedPageKeys` ⇒ 0 AI calls ⇒ re-finalize ⇒ 06), plus permanent junk
  // in the stored finalContent. Cosmetic + wasteful — NOT a handoff break.

  // The stamps are untouched by the whole run (landmine 3).
  expect(draft.audienceType).toBe('service');
  expect(draft.templateId).toBe('atelier');
  expect(draft.brief.copyEngine).toBe('work');

  // ── THE PLUMBING ASSERTION (the P5 trap) ─────────────────────────────────
  // A reload re-runs load-detection → resolveResumeStep(loaded). Reaching the
  // REVEAL proves `finalContent` actually reaches the seam: if page.tsx or
  // JourneyShell ever stops forwarding it, `loaded.finalContent` is undefined,
  // the rule returns 2, and this sits on STEP 02 forever — with every unit test
  // in resumeStep.test.ts still green (it fabricates its input). This assertion
  // is the ONLY thing guarding that chain.
  //
  // NB it does not assert "resumes DIRECTLY at 06": because of the stale
  // in-progress marker above, `isResumableGeneration` is still true, so the
  // draft resumes at STEP 05 first and re-drives — the fan-out finds every page
  // already in `completedPageKeys`, skips them all, re-finalizes and advances to
  // 06. Self-healing and chargeless, but wasted work; it disappears the moment
  // the saveDraft merge bug is fixed. Asserting the destination (not the route)
  // keeps this test true both before and after that fix.
  await page.reload();
  await expect(page.getByTestId('step-reveal')).toBeVisible({ timeout: 120_000 });
  await expect(page.getByTestId('step-show-work')).toHaveCount(0);

  // ── P6: THE REVEAL ───────────────────────────────────────────────────────
  // The site renders in an IFRAME — a separate document — which is the entire
  // mechanism that keeps the journey's `.app-chrome` from becoming an ancestor
  // of template output (landmine 1). Asserting through frameLocator is itself
  // part of the point: if someone ever "simplifies" this into an inline render,
  // there is no frame to locate and these assertions die loudly.
  const frame = page.frameLocator('[data-testid="reveal-frame"]');

  // The chromeless preview mounted...
  await expect(frame.getByTestId('preview-chromeless')).toBeVisible({ timeout: 60_000 });

  // ...and it is the REAL generated site, not an empty shell: template blocks
  // emit token attributes (same proof render.spec.ts uses). Mock copy still
  // renders through the real atelier template.
  await expect(
    frame.locator('[data-surface], [data-palette], [data-variant]').first()
  ).toBeVisible({ timeout: 60_000 });

  // ── NO PUBLISH SURFACE — absent from the DOM, not merely hidden ───────────
  // The reveal IS the review; the only way forward is the editor. `toHaveCount(0)`
  // (not `not.toBeVisible()`) is the assertion the plan pins: a hidden-but-present
  // Publish button would pass visibility checks and still be one CSS change from
  // shipping a publish action into the magic moment.
  await expect(frame.getByRole('button', { name: 'Publish' })).toHaveCount(0);
  await expect(frame.getByRole('button', { name: 'Custom Domain' })).toHaveCount(0);
  await expect(frame.getByRole('button', { name: 'Back to Edit' })).toHaveCount(0);
  await expect(frame.getByText('Preview from edit mode')).toHaveCount(0);

  // Nor is there a publish control in the SHELL around the iframe.
  await expect(page.getByRole('button', { name: 'Publish' })).toHaveCount(0);

  // Site content lives ONLY inside the iframe: the shell's own document must
  // carry no template output (the landmine-1 tripwire, from the outside).
  await expect(page.locator('[data-surface], [data-palette], [data-variant]')).toHaveCount(0);

  // Phone toggle constrains the frame; desktop is the default.
  await page.getByTestId('reveal-viewport').getByRole('radio', { name: 'Phone' }).click();
  await expect(page.getByTestId('reveal-frame')).toHaveAttribute('style', /width:\s*390px/);

  // ── The handoff: the one forward path ────────────────────────────────────
  await page.getByTestId('reveal-open-editor').click();
  await page.waitForURL(`**/edit/${token}`, { timeout: 60_000 });

  // The editor loads the generated site (template output present = it rendered,
  // not an empty canvas). Here it IS in the page document — the editor is not
  // under `.app-chrome`, which is exactly why the reveal needed the iframe.
  await expect(
    page.locator('[data-surface], [data-palette], [data-variant]').first()
  ).toBeVisible({ timeout: 60_000 });

  // The stamps survive the whole journey, end to end (landmine 3).
  const afterEdit = await loadDraft(api, token);
  expect(afterEdit.audienceType).toBe('service');
  expect(afterEdit.templateId).toBe('atelier');
  expect(afterEdit.brief.copyEngine).toBe('work');
});

test('legacy unchanged: a non-seam brief still reaches the entry card / WizardShell', async ({
  page,
}) => {
  const api = await authedApi(page);
  const token = await startProject(api);

  // A TRUST brief (agency) — no journey seam ⇒ the dispatch must not touch it.
  const res = await api.post('/api/brief/confirm', {
    data: {
      tokenId: token,
      brief: {
        businessType: 'agency',
        copyEngine: 'trust',
        facts: {
          entry: {
            rawInput: 'a six-week brand studio for DTC founders',
            resolvedEngine: 'trust',
            classificationSource: 'lookup',
            tiebreaker: 'none',
            platformNeeds: 'none',
            summary: 'Brand identity studio',
            businessName: 'Studio Six',
            offerings: ['Brand identity'],
            audiences: ['DTC founders'],
            categories: ['branding'],
            outcomes: [],
            deliveryModel: 'remote',
            offer: 'Book a call',
            oneLiner: 'A six-week brand studio for DTC founders.',
            testimonials: [],
          },
        },
        structure: { mode: 'single', pages: [] },
        confidence: 0.9,
      },
    },
  });
  expect(res.ok(), `/api/brief/confirm: ${res.status()}`).toBeTruthy();
  expect((await res.json()).outcome).toBe('serve');

  await page.goto(`/onboarding/${token}`);

  // The unified wizard, exactly as before — no journey chrome anywhere.
  await expect(page.getByText('Basics', { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId('journey-dot-2')).toHaveCount(0);
  await expect(page.getByTestId('step-show-work')).toHaveCount(0);
});
