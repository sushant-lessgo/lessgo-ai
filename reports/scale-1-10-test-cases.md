# scale-01 → scale-10 — test case matrix & results

**Run date:** 2026-07-10 · **Branch:** `main` @ `010b711c` · **Target:** `http://localhost:3000` (fresh `npm run dev`)
**Mode:** real LLM (`USE_OPENAI=true`, `AI_MODEL_TIER=cheap`, `NEXT_PUBLIC_USE_MOCK_GPT=false`), `DEV_BYPASS_CREDITS=true`, `NEXT_PUBLIC_IMAGES_AT_BIRTH=true`
**Method:** Claude-in-Chrome browser drive, authenticated as the owner account; DB assertions via Prisma; code-level layer via `npm run test:run`.

**Legend —** PASS · FAIL · PARTIAL · NOT RUN · N/A-DORMANT (shipped intentionally inert) · CODE-ONLY (no browser surface)

---

## Headline

**Defects are written up in `reports/scale-1-10-findings.md` (F1–F30).** This file is the coverage matrix.

The entry funnel, serve gate, demand board, businessType config, wizard convergence and 7b structure gate all work as specced — several verbatim to the letter of the spec copy. Generation runs end-to-end from a bare one-liner to `/edit/[token]` with no founder touch, and the published blob is correct.

Six defects matter most:

| # | Sev | Defect |
|---|---|---|
| **F13 + F15 + F16** | **P0** | The serve gate is over-tight. `structure.mode='multi' → multipage`, `goal.mechanism='M1' → lead-form` and `intent='download-app' → store-badges` are treated as **required** capabilities no template declares. **4 of my 7 real leads were rejected** — including Wingrrowth (the pilot named in scalePlan §9), every writer with a form goal, and every app with a download goal. Two of the three are already satisfied by shared blocks the gate doesn't look at. |
| **F3** | **P0** | **Registry-level variant dispatch is dead on all 8 templates.** `types/template.ts:36` declares `resolveBlock(type, mode, layoutName?)`; every barrel implements `(type, mode)` and drops the third arg. `tsc` can't see it (2-arg is assignable to 3-arg) and all 1757 tests call the *inner* resolver. Any meridian variant the user picks never ships. |
| **F1** | **P0** | The auto-seeded lead form renders **zero input fields** in the editor. The seed and the published output are both correct; only the edit twin reads the store from the wrong place. |
| **F2** | **P0** | **Testimonials are fabricated**, with invented names, job titles and client companies — on **all three engines**. The trust run invented a "284% ROI" attributed to a named client. Violates scalePlan §8's "proof is never generated" law. |
| **F17** | **P1** | The one variant swap that *does* render (surge) **destroys a testimonial** and draws an empty quote card, and **Undo restores neither** — while the modal promises "Undo restores the removed card." |
| **F14** | **P1** | An M3 redirect goal can be confirmed with **no destination**, producing a primary CTA that points nowhere. |

Plus F4–F12 and F18 (template picker never shown, dead nav anchors, GOAL_REF not by-reference, CTA removable at 7b on the thing engine, hardcoded asset base, dead one-card Layout modal).

**7 runs executed:** saas one-liner (meridian) · manufacturer one-liner (vestria, multipage) · photographer + restaurant (MANUAL-ONBOARD) · plausible.io URL (vestria, review mode) · writer one-liner (rejected) · **agency one-liner (surge)** · **app one-liner (rejected)** · plus one publish to `qa-scale-parity`.

> **Second pass (same day)** re-tested the scale-09 variant surface and the two remaining
> businessTypes. It **corrected F3's root cause** (the DB never disagreed with itself) and added
> F16/F17/F18.
>
> **Third pass (same day)** ran a product-catalogue URL (`pine64.org`) to reach scale-10 and
> images-at-birth. It found **F19** — scale-10's collection capture is a dead wire, so TC-10.1–10.7
> are unreachable, not merely untested — plus F20/F21 (Goal and Offer steps have no validation;
> an empty offer dead-ends the wizard at 7/8). **TC-03.2 passes.**
>
> **Fourth pass (same day)** started scale-04 on that 5-page vestria project. Header nav auto-seed
> passes (TC-04.12). It found **F22** — the add-page chip bypasses the proof filter, producing
> fabricated testimonials on a page the user added *with the toggle off* — plus **F23** (multipage M1
> primary CTA has no destination at all) and **F24** (footer nav omits added pages).
>
> **Fifth pass (same day)** closed scale-04, scale-10 and the loose ends. New: **F25** (hearth+lex
> ship no `LinkTargetPopover` at all), **F26** (`Link.source` written inconsistently, read nowhere),
> **F27** (a raw ZodError blob shown to the user; root cause = `legal_links` is `ai_generated` but its
> shape is never declared in the copy prompt), **F28** (`slugify` leaves orphan hyphens; three impls
> exist). TC-10.2/10.3/10.4/10.6/10.8b now **pass** against a forced fixture, proving `CollectionNode`
> is sound and only F19's input path is dead. TC-02.11 (server-authoritative gate), TC-02.2, TC-04.13,
> TC-06.14, TC-09.13 all **pass**. **F15's "subscribe-newsletter is forced to M1" claim is retracted.**
> See `reports/scale-1-10-findings.md` → "Second-pass corrections" / "Third-pass additions".

---

## 0. Environment / preconditions

| # | Check | Expected | Status | Notes |
|---|---|---|---|---|
| TC-00.1 | Dev server on :3000 | serves current `main` | PASS | A stale Next server was already holding :3000; killed and restarted from `main` so tests ran against current code |
| TC-00.2 | Unit/integration suite | green | PASS | `npm run test:run` → 103 files, **1757 passed, 3 skipped, 0 failed** |
| TC-00.3 | Authenticated browser session | `/dashboard` reachable | PASS | user signed in manually — I do not authenticate on the user's behalf |

---

## 1. scale-01 — Brief record · registry · goal enums

Data + types only; no browser surface by design. First readers arrive in scale-02, and scale-02's live behavior (below) exercises them transitively.

