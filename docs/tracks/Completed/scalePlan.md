# scalePlan — self-serve architecture

Status: WORKING DRAFT · updated 2026-07-07 (BA session: plain-language design, decision inventory, specs §5–§8, round-2 decisions §11, consistency pass)
**Implementation specs: `docs/task/scale-00-index.md` → scale-01…09** (numbered = build order; 01–03 = pilot, 04–05 = conversion machinery, 06–08 = convergence, 09 = variation). This doc stays the WHY/decisions record; specs are the coder-facing WHAT.
Goal: customer runs input→published with zero founder touch by ~site 30. Start from an audit of what today's templates already serve (§11.3); till site 20 build only on actual demand; expand by adding list entries, never by adding funnels.

---

## 1. Agreed decisions

| # | Decision |
|---|---|
| D1 | **Self-serve SaaS, not agency.** Customer runs end-to-end without founder by ~site 30. "Automatic for them", not "automatic for me". |
| D2 | **ICP = the one-conversion-action site.** Credibility page whose whole job is ONE action (form / call-WhatsApp / subscribe-follow / redirect / donate-RSVP). Transaction always **delegated via link** (Razorpay/Calendly/store). NOT software (no checkout, booking engine, portals). 100-site experiment: ~78% of commissioned-web market fits. |
| D3 | **No vertical software.** |
| D4 | **Bespoke = top-priced rare agency tier**, off-funnel. naayom/lumen grandfathered. |
| D5 | **One universal entry.** AI classifies; user confirms in 1 tap. Categories are INTERNAL — user never self-classifies upfront. |
| D6 | **Machine decides FACTS, user decides TASTE.** No AI taste-scoring. Template shortlist by hard filters only; auto-select only when exactly 1 fits. |
| D7 | **Variation = parameters over template count** (accent × typeface × mood). 1 flagship per copy engine before breadth. |
| D8 | **Input-first, not type-first.** One-liner/URL → AI fills Brief → page 2 plays it back in user language. Type chooser exists only as correction UI / low-confidence fallback. (Type-first fails: users answer in output words — "portfolio", "shop" — that don't map to how pages persuade; also violates D5.) |
| D9 | **Any difference between two customers lives in a list entry, not an if-statement.** (Manufacturer = 24 files keyed on `templateId==='vestria'` = the violation.) |
| D10 | **Copy engines are code, few (~4–5 ever), split by HOW THE VISITOR DECIDES. Business types are list entries, unbounded.** |
| D11 | **Templates attach to: copy engine (hard) + capabilities (hard) + design style (soft, sorts shortlist only). NEVER to a business type.** User always picks; style only orders the picker (worst case of wrong style = wrong first card, not wrong site). |
| D12 | **CTA buttons and links are two different objects** sharing one destination vocabulary. Primary CTA = the goal, by reference. Links derive from site data. Spec §5. |
| D13 | **Social profiles: scrape-prefill + editable in editor** — site-level list, not per-link config. |
| D14 | **Secondary CTA: NO default.** User configures if wanted. |
| D15 | **Conversion beacon fires on primary AND secondary CTA clicks** (tagged which). |
| D16 | **Goal = intent × mechanism × destination** (§6). Intent (what visitor commits to) feeds copy; mechanism (what button does) feeds CTA/form machinery. Today's enums staple them together — why goal is a dead wire. **Primary-only to start** (D14). `buy` renamed **buy-via-link** — enforces D2 (transaction always delegated). |
| D17 | **Serve gate after page-2 CONFIRMATION** (§7) — decides on the confirmed Brief, never the AI guess. Serveability = computed query over the 3 lists (business type entry + live engine + fitting template), NOT a hardcoded allowlist. No coverage → MANUAL-ONBOARD capture ("someone from Lessgo AI will connect with you shortly") → founder notified + admin demand board; extra button click = **double intent → fast-track**. Never a full exit. Unmet demand IS the template roadmap. |
| D18 | **Engine owns the element contract; uiblocks conform — never the reverse.** Block declares consumed elements + capacity (cards 3–6) + asset needs; needs different content ⇒ it's a different section type, not a variant. Copy never waits for block choice ⇒ block swap = taste, 1-click, no regen (template-swap trick, one level down). Initial block = template's declared default; eligibility filter = capacity∧assets (facts); user swaps in EDITOR (LayoutChangeModal exists) — never a wizard step. Until 2+ blocks/section exist (P4), filter is a no-op; surge's `Math.random()` testimonial pick = this decision done wrong (machine deciding taste, unstably). |

## 2. The design in plain words — 3 lists + 1 record

### List 1: Business types (unbounded, pure config)
One entry per kind of business (SaaS, hardware maker, cloth manufacturer, photographer, dentist, writer…). Each entry says only:
- which **questions** the wizard asks (photographer: genres/style/clients · manufacturer: whatYouMake/industries)
- which **proof** we ask for (portfolio / testimonials / screenshots / menu)
- which **copy engine** writes the page
- which **design style fits by default** (hardware→tech/minimal · cloth maker→editorial/craft)
- matching **scrape-extraction schema** so URL import prefills the same fields

Customer #5 is a new kind of business → add entry #5. No funnel code.

### List 2: Copy engines (code, deliberately few — ~4–5 ever)
The only real code forks. **A copy engine = the argument machine: Brief in → (1) strategy questions the AI answers (awareness, oneReader/oneIdea), (2) section grammar (argument order + which objections), (3) element contract (what each section owes the argument), (4) voice rules → copy fan-out fills the words.** Concretely it IS today's `src/modules/audience/<x>/` folder (strategy prompts + sectionSelection + elementSchema + voice), renamed and keyed off the Brief instead of templateId. Division of labor: goal = what the visitor should DO · engine = what they must BELIEVE first, in what order · copy call = in which words · template = in what clothes. Engine never decides template/blocks/look (firewall) nor CTA mechanics (§5/§6) — it receives the goal as a fact and aims the argument at it.

New engine ONLY when the visitor's decision question changes (Kinshu vs Golden Shadow: both "does this thing solve my problem" → same engine, different facts/voice = list data. Kinshu vs writer-Dinesh: "do I like his work" → sections change CATEGORY, not values → different engine). Split by how the visitor decides, because that changes what the page must say:

| Engine | Visitor is… | Page persuades via |
|---|---|---|
| evaluating a THING | SaaS, hardware, cloth, app | features, proof it works |
| trusting a PERSON/FIRM | dentist, consultant, agency | credentials, testimonials, process |
| browsing WORK | photographer, writer, designer | the work itself |
| checking a PLACE | restaurant, shop, venue | photos, menu, hours, directions |
| one quick YES | app download, RSVP, waitlist | one claim, one button |

Naayom + Golden Shadow share ONE engine (evaluating a thing); everything different about them is list data + design style. "Place" kept narrow — dentist = trust-engine + `hasPhysicalLocation` capability flag (injects map/hours blocks), not place-engine. Router tiebreakers, in order: sells defined expertise → trust · portfolio is the proof → work · browsing photos/menu IS the decision → place · **offer already understood, page only ASKS (link-in-bio, RSVP, known-thing waitlist) → quick-yes** · else thing. Quick-yes is about how little persuading is needed, NEVER keyed on M3 redirect — kathaworld.com has a store-redirect button atop a full thing argument (features/how-it-works/testimonials); the old "destination elsewhere → quick-yes" rule would have misclassified it.

**Field test 2026-07-07** (live fetches: kathaworld + scalifix + vishwas-dubey + goldenshadow + cirkles): 5/5 classified cleanly, no 6th engine needed. kathaworld = thing+download-app (not quick-yes — resolved). cirkles = work-engine business wrongly built as a trust page by their paid Elementor dev — the method out-designs the incumbent. goldenshadow's real 4-page nav matches our sitemap archetypes. vishwas validates `blog` as required capability.

**Master list is CLOSED at 5** (agreed 2026-07-07): a one-action page can only offer 5 kinds of reason-to-act — the thing works · the person is credible · the work itself · the place itself · nothing but the claim. A 6th would need a 6th evidence kind = exactly what D2/D3 excluded. All first-20 map to engines 1–3; place/quick-yes wait for customers (P3). Status: thing=`audience/product/` ✅ · trust=`audience/service/` ✅ · work=`audience/writer/` ⚠️ seed-only · place ❌ · quick-yes ❌.

**Engine selection rule: AI picks the engine ONLY when List 1 doesn't already know it.** Classify call outputs businessType guess → entry exists ⇒ `copyEngine = entry.copyEngine` (lookup, zero AI) · no entry ⇒ AI applies tiebreaker ladder (+ lead doubles as rung-A demand signal) → page-2 playback in user language, 1-tap correct · low confidence ⇒ chooser upfront. AI's job shrinks over time to mapping one-liners onto known types; ladder fires only for genuinely new types — precisely the leads the demand board wants flagged.

### List 3: Templates (registration entry + block code; self-describing)
Template registers `{ copyEngines[], capabilities[] (multipage, bilingual, video-hero, map…), designStyles[], looks }`. Add-template skill fills entry + blocks; template enters shortlists automatically — zero funnel code. Shortlist = filter(engine ∩ capabilities) → sort by design-style match → **user picks** (auto iff 1) → look parameters personalize. Post-gen template swap stays 1 click (copy never knows templateId — firewall sacred).

Design styles (small controlled vocab, multiple tags per template ok): tech/minimal (meridian; techpremium retired §11.4) · editorial/craft (vestria) · warm/human (hearth) · authority/professional (lex) · bold/performance (surge) · literary/quiet (granth).

### The record: the Brief (1 per project — replaces the 6-place routing confetti)
AI fills from one-liner/URL: `{ businessType, copyEngine, category, goal (one action + parameter), facts, proofAvailable, socialProfiles, structure (single/multi + pages), designStyleHint, templateShortlist→templateId, look }`. Page 2 IS the Brief shown back; taps correct it. Wizard, template shortlist, and generation read the Brief and nothing else.

## 3. Flow

```
 1 /onboarding/[token]: one line | URL | social            [user; kills /onboarding/{product,service,persona}]
 2 ONE AI call: scrape+understand+classify → Brief draft   [AI fills; engine by LOOKUP if type known, ladder if new]
 3 page 2: Brief playback, user language → 1-tap confirm / correct / low-confidence chooser   [user]
 4 SERVE GATE (§7) — on the CONFIRMED Brief, never the guess: SERVE | MANUAL-ONBOARD capture  [pure query over 3 lists, no AI]
 5 wizard RESOLVED (§8): ask = contract − scraped − inferred − dropped → 2–6 Qs
   (T1 words + T2 booleans; review-mode when prefilled)                                      [user]
 6 template: hard filter → style-sorted shortlist → auto iff 1, else user picks → look pickers [machine filters, user tastes]
 7 strategy (engine's): awareness · oneReader/oneIdea · sitemap proposal (clamped; slugs never AI) · sections+cardCounts [AI proposes, code clamps]
 7b STRUCTURE CONFIRM — universal, single-page too: multi = pages+sections, single = section list+order.
    Required sections locked (hero first, CTA present) · optionals toggleable · default-accept, 1 tap.
    Generalizes vestria's SitemapReviewStep; clamp law extends to single-page.                [user]
 8 assembly: sections → default blocks (capacity ∧ T2 assets, D18) → element list from engine contract [deterministic]
 9 copy fan-out per page: canonical elements · verbatim testimonials · engine+type voice · retry×2 · resume [AI writes, contract constrains]
10 IMAGES AT BIRTH: per-slot fetch, palette-scored; placeholders where T2 promised [code — wire fetchImages.ts]
11 reveal /generate/[token] → editor (T3 pixels · block/template swap free · GOAL_REF CTA) → publish [user]
```
Invariant: AI only fills or proposes; every accept is a list lookup, a set operation, or a user tap. Only AI: 2/7/9. Only user: 1/3/5/6/7b/11 — and 3/5 shrink as scrape coverage grows.
Invariant: **copy depends on engine + Brief ONLY, never template** — template conforms to the engine contract (conformance test), picked pre-strategy only so palette is known for image scoring; swap after generation changes zero words. 7b edits land in Brief.structure BEFORE copy ⇒ deleted section = no copy generated (user decisions are Brief inputs, not template inputs).
Invariant: **section list = engine CORE + capability-bound optionals** (agreed 2026-07-07). Core (hero/proof/CTA…): every template of the engine implements ALL — conformance-tested, identical across templates. Capability sections (gallery/packages/map-hours/catalog): enter the site's list only if Brief requires the capability — and the gate guaranteed the template has it. **Swap shortlist = same hard-fit query ⇒ every offerable template renders every section THIS site has.** Templates differ in what they COULD render, never in what this site needs. meridian-7 vs vestria-12 today = violation to converge (vestria extras → capability sections; both implement thing-core).
- **Core sets FROZEN now** (agreed): thing-core seeded from meridian's 7 · trust-core from hearth's list · work-core from granth/lumen. Adjust only via engine-level change, never per template.
- **7b deletion RELAXES hard-fit** (agreed): requirements recompute from confirmed structure — user drops gallery ⇒ more templates eligible. User decides, then user decides.
- **THE DESIGNER'S BAR** (agreed, the key): a template ships ONLY with all its engine's core sections designed — no partial templates, ever; conformance test is the gate, /new-template skill leads with core-set checklist. Capabilities are the only optional surface.

## 4. Decision inventory (grounded in code, scouted 2026-07-07)

Every decision from input → /generate/[token], with today's decider. ❌ = no decider exists.

### A. Entry & classification
| # | Decision | Today |
|---|---|---|
| 1 | What kind of business | User self-picks persona (11) → hardcoded map to product/service/writer (`types/service.ts:141`); anon→product |
| 2 | Customer allowed in? | Hardcoded pilot allowlist {agency,consultant,coach}; else waitlist (`api/start:16`) → replaced by serve gate §7 |
| 3 | Which wizard | Route fork product/service. Writer: NO route (dev-only seed, founder-manual) |

### B. Understanding
| # | Decision | Today |
|---|---|---|
| 4 | Which questions/extraction schema | 3 hardcoded schemas keyed audienceType + `templateId==='vestria'` (`v2/understand:34`) |
| 5 | URL prefill | AI scrape: one-liner, name, categories, audiences, features, offer, goal guess, verbatim testimonials (1 credit) |
| 6 | serviceType | Silent persona seed, no UI |

### C. Goal
| # | Decision | Today |
|---|---|---|
| 7 | Goal options shown | Product 6 (+`enquiry` manufacturer-only); service 3 shown of 6 defined. User picks |
| 8 | What goal changes | ❌ Copy-prompt hint only (`getGoalCtaGuidance`). No form, no CTA, no sections — dead wire |

### D. Proof
| # | Decision | Today |
|---|---|---|
| 9 | What proof exists | Service: 5 user booleans. Product: no assets step |
| 10 | What assets gate | Service: testimonials/logos/case-study sections. Product: nothing |

### E. Template
| # | Decision | Today |
|---|---|---|
| 11 | Which template | 6 places: default map · product store default · `?template=` param · manufacturer-persona→vestria · hardware-founder→techpremium mid-gen bridge · service picker |
| 12 | Which templates COULD fit | ❌ Registry loader-only, zero capability metadata anywhere queryable |

### F. Look
| # | Decision | Today |
|---|---|---|
| 13–16 | variant / palette / mood / hero | Vestria: user (8×3×2+2 heroes) · service: default+override, palette inferred (`inferDefaultPalette`) · meridian/techpremium LOCKED · granth seeded |

### G. Structure
| # | Decision | Today |
|---|---|---|
| 17 | Single vs multipage | Hardcode `templateId==='vestria'` (naayom multipage = separate collections mechanism) |
| 18 | Which pages | AI sitemap proposal (vestria only) + `clampSitemap` law (home forced, slugs never AI) |
| 19 | Sections per page | Product: hardcoded arrays (meridian 7, vestria 12). Service: awareness-ordered + asset gates + format — the only responsive structure |
| 20 | Block per section | Hardcoded 1:1 maps per template; one `Math.random()` (surge testimonials) |

### H. Copy
| # | Decision | Today |
|---|---|---|
| 21 | Awareness stage | AI (4 product / 4 service stages) |
| 22 | Positioning (oneReader/oneIdea · oneClient/ourPosition) | AI — the moat |
| 23 | Voice | Product: keyed `templateId==='vestria'` → tailored-trade else modern-tech (WRONG key). Service: serviceType+keywords → performance/hearth (RIGHT pattern) |
| 24 | Presentation format (packages/quote/hybrid) | AI, service only; gates packages section |
| 25 | Content contract | Fixed schema per audience; writer 100% manual, zero AI |
| 26 | Copy per element | AI fan-out per page (vestria), retry ×2 |

### I. Images
| # | Decision | Today |
|---|---|---|
| 27 | Image per slot | ❌ `fetchImages.ts` (query-from-category + palette-scored pick) built, ZERO callers. Manual in editor |

### J. Conversion machinery
| # | Decision | Today |
|---|---|---|
| 28 | Form fields | Founder manual in FormBuilder; `TEMPLATES_BY_GOAL` (3 goals) exists but NOT auto-applied |
| 29 | Form placement/wiring | Founder manual |
| 30 | Click behavior | Two parallel systems (§5). WhatsApp/call/subscribe/badge missing as structured behaviors |

### K. Language
| # | Decision | Today |
|---|---|---|
| 31 | Site language(s) | Lumen-only implicit twin-fields; no capability flag |

**Shape of the problem:** #4, 10, 17, 19, 20, 23 all key off `templateId` — the skin decides questions/structure/voice; must key off the Brief. Four decisions have NO decider (#8, 12, 27, 30) — exactly what self-serve needs. Right patterns to generalize: #21/22/24/26 (AI strategy), #14-service (infer+override), #19-service (asset-gated ordering).

**Work-backwards order:** #30 click system (✅ specced §5) ← #7/#8/#28 goal vocabulary + goal→form (✅ specced §6) ← #19 sections ← #12 template fit ← #4/#9 wizard questions ← #1 classification/router.

## 5. SPEC — click system (#30; closes #8 structurally; agreed 2026-07-07)

### Today (grounded)
Two parallel data models for "what happens on click":
1. `LinkTargetPopover` — duplicated ×6 in template code (meridian/techpremium/vestria/surge/lumen/granth) — writes RAW `href` string (`#anchor`/`/slug`/url) for nav/footer links.
2. `ButtonConfigurationModal` (+Global) — writes structured `buttonConfig` (`type: link|form|link-with-input|page`, behavior, formId) at elementMetadata; resolved by `resolveCtaHref.ts`.
Neither knows the goal exists. Social links = freeform text inside footer blocks.

### Target: two objects, one destination vocabulary

```
Destination (shared union — every type resolves to a plain href;
resolveCtaHref stays the one dumb resolver; published pages stay static HTML):
  section {anchor} | page {pathSlug} | external {url} | whatsapp {number, msg}
  call {number} | email {addr} | download {fileUrl} | social {platform, url}

CTAButton = { role: primary|secondary, dest: 'GOAL_REF' | Destination, formId? }
Link      = { dest: Destination, source: derived|manual }
```

| | CTA button | Link |
|---|---|---|
| Job | move visitor toward THE goal | wayfinding/reference (nav, legal, social, cross-page) |
| Default | **primary = GOAL_REF** — points at the Brief's goal *by reference, not copied*; change goal → every primary re-points. Secondary: none (D14) | **derived from site data** — nav←sitemap · legal←site settings (privacy generator exists) · social←profiles list (scrape-prefill, editable in editor, D13) · cross-page←sitemap slugs |
| User config | button modal: detach from GOAL_REF, pick explicit dest | ONE shared link popover (deletes the 6 template copies) = the override, not the mechanism |
| Analytics | conversion beacon, primary AND secondary, tagged (D15) — **plus per-instance attribution (agreed 2026-07-07): same goal appears as hero/mid/footer buttons; beacon carries the button's placement (section id) so analytics shows WHICH button converted** | not a conversion |
| Form | goal=form ⇒ primary opens form auto-seeded from `TEMPLATES_BY_GOAL` (kills #28's manual step) | never |

Wizard goal slot collects the goal's parameter (number / URL / form fields / platform) → lands in Brief → GOAL_REF resolves from it. By-reference is the load-bearing detail: today's per-element copied configs are why goal is a dead wire.

Overlap proof the split is right: creator, goal = "follow on Instagram". Footer IG icon = Link (derived from profiles). Hero "Follow" button = CTA via GOAL_REF to a social destination. Same destination, different object, different tracking.

Migration: dual-read shim — raw `href` (`#x`→section, `/x`→page, url→external) and old `buttonConfig` map losslessly into Destination; new writes use new shape only. No data migration.

## 6. SPEC — goal taxonomy (#7/#8; agreed 2026-07-07)

Grounded in: today's enums (product 7 / service 6, mismatched, half hidden), D2 action families, first-20 real sites.

### Mechanisms (5, finite — this IS the CTA machinery of §5)
| M | Mechanism | Button does |
|---|---|---|
| M1 | on-site form | collect fields → FormSubmission + lead email |
| M2 | direct channel | WhatsApp deep-link / `tel:` / `mailto:` |
| M3 | redirect out | external URL: store badge, Amazon, Razorpay, Calendly, aggregator |
| M4 | subscribe/follow | newsletter form or social profile links |
| M5 | scroll/anchor | secondary/wayfinding only (exists today) |

### Intents (~18; what the visitor commits to)
| # | Intent | Mech | Today | First-20 evidence |
|---|---|---|---|---|
| **Lead capture** (13/20 of first-20) |
| 1 | general enquiry | M1/M2 | `enquiry` (manufacturer-only!) | naayom, Pancholi, Right Brain, Golden Shadow |
| 2 | request quote | M1/M2 | `request-quote` | manufacturers, B2B |
| 3 | book call/consultation | M1/M3/M2 | `book-call` | Ravi, Vivek, Shyam, Wingrrowth |
| 4 | request demo | M1/M3 | `demo` | SaaS |
| 5 | book me / hire for event | M1/M2 | ❌ | Prasenjit (shows), photographers |
| 6 | enroll/register | M1/M3 | ❌ | Prasenjit (lessons), cohorts, workshops |
| 7 | apply | M1 | `apply` (defined, hidden) | programs |
| 8 | get lead magnet | M1 | `lead-magnet` | guides/checklists |
| 9 | join waitlist | M1 | `waitlist` | pre-launch |
| **Product-led** |
| 10 | sign up free | M3 | `signup` | Kinshu (AnythingBehindImage) |
| 11 | start free trial | M3 | `free-trial` | SaaS |
| **Redirect commerce** (D2: always delegated) |
| 12 | download app | M3 | `download` (no store-badge behavior) | Kathaworld |
| 13 | **buy-via-link** | M3 | `buy` renamed (implied on-site = wrong) | Fozi→Amazon, writers' books |
| 14 | order/reserve via platform | M3 | ❌ | future place-engine (Swiggy/booking) |
| 15 | pay/donate via link | M3 | ❌ | Razorpay/UPI |
| **Audience building** (5/20 of first-20) |
| 16 | subscribe newsletter | M4 | `subscribe-newsletter` (defined, hidden) | Vishwas |
| 17 | follow on social | M4 | ❌ **— 20% of real list** | Dinesh, Anu, Bhawishya, Raz (all 4 writers) |
| **Event** |
| 18 | RSVP/attend | M1/M3 | ❌ | launches, readings |

NOT goals (out of ICP, D2/D3): on-site checkout, live booking engine w/ inventory, member portal. "Branding only" (Pancholi) isn't a goal — resolves to #1; every page keeps ONE action.

### Wiring
- Brief carries `goal = { intent, mechanism, destination/param }` — e.g. writers `{follow-social, M4, [instagram, amazon]}`; Kathaworld `{download-app, M3, play-store-url}`. Primary-only (D14/D16).
- Intent → copy-prompt guidance + section emphasis (extends `getGoalCtaGuidance`).
- Mechanism → CTA behavior (§5 Destination) + form auto-seed (revives `TEMPLATES_BY_GOAL`; closes #8/#28).
- Wizard never shows 18: business-type entry pre-filters to 3–4 likely intents; AI pre-selects from scrape (goal guess already extracted today). Goal slot collects the parameter.
- Coverage: all 20 first-20 sites map. Gaps blocking EXISTING customers: **#17 follow-social (4 writers) + #5 book-me (Prasenjit, photographers)**.

## 7. SPEC — serve gate & demand capture (agreed 2026-07-07)

Why: few templates today → gate demand instead of blocking launch. Every unserved one-liner = a logged vote for which business type/template to build next.

### Gate (runs AFTER page-2 confirmation — input = CONFIRMED Brief, never the AI guess; agreed 2026-07-07)
Gating on the guess would wrongly capture serveable leads (or wrongly serve). Playback → user confirms/corrects → THEN decide.
```
serveable = businessType entry exists ∧ its copyEngine live ∧ ≥1 template passes engine+capability filter
```

### Hard-fit check (agreed 2026-07-07) — set inclusion, zero AI judgment
1. **Closed capability vocab** (block contracts, enum-like, grows rarely): `multipage · gallery/portfolio · catalog · map-hours · bilingual · video-hero · store-badges · lead-form · packages · blog`. Grounded: multipage=vestria page-menu, catalog=naayom collections, bilingual=lumen twin-fields — all exist today but unqueryable (inventory #12).
2. **Requirements derive from Brief by fixed table** (no AI): copyEngine → engine match · businessType entry carries `requiredCapabilities` (photographer→gallery, restaurant→map-hours) · goal.mechanism (download-app→store-badges, form intents→lead-form; most mechanisms need nothing) · structure→multipage · language→bilingual.
3. **Required vs preferred:** required FILTERS (no gallery = photographer → MANUAL-ONBOARD); preferred only SORTS (soft lane w/ design style, D11). Default to preferred unless page is broken without it — every required flag shrinks serveability.
4. **Declarations kept honest by conformance test:** registry test asserts each declared capability's blocks exist in the template's block map (dispatch-regression pattern). Lying = red test ⇒ gate is safe to automate.
5. ```
   fit(t,b) = b.copyEngine ∈ t.copyEngines ∧ required(b) ⊆ t.capabilities
   0 → MANUAL-ONBOARD (log the MISSING capability/engine) · 1 → auto · N → user picks
   ```
6. MANUAL-ONBOARD logs the missing capability ⇒ demand board ranks **capability gaps, not template counts** ("3 leads blocked on gallery") — one capability build can unblock several business types.

### Build ladder (agreed 2026-07-07) — the failed gate clause diagnoses WHAT to build; cheapest rung first
| Rung | Failed clause | Build action | Cost |
|---|---|---|---|
| A | businessType entry missing | config entry | hours, no code |
| B | goal.mechanism machinery missing | platform feature in click system (§5), all templates benefit | days, once ever |
| C | capability missing, engine HAS a template | block pair(s) on flagship + declare capability (conformance test) | days/block |
| D | engine has NO template · or accumulated style demand | new template (/new-template skill) | weeks |
| E | copyEngine not live | new engine | biggest, rare |

Rules: never D when C works (capability = block contract → add to flagship, per D7 — no "photographer template"); B beats C when the miss is a mechanism (blocks-per-template would recreate the ×6 link-popover duplication). First-20 diagnosed: writers = B(follow-social)+A · Kathaworld = B(store-badges) · photographers = C(gallery)+A · restaurant = E(place engine, correctly deferred P3).

### Outcomes — two only, **NEVER a full exit** (agreed 2026-07-07)
| Outcome | Condition | What happens |
|---|---|---|
| SERVE | query passes | → wizard, usual path |
| MANUAL-ONBOARD | no coverage OR out-of-ICP | "This isn't automated yet — manual onboarding; someone from Lessgo AI will contact you soon. Leave your contact details." Same screen for both; difference is INTERNAL only (lead tagged rung A–E vs out-of-icp) — founder decides privately whether/how to pursue |

Replaces: `PILOT_SERVICE_PERSONAS` hardcode (`api/start:16`), `/onboarding/waitlist`, persona gate. Gate is a QUERY over the 3 lists — coverage grows by adding entries, gate opens itself.

### Demand capture (MANUAL-ONBOARD path)
1. Screen: "Not automated yet — **someone from Lessgo AI will connect with you shortly.**" Collect email/phone (email required, phone optional). Beta-private: reached via Clerk login (lessgo.ai/dashboard); post-site-20 beta-public: no login required (§11.10).
2. Persist `DemandLead { input (oneLiner|url), briefDraft (classified guess), email, phone?, fasttrack=false, status: new|contacted|converted|declined, createdAt }`.
3. Notify founder — reuse lead-email pattern (Resend, env-gated) + admin panel **demand board**: leads grouped by classified businessType/engine, counts ranked → the template priority list.
4. Thank-you screen shows one more button ("Need it sooner?") → click = **double intent**: `fasttrack=true` + high-priority founder notification + message upgrades to "**Sushant will connect with you shortly to personalize.**"
5. Convert loop: founder adds business-type entry (config) → emails lead a resume link → lead enters normal funnel; status→converted. The "shortly" promise is realistic precisely because serving a new type = list entry, not code (D9).

## 8. SPEC — engine input contracts: ask only what we can't know (agreed 2026-07-07)

Derived backwards from what each engine's strategy call must produce (reader, claim, proof, objections, action). Every engine needs 5 fact groups — WHO / WHAT / WHY-BELIEVE / WHY-YOU / ACT — in engine-specific shapes. **Engine defines the shape; businessType entry only relabels + gives examples** (D9/D10 boundary).

Universal: name + one-liner · goal {intent, mechanism, param} · offer (slots 1/3/4).

| Engine | Fact groups | Today's fields (proof it works) |
|---|---|---|
| THING | audience segments · capabilities · differentiator · proof (testimonials-verbatim, metrics, logos, certs, screenshots) · objection facts (pricing/trial, MOQ/export) | SaaS features/audiences/whatItDoes + mfr whatYouMake/industriesServed/valueAdds = two dressings of ONE contract |
| TRUST | who+problem · services/packages · outcomes W/ NUMBERS · process · credentials · testimonials | service whatYouDo/services/targetClients/outcomes/deliveryModel + asset booleans |
| WORK | the work (ASSETS, not text) · genres/style · bio/story · achievements · what you take on | lumen/granth fields; copy thin, proof slot dominates |
| PLACE (P3) | location/hours · offerings/menu · photos · specialties · platform links | — |
| QUICK-YES (P3) | claim · destination · one proof point | — |

**Waterfall per field:** SCRAPED (prefill, mark inferred) → INFERRED (safe category-level only) → ASK → DROP (optional unanswered = section cut, not faked). ASK converges on the outside-unknowable: **differentiator · real numbers · proof artifacts · goal param**. Amended law (proof-truth, 2026-07-10): **proof may be AI-drafted (thing/trust — the engines whose copy routes draft proof) but is ALWAYS flagged needs-review and never enters the real-proof library (the `Testimonial` table); real proof always wins over drafted. Work-engine `praise` stays manual-fill — the AI never drafts it.** See `docs/task/proof-truth.spec.md`.

**Timing tiers (agreed 2026-07-07) — wizard collects words + booleans; editor collects pixels:** T1 words that land IN copy (differentiator, numbers, audience, capabilities, offer, goal param, testimonial text) → wizard. T2 existence booleans ("have logos/photos/case studies?") → wizard 1-tap; gate sections + block eligibility (D18), artifact rendered as placeholder slot. T3 the artifacts (logos, photos, screenshots) → EDITOR after reveal, never wizard. Already the service pattern (`ServiceAssetInput` = booleans). Exception: WORK engine — artifact IS the argument, empty-gallery reveal kills the wow → scrape work (site/Insta, P5) > ask 3–5 uploads > placeholder grid + post-reveal nudge.

Machinery exists: `useOnboardingStore` confirmed/validated/inferred states + v2 scrape schemas = stages 1–2, generalized per engine instead of per audienceType+vestria-hack. **Wizard length becomes a computed property:** `ask = contract(engine) − scraped − inferable − dropped optionals` — rich-site URL entry ⇒ ~2 questions; bare one-liner ⇒ ~6. The wizard is resolved, not designed.

## 9. Pilot — "site 21 self-serves"

Build: Router v1 (classifier → Brief → confirm card) + serve gate on **today's full coverage** (meridian+vestria+hearth/lex/surge, per §11.9 — superseded the earlier vestria-only scope) + generation-time images (vestria-first where slot maps exist).

Test: one real customer from first-20 list (candidate: Wingrrowth — trust engine, surge path) goes input→published — **founder watches, hands off**.
Gate: quality holds without founder touch → start P1 convergence. Fails → the failing step is the next build, not more surface. Gate must answer "would I have intervened?" explicitly (the self-serve quality backstop).

## 10. Sequencing after pilot (direction, not commitment)

P1 Router+Brief to all paths (writer joins as work-engine entry; techpremium retired) · one wizard engine · serve gate + demand board (§7) · click system (§5) + goal machinery (§6) → P2 business-type list (melt manufacturer = entry #1; +photographer, app) → P3 engines 4–5 (place, quick-yes) w/ their blocks (map/hours/WhatsApp; store badges) → P4 block variants per section (copy-compatible by D18; ships eligibility filter + `defaultBlock` registration, zero copy-pipeline change) → P5 brand kit + GBP/Insta import.

## 11. Round-2 decisions (2026-07-07) + remaining open

1. ✅ Wrong-guess rate: non-issue now — cheap model guesses, confirm card catches. Revisit only if page-2 corrections feel frequent.
2. ✅ Intent list: **FROZEN enum, coder adds** — intents feed copy+CTA machinery, curated like engines (few), not like business types (many). 18 covered all first-20. Revisit if demand board shows misses.
3. ✅ Starting coverage: **AUDIT the 8 existing templates → serveable-business list v0** (meridian+vestria=thing · hearth/lex/surge=trust · granth=work · lumen=bespoke-off · techpremium=retired). **Till site 20: build ONLY on actual demand. After: priority or lead.**
4. ✅ techpremium: **RETIRED for now** (was for learnings; revisit later).
5. ✅ Writer: **joins as work-engine entry in P1** convergence.
6. ✅ WhatsApp prefill (delegated): deterministic template from Brief slots — "Hi {businessName}, I found your website — interested in {offer}". NO AI (fires from visitor's phone, zero hallucination tolerance); editable in editor.
7. ✅ GOAL_REF: **buttons only; links explicit-only** — "buttons convert, links navigate", no silent link mutations on goal change. **Multiple primary buttons (hero/mid/footer) → beacon carries placement (section id) → analytics shows WHICH button converted** (§5 analytics row).
8. ✅ Place intents (#14): **enum + classifier vocab NOW** (demand board tags "restaurant wants order-links" correctly), CTA machinery at P3.
9. ✅ Serve gate launches with **today's full coverage** (meridian+vestria+hearth/lex/surge) — only way to test meaningfully. (9b kathaworld=thing, resolved by field test.)
10. ✅ Access: **beta-private = Clerk login via lessgo.ai/dashboard.** After site 20 → beta-public w/ new marketing site: create-page WITHOUT login exposed to everyone.
11. ✅ Capture message: "Someone from Lessgo AI will connect with you shortly." **Fast-track (double intent): "Sushant will connect with you shortly to personalize."**
12. ⏳ Bespoke tier pricing + qualification — separate discussion.
