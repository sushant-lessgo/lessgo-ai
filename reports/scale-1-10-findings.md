# scale-01 → scale-10 — defect report (dev-actionable)

**Run:** 2026-07-10 · branch `main` @ `010b711c` · `localhost:3000`, real LLM (`AI_MODEL_TIER=cheap`), `DEV_BYPASS_CREDITS=true`, `NEXT_PUBLIC_IMAGES_AT_BIRTH=true`
**Companion doc:** `reports/scale-1-10-test-cases.md` (full pass/fail matrix)
**Unit suite:** `npm run test:run` → 103 files, 1757 passed, 3 skipped, **0 failed**. Every defect below is invisible to the current tests.

Repro projects left in the dev DB:

| Token | Scenario | Template |
|---|---|---|
| `I9HwKOYo9jsm` | SaaS "Vaulta", goal `request-demo` (M1), single-page | meridian |
| `nmzl0brZggz5` | Manufacturer "Shakti Precision Works", goal `request-quote` (M1), multipage | vestria |
| `qgWwABkSRXLm` | Photographer → MANUAL-ONBOARD (`rungC:gallery`, fast-tracked) | — |
| `o7lMBLf409kA` | Restaurant → "Something else" → MANUAL-ONBOARD (`rungA:unclassified`) | — |
| `bibO4F6MfOI8` | **(2nd pass)** Agency "Northbeam Studio", `book-call` (M1), single-page | **surge** (auto, `bold-performance`) |
| `Uutvg3qzIJHs` | **(2nd pass)** App "Zenmind", `download-app` → MANUAL-ONBOARD (`rungC:store-badges`) | — |
| `9knkYn8_QZpE` | **(3rd pass)** URL `https://www.pine64.org` → manufacturer/thing/multi, 5 pages incl. added `/industries` | vestria |
| `I-fwXvbaMwzP` | **(5th pass)** "Brightforge" CNC manufacturer; **`facts.collections.products` injected by hand** to exercise the scale-10 node. Generation failed 3× (**F27**); reached the editor via *Skip to editor*. | vestria |
| `0dG4f5wmo93H` | **(5th pass)** existing lex project, used read-only for TC-09.13 + F25 | lex |

Published test page: slug `qa-scale-parity` (safe to delete).

**State left behind by the 2nd pass** (all recoverable, all in dev DB):
`I9HwKOYo9jsm` features/testimonials are swapped to `LedgerFeatureList` / `CenteredEditorialTestimonials`
in the DB (invisible, per F3). `nmzl0brZggz5` hero is swapped to `VestriaFullBleedHero`.
`bibO4F6MfOI8` testimonials are on `PullQuoteWithMark` and **one testimonial card was destroyed** by F17.

---

## Priority order

| # | Sev | One-liner | Est. |
|---|---|---|---|
| F13 | **P0** | Any trust lead entering by URL from a multi-page site is auto-rejected — including the named pilot customer | gate rule |
| F15 | **P0** | Every writer lead with a form-style goal is auto-rejected: granth declares zero capabilities | registry |
| F16 | **P0** | Every `app` lead with a `download-app` goal is auto-rejected: nobody declares `store-badges` | gate rule + tests |
| F3 | **P0** | Registry-level variant dispatch is dead on **all 8 templates**: every barrel drops `layoutName` | 1 line × 8 files |
| F1 | **P0** | Auto-seeded lead form renders zero fields in the editor | 1-line fix ×2 files |
| F2 | **P0** | Testimonials are AI-fabricated, with invented names/titles (all 3 engines) | prompt + gate change |
| F22 | **P0** | "Add a page" seeds archetype `defaultSections` **without the proof filter** ⇒ fabricated testimonials with proof toggled OFF | filter on seed path |
| F23 | **P1** | Multipage M1: primary CTA gets **no destination at all** — ships `href="#contact"` with no such anchor | GOAL_REF / cross-page dest |
| F29 | **P1** | Republishing silently turns analytics **off** (checkbox defaults unchecked) | 1-line init |
| F30 | **P2** | A failed lead-notification email is invisible: `console.warn` only, no Sentry, no row flag | observability |
| F17 | **P1** | Variant swap destroys a testimonial + renders empty copy; Undo restores neither | manifest + undo |
| F19 | **P1** | scale-10 collections can **never** populate: enrichment keyed on `businessType`, which the entry call outputs | entry-route wiring |
| F4 | **P1** | No template shortlist/picker anywhere in the funnel | wiring / product decision |
| F5 | **P1** | Hero + header primary CTAs ignore the goal destination | GOAL_REF not applied |
| F14 | **P1** | An M3 (redirect) goal can be confirmed with **no destination**; wizard doesn't gate it | validation |
| F21 | **P2** | Empty `offer` passes the wizard but 400s the strategy API ⇒ dead-end "Strategy generation failed" | validation |
| F20 | **P2** | Goal step advances with nothing selected; goal silently defaults to `likelyIntents[0]` | validation |
| F27 | **P1/P2** | `legal_links` is `ai_generated` with no declared shape ⇒ generation dies; raw ZodError JSON shown to the user | prompt + parse + error UI |
| F25 | **P2** | hearth + lex ship **no** `LinkTargetPopover` — their links can never be re-pointed | 2 templates |
| F6 | **P2** | Primary CTA persisted as a resolved dest, not `GOAL_REF` | data-shape |
| F7 | **P2** | 4 dead nav anchors ship on every published meridian page | template default |
| F8 | **P2** | "Call to action" is removable at the 7b gate (**thing engine only** — trust marks it REQUIRED) | required-flag |
| F9 | **P2** | Published pages load beacon/form JS from hardcoded `https://lessgo.ai` | deploy coupling |
| F18 | **P3** | "Layout" button shows when only **one** variant is eligible → dead one-card modal | eligibility check |
| F24 | **P3** | Footer quick-links are AI-authored; omit pages added at the gate (header is derived, and correct) | derive footer nav |
| F26 | **P3** | `Link.source` written by 3 templates, dropped by 5, read by nobody | contract |
| F28 | **P3** | `slugify` leaves orphan hyphens (`widget--co`); three implementations exist, collections use the broken one | consolidate |
| F10 | **P3** | SSR `/p/[slug]` fallback never injects `form.v1.js` | fallback path |
| F11 | **P3** | Wizard copy leaks SaaS wording into other engines (**trust too**, not just manufacturer) | config copy |
| F12 | **P3** | `TabManager` throws `InvalidStateError` on every unload → Sentry noise | pre-existing |

### Second-pass corrections to the first report

- **F3's root cause was wrong** and is rewritten below. The DB does *not* disagree with itself; a
  two-parameter `resolveBlock` in every template barrel silently discards the variant name.
- **F16 is new** and makes the serve-gate bug a *three*-headed one, not two.
- **F17 is new**: the variant swap that *does* work (surge) destroys a testimonial and renders empty.
- **F2 now confirmed on all three engines** (thing one-liner, thing URL, trust one-liner).
- **F8 is engine-scoped**: on the trust engine "Call to action" *is* marked REQUIRED. Only the thing
  engine leaves it removable.
- **F11 is broader than businessType**: an *agency* (trust) sees the offer placeholder
  "Start a free 14-day trial". It's the shared default, not a manufacturer-entry gap.

### Third-pass additions (collections + images)

- **F19 is new and explains a whole silent area**: scale-10's collection capture is a dead wire, so
  TC-10.1–10.7 were never observable. Previously logged as "needs test data".
- **F20 / F21 are new**: the Goal and Offer steps have no validation. Offer produces a genuine
  dead-end at 7/8.
- **TC-03.2 PASSES**: images-at-birth works on vestria once an Industries section exists.
- **No defect in "Add a page"** *mechanically* — an earlier suspicion that the chip was a no-op was a
  stale-coordinate artifact of my own clicking. Recorded so nobody chases it. (What the chip *seeds*
  is a separate and real problem — see F22.)

### Fourth-pass additions (scale-04 click system, started)

- **F22 (P0) is the most damaging find of the day**: the add-page chip bypasses the proof filter, so a
  user who toggles testimonials OFF still gets invented, attributed quotes on the page they added.
  It also demotes TC-06.11's earlier PASS to "true only on the strategy path".
- **F23 (P1)**: on multipage, the M1 primary CTA carries no destination metadata at all.
- **F24 (P3)**: header nav is sitemap-derived and correct; the footer's link list is AI-authored and
  omits pages added at the gate. The two navs disagree within one project.
- **TC-04.12 PASSES** — header nav auto-seed is right, including the page added at the gate.

### Fifth-pass additions (scale-04 + scale-10 closed out)

- **F25 (P2)**: `LinkTargetPopover` is imported by 6 of 8 templates. hearth and lex have **zero**
  — their nav/footer links can be renamed but never re-pointed. TC-04.10's earlier PARTIAL was a
  meridian-only observation.
- **F27 (P1/P2)**: generation failed **3× in a row** on this brief. Root cause: `legal_links` is
  declared `fillMode: 'ai_generated'` in the element schema but appears **zero times** in
  `copyPrompt.ts`'s Collection-schemas block, so the model emits an object where an array is required.
  The wizard then prints ~1.2 kB of raw ZodError JSON to the user.