| # | Test case | Expected | Status | Notes |
|---|---|---|---|---|
| TC-01.1 | `Project.brief` column | migration applied | PASS | `brief.goal` read back from DB: `{"intent":"request-demo","mechanism":"M1"}` |
| TC-01.2 | 18 intents × 5 mechanisms | enum frozen | PASS | all 18 rendered in the goal step (4 likely + 14 under "Other goals") |
| TC-01.3 | `fit()` shortlist | saas→[meridian,vestria]; photographer(gallery)→[] | PASS | photographer→[] proven live: serve gate emitted `rungC:gallery` |
| TC-01.4 | lumen bespoke / techpremium retired | never shortlisted | CODE-ONLY | vitest green |
| TC-01.5 | Zero runtime change | no `src/app/` import | CODE-ONLY | audit import-gate |

---

## 2. scale-02 — universal entry · router · serve gate · demand capture

The strongest area. Copy strings match the spec **verbatim**.

| # | Test case | Expected | Status | Notes |
|---|---|---|---|---|
| TC-02.1 | Unauth `/onboarding/[token]` | → Clerk sign-in | PASS | observed redirect to `accounts.dev/sign-in` |
| TC-02.2 | Unknown token | → `/dashboard` | **PASS** | `/onboarding/ZZnotarealtoken` → redirected to `/dashboard` |
| TC-02.3 | Entry = ONE input | no persona picker | PASS | "What are you building a page for?" + 1 textarea + 3 example chips |
| TC-02.4 | Sentence → `/api/v2/understand` `entry:true` | classify + loader | PASS | 3/3 sentences classified (saas, photographer, restaurant) |
| TC-02.5 | URL → `/api/v2/scrape-website` | prefill | PASS | `plausible.io` + `wingrrowth.com` both crawled; hint "Looks like a website — we'll read it and pull your copy + testimonials"; loader "Reading your site…" |
| TC-02.6 | Playback sentence | "A page for your {cat} that gets visitors to {goal}." | PASS | e.g. *"A page for your Financial software that gets visitors to request a demo."* |
| TC-02.7 | Confirm copy | "Looks right — continue" | PASS | exact |
| TC-02.8 | "Not quite right?" chooser | type cards + "Something else" | PASS | **8** cards (spec said 6 — scale-08 added photographer + app), + "Something else" |
| TC-02.9 | Low confidence → chooser upfront | | NOT RUN | all 3 inputs were high-confidence |
| TC-02.10 | SERVE → wizard | routes into wizard | PASS | saas → `/onboarding/{token}` wizard, prefilled |
| TC-02.11 | Gate is server-authoritative | client can't force serve | **PASS** | Posted a hand-forged photographer Brief to `/api/brief/confirm` carrying `serve:true, decision:'SERVE', confidence:0.95`. Server ignored all of it and re-ran `decideServe`: `{"outcome":"manual","missing":"rungC:gallery","outOfIcp":false}`. |
| TC-02.12 | Photographer → MANUAL-ONBOARD | "Not automated yet — someone from Lessgo AI will connect with you shortly." | PASS | exact, incl. heading "We've got you — almost" |
| TC-02.13 | "Something else" → manual | tagged `rungA:unclassified` | PASS | restaurant lead; skips confirm, straight to capture |
| TC-02.14 | Email required, phone optional | | PASS | submit disabled until valid email |
| TC-02.15 | Fast-track double intent | "Sushant will connect with you shortly to personalize." | PASS | exact, after "Need it sooner?" |
| TC-02.16 | `DemandLead` persisted | input/briefDraft/missing/email/fasttrack | PASS | both leads present |
| TC-02.17 | No internal jargon in UI | no engine/rung/archetype | PASS | user-facing copy clean; tags internal-only |
| TC-02.18 | `/admin` Demand Board | 3 grids + lead table | PASS | *Blocked on*: `rungC:gallery` 1, `rungA:unclassified` 1 · *Business type*: photographer 1, restaurant 1 · *Engine*: work 1, place 1 |
| TC-02.19 | Fast-track pinned | amber + "FAST TRACK" badge | PASS | pinned first |
| TC-02.20 | `/admin` as non-admin → 404 | | NOT RUN | only admin account available |
| TC-02.21 | `/onboarding/persona` | → `/dashboard` | NOT RUN | unauth probe returns 404 via Clerk; not a valid check |
| TC-02.22 | `/onboarding/waitlist` | → `/dashboard` | NOT RUN | same |
| TC-02.23 | `/api/start` → universal entry | `{url: /onboarding/{token}}` | PASS | "+ Create New Page" → `/onboarding/qgWwABkSRXLm`, no persona gate |
| TC-02.24 | Founder lead email | env-gated no-op | NOT RUN | would send real email; skipped deliberately |

**Note (UX, not a defect):** tapping a chooser card silently collapses the chooser and leaves the playback sentence unchanged, so there's no visual confirmation the correction registered. It *does* register — the demand board proved `businessType=photographer` — but the user can't tell.

---

## 3. scale-03 — images at birth

| # | Test case | Expected | Status | Notes |
|---|---|---|---|---|
| TC-03.1 | Flag ON + meridian | zero stockable slots → placeholders | PASS | flag was ON; meridian generated with no stock imagery, no Pexels calls |
| TC-03.2 | Flag ON + vestria | `VestriaIndustriesGrid` gets palette-scored images | **PASS** | `9knkYn8_QZpE` (pine64 → vestria, 5 pages, `/industries` added at the gate): **11 Pexels URLs**, one `image` per `industries[]` item on both `/` and `/industries`, queries derived per item title (`Education Technology`, `Embedded Systems`, `Tech Development`). 3 `<img>` on home load at 940×627, 0 broken. Confirms `imageSlots.ts:36` is the only stockable slot and that it expands per item. |
| TC-03.3 | Promised-asset slots | labeled placeholder | **PASS** | vestria hero renders a `HERO IMAGE` labeled placeholder (`stockable:false`), never stocked |
| TC-03.4 | hearth/lex/surge/granth | no images at birth | N/A-DORMANT | not wired (pilot = meridian+vestria) |
| TC-03.5 | posthog `images_at_birth` | emitted | NOT RUN | |
| TC-03.6 | `pickBestImage` / `buildSearchQuery` | deterministic | CODE-ONLY | vitest green |

---

## 4. scale-04 — click system (Destination · GOAL_REF · beacon)

