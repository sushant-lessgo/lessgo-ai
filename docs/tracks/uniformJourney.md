# Uniform Journey — track doc

**Status:** analysis agreed + build architecture agreed 2026-07-20; not specced. CMS amendments (findings 1-4 below) SENT to the in-flight cms-collections session 2026-07-20.
**Thesis:** one onboarding journey serves all 5 copy engines. Variation is declarative seam data, never a branch in a shared component.

---

## Problem

The journey shell (E1) is engine-agnostic and proven, but only `work` has a seam. `thing` and `trust` still run the older linear slot wizard. Step 2 ("Show your work") is hardcoded to photo upload, which is photographer-shaped even within the work engine.

Underneath that: **three live customers, three incompatible answers to "where does catalog data come from."** None of them is a real mechanism.

---

## Evidence — the three customers

| | Photographer (work) | Naayom (thing) | Scalifix (trust) |
|---|---|---|---|
| Template | atelier | techpremium | surge |
| Journey | full E1 journey (pilot) | old linear wizard | old linear wizard |
| **How built** | journey | **hardcoded** `archetypes.ts:600-679` | **real self-serve** |
| Pages | multi | multi (9 detail) | single (anchor nav) |
| Catalogs | 1 (groups/photos) | 1 (products) | **3** (services, case studies, packages) |
| Catalog source | user uploads | hardcoded seed | **AI prose in fixed blocks** |
| Price | required, blanket scalar | none (sales-led) | 3 tiers, ranges + duration |
| Conversion | WhatsApp / booking / form | enquire | booking link (Calendly) |

**Scalifix is the load-bearing data point** — the only one built through the real self-serve flow. Its six services and three case studies are generated prose inside fixed blocks, not data. The owner cannot add a fourth case study except as a copy edit. That is what every self-serve user gets today.

---

## Field inventory — what generalizes

Work journey collects ~24 real inputs. **~17 are universal.**

**Universal spine:** entry one-liner/URL + the whole classify block (`oneLiner`, `summary`, `businessName`, `offerings[]`, `categories[]`, `audiences[]`, `testimonials[]`, `deliveryModel`) · name · descriptor · audience/dreamClient · proof/praise · contact method · languages · site shape · Home/Prices/About/Contact/Blog tiles.

**Work-specific, needs per-engine replacement:**
1. The entire step-2 photo pipeline (upload, EXIF, folder-grouping, 24/150 caps, 5 correction verbs) — the single biggest non-portable block.
2. Profession wording on `groups` + `dreamClientChips`.
3. `origin: 'offer' | 'upload'` provenance + rail filtering of upload buckets — exists *only* because photos create pseudo-groups.
4. Work / Work-group / Project-story plan tiles + `/work/<slug>` promotion.
5. `WorkGroup.items[]` — modelled, never collected.

**Cross-engine deltas that are legitimately real** (not accidental): `capabilities`, `differentiator`, `objectionFacts` are thing-only. A thing-engine visitor evaluates against alternatives so the page must argue; a work-engine visitor looks at the work — the work *is* the argument. The copy-engine thesis showing up correctly in the field list.

`realNumbers` is thing-only today but scalifix's entire page runs on it ("PROOF ↗ The numbers we moved", "BY THE NUMBERS ↗"). Shared once slots stop being filed under engines.

---

## The design

**Uniform = one shell, one step sequence, one facts spine. Variation is data.**
Invariant: *no shared component reads the engine id.*

| Step | Does | Varies |
|---|---|---|
| 1 Entry | one line or URL → classify → engine belief, offerings, audiences, testimonials | nothing — already uniform |
| 2 Catalog | "what are the repeating things on your page, and what role does each play?" → confirm/edit Collections. Renders **iff `entry.offerings[]` non-empty** | which collections + their roles + field schemas (CMS presets) |
| 3 Questions | uniform frame, shared slot library, cap 5, priority-ranked | which slots + wording |
| 4 Plan | uniform; tiles **derived** from what exists (collections → pages) | nothing |
| 5 Build | uniform frame | generation driver (per-engine) |