- **F26 / F28 (P3)**: dead `Link.source` contract; broken `slugify` with two correct siblings in-repo.
- **scale-10 is now genuinely tested.** Injecting `facts.collections.products` into a served Brief made
  the whole structure-gate collection UI work — render, rename (focus + caret kept), add, remove,
  empty-state — and the collection→pages bridge correctly stayed dormant. **`CollectionNode` is sound;
  F19's dead input path is the entire problem.**
- **TC-02.11 PASSES** — I forged `serve:true, decision:'SERVE'` on a photographer Brief and
  `/api/brief/confirm` re-ran `decideServe` and returned `manual · rungC:gallery`. The gate cannot be
  driven from the client.
- **Retraction:** F15's claim that `subscribe-newsletter` is "forced to M1" is **wrong** (it is M4).
  Corrected in place. F15's substance survives on `lead-magnet`/`waitlist`/`apply`.
- **Not a bug:** the "Add a page" chip works; an earlier suspicion was my own stale-coordinate clicking.

---

## The serve gate is over-tight: F13 + F15 + F16 are one bug wearing three hats

Read these three together before fixing any. `requiredCapabilitiesFromBrief()` derives **required** (filtering) capabilities from three sources — `copyEngine`, the businessType's `requiredCapabilities`, and *implicit* signals: `structure.mode === 'multi' → multipage`, `goal.mechanism === 'M1' → lead-form`, and `goal.intent === 'download-app' → store-badges`. The template registry cannot satisfy those implicit ones:

| Engine | Templates | `multipage`? | `lead-form`? | `store-badges`? |
|---|---|---|---|---|
| thing | meridian, vestria | vestria ✓ | ✓ ✓ | **none** |
| trust | hearth, lex, surge | **none** | ✓ ✓ ✓ | **none** |
| work | granth | **none** | **none** | **none** |

So:
- **trust + multi-page source site → 0 fit** (F13). Kills the pilot customer.
- **work + any M1 goal → 0 fit** (F15). Kills every writer whose goal is `lead-magnet` / `waitlist` / `apply` (all `mechanisms: ['M1']`). *Corrected:* `subscribe-newsletter` is **M4**, not "forced to M1" as the first report claimed — see the correction under F15 — so it and `follow-social` do survive the gate.
- **any businessType + `download-app` → 0 fit** (F16). Kills the `app` businessType's first likely intent.

Four of my seven real leads were rejected by this rule, and all four are businesses the admin panel lists as **serveable**. §7 rule 3 warned about exactly this: *"Default to preferred unless page is broken without it — every required flag shrinks serveability."* A trust page is not broken by being single-page.

**The decisive point:** two of the three implicit capabilities are *already satisfied by shared blocks
that resolve on every template, before template dispatch* — `SharedLeadForm` (scale-05) and
`SharedStoreBadges` (`injectGoalSections.ts:86`). The gate filters on `templateMeta.capabilities`,
which shared blocks never appear in. So the gate is asking the wrong registry.

**The codebase already agrees with that fix, in one place.** `seedGoalForm.ts:80` reads
```ts
const isM1 = goal.mechanism === 'M1' || goal.intent === 'subscribe-newsletter';
```
so a `subscribe-newsletter` page (mechanism **M4**) gets a real lead form seeded — on **granth**, which
declares `capabilities: []`. That works, because `SharedLeadForm` resolves on every template. Meanwhile
`fit.ts:65` adds required `lead-form` only for `mechanism === 'M1'` and would have rejected the same
page had the mechanism been M1. The seeder and the gate hold opposite beliefs about what a template
must declare, and **the seeder is the one that's right**.

Suggested direction: teach the gate that a capability backed by a shared block is always satisfied,
and demote `structure.mode → multipage` from **required** to **preferred**. Note that `fit.test.ts:82`
and `serveGate.test.ts:221` currently *assert* the rejection — the fix has to rewrite those, so treat
this as a spec change, not a patch. Then re-check the admin serveability column, which today evaluates
only `businessType.requiredCapabilities` and therefore reports "serveable" for business types the gate
actually rejects.

---

## F15 · P0 · Every writer lead with a form-style goal is rejected

**Repro.** Token `iP83TfbUj-Kb`, one-liner: *"Dinesh Kumar writes Hindi short stories and poetry, and shares new work with readers."* Classification is perfect:
```
businessType = writer     copyEngine = work     confidence = 0.9
goal         = { intent: "lead-magnet", mechanism: "M1" }
structure    = { mode: "single" }
```
Gate → MANUAL-ONBOARD, `missing = rungC:lead-form`.

**Why.** `goal.mechanism === 'M1'` adds required `lead-form`. `templateMeta.ts:108` declares `granth: { copyEngines: ['work'], capabilities: [] }` — no `lead-form`. granth is the only work-engine template. Zero fit.

> **Correction (3rd pass).** The first report added: *"since `subscribe-newsletter` is forced to M1 by
> scale-05 … only `follow-social` (M4) survives."* **That is wrong.** `vocabulary.ts:96` declares
> `'subscribe-newsletter': { mechanisms: ['M4'] }`, and `bridge.ts:218` takes `mechanisms[0]`, so the
> Brief carries **M4**. `fit.ts:65` therefore adds no `lead-form` requirement and the goal **serves**.
> Two writer goals survive, not one.
>
> The confusion is understandable: three other places *do* treat it as a form goal —
> `seedGoalForm.ts:80` (`|| goal.intent === 'subscribe-newsletter'`), `GoalParamFields.tsx:15`
> (*"M1 form treatment"*), and `injectGoalSections.ts:74` (*"`subscribe-newsletter` is an M1 form"*).
> Only the **serve gate** doesn't. So the intent is M4 for filtering and M1 for rendering.
>
> F15's substance is unaffected: `lead-magnet` (my repro), `waitlist` and `apply` are all
> `mechanisms: ['M1']`, so most writer goals are still rejected.

This directly contradicts scale-06's headline deliverable ("Writer self-serves end-to-end — work brief → wizard → granth page, no dev seed") and §11.5 ("Writer joins as work-engine entry in P1"). It also means `/dev/seed-writer` was deleted while the self-serve path it replaced cannot run.

The `/admin` Business Types table shows `writer · work · — · single · — · serveable`, because it only checks the businessType's own `requiredCapabilities` (empty) and never the goal-derived ones. The panel is telling you a lie you'd act on.

---

## F16 · P0 · Every `app` lead with a `download-app` goal is rejected — the third head of the same gate bug

**Repro.** Token `Uutvg3qzIJHs`, one-liner: *"Zenmind is a mobile meditation app for iPhone and Android
that helps people sleep better, and we want people to download it from the App Store and Google Play."*
Playback: *"A page for your Health & Wellness that gets visitors to download the app."* — correct.
Confirmed → **MANUAL-ONBOARD**.

**Why.** `src/modules/templates/fit.ts:66`
```ts
if (brief.goal?.intent === 'download-app') required.add('store-badges');
```
`store-badges` is declared by **no template at all** (`templateMeta.ts`). Zero fit, always.

The contradiction is sharper than F13/F15: the store badges are a **template-agnostic shared block**.
`src/modules/goals/injectGoalSections.ts:86` (`injectStoreBadges()`) injects `SharedStoreBadges`
whenever `intent === 'download-app'`, and it is registered in `sharedBlocks/registry.ts` +
`registry.published.ts`, so it resolves on *every* template — exactly like `SharedLeadForm`. The
capability is satisfied by construction, and the gate rejects it anyway.