| # | Test case | Expected | Status | Notes |
|---|---|---|---|---|
| TC-04.1 | Primary CTA defaults to GOAL_REF | modal shows "Follows your project goal" | **FAIL (see F6)** | Persisted CTA is a **resolved** destination, not `GOAL_REF`: `cta: {dest:{kind:'section',anchor:'form-section'}, role:'primary', formId:…}`. Hero CTA has **no `cta` metadata at all**. |
| TC-04.1b | Multipage M1 primary CTA resolves cross-page | hero → `/contact` form | **FAIL → F23** | `9knkYn8_QZpE`: form seeded on `/contact`; **zero** sections across all 5 pages carry `cta`/`buttonConfig` metadata. Home hero is bare `cta_text:"Send enquiry"`. Same-page anchor impossible; no `dest:{kind:'page'}` written. |
| TC-04.2 | Change goal → primaries re-point | href changes, copy unchanged | NOT RUN | blocked by F6 + no reachable goal editor post-gen |
| TC-04.3 | Detach from GOAL_REF | explicit dest + re-attach | NOT RUN | could not find the entry point to open `ButtonConfigurationModal` from a hero CTA (double-click → text toolbar; right-click → nothing) |
| TC-04.4 | Secondary CTA never follows goal | | NOT RUN | same |
| TC-04.5 | `section` destination resolves | anchor exists on page | **FAIL → F23** | `qa-scale-vestria`: both primaries emit `href="#contact"`; `document.getElementById('contact') === null`. Home ids: `header, hero, trust, features, catalog, about, industries, footer`. Click changes hash, scrolls nowhere. |
| TC-04.6 | `page` destination resolves | cross-page link | **NOT EMITTED → F23** | no `dest:{kind:'page'}` written anywhere, though `/contact` exists and serves (200) |
| TC-04.7–04.9 | external / whatsapp / call / email / social / download | | NOT RUN | no goal on the 8 businessTypes' `likelyIntents` produces these kinds; nav popover can author `Custom URL` but no generated CTA used them |
| TC-04.10 | ONE shared `LinkTargetPopover` | same popover everywhere | **PASS on vestria / FAIL → F25 on hearth+lex** | vestria: 6 `button[aria-label="Set link target"]`; opening one shows *Scroll to section · Link to page · Custom URL* + page options for all 5 pages incl. the added `/industries`, with the current target pre-selected. **hearth and lex import `LinkTargetPopover` in 0 files** — their nav/footer links can never be re-pointed. |
| TC-04.13 | Seed not re-applied after edit | | **PASS** | Re-pointed a vestria nav item `/about → /industries` via the popover, hard-reloaded: edit survived (`href: "/industries"`). Seed runs at generation only. (But see **F26**: it persisted as a bare string, dropping `Link.source`.) |
| TC-04.11 | Derived links don't move on goal change | | NOT RUN | |
| TC-04.12 | Nav auto-seed on multipage | one link per page | **PASS** | `9knkYn8_QZpE` header `nav_items` = `/about`, `/catalogue`, `/industries`, `/contact` — one per non-home page, home correctly excluded (logo carries it), `/industries` (added at the gate) present. `aiGenerated` unset ⇒ derived, not authored. Header `cta_text` = "Send enquiry", matching goal `enquiry`. |
| TC-04.13 | Seed not re-applied after edit | | NOT RUN | |
| TC-04.21 | Footer nav matches sitemap | | **FAIL → F24** | Footer (`VestriaFooter`, `aiGenerated:true`) Quick Links = Home/About/Catalogue/Contact — **`/industries` missing**. Header and footer disagree on the same project. |
| TC-04.14 | Single-page nav NOT seeded | | PASS (with caveat) | nav is not sitemap-derived — but see **F5**: it ships template-default anchors `#pricing`, `#about`, `#support` that point at sections this page doesn't have |
| TC-04.15 | Social panel in `GlobalAppHeader` | opens, add profile | PASS | "Social" button → "Social Media Links" modal → platform select + URL + Add |
| TC-04.16 | Social profiles round-trip | → `Project.brief.socialProfiles` | PARTIAL | `brief.socialProfiles = []` (empty; nothing added/saved in this run) |
| TC-04.17 | Beacon attribution `{role, placement}` | on published CTA click | PARTIAL → F9 | beacon fires (`POST /api/analytics/event` 200) and `PageAnalytics.ctaPlacements` is written — but as `{"unknown":{"primary":2}}`, and a *secondary* click was counted primary. Cause: the page loads **prod's** `a.v1.js` (hardcoded `assetBase`), which predates scale-04. Blob prerequisites are all correct: 3 `primary` + 1 `secondary` roles, `id`+`data-surface` on all 7 wrappers. |
| TC-04.18 | Dashboard CTA breakdown | per-placement table | **PASS** | `/dashboard/analytics/qa-scale-parity` renders `CtaBreakdown` — "Button clicks by placement", columns Section/Primary/Secondary, row `Unknown section · 2 primary · 0 secondary`. Table is correct; the *data* is F9's stale-beacon garbage (`formatPlacement()` got no section anchor, and the secondary click was recorded as primary). |
| TC-04.19 | Legacy page parity | byte-identical | NOT RUN | |
| TC-04.20 | surge/lumen footer legal+social store a string | not derived-synced | N/A-DORMANT | known scope gap |

---

## 5. scale-05 — goal machinery

