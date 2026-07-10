# scale-01 → scale-10 — test case matrix & results

**Run date:** 2026-07-10 · **Branch:** `main` @ `010b711c` · **Target:** `http://localhost:3000` (fresh `npm run dev`)
**Mode:** real LLM (`USE_OPENAI=true`, `AI_MODEL_TIER=cheap`, `NEXT_PUBLIC_USE_MOCK_GPT=false`), `DEV_BYPASS_CREDITS=true`, `NEXT_PUBLIC_IMAGES_AT_BIRTH=true`
**Method:** Claude-in-Chrome browser drive, authenticated as the owner account; DB assertions via Prisma; code-level layer via `npm run test:run`.

**Legend —** PASS · FAIL · PARTIAL · NOT RUN · N/A-DORMANT (shipped intentionally inert) · CODE-ONLY (no browser surface)

---

## Headline

The **entry funnel, serve gate, demand board, businessType config, wizard convergence and 7b structure gate all work as specced** — several of them verbatim to the letter of the spec copy. Generation runs end-to-end from a bare one-liner to `/edit/[token]` with no founder touch.

Four defects matter, two of them serious:

| # | Severity | Defect |
|---|---|---|
| **F1** | **P0** | The auto-seeded lead form renders **zero input fields** in the editor/preview. The seed is correct in the DB; the edit renderer reads it from the wrong place. The conversion path — the whole point of scale-05 — looks broken to the user. |
| **F2** | **P0** | **Testimonials were fabricated by the AI**, with invented names and job titles, though I never supplied a single quote. Violates the "proof is scraped verbatim or user-given, NEVER generated" law (scalePlan §8). |
| **F3** | **P1** | **Block-variant swap (scale-09) is a no-op.** Picking a different layout updates the badge and the undo stack but never re-renders — before or after reload. Two sources of truth disagree. |
| **F4** | **P1** | **No template-swap UI** appears on a meridian project, and the wizard's "style" slot shows no template shortlist at all — contrary to scalePlan §3 step 6 ("user picks; auto iff 1"). |

Plus three smaller ones (F5–F7) below.

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
| TC-02.2 | Unknown token | → `/dashboard` | NOT RUN | |
| TC-02.3 | Entry = ONE input | no persona picker | PASS | "What are you building a page for?" + 1 textarea + 3 example chips |
| TC-02.4 | Sentence → `/api/v2/understand` `entry:true` | classify + loader | PASS | 3/3 sentences classified (saas, photographer, restaurant) |
| TC-02.5 | URL → `/api/v2/scrape-website` | prefill | NOT RUN | needs a live site; sentence path covered |
| TC-02.6 | Playback sentence | "A page for your {cat} that gets visitors to {goal}." | PASS | e.g. *"A page for your Financial software that gets visitors to request a demo."* |
| TC-02.7 | Confirm copy | "Looks right — continue" | PASS | exact |
| TC-02.8 | "Not quite right?" chooser | type cards + "Something else" | PASS | **8** cards (spec said 6 — scale-08 added photographer + app), + "Something else" |
| TC-02.9 | Low confidence → chooser upfront | | NOT RUN | all 3 inputs were high-confidence |
| TC-02.10 | SERVE → wizard | routes into wizard | PASS | saas → `/onboarding/{token}` wizard, prefilled |
| TC-02.11 | Gate is server-authoritative | client can't force serve | NOT RUN | needs a tampered POST; `decideServe` re-run server-side per audit |
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
| TC-03.2 | Flag ON + vestria | `VestriaIndustriesGrid` gets palette-scored images | NOT RUN | needs a manufacturer/multipage run |
| TC-03.3 | Promised-asset slots | labeled placeholder | NOT RUN | |
| TC-03.4 | hearth/lex/surge/granth | no images at birth | N/A-DORMANT | not wired (pilot = meridian+vestria) |
| TC-03.5 | posthog `images_at_birth` | emitted | NOT RUN | |
| TC-03.6 | `pickBestImage` / `buildSearchQuery` | deterministic | CODE-ONLY | vitest green |