Three variation layers, all declarative: **slot selection**, **wording**, **generation driver**. Steps 3 and 5 already work this way — their frames have no engine component at all.

### Validation

| | Step 2 | Step 3 slots |
|---|---|---|
| Photographer | Projects — gallery-typed, folder upload | identity, groups, price, establishment, dreamClient, praise, contact, languages |
| Naayom | Products ×9 — spec-pairs, images | name, oneLiner, audience, capabilities, differentiator, objectionFacts, offer, realNumbers, goal |
| Scalifix | 3 collections — Services, Case studies, Packages | name, descriptor, audience, realNumbers, praise, contact (booking) |
| Solo consultant (one offer) | *skipped* (no offerings) | name, descriptor, audience, credentials, contact |

### Key correction

**The catalog step is business-gated, not engine-gated.** A trust-engine agency (scalifix) has three catalogs; a single-offer trust-engine consultant has none. The gate is `entry.offerings[]`, which the classify already produces and already seeds into `groups`. This removes a per-engine branch rather than adding one.

Caveat: the genuinely catalog-less set is narrow — single-offer consultant, single-product SaaS, link-in-bio, RSVP. A dentist (cleaning / whitening / implants) *does* have an offer catalog, just a short prose-y one. The gate holds, but it fires more often than "only work-engine businesses have catalogs" would suggest.

### Collection roles — step 2's actual shape

Not one collection per engine. A small set of **roles**, each engine using a subset:

| Role | work / photographer | thing / naayom | trust / scalifix |
|---|---|---|---|
| **Offer** — what you sell | Galleries | Products ×9 | Services ×6 |
| **Proof** — evidence it works | *same as offer* | (testimonials / realNumbers only) | Case studies ×3 |
| **Price** — packages / tiers | blanket scalar | — (sales-led) | Packages ×3 |

**In work, offer and proof collapse into one collection** — a photographer's portfolio is simultaneously what you're buying and the evidence it's good. That is precisely why the work engine has no `capabilities`/`differentiator` slot and doesn't need to argue. The field inventory and the copy-engine thesis agree here, which is evidence the model is real rather than convenient.

Thing splits them the other way: products carry the offer, proof comes from `realNumbers` + testimonials, price often doesn't exist at all.

**Per-item vs page-level.** "What it does" exists at *both* levels in thing — `capabilities` as a page-level wizard slot, `features[]` per product record. They collapse for a single-product business and diverge across a 9-product catalog. Implies a fork inside thing: single-product SaaS has no catalog (the page *is* the product); naayom has nine.

---

## What has to change

1. **`facts.work` → `facts.core` + thin per-engine block.** Rail vocabulary is already 10-of-11 universal (`name, descriptor, location, reach, languages, groups, establishment, dreamClient, praise, contactMethod, note`) — only `groups` is work-shaped.
2. **Catalog → CMS Collections**, many per site. Retires `groups[].photos`.
3. **Step sequence from the seam** — `FIRST_STEP=2` / `LAST_STEP=5` and the 2–6 dots are hardcoded (`JourneyShell.tsx:100-104`, `JourneyTopBar.tsx:22`).
4. **Price demoted** from required scalar to optional slot; packages become a Collection. Today work writes one blanket price onto *every* group — cannot express scalifix's 3 tiers, and naayom has no price at all.
5. **Shared slot library** — engines select + word, don't define.
6. **Plan tiles derived** from collections + facts, not a hardcoded per-engine list.

## What can never be uniform (and that's fine)

Generation driver · question set · wording · template shortlist. All four are seam data, not branches.

---

## Build architecture (agreed 2026-07-20)

Repeat the skeleton pattern — shell owns structure, closed contracts, variation = compile-time data, invariants enforced by TESTS not convention. Four layers, strict order:

**Layer 0 — data spine (in flight).** cms-collections Phase 1 + the 4 amendments below. Freezing this wrong is the only unrecoverable mistake in the track — hence amendments sent before model freeze.

**Layer 1 — cheap structural de-hardcoding (small specs, BEFORE engine #2):**
- `facts.core` split (10 universal keys) + thin `facts.<engine>` block. Contract-first: paper-check core shape against ALL 5 engines (place/quick-yes on paper, ~1hr) before freeze — avoids re-freeze at engine #4.
- Shell derives step list/dots from seam-supplied array (kill `FIRST_STEP=2`/`LAST_STEP=5` constants). NOT the full manifest abstraction — just the constants. Business-gated step-2 skip falls out free.
- Price demoted out of core at the same split (work keeps its scalar in its engine block temporarily).
- Step 2 inverted: generic Collection step (presets + roles + `entry.offerings[]` gate); engines contribute DATA — preset schemas, wording, and **field-type ingesters**. Photo pipeline (EXIF/grouping/caps) becomes work's gallery-type ingester plugged into the generic step. Biggest single refactor; retires `groups[].photos` + `origin` provenance.

**Layer 2 — engine #2 = trust/scalifix as forcing function.** Built ON the new spine, deliberately WITHOUT extracting the slot library — trust supplies slots/wording via seam data as work does; copy-paste allowed. Copy-paste pain = verified seam; log each.

**Layer 3 — extract what N=2 proved:** slot library, derived plan tiles, full seam manifest. Engines 3-5 then = data + one generation driver each.

**Enforcement (mechanical, skinPurity-style):**
- `seamPurity` test: no shared `journey/` module imports an engine id or branches on engine — engines reach the shell only via the registry seam.
- Fail-loud asserts on every closed vocab (field types, collection roles, slot ids) — the `assertSkinTokens` pattern.
- Generation driver = one typed function per engine `(facts.core, collections, engineBlock) → draft`, zero UI imports.

**NOT building:** generic workflow/step-config framework, DB-stored journey definitions, runtime-pluggable engines. Seams stay TypeScript data modules, compile-time checked (same ruling as skins-as-code-barrels).

**Migration posture:** old linear wizard keeps serving thing/trust until the scalifix journey beats it — retire per-engine, no big bang. Naayom hardcoded seed untouched until products migrate onto CMS (paying customer, zero churn).

**Queue placement:** work-library-board → cms amendments (SENT) → work-contract-wave2 (Kundius) → Kontur spike → Layer 1 → scalifix journey (Layer 2).

**wave-2 reconciliation:** `work-contract-wave2.spec.md` keeps packages as CONTRACT fields (AI copy lane; Collections are user-authored/no-AI per cms spec). Packages likely migrate to a price-role Collection at engine #2 — wave-2 fields deliberately map 1:1 onto closed field types (image/long-text/tag/flag) so migration stays mechanical. The scalifix step-2 AI-proposal idea pokes the same no-AI boundary; eventual answer likely "AI proposes structure/seeds, user owns content."

---

## Sequencing

Do **not** extract the whole abstraction now. N=1 journey exists (work); abstracting from one example produces the wrong seams.

**Extract now** — proven by three real customers with incompatible catalog models:
- cms-collections Phase 1 (already in flight) — prerequisite for both items below
- `facts.core` extraction
- Step 2 → generic Collection step

**Extract at N=2** — currently inferred from comparing two *field lists*, not from having built two journeys:
- shared slot library
- seam-supplied step manifest
- derived plan tiles

**Engine #2 = trust / scalifix** (reversed from an earlier call in-session favouring thing/naayom). Rationale: only customer who went through real self-serve; live paying customer whose three collections are currently un-authorable prose; exercises the multi-collection case that naayom's single product list doesn't.

---

## Findings that feed `cms-collections` (in flight) — SENT as spec amendment 2026-07-20

Delivered to the cms session: (1) 10th field type stat/spec pair — ADD v1; (2) collection-level role as a SET `{offer,proof,price}` — ADD v1; (3) `featuredOnHome` per-item flag — decide before item schema freezes (or explicitly punt to home-summary-links); (4) presets — defer UI, data model must support programmatic schema seeding. Awaiting impact/pushback reply in mailbox.

1. **Missing 10th field type: stat / spec key-value pairs.** The closed 9 has no key-value type. Naayom's `specs[] {key,value}` (0-16) is the core buying signal for hardware; scalifix's case-study metrics and "BY THE NUMBERS" are the same shape. **Two of three customers need it.** The spec's own success criterion #2 ("Naayom's spec-schema Products") cannot be met without it. Higher priority than the already-deferred price/number, PDF, oEmbed types.
2. **Presets are onboarding infrastructure, not a nicety.** Spec defers them ("blank-start v1"), but step 2 needs per-discipline default schemas — otherwise onboarding hands every user a blank schema builder as step 2.
3. **`featuredOnHome`** — per-item flag promoting items into the home lineup (cap 4). CMS has no notion of promoting items to home. Confirm whether `home-summary-links` (Spec 2) covers it.
4. **Collection-level role, sibling to the existing field-level roles.** The spec has `title` / `cover` / `primaryLink` at the *field* level. Nothing marks what a whole Collection is *for*. Without it a template renders scalifix's Case Studies as a second product grid instead of as proof. Proposed closed set: `offer` | `proof` | `price`. Also carries the work-engine collapse (one collection can be both offer and proof) — so the role may need to be a set, not a scalar.

---

## Open questions — RESOLVED 2026-07-20 (per architecture agreement)

- Extract-now vs N=2 split: **as written** — no full uniform push in one go.
- Engine #2: **trust/scalifix** (self-serve provenance + multi-collection case naayom can't provide).
- `facts.core`: **own spec after CMS Phase 1**, not folded into cms-collections.
- Scalifix step 2: **manual collection creation v1**; AI-proposal from scrape = fast-follow (see wave-2 reconciliation note on the no-AI boundary).
- Stat/spec-pair 10th type: **confirmed, in cms v1** (amendment sent).
- Price: **confirmed** — demoted to optional slot at facts.core split; packages-as-Collection lands at engine #2 (wave-2 keeps packages as contract fields until then).
- Collection-level role: **confirmed, cms v1, as a SET** (work collapses offer+proof).
- Thing single-vs-multi fork: **1-product SaaS skips step 2 entirely** (the page IS the product; a 1-item collection is ceremony).
- Discipline: **captured at the decider**; stop defaulting to `photographer` on unknown.

## Still open

- `featuredOnHome` vs home-summary-links ownership — awaiting cms session reply.
- Exact `facts.core` key list — freeze only after the 5-engine paper check (Layer 1).

---

## Reference pointers

- Seam contract: `src/components/onboarding/journey/engines/types.ts:381-437` (8 keys); registry `engines/registry.ts:23-28` (work only)
- Work rail: `src/modules/wizard/work/rail.ts:460` (`applyRailEdit`)
- Work facts: `src/lib/schemas/workFacts.schema.ts`
- Step 2: `engines/work/ShowWorkStep.tsx`, `modules/wizard/work/ingest/`
- Thing contract: `src/modules/engines/inputContracts.ts:123-142`; labels `wizard/SlotReviewCard.tsx:44-100`
- Naayom seed: `src/hooks/editStore/archetypes.ts:600-679`, `buildNaayomProductPages()` :685
- Product item schema: `src/modules/audience/product/elementSchema.ts:443-513`
- Profession wording: `src/modules/engines/workVocabulary.ts:178-223`; resolver `audience/work/voice.ts:151`
- Spec: `docs/task/cms-collections.spec.md`