| # | Test case | Expected | Status | Notes |
|---|---|---|---|---|
| TC-05.1 | Intent-first GoalStep | 3–4 likely + "Other goals" (18 total) | PASS | all 18 present |
| TC-05.2 | AI-guessed intent pre-selected | | PASS | "Request a demo" pre-selected from the classify call |
| TC-05.3 | `likelyIntents` per businessType | saas → demo/free-trial/signup-free/waitlist | PASS | exactly those four |
| TC-05.4 | `GoalParamFields` per intent | request-demo → optional destination link | PASS | *"e.g. a Calendly / booking link. Leave blank to collect leads with an on-page form instead."* |
| TC-05.5 | Param-less goal auto-advances | | NOT RUN | |
| TC-05.18 | Goal step requires a selection | Continue gated until an intent is chosen | **FAIL → F20** | `9knkYn8_QZpE`: classifier returned no goal (playback degraded to *"gets visitors to take action"*), nothing pre-selected, `Continue` never `disabled`. Advanced with no choice; strategy request then carried `landingGoal:"enquiry"` = `manufacturer.likelyIntents[0]`, chosen silently by array order. |
| TC-05.19 | Offer step gates the field the strategy API requires | Continue gated until offer non-empty | **FAIL → F21** | Empty offer advanced. At 7/8: "Strategy generation failed"; `POST /api/audience/product/strategy` → **400** (`offer: z.string().min(1,'Offer required')`, `route.ts:49`). `Try again` re-posts the same body and can never succeed; `Continue` stays enabled beside the failure. Going Back + filling offer → same request returns **200**. |
| TC-05.6 | Param goal gated + "Skip for now" | Continue disabled until param valid | **FAIL → F14** | free-trial (M3) showed a required "Destination link"; Continue stayed **enabled** with it empty, no "Skip for now", and the wizard advanced. Brief persisted `{intent:'free-trial',mechanism:'M3'}` with no `param`. |
| TC-05.11b | free-trial `cta_subtext` | renders only if offer supports it | PASS (absent) | hero elements = `lede, cta_text, headline, status_text` — no `cta_subtext`; offer didn't state trial terms |
| TC-05.7 | book-call / M1 → form auto-seed | form in `content.forms`, `leadForm-<uuid>` after hero, CTA wired | **PARTIAL → F1** | **Data layer is perfect:** `form-1783644243938` with 4 fields (name/email/company/message), `successMessage`, `submitButtonText:"Request a demo"`; section `leadForm-8ca87d90` injected directly after hero; CTA `formId` + `#form-section` wired. **Render layer is broken:** the form draws no fields. |
| TC-05.8 | subscribe-newsletter → forced M1, no follow strip | | **CODE-ONLY — PASS, but the premise is wrong** | It is **not** forced to M1: `vocabulary.ts:96` → `mechanisms: ['M4']`, `bridge.ts:218` takes `mechanisms[0]`. The *behavior* the test asserts still holds via special-cases: `seedGoalForm.ts:80` (`|| intent==='subscribe-newsletter'`) seeds the form, and `injectGoalSections.ts:74` explicitly excludes it from the M4 follow-strip. Consequence: `fit.ts:65` never requires `lead-form` for it → it **serves** on granth. See the correction under F15. |
| TC-05.9 | follow-social → follow strip | | NOT RUN | needs a writer run (blocked by F15) |
| TC-05.10 | download-app → two store badges | | **FAIL → F16** | `Uutvg3qzIJHs`: app one-liner classifies perfectly (`download-app`), then the serve gate rejects it — `fit.ts:66` derives required `store-badges`, which **no template declares**. The badges exist as a template-agnostic shared block (`injectGoalSections.ts:86` → `SharedStoreBadges`), so the capability is satisfied by construction and rejected anyway. Rejection is asserted by `fit.test.ts:82` + `serveGate.test.ts:221`. |
| TC-05.11 | free-trial → external + `cta_subtext` | | NOT RUN | |
| TC-05.12 | WhatsApp prefill deterministic | | CODE-ONLY | pure fn, 50-call equality test green |
| TC-05.13 | WhatsApp message editable | | NOT RUN | no M2 goal in this run |
| TC-05.14 | Shared blocks resolve on all templates | | PARTIAL | `SharedLeadForm` resolved on meridian (section `layout: "SharedLeadForm"`) |
| TC-05.15 | Published `<form data-lessgo-form>` POSTs `/api/forms/submit` | | **PASS (live submit run)** | `qa-scale-vestria/contact` renders all **7** fields (4 `<input>`, 2 `<select>` industry/quantity, 1 `<textarea>`) + `data-lessgo-form`/`data-form-id`/`data-page-id`/`data-owner-id`/`data-success-message`. Live POST → `200 {"success":true,"submissionId":"cmretumxy…"}`; `FormSubmission` row written with all 7 fields. **But `form.v1.js` is absent on this page (F10)**, so I had to POST as the script would — a real visitor's form has no submit handler. Lead email failed silently → **F30**. |
| TC-05.16 | M2-primary intent from legacy enums | unreachable | N/A-DORMANT | |
| TC-05.17 | FollowStrip doesn't auto-sync | | N/A-DORMANT | documented |

---

## 6. scale-06 — wizard convergence

| # | Test case | Expected | Status | Notes |
|---|---|---|---|---|
| TC-06.1/06.2 | `/onboarding/{product,service}/[token]` → `/onboarding/[token]` | | NOT RUN | entry never routed through them |
| TC-06.3 | `/dev/seed-writer` → 404 | | NOT RUN | |
| TC-06.4 | Slot skeleton | identity·understanding·goal·offer·proof·style·structure·generating | PASS | progress read `1/8 … 8/8`, labels: Basics, Understanding, Goal, Offer, Proof, Style, Structure, Building |
| TC-06.5 | Bare one-liner THING → 6 questions | | PASS | 6 asked slots (Basics, Understanding, Goal, Offer, Proof, Structure); Style asked nothing |
| TC-06.6 | URL entry → ≤3 questions | | PASS | plausible.io: only the differentiator was genuinely asked; identity/understanding/offer all arrived pre-filled as confirm cards |
| TC-06.7 | Differentiator = guided chips + editable textarea | | PASS | tapping "Faster to set up" seeded the textarea; free text then overwrote it cleanly |
| TC-06.8 | Chip sets differ per engine | | PARTIAL | THING set observed: Faster to set up · More affordable · Easier to use · More reliable · Better support · The only one that… · Built for a specific niche · All-in-one |
| TC-06.9 | Review-mode on URL entry | confirm-per-slot cards | PASS | "WE PULLED THIS FROM YOUR SITE — CONFIRM OR EDIT" + 1-tap "Looks right" on identity, understanding, offer |
| TC-06.10 | Fill-mode on typed one-liner | editable inputs | PASS | plus AI pre-fill of name, one-liner, audiences, features, metrics |
| TC-06.11 | Proof toggle OFF → section dropped | | **PASS on strategy path / FAIL on add-page path → F22** | manufacturer run (`nmzl0brZggz5`) with testimonials OFF → zero testimonial sections on 3 pages. **But** `9knkYn8_QZpE` (toggle OFF, `proofAvailable: []`, `facts.testimonials: null`) generated a `VestriaQuotes` section with **two fabricated attributed quotes** on `/industries` — the page I added at the gate. Cause: the proof filter lives only in `parseStrategyProduct.ts:43`; the add-page chip seeds `pageArchetypes.ts:78 defaultSections: ['industries','testimonials']` verbatim. `about` archetype has the same defaults. The earlier PASS held only because that run never added such a page. |
| TC-06.12 | Product gets a proof step | | PASS | "What do you have to work with?" — testimonials toggle (default OFF) + optional metrics chips |
| TC-06.13 | Writer self-serves, ≥3 uploads enforced | granth page | **FAIL → F15** | writer never reaches the wizard: gate rejects `rungC:lead-form` (granth declares no capabilities). Upload gate unreachable. |
| TC-06.14 | Reload mid-wizard re-hydrates | | **PASS** | `I-fwXvbaMwzP`: hard-reloaded at slot 1/8 after confirm; name ("Brightforge") and one-liner both rehydrated from the persisted Brief. |
| TC-06.15 | Success → `/edit/[token]` | | PASS | not `/generate/[token]` |
| TC-06.16 | Trust testimonials unattributed | | N/A-DORMANT | known gap |