---

## 4. scale-04 — click system (Destination · GOAL_REF · beacon)

| # | Test case | Expected | Status | Notes |
|---|---|---|---|---|
| TC-04.1 | Primary CTA defaults to GOAL_REF | modal shows "Follows your project goal" | **FAIL (see F6)** | Persisted CTA is a **resolved** destination, not `GOAL_REF`: `cta: {dest:{kind:'section',anchor:'form-section'}, role:'primary', formId:…}`. Hero CTA has **no `cta` metadata at all**. |
| TC-04.2 | Change goal → primaries re-point | href changes, copy unchanged | NOT RUN | blocked by F6 + no reachable goal editor post-gen |
| TC-04.3 | Detach from GOAL_REF | explicit dest + re-attach | NOT RUN | could not find the entry point to open `ButtonConfigurationModal` from a hero CTA (double-click → text toolbar; right-click → nothing) |
| TC-04.4 | Secondary CTA never follows goal | | NOT RUN | same |
| TC-04.5–04.9 | Destination kinds resolve (section/page/external/whatsapp/call/email/social/download) | | NOT RUN | requires published render |
| TC-04.10 | ONE shared `LinkTargetPopover` | same popover everywhere | PARTIAL | "Set link target" / "Remove link" controls present on every nav + footer link; popover not opened |
| TC-04.11 | Derived links don't move on goal change | | NOT RUN | |
| TC-04.12 | Nav auto-seed on multipage | one link per page | NOT RUN | single-page project |
| TC-04.13 | Seed not re-applied after edit | | NOT RUN | |
| TC-04.14 | Single-page nav NOT seeded | | PASS (with caveat) | nav is not sitemap-derived — but see **F5**: it ships template-default anchors `#pricing`, `#about`, `#support` that point at sections this page doesn't have |
| TC-04.15 | Social panel in `GlobalAppHeader` | opens, add profile | PASS | "Social" button → "Social Media Links" modal → platform select + URL + Add |
| TC-04.16 | Social profiles round-trip | → `Project.brief.socialProfiles` | PARTIAL | `brief.socialProfiles = []` (empty; nothing added/saved in this run) |
| TC-04.17 | Beacon attribution `{role, placement}` | on published CTA click | **NOT RUN — needs publish permission** | no `data-lessgo-cta-role` present in editor/preview (expected: it's published-only) |
| TC-04.18 | Dashboard CTA breakdown | per-placement table | NOT RUN | needs published clicks |
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
| TC-05.6 | Param goal gated + "Skip for now" | | NOT RUN | link was optional here |
| TC-05.7 | book-call / M1 → form auto-seed | form in `content.forms`, `leadForm-<uuid>` after hero, CTA wired | **PARTIAL → F1** | **Data layer is perfect:** `form-1783644243938` with 4 fields (name/email/company/message), `successMessage`, `submitButtonText:"Request a demo"`; section `leadForm-8ca87d90` injected directly after hero; CTA `formId` + `#form-section` wired. **Render layer is broken:** the form draws no fields. |
| TC-05.8 | subscribe-newsletter → forced M1, no follow strip | | NOT RUN | |
| TC-05.9 | follow-social → follow strip | | NOT RUN | needs a writer run |
| TC-05.10 | download-app → two store badges | | NOT RUN | needs an `app` businessType run |
| TC-05.11 | free-trial → external + `cta_subtext` | | NOT RUN | |
| TC-05.12 | WhatsApp prefill deterministic | | CODE-ONLY | pure fn, 50-call equality test green |
| TC-05.13 | WhatsApp message editable | | NOT RUN | no M2 goal in this run |
| TC-05.14 | Shared blocks resolve on all templates | | PARTIAL | `SharedLeadForm` resolved on meridian (section `layout: "SharedLeadForm"`) |
| TC-05.15 | Published `<form data-lessgo-form>` POSTs `/api/forms/submit` | | **NOT RUN — needs publish permission** | |
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
| TC-06.6 | URL entry → ≤3 questions | | NOT RUN | |
| TC-06.7 | Differentiator = guided chips + editable textarea | | PASS | tapping "Faster to set up" seeded the textarea; free text then overwrote it cleanly |
| TC-06.8 | Chip sets differ per engine | | PARTIAL | THING set observed: Faster to set up · More affordable · Easier to use · More reliable · Better support · The only one that… · Built for a specific niche · All-in-one |
| TC-06.9 | Review-mode on URL entry | | NOT RUN | |
| TC-06.10 | Fill-mode on typed one-liner | editable inputs | PASS | plus AI pre-fill of name, one-liner, audiences, features, metrics |
| TC-06.11 | Proof toggle OFF → section dropped | | NOT RUN | I toggled testimonials **ON** (to exercise scale-09); the drop rule is covered by vitest |
| TC-06.12 | Product gets a proof step | | PASS | "What do you have to work with?" — testimonials toggle (default OFF) + optional metrics chips |
| TC-06.13 | Writer self-serves, ≥3 uploads enforced | | NOT RUN | needs image uploads |
| TC-06.14 | Reload mid-wizard re-hydrates | | NOT RUN | |
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
| TC-07.8 | Multipage sitemap mode | | NOT RUN | needs manufacturer |
| TC-07.9 | Gate edits land **pre-copy** | deleted/reordered ⇒ generation follows | PASS | my reorder survived into generation: rendered order `header, hero, leadform, features, cta, testimonials, footer` |
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
| TC-09.2 | Single-variant sections show no Layout | | NOT RUN | |
| TC-09.3 | Vestria hero swap | | NOT RUN | needs vestria |
| TC-09.4 | Undo after swap | | PARTIAL | Undo button *enabled* after swap; nothing visual to undo (F3) |
| TC-09.5 | Surge testimonials clamp warning | | NOT RUN | needs surge |
| TC-09.6 | One undo restores layout + cards | | NOT RUN | |
| TC-09.7 | meridian hero "Editorial photo hero" gated by `hero_image` | | NOT RUN | |
| TC-09.8 | meridian features → "Ledger list" | full-width hairline rows | **FAIL → F3** | Modal correct ("Change features style", 2 cards, "Current" badge). After picking Ledger list: badge → `LedgerFeatureList`, but DOM stays `.mrd-features-grid` (Hairline). Survives reload. |
| TC-09.9 | meridian testimonials → "Centered editorial" | | **FAIL → F3** | Same: modal correct, DOM stays `mrd-testi-*` (ProofWithLogoRail) instead of `mrd-te-*` |
| TC-09.10 | Surge testimonials deterministic | | CODE-ONLY | `Math.random()` removed |
| TC-09.11 | Legacy project → old selector | | NOT RUN | |
| TC-09.12 | Publish parity per variant | | **NOT RUN — needs publish permission** | |
| TC-09.13 | lex/lumen/granth/techpremium → no Layout | | NOT RUN | |
| TC-09.14 | Capacity clamps but doesn't filter picker | | N/A-DORMANT | by design |

---

## 10. scale-10 — collections convergence

Almost entirely dormant by design (no template declares a collection-family capability), so there is very little to see in a browser.

| # | Test case | Expected | Status | Notes |
|---|---|---|---|---|
| TC-10.1 | Structure-gate collection node | `Label · N item(s)` | NOT RUN | requires a Brief carrying `facts.collections`; a saas one-liner produces none |
| TC-10.2 | Rename → slug re-derives, focus kept | | NOT RUN | |
| TC-10.3 | Remove / "+ Add" | | NOT RUN | |
| TC-10.4 | Empty/required collection empty-state | | NOT RUN | |
| TC-10.5 | WORK engine skips structure slot | | NOT RUN | |
| TC-10.6 | Editor Products panel unchanged | | NOT RUN | no products collection on this project |
| TC-10.7 | Empty-collection add post-reveal | | NOT RUN | |
| TC-10.8 | Generation→collections bridge | zero pages generated | N/A-DORMANT | registry-gated; confirmed unreachable |
| TC-10.9 | Serve gate `requiredCollections` | unreachable | N/A-DORMANT | no businessType populates it |
| TC-10.10 | PageSwitcher "Manage {label}" | renders nothing | N/A-DORMANT | |
| TC-10.11 | Collection-capability conformance | vacuous today | CODE-ONLY | bites at rung-C |

---

## Cross-cutting

| # | Test case | Expected | Status | Notes |
|---|---|---|---|---|
| TC-X.1 | Editor ↔ published parity | identical | **NOT RUN — needs publish permission** | F1 is itself a parity break (edit renderer wrong, published twin right) |
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

### F3 · P1 — Block-variant swap never re-renders (scale-09)
Both meridian variants tested behave identically: the modal is right, the "Current" badge is right, the block-name badge updates, undo arms — and the rendered component never changes, even after a hard reload.

The two stores disagree in the DB:
```
content["features-d125fd72"].layout          = "LedgerFeatureList"   ← swap wrote here
layout.sectionLayouts["features-d125fd72"]   = "HairlineFeatureGrid" ← renderer reads here
```
`LandingPageRenderer.tsx:246` resolves `sectionLayouts[sectionId] || sectionData?.layout` — `sectionLayouts` wins, so the stale value always shadows the new one. `updateSectionLayout` (`layoutActions.ts:280`) *does* set `state.sectionLayouts`, so the loss happens between the store and what gets persisted/re-read — most likely the page-slice copy (`pages[HOME].sectionLayouts`, `persistenceActions.ts:253/513`) introduced by multipage, which the swap doesn't touch. Worth confirming before fixing.

Note the scale-09 audit claims manual QA of these swaps passed, so this looks like a **regression introduced after** that audit — scale-10 phase 6 generalized the editor panel and is the prime suspect.

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

## Not run — needs your go-ahead

Publishing writes to Vercel Blob + KV and mints a live URL, so I stopped short of it. These cases are queued behind that one decision:

- TC-04.17 beacon attribution `{role, placement}` on CTA click
- TC-04.18 dashboard CTA-breakdown table
- TC-05.15 published `<form data-lessgo-form>` → `/api/forms/submit` → `FormSubmission`
- TC-09.12 per-variant editor↔published pixel parity
- TC-X.1 dual-renderer parity sweep — **most valuable of the four**, since F1 is already a parity break

Also unrun for scope/time, each needing its own generation run:
vestria/manufacturer multipage (TC-03.2, 07.7, 07.8, 09.3), surge testimonials clamp (TC-09.5/09.6), writer/granth work engine + uploads (TC-06.13, 05.9), `app` businessType store badges (TC-05.10), URL-entry review mode (TC-02.5, 06.6, 06.9), scale-10 collection node (TC-10.1–10.7).

---

## Artifacts

Test projects left in the dev DB (safe to delete):

| Token | Input | Outcome |
|---|---|---|
| `qgWwABkSRXLm` | wedding/portrait photography studio | MANUAL-ONBOARD, `rungC:gallery`, fast-tracked |
| `o7lMBLf409kA` | neighbourhood dosa restaurant | MANUAL-ONBOARD via "Something else", `rungA:unclassified` |
| `I9HwKOYo9jsm` | Vaulta — Stripe payout reconciliation SaaS | SERVE → meridian page at `/edit/I9HwKOYo9jsm` |

Demand leads: `qa-photographer@lessgo.test` (fast-track), `qa-somethingelse@lessgo.test`.
</content>