Worse, the rejection is **enshrined in tests**: `fit.test.ts:82` (*"download-app derives store-badges
→ 0 matches (nobody declares it)"*) and `serveGate.test.ts:221` (`expect(decision.missing).toBe('rungC:store-badges')`).
So this is not an oversight to patch quietly — it is a spec decision to reverse, and the tests must
be rewritten with it. `app` is one of the 8 businessTypes the admin panel reports serveable, and
`download-app` is its **first** `likelyIntent`.

Net: `app` serves only if the user picks `signup-free` or `waitlist` — in which case the store badges
are never injected, so the one block built for this businessType is unreachable from self-serve.

**F13 + F15 + F16 are one bug.** Three implicit required capabilities (`multipage`, `lead-form`,
`store-badges`) are derived from the Brief and filtered against `templateMeta`, which no template
satisfies. Two of the three (`lead-form`, `store-badges`) are already implemented as shared blocks
that resolve before template dispatch. Any fix should teach the gate that shared blocks satisfy a
capability, or demote all three to *preferred*.

---

## F17 · P1 · Variant swap destroys copy and a testimonial, and Undo restores neither

**Repro.** Token `bibO4F6MfOI8` (agency → trust → **surge**, auto-selected via `defaultStyle: 'bold-performance'`).
Generation produced `testimonials-135ea3ea` = `ReviewGrid` with **2** review cards.
Testimonials → **Layout** → **Pull quote**.

**The clamp warning is correct and well-written** (TC-09.5 passes):
> **This style shows fewer cards** — We'll keep the first 1 card and drop 1 at the end. **Undo restores the removed card.**
> `[Cancel]  [Switch & keep first 1]`

Three things then go wrong.

**1. The swapped-in block renders empty.** `PullQuoteWithMark` draws a quote card with **no quote
text, no author name**, a placeholder avatar reading "AK", and the headline gone. Because the two
variants of the *same section* consume incompatible element shapes (`blockManifest.ts`):

| Variant | `consumes` | Reads the generated copy? |
|---|---|---|
| `ReviewGrid` (default) | `eyebrow`, `headline` + `reviews[]` cards | ✓ |
| `PullQuoteWithMark` | `eyebrow`, **`quote`**, **`author_name`**, `author_role`, `author_company`, `author_photo`, `meta` | ✗ — reads top-level keys that don't exist |

The section stores `{eyebrow, headline, reviews:[{quote, author_name, …}]}`. `PullQuoteWithMark`
looks for a top-level `quote`/`author_name` and finds nothing. This directly violates the modal's own
promise — *"Your headline, copy and uploaded media are kept when you switch"* — and D18's
copy-compatibility law.

**2. A testimonial is permanently destroyed.** Post-swap DB:
```json
"reviews": [ { "id":"reviews-def88c99", "quote":"Our ad spend ROI increased by 284%…",
               "author_name":"Lydia Tan", … } ]        // was 2 cards; Marcello Garcia's is gone
"layout": "PullQuoteWithMark"
```
The clamp dropped the second card as promised — but nothing brings it back.

**3. Undo is a no-op.** One Undo click after the swap: layout stays `PullQuoteWithMark`, the dropped
card stays dropped, the render stays empty. The redo arrow arms, so the stack *thinks* it undid
something. Same on vestria's hero swap (`nmzl0brZggz5`): after Undo the modal still shows
"Full-bleed video hero" as **Current** and the DB still reads `VestriaFullBleedHero`. So
**Undo never restores a block-variant swap on either dispatch path**, and the clamp modal makes a
promise the editor cannot keep. (TC-09.4 and TC-09.6 both fail.)

**Why the scale-09 guards miss it.** The phase-3 distinctness guard explicitly **exempts**
`internalDispatch` variants (they resolve to the same component by design), and the conformance test
proves `consumes ⊆ contract` **per block** — never that two variants of one section consume the
*same* copy, which is what makes a swap lossless. Both surge testimonial variants are
`internalDispatch: true`, so they fall in the exemption gap.

**Severity note.** Item 2 is silent user-data destruction on a control the user is invited to explore,
with an on-screen guarantee of reversibility. That's worse than the empty render.

---

## F22 · P0 · "Add a page" bypasses the proof filter ⇒ fabricated testimonials on a page the user just added

**The single cleanest reproduction of §8's broken law so far**, because the user explicitly said *no*.

**Repro.** Token `9knkYn8_QZpE`. Proof step: testimonials toggle left **OFF** (its default here). At the
7b gate I clicked the **`+ Industries`** add-page chip. Generated project:

```json
brief.proofAvailable    : []
brief.facts.testimonials: null
pages.industries.content["testimonials-8da8b01d"] = {
  "layout": "VestriaQuotes",
  "elements": { "headline": "What our users say.", "testimonials": [
    { "quote": "PINE64 boards have enhanced my projects significantly…",
      "author_name": "Alex Johnson", "author_role": "Software Developer" },
    { "quote": "The flexibility and price point of PINE64 products…",
      "author_name": "Lisa Ray",     "author_role": "Tech Hobbyist" } ] } }
```
Two invented people, on a page the user added, with proof explicitly toggled off.

**Why.** The proof filter is enforced in exactly one place — the *strategy* section list:
```ts
// src/modules/audience/product/strategy/parseStrategyProduct.ts:43
if (proof.hasTestimonials !== true) dropped.add('testimonials');
```
The add-page chip does not go through it. It seeds the archetype's `defaultSections` verbatim
(`src/modules/audience/product/pageArchetypes.ts:78`):
```ts
{ key: 'industries', requiredSections: ['industries'],
  defaultSections: ['industries', 'testimonials'] }   // ← testimonials, unconditionally
```
The `about` archetype (`:73`) has the same `defaultSections: ['about','process','testimonials']`.

**Why the first pass called TC-06.11 a PASS.** The earlier manufacturer run (`nmzl0brZggz5`) *did*
drop testimonials everywhere — but it never added a page whose archetype defaults include them. The
proof-drop rule holds on the strategy path and is simply absent on the add-page path. So TC-06.11's
PASS was true but not general; **the rule is not enforced where the sitemap grows.**

`proofFilter.test.ts` covers only the strategy path (`hasTestimonials false ⇒ section absent`), which
is why 1757 tests stay green.

**Fix.** Run archetype `defaultSections` through the same proof filter before seeding (and re-check
`allowedSections`, which still offers `testimonials` as an addable chip on a no-proof project). This
is the same law as **F2** — worth fixing together.

---

## F23 · P1 · On a multipage project the goal's primary CTA gets no destination at all

`9knkYn8_QZpE`, goal `{intent:'enquiry', mechanism:'M1'}`. A form **was** seeded
(`form-1783675936514`, 7 fields, submit "Send request") and it lives on the **`/contact`** page
(`contact-091ee575`, `VestriaLeadForm`, `form_id` correctly wired).

But **no section on any of the five pages carries `cta` or `buttonConfig` metadata** — I walked every
`elementMetadata` in `finalContent`. The home hero's `cta_text` is the string `"Send enquiry"` and
nothing else:
```
[home] hero-5bb2d5ca  VestriaTailoredHero   cta_text="Send enquiry"    ← no cta{}, no href
[contact] contact-091ee575  VestriaLeadForm  form_id="form-1783675936514"
```
On the single-page meridian project (F5/F6) the CTA at least resolved to `#form-section`. Here the
form is on a *different page*, so a same-page anchor cannot work, and no `dest: {kind:'page'}` was
written either. The primary conversion button on the home page of an M1 multipage site has nothing
behind it.

This is the multipage face of **F6** (dest is copied at generation rather than held as `GOAL_REF`):
the copy step resolves the destination once, and when the target isn't in the same page's section
list there is nothing to resolve to, so it emits none.

**Confirmed on the live page (5th pass).** Published as `qa-scale-vestria`. Both primary CTAs render:
```html
<a data-lessgo-cta-role="primary" href="#contact">Send enquiry</a>   ← header
<a data-lessgo-cta-role="primary" href="#contact">Send enquiry →</a> ← hero
```
and the home page's element ids are exactly `header, hero, trust, features, catalog, about,
industries, footer` — **there is no `#contact`**. `document.getElementById('contact') === null`.
Clicking it changes the URL hash and scrolls nowhere. The form is on `/p/qa-scale-vestria/contact`,
a different page, and nothing links to it from a CTA.

So the resolver did emit *a* destination — it guessed the section anchor `#contact` from the goal —
but on a multipage site the contact section is not on this page, and no `dest: {kind:'page'}` was
written. Note both CTAs are `primary`; nothing on the page is `secondary`.

---

## F19 · P1 · scale-10 collections can never populate — the enrichment is keyed on a field the entry call produces

**This is why TC-10.1–10.7 have never been observable.** It is not missing test data; it is a dead wire.

`facts.collections` is written by exactly one path: `collectionsFromSignals()` (`classify.ts:159`) →
`buildBriefDraft()` (`:229`) → `setCollections()`. It reads `signals.collections`, which is only ever
set by the engine's `enrichSignals()` fold. And in `src/app/api/v2/scrape-website/route.ts:169`:

```ts
const extraction = businessType ? extractionForBusinessType(businessType) : null;
const enriched   = !!extraction && hasEntryEnrichment(extraction);
// …extraction === null ⇒ entryEnrichmentFields never added to the schema,
//                        entryEnrichmentPrompt never added to the prompt,
//                        enrichSignals never called ⇒ signals.collections stays undefined
```

`businessType` is an **optional request field**. The entry step never sends it
(`EntryInputStep.tsx:96`):
```ts
body: JSON.stringify(isUrl ? { url: normalizedUrl, entry: true }
                           : { oneLiner: value.trim(), entry: true })
```
It cannot: `businessType` is the *output* of this very call. Same shape in
`/api/v2/understand/route.ts:117`. So on every real entry, `extraction === null`, and
`facts.collections` is always unset. The per-engine wiring in `thing.ts` / `trust.ts` / `work.ts` /
`manufacturer.ts` (`entryEnrichmentFields` / `entryEnrichmentPrompt` / `enrichSignals`) is complete
and correct — and unreachable. The matrix already recorded this symptom as TC-08.8
*"`businessType` on v2 extraction routes — inert on first scrape — N/A-DORMANT"* without noticing it
also disables all of scale-10.

**Repro.** Token `9knkYn8_QZpE`, URL entry `https://www.pine64.org` — a site that is nothing but a
product catalogue. Classified `manufacturer` / `thing` / `multi`, confidence 0.9. The scrape *did*
read the product lines and put them in **features**:
> What can it do? (key features) — *Single Board Computers, Linux Smartphones, Tablets, Wearables, Accessories*

`brief.facts` came back with a single key, `entry`. `brief.facts.collections === null`. The 7b gate
then drafted a 4-page sitemap including a `/catalogue` page with a **Catalogue grid** section — and
rendered **no collection node**: DOM search for `N item(s)` returns 0 matches, and there is no
`+ Add` control. Note `catalog` is vestria's flat grid, explicitly *not* a `CollectionKey`, so the
catalogue page does not stand in for one.

**Consequence.** Every scale-10 browser case (TC-10.1–10.7) is unreachable on the real product
today, not merely untested. The registry-gated bits (`requiredCollections`, the template collection
bridge) were *known* dormant; this one wasn't.

**Fix sketch.** The entry call classifies and extracts in one AI pass, so it can't key the schema on
its own output. Either (a) run the enrichment as a second, cheap pass once `businessTypeGuess` is
known, (b) include the union of all engines' collection fields in the base entry schema and fold by
the guessed engine afterwards, or (c) accept that collections are captured on a later
wizard-triggered re-extraction — in which case something must actually trigger one.

---

## F20 · P2 · Goal step advances with nothing selected, and silently defaults the goal

**Repro.** Token `9knkYn8_QZpE`. After confirm, `brief.goal` is **undefined** — the classifier
produced no goal, and the playback sentence degraded to *"A page for your Open Source Hardware that
gets visitors to **take action**."* At the Goal step (3/8) — the step whose stated purpose is *"Pick
the single most important action"* — nothing was pre-selected. I clicked **Continue** without
choosing. It advanced. `Continue` was never `disabled`.

The goal is not left empty, though: the captured strategy request carries
```json
"landingGoal": "enquiry",
"brief": { "goal": { "intent": "enquiry", "mechanism": "M1" }, "businessType": "manufacturer" }
```
`enquiry` is simply `manufacturer.likelyIntents[0]`. So the single most consequential choice in the
wizard — the one that seeds the CTA copy, the form, and every primary button — is made silently by
array order when the user skips it. Either pre-select it visibly (as the saas run does, where the AI
guess *was* shown selected) or gate `Continue`.

This is the same family as **F14** (M3 goal confirmed with no destination): the Goal step has no
validation at all.

---

## F21 · P2 · The wizard doesn't gate `offer`, which the strategy API requires ⇒ an unrecoverable "Strategy generation failed"

**Repro.** Same token. At the Offer step (4/8) I left *"What is the offer / next step?"* empty and
clicked **Continue**. It advanced. At step 7 the gate showed:

> **Strategy generation failed** · `[Try again]`

`POST /api/audience/product/strategy` → **400** (not a crash). The route's zod schema
(`route.ts:49`) says:
```ts
offer: z.string().min(1, 'Offer required'),
```
So the wizard permits an empty value for a field its own API declares required. Three problems
compound:

1. **`Try again` can never succeed** — it re-posts the same invalid body. I clicked it twice; both 400.
2. **The error names nothing.** "Strategy generation failed" doesn't say *which* field, or that the
   user can fix it by going Back. A real user is simply stuck at 7/8.
3. **`Continue` stays enabled** next to the failure, so the user can walk past a failed strategy.

Going Back and filling the offer made the identical request return **200** immediately. Confirmed by
capturing the request/response pair in-page.

`productName`, `features` (`min(1)`), and `primaryAudience` carry the same `min(1)` guards and are
prefilled from the scrape — so an empty offer is the reachable one, but a user who clears any
prefilled field lands in the same trap.

---

## F13 · P0 · URL entry + multi-page source site ⇒ every trust lead is rejected

**Repro.** Token `crzZbjstC2aH`. Entry step, pasted `https://www.wingrrowth.com` — the very customer scalePlan §9 names as the pilot ("candidate: Wingrrowth — trust engine, surge path"). The scrape and classify are perfect:

```
businessType = consultant     copyEngine = trust     confidence = 0.9
category     = "SaaS Consulting"
goal         = { intent: "request-quote", mechanism: "M1" }
structure    = { mode: "multi", pages: [] }          ← inferred from the source site
```
Playback read *"A page for your SaaS Consulting that gets visitors to request a quote."* I confirmed it, and the gate returned **MANUAL-ONBOARD**, logged as:
```
missing = rungC:multipage
```

**Why.** `src/modules/templates/fit.ts:67`
```ts
if (brief.structure?.mode === 'multi') required.add('multipage');
```
and `multipage` is declared by exactly one template — **vestria**, which is `copyEngines: ['thing']` (`templateMeta.ts:53-89`). The trust templates declare only:

| Template | engine | capabilities |
|---|---|---|
| hearth | trust | `lead-form` |
| lex | trust | `lead-form` |
| surge | trust | `lead-form`, `packages` |

So `fit(t, b)` = `trust ∈ t.copyEngines ∧ {lead-form, multipage} ⊆ t.capabilities` = **∅** for every trust template. Zero fit → MANUAL-ONBOARD.

**Blast radius.** The `multi` flag came from the AI reading the *source website's* page count, not from anything the user asked for. Any consultant/agency/coach who pastes a normal multi-page website URL — which is most of them, and is the flow scale-02 was built to make the primary entry — is silently pushed to the demand board. Enter the same business as a one-liner and it serves fine (businessType `consultant` has `structureDefault: 'single'`). So **serve coverage silently depends on how the user typed their input**, which is exactly what D5/D8 set out to eliminate.

It also can't self-correct: §3 says *"7b deletion RELAXES hard-fit — user drops gallery ⇒ more templates eligible"*, but the serve gate runs at step 4 and the structure gate at step 7b. The user never gets the chance to say "single page is fine."

**Options:**
1. Treat a multi-page *source* as a **preferred** signal (sorts) rather than a **required** capability (filters) — §7 rule 3 already says *"Default to preferred unless page is broken without it"*, and a trust page is not broken by being single-page.
2. Don't let the classifier set `structure.mode` at all; default from the businessType entry (`structureDefault`) and let 7b decide, per D6 (machine decides facts, user decides taste — page count is taste).
3. Keep it required, but on a `rungC:multipage` miss, re-run the gate with `structure.mode = 'single'` and serve if that fits, noting the downgrade in the confirm card.

Option 1 or 2 restores the pilot. Whichever you pick, the pilot gate in scalePlan §9 ("site 21 self-serves… candidate: Wingrrowth") cannot currently pass.

**Side effect on testing:** this blocked TC-02.5 / 06.6 / 06.9 (URL-entry review mode, "≤3 questions" budget) — the lead never reaches the wizard.

---

## F1 · P0 · Auto-seeded lead form renders no fields (scale-05)

**Symptom.** After a `request-demo` (M1) generation, the injected `leadForm` section shows a heading and a single "Submit" button. No name/email/company/message inputs. Same in `/edit/[token]` and `/preview/[token]`.

**The seed is correct.** From `Project.content.finalContent`:
```json
"forms": { "form-1783644243938": {
  "name": "Request a demo",
  "fields": [ {"id":"name",...}, {"id":"email",...}, {"id":"company",...}, {"id":"message","type":"textarea",...} ],
  "submitButtonText": "Request a demo",
  "successMessage": "Thanks — we'll reach out to schedule your demo."
}}
"leadForm-8ca87d90": { "layout": "SharedLeadForm", "elements": { "form_id": "form-1783644243938", ... } }
```

**Rendered instead:**
```html
<form class="lg-lead__form"><div class="lg-lead__foot"><span class="lg-lead__btn">Submit</span></div></form>
```
The fallback label `"Submit"` (instead of `"Request a demo"`) is the tell: the form lookup returned `undefined`.

**Root cause.** The edit twin reads the form from the wrong slice of the store.

- `src/modules/generatedLanding/sharedBlocks/LeadForm/LeadForm.tsx:26`
  ```ts
  const form = formId ? store.content?.forms?.[formId] : undefined;   // ← always undefined
  ```
- The edit store keeps forms at **top level**: `state.forms` (`src/types/store/state.ts:445`, `FormsSlice`), written by `src/hooks/editStore/formActions.ts:22` as `state.forms[newForm.id] = newForm`. `store.content` is the section map only.
- `src/modules/templates/vestria/blocks/Contact/VestriaLeadForm.tsx:24` has the identical bug.

**Published twins are correct** — they read `props.content?.forms?.[formId]` (`LeadForm.published.tsx:33`), and the persisted content object *does* carry `forms`. Verified against the published blob for `qa-scale-parity`: 3 `<input>` + 1 `<textarea>`, `data-lessgo-form`, `data-form-id`, `data-page-id`, `data-owner-id`, `data-success-message`, submit label `Request a demo`, all inside `id="form-section"`.

So this is a **dual-renderer divergence in the unusual direction**: editor wrong, published right.

**Fix.** Read `store.forms?.[formId]` in both edit twins. Add a render test asserting `fields.length === form.fields.length` for a seeded M1 form — the existing suite passes because nothing renders the edit twin against a seeded store.

**Impact.** M1 intents are 13 of the first-20 sites. Every one of those customers sees a visibly broken form as the first thing after reveal.

---

## F2 · P0 · Testimonials are AI-generated, with invented people

**Repro.** Token `I9HwKOYo9jsm`. In the Proof slot I toggled "Customer testimonials" ON, picked "Text quotes", and supplied **no quotes** (the wizard never asks for any). The generated page contains:

> "Vaulta has drastically reduced our reconciliation time and improved accuracy. It's a must-have tool for any finance team." — **Jessica T., Finance Manager**
>
> "The integration with our existing accounting software was smooth. Vaulta just fits into our workflow." — **Marcus L., Controller**

Neither the quotes nor the people exist.

**Spec violated.** `docs/tracks/scalePlan.md` §8: *"proof is scraped verbatim or user-given, NEVER generated; missing proof drops the section."* §8's timing tiers also put "testimonial text" explicitly in **T1 — words that land in copy → wizard**.

**Where the hole is.** The proof step collects a *boolean* (`hasTestimonials`) plus a *format* ("Text quotes" / "With client photos" / "Video" / "Transformation stories"), then hands both to the copy fan-out, which happily writes the quote elements. The boolean is being treated as a T2 existence flag when the spec classifies the quote text as T1.

**Options (product call):**
1. Collect the quotes in the wizard when the toggle is ON (spec-faithful), or
2. Render the section with empty placeholder quote slots + a post-reveal nudge, and never let the prompt emit `testimonial_quote` / `testimonial_name` content.

Either way, the copy prompt must be prevented from inventing attributed quotes. Worth a check across engines: trust and work engines have the same proof toggles.

**It also happens on the URL path, which is worse.** Second repro, token `QhF4YMiht53s`, entry = `https://plausible.io`. The proof toggle arrived **already ON**, yet `brief.facts.testimonials` is `null` — nothing was actually scraped. Generation produced:

> "Plausible Analytics has simplified our approach to data." — **Alex Chen, Ecommerce Manager**
> "Finally, an analytics tool that respects our users' privacy." — **Jordan Smith, Digital Marketing Specialist**

So the toggle is being switched on without any captured proof behind it, and the fan-out fills the gap with invented people. Two bugs stacked: the toggle's default is unfounded, and the prompt is permitted to author `author_name` / `author_role`.

**Third repro — the trust engine does it too.** Token `bibO4F6MfOI8` (agency "Northbeam Studio",
one-liner, testimonials ON → "Text quotes", no quotes supplied). The toggle's own sub-label reads
**"Quotes you can publish"**, and the step still never asks for a quote. Generated:

> "Our ad spend ROI increased by 284% within just three months!" — **Lydia Tan, Marketing Director, GlowSkin**
> "The landing pages they built converted like nothing we've seen before." — **Marcello Garcia, CMO, Pure Beauty**

Invented people, invented job titles, invented **client companies** — and a fabricated hard metric
("284%") that reads as a claim the agency is making about a named client. So F2 is confirmed on all
three live engines (thing/one-liner, thing/URL, trust/one-liner); it is not a per-engine prompt gap.

**Why it matters beyond the spec:** fabricated attributed testimonials on a customer's live site is a legal/trust exposure, not a cosmetic bug. A customer who publishes without reading closely is quoting people who do not exist — and, on the trust engine, attributing invented performance numbers to named companies.

---

## F3 · P0 · Registry-level block-variant dispatch is dead on every template

> **Root cause corrected on re-test (2026-07-10, second pass).** The first pass blamed
> "two sources of truth disagree in the DB". That was wrong — a re-probe of both projects
> shows `content[id].layout` and `sectionLayouts[id]` (and `pages[home].sectionLayouts[id]`)
> **agree perfectly**; the earlier read simply raced the debounced autosave. The store and
> persistence layers are fine. The bug is one line, repeated eight times.

**Repro.** Token `I9HwKOYo9jsm`, meridian. Features → toolbar → **Layout** → pick **Ledger list**.
Badge flips to `LedgerFeatureList`, Undo arms, and the DOM keeps rendering `.mrd-features-grid`.
Same for Testimonials (`ProofWithLogoRail` → "Centered editorial": DOM stays `mrd-testi-*`).
Survives a hard reload — because the DB is *correct*:

```
content["features-d125fd72"].layout             = "LedgerFeatureList"           ✓
sectionLayouts["features-d125fd72"]             = "LedgerFeatureList"           ✓
pages[home].sectionLayouts["features-d125fd72"] = "LedgerFeatureList"           ✓
content["testimonials-0e7185cf"].layout         = "CenteredEditorialTestimonials" ✓
```
…yet a fresh load renders `mrd-features-grid` + `mrd-testi-*`, i.e. both **defaults**.

**Root cause.** `src/types/template.ts:36` declares the contract with three parameters:
```ts
resolveBlock(blockType: string, mode: 'edit' | 'published', layoutName?: string)
```
`componentRegistry.ts:71` and `componentRegistry.published.ts:53` both dutifully forward the
stored `layoutName`. But **every one of the eight template barrels implements it with two**:

```ts
// src/modules/templates/meridian/index.ts:47   (identical in vestria, hearth, lex, surge,
export function resolveBlock(blockType: string, mode: 'edit' | 'published') {  // granth, lumen,
  return resolveMeridianBlock(blockType, mode);        // ← layoutName silently dropped  techpremium)
}
```
So the inner resolver always receives `layoutName === undefined` and falls through to
`section.variants[section.default]`. `resolveMeridianBlock` itself is **correct** — it is
never given the argument it needs.

**Why nothing caught it.**
- **`tsc` is green:** a 2-arg function is structurally assignable to a 3-arg function type. TypeScript will never flag this.
- **1757 unit tests are green:** every variant test calls the *inner* resolver directly
  (`resolveMeridianBlock('cta','published')` — `dispatch.test.ts:77`, `renderParity.meridian.test.tsx:103`,
  `legacyHrefShim.test.tsx:28`). Nothing exercises the exported barrel that the renderers actually call.

**Blast radius.** Both renderers are affected identically, so editor and published agree — on the
wrong block. A meridian variant the user picks **never ships**. The only variants that work are the
two declared `internalDispatch: true` (vestria hero, surge testimonials), because those are a single
component that re-reads `content[id].layout` itself and never needed the argument.

**Verified both directions.** Vestria hero `VestriaTailoredHero → VestriaFullBleedHero`
(`internalDispatch`) re-renders correctly, copy preserved (token `nmzl0brZggz5`).
Meridian features/testimonials (registry dispatch) do not. That asymmetry is the fingerprint.

**Fix.** Add the third parameter to all eight barrels and forward it. Then add one test that goes
through `getComponent()` / the barrel — not the inner resolver — asserting a stored variant name
yields the variant component.

---

## F4 · P1 · No template shortlist or picker anywhere

**Wizard, Style slot (6/8)** never offers a template. On the meridian run it rendered only:
> "We'll use a clean default theme. You can fine-tune fonts, colours and layout in the editor once your page is generated."

On the vestria run (`QhF4YMiht53s`) the same slot **does** render a *block-variant* picker — "While we write — pick your hero style: Image hero / Video hero". So the slot is wired and correctly shows nothing when only one variant is eligible; what's missing everywhere is the **template** shortlist.

**Editor, Style popover** renders only *Typeface* (Developer / Marketing / Light) + *Palette* swatches. The strings "template"/"vestria" appear nowhere in the DOM; no `TemplateSwapList`.

**The machine is silently choosing.** Token `QhF4YMiht53s` is a **single-page saas** brief and generated on **vestria**; token `I9HwKOYo9jsm` is also single-page saas and generated on **meridian**. Both engines/capabilities fit both templates, so the shortlist has ≥2 members and D6 says the user picks. Instead the pick happens invisibly and inconsistently.

**Spec.** `scalePlan.md` §3 step 6: *"template: hard filter → style-sorted shortlist → auto iff 1, else user picks → look pickers"*. D6/D11 make "user always picks; auto only when exactly 1 fits" load-bearing. scale-07 phase 7 claims `TemplateSwapList` was wired into the theme popover for **all** product template-module projects ("meridian unlocked").

**Evidence the filter itself works:** the manufacturer run (`nmzl0brZggz5`) auto-selected **vestria** — correct, since only vestria declares `multipage`, so the shortlist collapses to 1 and auto-select is right. The saas run (`I9HwKOYo9jsm`) should have offered a choice between meridian and vestria and offered none.

Two separate questions for you:
1. Is the *editor* swap list correctly suppressed here because this page's `leadForm`/`cta` sections make hard-fit collapse to 1? If so, say so in the UI rather than hiding the control.
2. The *wizard* Style slot has no shortlist at all, and at that point the page has no sections yet — so no hard-fit justification exists. This looks unimplemented.

Blocks verification of TC-07.11 / 07.12 / 07.13 / 07.14 (swap shortlist = hard-fit; swap changes zero words; retired/bespoke/cross-engine excluded).

---

## F14 · P1 · An M3 redirect goal can be confirmed with no destination

**Repro.** Token `QhF4YMiht53s` (plausible.io). Goal step pre-selected **Start free trial** (M3 = redirect out) and rendered a **"Destination link"** field, described as *"Where the main button sends visitors (store page, checkout, signup…)"* — with no "(optional)" marker, unlike `request-demo`'s.

I left it empty. **Continue was never disabled**, there was no "Skip for now" affordance, and the wizard advanced. The persisted Brief:
```json
"goal": { "intent": "free-trial", "mechanism": "M3" }   // no `param`
```
No element on the generated page carries any `cta` metadata, so the hero's "Start free trial" button has no destination to resolve to. The single most important button on an M3 page points nowhere.

The scale-05 audit describes the intended behavior: *"Product param-less goals auto-advance; param goals pause with Continue (gated) + 'Skip for now'."* Neither the gate nor the skip button is present on this path.

Related smell in the same run: the goal is M3 (redirect), yet a lead form was still seeded (`forms` count = 1) — worth checking whether `seedGoalForm` is firing for non-M1 mechanisms, or whether that form comes from vestria's `contact` section default.

---

## F5 · P1 · Hero and header primary CTAs ignore the goal destination

From the **published blob** for `qa-scale-parity` (goal = `request-demo`, M1, form at `#form-section`):

```
data-lessgo-cta-role="primary"   href="#cta"            ← header
data-lessgo-cta-role="primary"   href="#cta"            ← hero
data-lessgo-cta-role="primary"   href="#form-section"   ← cta section  (correct)
data-lessgo-cta-role="secondary" href="#signin"
```

Only the CTA-section button points at the goal. The hero and header primaries scroll to `#cta`, i.e. to *another button*, costing the visitor an extra click on the single most important element of the page. §5's promise is that **every** primary re-points when the goal changes.

Related to F6: the hero's `cta_text` element has **no `cta` metadata at all**, so it falls through to a template default `#cta`.

---

## F6 · P2 · Primary CTA persisted as a resolved destination, not `GOAL_REF`

`content["cta-eeb28d40"].elementMetadata.cta_text`:
```json
{ "cta":  { "dest": {"kind":"section","anchor":"form-section"}, "role":"primary", "formId":"form-1783644243938" },
  "buttonConfig": { "type":"form", "formId":"form-1783644243938", "ctaType":"primary", "behavior":"scrollTo" } }
```

Expected per D12 / §5: `dest: 'GOAL_REF'` — *by reference, not copied* — so that changing the goal re-points every primary. What's stored is a snapshot of today's resolution, which is exactly the "per-element copied config" §5 identifies as the reason goal was a dead wire. I could not verify re-pointing (no reachable post-generation goal editor), but the stored shape does not match the spec.

Also: I could not find any way to open `ButtonConfigurationModal` from a hero CTA — double-click opens the text-format toolbar, right-click does nothing. If there's an entry point, it isn't discoverable; if there isn't, TC-04.1/04.3/04.4 have no UI at all.

---

## F7 · P2 · Dead nav anchors ship on every published meridian page

Published blob nav: `#features`, `#pricing`, `#about`, `#support`, plus `#signin`. The page contains only `header, hero, leadform, features, cta, testimonials, footer`. **Four of five anchors scroll nowhere.**

Single-page nav is correctly *not* sitemap-seeded (scale-04 says seed only on multipage), but the meridian template default fills the gap with links to sections that don't exist. Either derive single-page nav from the actual section list, or ship a nav with only the anchors the page has.

Bonus: `Sign in` carries `data-lessgo-cta-role="secondary"`, so a wayfinding link enters CTA analytics as a CTA. Per D15 the beacon fires on secondary CTA clicks — sign-in clicks will land in the conversion breakdown.

---

## F8 · P2 · "Call to action" is removable at the 7b gate

Token `I9HwKOYo9jsm`, structure slot. Button states read from the DOM:

| Row | Move up | Move down | Remove |
|---|---|---|---|
| Hero `REQUIRED` | (absent) | (absent) | disabled |
| Features `REQUIRED` | disabled | enabled | disabled |
| Testimonials | enabled | enabled | **enabled** |
| Call to action | enabled | disabled | **enabled** |

Spec §7b: *"Required sections locked (hero first, **CTA present**)"*. A user can approve a page plan with no CTA section. Mitigating: with an M1 goal the injected `leadForm` still carries the conversion, so this is a law violation more than a broken page.

**Scoped in the 2nd pass: this is a thing-engine bug only.** The agency run (`bibO4F6MfOI8`, trust engine)
renders `Hero REQUIRED · Services REQUIRED · Call to action REQUIRED`. So the trust engine already marks
CTA required and the thing engine doesn't — the required-set is per-engine, and thing's is missing `cta`.

Everything else in the gate is correct: hero pinned first and unremovable, Features can't move above hero, no add affordance in single-page mode, reorder persists into generation (I moved Testimonials below CTA and the generated page rendered `header, hero, leadform, features, cta, testimonials, footer`).

---

## F9 · P2 · Published pages load beacon + form JS from hardcoded `https://lessgo.ai`

`src/lib/staticExport/htmlGenerator.ts:233`
```ts
const assetBase = 'https://lessgo.ai';
```

Consequences observed:
- The locally-published page loaded **production's** `a.v1.js`. Production's copy predates scale-04, so the beacon recorded `ctaPlacements = {"unknown":{"primary":2}}` and counted my *secondary* ("Sign in") click as **primary**. The local `public/assets/a.v1.js` does contain the `placement` and `role` logic — so this is stale-asset coupling, not a beacon bug.
- Practical effects: (a) per-placement CTA attribution cannot be tested locally at all; (b) every already-published blob starts reporting new-format events the moment `lessgo.ai/assets/a.v1.js` is redeployed, and reports garbage until then. The blob HTML and the beacon asset are versioned independently with no contract between them.

The prerequisites in the blob are all present and correct: `id` + `data-surface` on all 7 section wrappers, 3 `primary` + 1 `secondary` role attributes. Consider versioning the asset path (`a.v2.js`) or making `assetBase` env-driven.

**Proven outright (5th pass).** I fetched both assets and counted the scale-04 symbols:

| | `placement` | `role` | `primary` |
|---|---|---|---|
| local `public/assets/a.v1.js` | 1 | 1 | 1 |
| **live `https://lessgo.ai/assets/a.v1.js`** (HTTP 200, 1743 B) | **0** | **0** | **0** |

Production's beacon has no notion of placement or role at all. A CTA click on the freshly published
`qa-scale-vestria` recorded `ctaPlacements = {"unknown":{"primary":1}}` even though the page's hero
wrapper carries `id="hero"` and the anchor carries `data-lessgo-cta-role="primary"`. The markup is
right; the asset is a different generation of the code. Per-placement attribution is untestable — and
wrong in production — until `a.v1.js` is redeployed, at which point every previously-published blob
starts emitting the new format with no version handshake.

---

## F10 · P3 · SSR `/p/[slug]` fallback never injects `form.v1.js`

The published **blob** (what prod serves via blob-proxy) correctly contains both `a.v1.js` and `form.v1.js`. The **SSR fallback** page renders identical form markup but only pulls `a.v1.js` (injected by `LandingPagePublishedRenderer.tsx`); `form.v1.js` is injected only by `htmlGenerator.ts:302` (gated on `hasForms`). On the SSR path the form therefore has no submit handler.

Per `CLAUDE.md`, custom-domain requests fall back to SSR through a slug-for-host lookup — so a custom-domain page could serve a non-submitting form. Worth confirming which requests actually land on the SSR path in prod.

---

## F11 · P3 · Wizard copy leaks SaaS wording into other businessTypes

Manufacturer run (`nmzl0brZggz5`):
- Offer slot placeholder: **"Start a free 14-day trial"** — for a CNC machining shop asking for drawings.
- Understanding slot label: "What can it do? (key features)" rather than anything manufacturer-shaped.

The engine correctly owns the *shape* (that's D9/D10); the businessType entry is supposed to relabel + give examples. The `wizardFields` copy is still the placeholder quality the scale-01 audit flagged. Cheap to fix, and it's the first impression for every non-SaaS lead.

**Broader than one businessType.** The agency run (`bibO4F6MfOI8`, **trust** engine) shows the same
offer placeholder — *"Start a free 14-day trial"* — for a performance-marketing agency asking for a
strategy call. So this is the shared default placeholder leaking into every engine, not a gap in the
manufacturer entry. Its *other* labels were correctly trust-shaped ("What do you do for clients?",
"Best result you can claim?"), which is what makes the trial placeholder stand out.

---

## F25 · P2 · `LinkTargetPopover` is missing on hearth and lex — no way to set any link target

**Spec.** scale-04 / TC-04.10: *one shared `LinkTargetPopover`, the same control everywhere.*

**Reality.** Files importing it, per template:

| meridian | vestria | surge | granth | lumen | techpremium | **hearth** | **lex** |
|---|---|---|---|---|---|---|---|
| 2 | 3 | 2 | 3 | 2 | 2 | **0** | **0** |

**Repro.** Token `0dG4f5wmo93H` (lex). Selected the header, selected a nav item. The element toolbar
offers only Bold / Italic / Underline / align / font-size / colour / AI-variations. A DOM sweep for
the trigger returns nothing:
```js
document.querySelectorAll('button[aria-label="Set link target"]')   // → 0
document.querySelectorAll('.sg-nav-link-wrap')                      // → 0
```
`LinkTargetPopover.tsx:130` renders `aria-label="Set link target"` with a `Link2` chain icon, and
surge's `WarmNavHeader.tsx:134` mounts it behind `{edit && …}`. So on surge it appears. On hearth and
lex nothing does — `href` is a plain static prop (`hearth/blocks/Header/WarmNavHeader.tsx:14`).

Two of the three **trust** templates therefore ship nav and footer links the user can rename but can
never re-point. The first report recorded *"'Set link target' / 'Remove link' controls present on
every nav + footer link"* — that observation was made on **meridian**, and does not generalize.

**Bonus: a two-identifier collision that makes this hard to see.** `WarmNavHeader` exists **twice** —
`hearth/blocks/Header/WarmNavHeader.tsx` and `surge/blocks/Header/WarmNavHeader.tsx`. lex dispatches
via `resolveServiceBlock` → hearth's blocks, so the editor block-name badge reads `WarmNavHeader` on a
lex page while rendering hearth's component. The badge tells you the layout name, not which file ran.
This is exactly the trap `/new-template` §"two-identifier discipline" warns about.

---

## F29 · P1 · Republishing silently turns analytics OFF

**Repro.** Published `qa-scale-vestria` with **"Enable analytics tracking" ticked** →
`PublishedPage.analyticsEnabled = true`, and the blob carried the `a.v1.js` beacon.

Then I hit **Publish** again to ship a hero-variant change. The *Republish Your Page* dialog reopens
with the checkbox **unchecked** — it does not reflect the page's current setting. I clicked
**"Update Published Page"** without touching it. Result:

```
analyticsEnabled: true  →  false
a.v1.js in published HTML:  2 refs  →  0 refs
```

Confirmed twice: the checkbox reads `checked === false` on every republish, regardless of stored state.

**Impact.** Any customer who republishes — a copy tweak, a new page, anything — silently loses
analytics from that moment on. Nothing in the dialog says so; the copy still reads *"Track pageviews,
CTA clicks, and form submissions."* Their dashboard simply stops accumulating, and the cause is
invisible. Re-ticking the box restores it (verified: `analyticsEnabled → true`, beacon back).

**Fix.** Initialize the checkbox from `PublishedPage.analyticsEnabled` on the republish path. The
dialog already knows it is a republish — it renders "Currently published at: …" and the button says
"Update Published Page" rather than "Confirm & Publish".

---

## F30 · P2 · A failed lead-notification email is invisible to everyone

Tested end-to-end at your request. Submitted a real lead through the published contact form
(`/p/qa-scale-vestria/contact`), with `LEAD_NOTIFICATION_EMAIL` set:

- `POST /api/forms/submit` → `200`, `FormSubmission` row written with all 7 fields. ✓
- The email **never sent.** Resend replied:
  ```
  403 validation_error — "You can only send testing emails to your own email address
  (hello@lessgo.ai). To send emails to other recipients, please verify a domain at
  resend.com/domains, and change the `from` address to an email using this domain."
  ```

The 403 is a configuration fact (`LEAD_NOTIFICATION_FROM` is unset, so
`sendLeadNotification.ts:49` falls back to the shared `onboarding@resend.dev` sender, which Resend
restricts to the account owner). **The defect is what happens next.** `sendLeadNotification.ts:94`:

```ts
if (!res.ok) {
  const body = await res.text().catch(() => '');
  logger.warn(`sendLeadNotification: Resend responded ${res.status}`, () => body.slice(0, 300));
}
```

A `console.warn` on the server, and nothing else. No Sentry capture, no `UsageEvent`, no flag on the
`FormSubmission` row, no retry, no surface anywhere in the dashboard. On Vercel that line lands in a
log stream nobody reads. **A customer's lead is captured and the notification quietly evaporates** —
the founder believes the form works because the submission row exists.

`sendBlogPostNotification.ts` shares the shape, so it likely shares the blind spot.

**Fix.** Capture the non-OK response to Sentry (it's already wired), and persist a
`notifiedAt`/`notifyError` on `FormSubmission` so the dashboard can show "lead saved, email failed".
Separately: verify a domain and set `LEAD_NOTIFICATION_FROM`, or lead email cannot work for any
recipient other than `hello@lessgo.ai`.

---

## F27 · P2 · A raw ZodError JSON blob is shown to the user when generation fails

Token `I-fwXvbaMwzP`. Generation failed and the "Generation hit a snag" panel rendered, verbatim, in
the customer-facing wizard:

```
[ { "code": "invalid_union", "unionErrors": [ { "issues": [ { "code": "invalid_type",
"expected": "string", "received": "object", "path": [ "footer", "elements", "link_columns" ],
"message": "Expected string, received object" } ], "name": "ZodError" }, … ] } ]
```

~1,200 characters of internal schema paths where a sentence belongs. Compare the sibling error states,
which are correctly written for humans: *"Too many requests. Please try again later."* and
*"Could not read that website."* Whatever formats those should format this.

### The underlying defect (P1) — an `ai_generated` array whose shape the prompt never declares

It failed **twice in a row on different fields**, so this is not drift:

1. `footer.elements.link_columns` — object where an array is required
2. `footer.elements.legal_links` — object where an array is required

The prompt's "Collection schemas (for array fields — emit the exact shape)" block
(`copyPrompt.ts:170-184`) documents exactly fifteen keys:

> `nav_items · stats · values · features · industries · items · swatches · rows · steps · testimonials · logos · tiers · assurances · footer_columns · link_columns`

**`legal_links` is not among them — it appears zero times in `copyPrompt.ts`.** Yet
`elementSchema.ts:381` declares it `requirement: 'optional'`, **`fillMode: 'ai_generated'`**,
`constraints: {min: 0, max: 4}`. So the model is *asked to fill an array element whose shape it is
never shown*, and it reasonably emits an object. Zod then rejects all five union branches and the whole
generation dies.

Two things follow:
- **`legal_links` needs a Collection-schemas entry** (and `link_columns`, though documented, still drifted
  once — worth a tolerant parse that coerces a lone object → `[object]`).
- **`legal_links` is only consumed by `lumen` and `techpremium` footers** (grep: no other template reads
  it), yet it sits in the shared *product* element schema, so it is requested on **vestria** — a template
  that never renders it. An optional element nothing will draw is hard-failing the build.

Meanwhile `Continue` stays enabled beside the failure (same as **F21**), and `Try again` re-rolls the
same prompt, so it can fail repeatedly. `Skip to editor` is offered, which is the only escape.

---

## F28 · P3 · `slugify` leaves orphan hyphens — and three different implementations exist

Collection slugs are code-derived (correctly — never AI). The function they derive through,
`src/lib/normalize.ts:5`, hyphenates **before** it strips punctuation, so any removed character leaves
its separators behind:

```ts
export function slugify(str: string): string {
  return str.toLowerCase().trim()
    .replace(/\s+/g, '-')        // "Blades  &  Discs" → "blades-&-discs"
    .replace(/[^a-z0-9-]/g, ''); // drops "&"          → "blades--discs"   ← orphan hyphen
}
```

Observed live — I renamed a product to `Turbine Blades  &  Discs!!` at the structure gate and the
brief persisted:
```json
{ "name": "Turbine Blades  &  Discs!!", "slug": "turbine-blades--discs" }
```

| input | actual | expected |
|---|---|---|
| `Widget & Co.` | `widget--co` | `widget-co` |
| `Café Crème` | `caf-crme` | `cafe-creme` (needs NFKD) |
| `A/B Testing` | `ab-testing` | `a-b-testing` |

There is no repeated-hyphen collapse and no leading/trailing trim. **And the repo already contains two
correct implementations** that this one doesn't share:
- `src/hooks/editStore/pageActions.ts:77` — `replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')` ✓
- `src/app/dashboard/blog/[slug]/[postId]/components/BlogPostEditor.tsx:24` — same, plus `.normalize('NFKD')` ✓

Three slugify functions, and collections use the only broken one. These slugs become URL path segments,
so this is user-visible the moment collection routing ships. Collapse to one shared implementation.

---

## F26 · P3 · `Link.source` is written by some templates, dropped by others, and read by nobody

`src/types/destination.ts:41` defines the nav-link contract:
```ts
export interface Link { dest: Destination; source: 'derived' | 'manual' }
```
with the comment that `source` *"records whether the destination was hand-picked (`'manual'`) or derived
from a site source such as the sitemap"* — i.e. the flag that should stop an auto-seed from clobbering a
user's edit.

Every `LinkTargetPopover` `onChange` handler, side by side:

| Site | Handler | Keeps `source`? |
|---|---|---|
| `meridian/…/MeridianNavHeader.tsx:149` | `updateNavHref(item.id, link)` | ✓ |
| `surge/…/WarmNavHeader.tsx:140` | `patchItem(item.id, { href: link })` | ✓ |
| `lumen/…/LumenNav.tsx:130` | `patchItem(item.id, { href: link })` | ✓ |
| `vestria/blocks/editPrimitives.tsx:124` | `saveField(ctx, hrefKey, resolveDestination(link.dest))` | ✗ |
| `granth/blocks/editPrimitives.tsx:124` | same | ✗ |
| `surge/…/ContactFooterRich.tsx:279` | `patchLink(l.id, { href: resolveDestination(…) })` | ✗ |
| `lumen/…/LumenFooter.tsx:134,162` | same | ✗ |

So it's inconsistent *within* a template (lumen's nav keeps the object, lumen's footer flattens it).
Confirmed live: re-pointing a vestria nav item through the popover persisted `href: "/industries"` — a
bare string, not a `Link`.

**And nothing consumes it.** The only reference to `.source` in the whole tree is the type guard at
`destination.ts:79`. Grep confirms no seeder, renderer, or migration reads it.

**Not currently a live bug** — TC-04.13 passes, because the nav seed only runs at generation, not on
load. (Verified: re-pointed a nav item, hard-reloaded, edit survived.) But the field that exists to
protect user edits is dead, so the moment anything re-seeds nav on an existing project, edits are lost
silently. Either wire `source` into the seed guard or delete it from the type.

---

## F24 · P3 · Footer quick-links are AI-authored and miss pages the user added

`9knkYn8_QZpE` footer (`VestriaFooter`, `aiGenerated: true`) lists Home / About Us / Product
Catalogue / Contact Us — but **not `/industries`**, the page added at the 7b gate. The **header** nav
for the same project is correctly sitemap-derived (see TC-04.12) and does include it.

So the two navs disagree on the same project: one derived, one authored. A user who adds a page at
the gate gets it in the header and never in the footer. Either derive the footer's "Quick Links"
column from the sitemap the way the header is, or stop presenting an AI-authored link list as
navigation. Related to **F7** (meridian's single-page nav ships dead anchors) — both are "nav is not
derived from the actual page/section list".

---

## F18 · P3 · "Layout" appears when only one variant is eligible

Meridian's hero declares two variants, but `EditorialPhotoHero` carries `requiresAssets: ['photos']`
and this page has no `hero_image`. Eligibility filtering works correctly — the modal offers only
"Terminal hero". But the **Layout button still renders**, so the user opens "Change hero style" and
finds a single card marked *Current* with nothing to choose. Either hide the button when the eligible
count is 1 (as it already is for genuinely single-variant sections like `ArcCTA` — TC-09.2 passes),
or explain why the alternative is unavailable ("Add a hero image to unlock the photo hero").

---

## F12 · P3 · `TabManager` throws on every page unload

```
InvalidStateError: Failed to execute 'postMessage' on 'BroadcastChannel': Channel is closed
    at TabManager.sendMessage (src/utils/tabManager.ts:94)
    at TabManager.destroy   (src/utils/tabManager.ts:142)
```
Three per unload, wrapped by Sentry, so it reaches production error tracking. Pre-existing, unrelated to scale-01..10 — guard `sendMessage` with a closed-channel check.

---

## What is working (don't touch)

Worth stating plainly, because most of the scale surface is solid:

- **scale-02 is excellent.** Universal entry (one input, no persona gate), classification, playback sentence, the correction chooser (8 businessTypes + "Something else"), the serve gate, MANUAL-ONBOARD capture, the fast-track double-intent, and the admin Demand Board all work — and the user-facing copy matches the spec **verbatim**, including "Not automated yet — someone from Lessgo AI will connect with you shortly." and "Sushant will connect with you shortly to personalize."
- **Demand board diagnoses correctly**: photographer → `rungC:gallery` / engine `work`; restaurant via "Something else" → `rungA:unclassified` / engine `place`. Fast-track row pinned + badged.
- **scale-08**: `/admin` Business Types table renders all 8 entries with correct serveability (photographer alone red, "missing: gallery").
- **scale-06**: one wizard for all engines; bare one-liner = 6 questions; guided differentiator chips seed an editable textarea; product now has a proof step; success redirects to `/edit/[token]`.
- **scale-07**: the 7b gate is real and load-bearing. Single-page: hero pinned, required rows locked, reorder honored into generation. Multipage (manufacturer → vestria, auto-selected): "Your site plan" with 4 pages, code-derived slugs (`/`, `/about`, `/services`, `/contact`), Home has no Remove button (clamp law), and **deleting `/services` produced "Writing the copy — page 1 of 3"** and a 3-page project — deleted means never generated.
- **Proof-drop rule works** where it's a real T2 boolean: manufacturer run with testimonials OFF produced zero testimonial sections anywhere. (F2 is specifically about what happens when it's ON.)
- **scale-05 goal machinery** is right everywhere except the render: 18 intents, correct per-businessType `likelyIntents` (saas → demo/free-trial/signup-free/waitlist; manufacturer → enquiry/request-quote), AI guess pre-selected, param fields per intent, form seeded and wired to `#form-section`.
- **Published output** (blob) is correct: full 4-field form, both scripts, role + placement attributes on every CTA, all 7 section wrappers carrying `id` + `data-surface`.

---

## Closed in the second pass

| Case | Result |
|---|---|
| TC-04.18 dashboard CTA breakdown | **PASS** — `CtaBreakdown` renders "Button clicks by placement". Its data is garbage (`Unknown section · 2 primary`) purely because of F9's stale prod beacon. |
| TC-09.2 single-variant → no Layout | **PASS** — `ArcCTA` toolbar has no Layout button. |
| TC-09.3 vestria hero swap | **PASS** — re-renders, copy preserved. (This is what proved F3's real root cause.) |
| TC-09.5 surge clamp warning | **PASS** — copy is exact and offers Cancel. |
| TC-09.4 / TC-09.6 undo after swap | **FAIL → F17** — undo restores neither layout nor the dropped card. |
| TC-09.7 photo hero gated by `hero_image` | **PASS** (eligibility) / **F18** (button still shown). |
| TC-05.10 `app` store badges | **FAIL → F16** — lead never reaches the wizard. |
| TC-06.8 chip sets differ per engine | **PASS** — trust set is distinct from thing set. |
| TC-03.3 promised-asset slots labeled | **PASS** — vestria hero shows a `HERO IMAGE` labeled placeholder. |
| TC-07.11 / 07.12 swap changes zero words | **PASS on vestria** (internalDispatch), **FAIL on surge** (F17), **unverifiable on meridian** (F3). |

## Closed in the third pass

| Case | Result |
|---|---|
| TC-03.2 images-at-birth on vestria | **PASS** — `9knkYn8_QZpE`: 11 Pexels URLs, one per `VestriaIndustriesGrid` item on both `/` and `/industries`, queries keyed to item titles ("Education Technology", "Embedded Systems"). 3 imgs render on home at 940×627, none broken. |
| TC-07.8 multipage "Add a page" | **PASS** — the Industries chip adds `/industries` with a code-derived slug; it then generated ("page 1 of **5**"). |
| TC-07.9 gate edits land pre-copy | **PASS** (again, additive direction) — added page ⇒ generated page. |
| TC-10.1 collection node | **FAIL → F19** — no node even for a pure product-catalogue site. |
| TC-08.8 `businessType` inert on first scrape | **Reclassified**: not benign dormancy — it is the cause of F19. |

## Closed in the fifth pass

| Case | Result |
|---|---|
| TC-02.2 unknown token → `/dashboard` | **PASS** |
| TC-02.11 gate is server-authoritative | **PASS** — forged `serve:true` ignored; server re-ran `decideServe` |
| TC-04.10 shared `LinkTargetPopover` | **PASS on vestria / FAIL → F25 on hearth+lex** |
| TC-04.13 seed not re-applied after edit | **PASS** (see F26 on the dropped `source`) |
| TC-06.14 reload mid-wizard rehydrates | **PASS** |
| TC-09.13 lex/lumen/granth/techpremium → no Layout | **PASS** |
| TC-10.2 / 10.3 / 10.4 / 10.6 / 10.8b | **PASS** against a forced fixture — `CollectionNode` is sound |
| TC-05.8 subscribe-newsletter | **CODE-ONLY** — premise wrong (M4, not M1); behavior holds via special-cases |

## Still to run

Everything below is blocked on a decision or a defect, not on effort.

**Closed by the publish run (`qa-scale-vestria`, published 2026-07-10):**
- TC-04.5 section destination → **FAIL → F23** (`#contact` has no target)
- TC-04.17 beacon attribution → **F9 proven**: prod's `a.v1.js` has 0 occurrences of `placement`/`role`
- TC-04.18 dashboard CTA breakdown → renders; data is `unknown` for the F9 reason
- TC-04.22 republish preserves analytics → **FAIL → F29**
- TC-05.15 live form submit → **PASS** (`FormSubmission` written); lead email → **F30**
- TC-09.12 per-variant publish parity → **PASS for `internalDispatch`**; registry dispatch still dead (F3)
- TC-10.x published multipage routing → `/contact`, `/about`, `/industries` all serve 200

**Still needs a decision:**
- TC-04.7–04.9 external/whatsapp/call/email/social/download destinations — no reachable goal produces
  them; would need a hand-authored CTA.
- TC-X.1 full dual-renderer parity sweep — F1 is a confirmed parity break; a systematic sweep is owed.
- TC-04.19 legacy-page byte parity.

**Blocked by an open defect:**
- TC-10.2–10.7 *through the product* — blocked by **F19** (the component itself now verified via fixture).
- TC-10.5 work-engine structure slot, TC-06.13 writer upload gate, TC-05.9 follow strip — blocked by **F15**.
- TC-07.11–07.14 template-swap shortlist — blocked by **F4** (no picker exists).
- TC-04.2 goal-change → GOAL_REF re-point — no reachable post-generation goal editor (**F6**).
- TC-04.11 derived links don't move on goal change — depends on `Link.source`, which is dead (**F26**).

**Deliberately skipped (would send real email / needs a second account):**
- TC-02.24 founder lead email; live form submit → `FormSubmission`; TC-02.20 `/admin` as non-admin.

**Genuinely unrun, low value:**
- TC-05.13 WhatsApp message editable (no M2 goal reachable from the 8 businessTypes' `likelyIntents`).
- TC-07.7 same Brief ⇒ same sections on meridian & vestria; TC-X.4 determinism — each needs paired
  generations and, given **F27**'s flakiness, would not isolate cleanly right now.
- TC-09.11 legacy project → old selector.

**Environment note.** One generation attempt failed with *"Generation hit a snag — Too many requests."*
(provider 429). Retried clean. Not a product bug; the error screen correctly offered `Try again` and
`Skip to editor`.
</content>