**Conditional-field bonus:** toggling testimonials ON revealed a required "What kind of testimonials?" follow-up (Text quotes / With client photos / Video / Transformation stories). Good — but see **F2**: it never asks for the quotes themselves.

---

## 7. scale-07 — structure convergence (7b gate · swap)

| # | Test case | Expected | Status | Notes |
|---|---|---|---|---|
| TC-07.1 | 7b runs for single-page too | | PASS | "Your page plan — We suggest these sections. Turn off anything you don't need — nothing is written until you approve the shape." |
| TC-07.2 | Required rows locked; hero pinned first | | PASS (partial) | Hero: REQUIRED, **no** move buttons, remove disabled. Features: REQUIRED, move-up disabled, remove disabled. **But CTA is optional and removable → F7** |
| TC-07.3 | Optionals toggle-OFF only, no add | | PASS | no add affordance |
| TC-07.4 | Reorder up/down | | PASS | moved Testimonials below CTA; hero immovable |
| TC-07.5 | Default-accept, 1 tap | | PASS | |
| TC-07.6 | Toggle OFF → zero copy generated | | NOT RUN | see TC-06.11 |
| TC-07.7 | Same Brief ⇒ same sections on meridian & vestria | | NOT RUN | needs a vestria run |
| TC-07.8 | Multipage sitemap mode | editable pages + sections; slugs never AI | PASS | "Your site plan": `/`, `/about`, `/services`, `/contact` + "Add a page: Industries, Catalogue". Home has no Remove button (clamp law). Add-section chips per page (single-page mode correctly has none). |
| TC-07.9 | Gate edits land **pre-copy** | deleted/reordered ⇒ generation follows | PASS | reorder survived into generation (`header, hero, leadform, features, cta, testimonials, footer`); deleting `/services` → "Writing the copy — **page 1 of 3**", `brief.structure.pages = [home, about, contact]` |
| TC-07.10 | Template swap in editor (meridian unlocked) | `TemplateSwapList` in theme popover | **FAIL → F4** | Style popover contains only *Typeface* (Developer/Marketing/Light) + *Palette* swatches. No template list; the string "template" appears nowhere in the DOM. |
| TC-07.11–07.14 | Swap shortlist = hard-fit; zero words change; retired/bespoke/cross-engine excluded | | NOT RUN | blocked by F4 |
| TC-07.15 | Reload between structure & generating re-charges | | NOT RUN | known deferred |
| TC-07.16 | Multi-page resume drops titles | | N/A | single-page |

---

## 8. scale-08 — businessType config system

Cleanest area after scale-02.

| # | Test case | Expected | Status | Notes |
|---|---|---|---|---|
| TC-08.1 | `/admin` Business Types table | 8 rows | PASS | saas, manufacturer, agency, consultant, coach, writer, photographer, app |
| TC-08.2 | Serveability pills | photographer red "missing: gallery"; other 7 emerald | PASS | exactly |
| TC-08.3 | Columns | Key·Label·Engine·Required caps·Structure·Voice hint·Serveability | PASS | voiceHint "—" for trust/work entries |
| TC-08.4 | Manufacturer voice via config | `tailored-trade`, no templateId fork | CODE-ONLY | `pipelineGuards.test.ts` green |
| TC-08.5 | Manufacturer `structureDefault: multi` | | PASS | shown in the table |
| TC-08.6 | Deleted routes 404 | generate-landing / market-insights / validate-fields | PARTIAL | 404 confirmed, though Clerk 404s unauth routes generally, so this isn't conclusive on its own |
| TC-08.7 | Grep gate | zero `isManufacturerFlow` | CODE-ONLY | green |
| TC-08.8 | `businessType` on v2 extraction routes | inert on first scrape | N/A-DORMANT | |

---

## 9. scale-09 — block variants

| # | Test case | Expected | Status | Notes |
|---|---|---|---|---|
| TC-09.1 | Multi-variant section shows "Layout" | | PASS | section toolbar: `Features-d125fd72 100% │ Layout │ + Elements │ Move Up │ Move Down │ Duplicate │ Delete` |
| TC-09.2 | Single-variant sections show no Layout | | PASS | `Cta-eeb28d40` (ArcCTA) toolbar = `100% │ + Elements │ Move Up │ Move Down │ Duplicate │ Delete` — no Layout |
| TC-09.3 | Vestria hero swap | | **PASS** | `nmzl0brZggz5`: Tailored → Full-bleed video hero **re-renders** (badge `VestriaFullBleedHero`, dark full-bleed, stat row), copy identical. Works because it's `internalDispatch` — this is the control that proved F3's real cause. |
| TC-09.4 | Undo after swap | | **FAIL → F17** | Vestria: after Undo the modal still shows "Full-bleed video hero" as **Current**, DB still `VestriaFullBleedHero`. Redo arms, so the stack thinks it undid. |
| TC-09.5 | Surge testimonials clamp warning | | **PASS** | `bibO4F6MfOI8`: "This style shows fewer cards — We'll keep the first 1 card and drop 1 at the end. Undo restores the removed card." + Cancel / "Switch & keep first 1" |
| TC-09.6 | One undo restores layout + cards | | **FAIL → F17** | Restores neither. `reviews` stays at 1 card (2nd testimonial destroyed), `layout` stays `PullQuoteWithMark`. The modal's undo promise is false. |
| TC-09.7 | meridian hero "Editorial photo hero" gated by `hero_image` | | **PASS** (+ F18) | Modal offers only "Terminal hero" — `requiresAssets:['photos']` correctly excludes the photo hero. But the Layout button still renders → dead one-card modal (**F18**). |
| TC-09.8 | meridian features → "Ledger list" | full-width hairline rows | **FAIL → F3** | Modal correct. Badge → `LedgerFeatureList`; **DB is correct in all three places**; DOM still `.mrd-features-grid`. Cause: `meridian/index.ts:47` `resolveBlock(blockType, mode)` drops the `layoutName` arg the registry passes. |
| TC-09.9 | meridian testimonials → "Centered editorial" | | **FAIL → F3** | Same one-line cause; DOM stays `mrd-testi-*` |
| TC-09.10 | Surge testimonials deterministic | | CODE-ONLY | `Math.random()` removed |
| TC-09.11 | Legacy project → old selector | | NOT RUN | |
| TC-09.12 | Publish parity per variant | | **PASS for `internalDispatch` / N/A → F3 for registry dispatch** | Swapped `9knkYn8_QZpE` hero `VestriaTailoredHero → VestriaFullBleedHero`, republished. Published HTML changed `vs-hero__{h1,copy,cta,frame,grid,lede,media}` → `vs-heroFull__{h1,bg,cta,lede,media,veil,inner}`. **The variant ships**, because vestria's hero is one dispatcher reading `content[id].layout`. Registry-dispatch variants (meridian features/testimonials) still never ship — both renderers drop `layoutName` (**F3**), so editor and published agree on the *default*. |
| TC-09.13 | lex/lumen/granth/techpremium → no Layout | | **PASS** | lex (`0dG4f5wmo93H`) hero toolbar = `Elements │ Move Up │ Move Down │ Duplicate │ Delete` — no Layout. `blockManifests` (`blockManifest.ts:350`) is `Partial<Record<TemplateId,…>>` containing only meridian/hearth/surge/vestria, so lumen/granth/techpremium follow by construction. |
| TC-09.14 | Capacity clamps but doesn't filter picker | | N/A-DORMANT | by design |
| TC-09.15 | Variants of one section are copy-compatible (D18) | swap is lossless | **FAIL → F17** | surge `ReviewGrid` consumes `headline`+`reviews[]`; `PullQuoteWithMark` consumes top-level `quote`/`author_name`. Swap renders an empty quote card. Conformance test checks `consumes ⊆ contract` per block, never variant-vs-variant. |

---

## 10. scale-10 — collections convergence

First pass called this "almost entirely dormant by design". **That was too generous.** The
registry-gated parts (`requiredCollections`, the template collection bridge) *are* intentionally
dormant. But `facts.collections` — the input to all of it — can never be populated on any real entry
(**F19**), so the structure-gate node, its rename/remove/add controls and the editor panel are
unreachable through the product, not merely unexercised.

| # | Test case | Expected | Status | Notes |
|---|---|---|---|---|
| TC-04.22 | Republish preserves analytics setting | | **FAIL → F29** | Published with analytics **on**; reopened Publish to ship a variant change; checkbox rendered **unchecked**; clicking "Update Published Page" set `analyticsEnabled: true → false` and stripped `a.v1.js` from the HTML. Reproduced twice. |
| TC-10.1 | Structure-gate collection node | `Label · N item(s)` | **FAIL → F19** | `9knkYn8_QZpE`: URL entry for `pine64.org` — a pure product-catalogue site, classified manufacturer/thing @0.9. `brief.facts` = `{entry}` only; `facts.collections === null`. Gate drew 4 pages incl. `/catalogue` + "Catalogue grid" section, and **zero** collection nodes (`item(s)` → 0 matches, no `+ Add`). Cause: `scrape-website/route.ts:169` `extraction = businessType ? … : null`, and `EntryInputStep.tsx:96` never sends `businessType` — it's the call's *output*. `enrichSignals` never runs. |
| TC-10.2 | Rename → slug re-derives, focus kept | | **PASS** (+ **F28**) | Forced fixture, token `I-fwXvbaMwzP`. Renamed to `Turbine Blades  &  Discs!!`: input keeps focus and caret (`document.activeElement === input`, `selectionStart` preserved). Slug re-derived in code, never AI — but as `turbine-blades--discs` (orphan hyphen) → **F28**. |
| TC-10.3 | Remove / "+ Add" | | **PASS** | "Add product name" input + `Add` button appends (3 → 4 items, header count updates); per-row `button[title="Remove item"]` removes (4 → 3). |
| TC-10.4 | Empty/required collection empty-state | | **PASS** | Removing all items → `Products · 0 items` + *"No products yet — add them here or later in the editor."* |
| TC-10.5 | WORK engine skips structure slot | | **BLOCKED** | work engine unreachable (F15) |
| TC-10.6 | Editor Products panel unchanged | | **PASS** | With a real `products` collection on the Brief, `/edit/I-fwXvbaMwzP` shows no "Manage Products" surface — the string `products` appears nowhere in the DOM. Registry-gated, as designed. |
| TC-10.7 | Empty-collection add post-reveal | | **N/A-DORMANT** | no editor collection surface exists to add into (see TC-10.6/10.10) |
| TC-10.8b | Collections → pages bridge stays dormant | 0 collection pages generated | **PASS** | With a 2-item `products` collection the fan-out still reported *"Writing the copy — page 1 of **4**"* (the 4 sitemap pages). No per-item pages. Registry-gated, as designed. |

**Method note.** TC-10.2–10.4 and 10.8b were exercised by injecting
`brief.facts.collections = { products: [...] }` directly into the persisted Brief of a served
manufacturer/thing project, then reloading the wizard — because **F19** makes the production path
incapable of ever producing that data. The `CollectionNode` component itself is sound; only its input
is dead. That distinction is the whole point of F19.
| TC-10.8 | Generation→collections bridge | zero pages generated | N/A-DORMANT | registry-gated; confirmed unreachable |
| TC-10.9 | Serve gate `requiredCollections` | unreachable | N/A-DORMANT | no businessType populates it |
| TC-10.10 | PageSwitcher "Manage {label}" | renders nothing | **N/A-DORMANT (confirmed empirically)** | verified against a project that actually carries `facts.collections.products`, not merely one that lacks it |
| TC-10.11 | Collection-capability conformance | vacuous today | CODE-ONLY | bites at rung-C |

---

## Cross-cutting

| # | Test case | Expected | Status | Notes |
|---|---|---|---|---|
| TC-X.1 | Editor ↔ published parity | identical | **FAIL → F1** | Published blob renders the full 4-field lead form; the editor renders an empty one. Section order, surfaces and CTA roles otherwise match exactly. |
| TC-X.2 | Console clean | no uncaught errors | PARTIAL | 3× `InvalidStateError: Failed to execute 'postMessage' on 'BroadcastChannel': Channel is closed` from `src/utils/tabManager.ts:94` on unload. Pre-existing, unrelated to scale-01..10, but it reaches Sentry. |
| TC-X.3 | No 4xx/5xx on happy path | | PASS | generation completed clean |
| TC-X.4 | Deterministic second run | | NOT RUN | |

---

## Findings

### F1 · P0 — Auto-seeded lead form renders no fields (scale-05)
The seed is correct. `content.forms["form-1783644243938"]` holds 4 fields, a success message and submit label `"Request a demo"`; the `leadForm-8ca87d90` section carries `elements.form_id` pointing at it. The editor renders:
```html
<form class="lg-lead__form"><div class="lg-lead__foot"><span class="lg-lead__btn">Submit</span></div></form>
```
No inputs, and the fallback label "Submit" instead of "Request a demo" — the tell that the form lookup returned `undefined`.

**Root cause.** `src/modules/generatedLanding/sharedBlocks/LeadForm/LeadForm.tsx:26` reads
`store.content?.forms?.[formId]`, but the edit store keeps forms at **`state.forms`** (top-level `FormsSlice`, `src/types/store/state.ts:445`; written by `formActions.ts` as `state.forms[id]`). `store.content` is the section map only. So `fields` is always `[]`.
`src/modules/templates/vestria/blocks/Contact/VestriaLeadForm.tsx:24` has the identical bug.
The **published** twins (`LeadForm.published.tsx:33`, `VestriaLeadForm.published.tsx:24`) read `props.content?.forms?.[formId]`, which is correct because the persisted content object does carry `forms` — so this is a dual-renderer divergence in the direction the codebase doesn't usually guard against (editor wrong, published right).

**Impact.** Every M1-goal page — the majority intent family (13 of the first-20 sites) — shows the user an empty, obviously-broken form immediately after the reveal. This is the first thing a self-serve customer sees.

### F2 · P0 — Testimonials are AI-generated, with invented people
The proof step asks *whether* you have testimonials and *what kind*, but never collects the quotes. I toggled "Customer testimonials" ON, chose "Text quotes", supplied nothing — and the generated page contains:

> "Vaulta has drastically reduced our reconciliation time and improved accuracy. It's a must-have tool for any finance team." — **Jessica T., Finance Manager**
> "The integration with our existing accounting software was smooth. Vaulta just fits into our workflow." — **Marcus L., Controller**

Neither person nor quote exists. scalePlan §8 states the hard rule: *"proof is scraped verbatim or user-given, NEVER generated; missing proof drops the section."* Either the proof step must collect the quotes (T1 words, per §8's own timing tiers), or the boolean must gate a section of empty placeholders. Shipping fabricated attributed testimonials to customers is a legal and trust exposure, not just a spec violation.

### F3 · P0 — Registry-level variant dispatch is dead on every template (scale-09)

> **Corrected in the second pass.** The claim below that "the two stores disagree" was **wrong** — it
> raced the debounced autosave. A re-probe shows `content[id].layout`, `sectionLayouts[id]` and
> `pages[home].sectionLayouts[id]` all agree on the swapped variant, and the DOM *still* renders the
> default. Full write-up in `reports/scale-1-10-findings.md` → F3.

Both meridian variants behave identically: the modal is right, the "Current" badge is right, the
block-name badge updates, undo arms — and the rendered component never changes, even after a hard reload.

`src/types/template.ts:36` declares the contract with three parameters:
```ts
resolveBlock(blockType: string, mode: 'edit' | 'published', layoutName?: string)
```
`componentRegistry.ts:71` and `componentRegistry.published.ts:53` both forward the stored layout name.
But all eight template barrels implement only two:
```ts
// meridian/index.ts:47 — same in vestria, hearth, lex, surge, granth, lumen, techpremium
export function resolveBlock(blockType: string, mode: 'edit' | 'published') {
  return resolveMeridianBlock(blockType, mode);   // ← layoutName dropped
}
```
The inner resolver then falls back to `variants[section.default]`, forever.

`tsc` stays green because a 2-arg function is assignable to a 3-arg function type. The 1757 unit tests
stay green because every variant test calls the inner resolver directly (`dispatch.test.ts:77`,
`renderParity.meridian.test.tsx:103`), never the exported barrel the renderers use.

Only `internalDispatch: true` variants work (vestria hero, surge testimonials) — they are one component
that re-reads `content[id].layout` itself. That asymmetry, verified live in both directions, is the proof.

### F4 · P1 — No template choice anywhere in the funnel
- Wizard **Style** slot (6/8) says only: *"We'll use a clean default theme. You can fine-tune fonts, colours and layout in the editor once your page is generated."* No shortlist, no picker.
- Editor **Style** popover offers Typeface + Palette only; no `TemplateSwapList`, and "template"/"vestria" appear nowhere in the DOM.

scalePlan §3 step 6 specifies *hard filter → style-sorted shortlist → auto iff 1, else user picks*, and D6/D11 make "user always picks" load-bearing. For this saas Brief, `fit()` yields `[meridian, vestria]` — two candidates — so a picker was owed. It's possible the swap list is correctly suppressed because this page's `leadForm`/`cta` sections make the hard-fit shortlist collapse to 1; if so, that's defensible for the *editor* swap but not for the *wizard*, which never had those sections yet. Either way, the user never gets a template choice, and TC-07.11/07.12/07.13/07.14 are unverifiable.

### F5 · P2 — Nav ships anchors to sections that don't exist
Header nav renders `#features`, `#pricing`, `#about`, `#support`. This page has no pricing, about or support section, so three of four nav links scroll nowhere. Single-page nav isn't sitemap-seeded (correct per scale-04), but the template default fills the gap with dead anchors.

### F6 · P2 — Primary CTA is stored as a resolved destination, not `GOAL_REF`
```json
"cta": { "dest": {"kind":"section","anchor":"form-section"}, "role":"primary", "formId":"form-…" }
```
scale-04's whole premise (D12, §5) is that the primary CTA points at the goal **by reference** — `dest: 'GOAL_REF'` — so that changing the goal re-points every primary button. What's persisted is a copy of today's resolution, which is precisely the "copied config" pattern §5 blames for goal being a dead wire. The hero's CTA carries no `cta` metadata at all. I could not verify re-pointing behavior; it may still work via `normalizeCtas` at render, but the stored shape doesn't match the spec.

### F7 · P2 — "Call to action" is removable at the 7b gate
Spec §7b: *"Required sections locked (hero first, **CTA present**)."* Observed: Hero and Features carry `REQUIRED` + disabled remove; **Cta** has an enabled "Turn off section" button. A user can approve a page plan with no CTA section. (Mitigating: with an M1 goal the injected `leadForm` still carries the conversion.)

---

## Not run

Closed in the second pass: TC-04.18, TC-09.2, TC-09.3, TC-09.5, TC-09.7, TC-05.10, TC-06.8, TC-03.3
(and TC-09.4 / TC-09.6 now FAIL → F17).

Still open:

- **TC-10.1–10.7 scale-10 collection node.** Not reachable from a one-liner — `facts.collections` is
  only populated by the scrape/classify enrichment (`classify.ts:159` → `buildBriefDraft():229`), and
  both one-liner runs yielded `collections: null`. Needs a **URL** entry for a site with a real
  products/services listing. Use a *thing*-engine product site: a trust URL with a multi-page source is
  killed by F13 before the wizard. Node = `CollectionNode`, `StructureSlot.tsx:94–236`; forced shape is
  `brief.facts.collections = { products: [{ name }] }`.
- **TC-03.2 images-at-birth on vestria** — needs a run that adds the "Industries" page at the 7b gate;
  `VestriaIndustriesGrid` is the only `stockable: true` slot (`imageSlots.ts:36`).
- **TC-09.12 per-variant publish parity** — now **N/A pending F3**: both renderers drop `layoutName`,
  so editor and published agree on the default block. Re-run after the fix.
- **TC-09.13** lex/lumen/granth/techpremium show no Layout; **TC-09.11** legacy project → old selector.
- **TC-06.13 / TC-05.9 writer + granth** — blocked by F15, not merely unrun.
- **TC-04.2** goal-change → GOAL_REF re-point — no reachable post-generation goal editor.
- **TC-02.24** founder lead email, and live form submit → `FormSubmission` — skipped deliberately, both
  would send a real email.
- **TC-X.1 full dual-renderer parity sweep** — F1 is already a confirmed parity break; a systematic
  sweep is still owed.

---

## Run log / artifacts

All test projects are in the dev DB and safe to delete.

| Token | Input | Verdict | Result |
|---|---|---|---|
| `qgWwABkSRXLm` | wedding/portrait photography studio (one-liner) | MANUAL | `rungC:gallery`, fast-tracked. Correct by design. |
| `o7lMBLf409kA` | neighbourhood dosa restaurant (one-liner) | MANUAL | via "Something else" → `rungA:unclassified`, engine `place`. Correct. |
| `I9HwKOYo9jsm` | Vaulta — Stripe reconciliation SaaS (one-liner) | SERVE | meridian, single-page, `request-demo` M1. Published to `qa-scale-parity`. Surfaced F1, F2, F3, F5, F6, F7, F8, F9. |
| `nmzl0brZggz5` | Shakti Precision Works — CNC manufacturer (one-liner) | SERVE | vestria, **multipage**, `request-quote` M1. Deleted `/services` at the gate → 3 pages generated. Confirmed TC-06.11, 07.8, 07.9. |
| `crzZbjstC2aH` | `https://www.wingrrowth.com` (URL) | **MANUAL** | `rungC:multipage` — the pilot customer, rejected. **F13.** |
| `QhF4YMiht53s` | `https://plausible.io` (URL) | SERVE | vestria, review mode, `free-trial` M3 with no destination. Surfaced F14; strengthened F2 and F4. |
| `iP83TfbUj-Kb` | Dinesh Kumar — Hindi writer (one-liner) | **MANUAL** | `rungC:lead-form` — granth declares no capabilities. **F15.** |
| `bibO4F6MfOI8` | Northbeam Studio — perf-marketing agency (one-liner) | SERVE | **surge** (auto via `bold-performance`), variant `performance`, palette `volt`, `book-call` M1. Confirmed TC-09.5, TC-06.8; surfaced **F17**; F2 on trust; CTA is REQUIRED here (scopes F8). |
| `Uutvg3qzIJHs` | Zenmind — meditation app (one-liner) | **MANUAL** | `rungC:store-badges` — nobody declares it. **F16.** |
| `9knkYn8_QZpE` | `https://www.pine64.org` (URL) | SERVE | vestria, manufacturer/thing/**multi**, 5 pages (`/`, `/about`, `/catalogue`, `/contact`, `/industries` added at gate). Confirmed TC-03.2, TC-07.8 add-page. Surfaced **F19, F20, F21**. |

Published page: `qa-scale-parity` (analytics enabled; 2 CTA clicks recorded).
Demand leads: `qa-photographer@` (fast-track), `qa-somethingelse@`, `qa-wingrrowth@`, `qa-writer@` — all `@lessgo.test`.

**Environment note:** one wizard render came up completely unstyled (no stylesheet link; Tailwind classes intact). It did **not** reproduce after `rm -rf .next/cache` + a clean dev restart — a Next dev CSS-chunk artifact, not a product bug. Recorded so nobody chases it.
