# CMS / collections — agreed model (discussion, pre-spec) — 2026-07-19

Front-end of `/discuss` for the CMS feature (from Kundius 19-Jul QA F3/F4/F6). **Model AGREED; specs NOT yet written.** A fresh session writes the two specs below from this + the scout map. Everything here is pre-beta (`memory/feedback_everything_is_prebeta`).

## What triggered it
Kundius (photographer, Atelier) QA feature requests: **F3** About summary-on-home→dedicated page · **F4** Packages summary→dedicated · **F6** Work "see all photos" / group expansion. Founder framed it as "the CMS model" and said Naayom/techpremium already implements a version → **generalize + standardize + designer UI.**

## Scout finding (techpremium/Naayom CMS — the reference to generalize)
Full brief was produced by an Explore agent (not persisted; re-derivable). Key facts:
- **DERIVED, not separately generated.** AI writes ONE full record per item page; the home teaser is a **materialized read-only compact card** (subset of the record), re-derived on every commit + at publish (no dual-renderer drift). Evidence: `materializeHomeLineup/Gallery` (`src/hooks/editStore/collectionHelpers.ts:242-262`), `productdetail.featuredOnHome` flag (`src/modules/audience/product/elementSchema.ts:454`), `TechPremiumLineup.tsx:25-28` ("READ-ONLY: items are MATERIALIZED").
- **Registry-driven + template-capability-gated.** `src/modules/collections/registry.ts` (`CollectionDef{key,basePath,itemArchetypeKey,catalogSectionType,itemSectionType,labelFields}`). Fan-out `assembleCollectionPages`/`runCollectionFanOut` (`src/modules/generation/multiPageAssembly.ts:351-493`) fires only under a DOUBLE gate: registry def exists AND the template DECLARES the collection capability.
- **The plumbing already exists for `works` but ships DORMANT.** Registry already has `works` (+`services`,`case-studies`); `workElementContract` has `workdetail`/`workcatalog` (`src/modules/engines/workSections.ts:378,408`); page vocab has `work-group`/`project-story` (`workPages.ts`); renderers exist (`WorkGalleryGrid.core.tsx`, `WorkDetail.core.tsx`, `WorkCatalog.core.tsx`). **No live template declares the capability → never fires.** Home-teaser materializer + `cardFromEntry` are **products-hardcoded** (`collectionHelpers.ts:242,62-75`); no work equivalent; `featuredOnHome` flag absent on work records.
- Inter-page link: materialized card `href = entry.pathSlug` (`collectionHelpers.ts:73`); published anchor `TechPremiumLineup.published.tsx:36`; slugs code-derived (`multiPageAssembly.ts:380`). Editor page nav = `PageSwitcher.tsx`.

## AGREED MODEL

**1. General schema-driven CMS is the universal layer.** Registry-defined collections + ONE schema-driven **item editor** (designer t19) whose fields = the collection's schema + listing/detail rendering + derived home teaser. Accommodates **photographer Projects (image schema) · Naayom Products (spec schema) · writer Articles (text schema)** — one mechanism, different schemas. This answers the founder's two load-bearing questions:
   - *"How does work-library-board accommodate a writer?"* → it doesn't; a writer uses the general item editor with a text-field Articles collection.
   - *"Where does a general CMS like Naayom products live?"* → the same general CMS (products = a collection whose schema is product fields); techpremium's current bespoke "Products panel" should unify under it.

**2. CLOSED SET — no arbitrary collections.** Only the pre-defined collections a **template declares** are available (same closed-vocab law as pages/sections). Screen-12 "new collection" = **"add one of the collections THIS template supports"**, schema fixed by the template — NOT invent-a-collection-with-custom-fields.

**3. `work-library-board` (`/dashboard/[token]/work`, already BUILT this session) = a SPECIALIZED image view** layered on the same `works` collection — richer photo UX (groups/covers/reorder) for photographers. It is NOT the general model; keep it as an optional specialization.

**4. About & Packages are NOT CMS** (founder ruling). They're **independent authored** pieces: a short "one thing" home about/packages section + a separately-authored full dedicated page (home does NOT derive from the page). The **template auto-adds a "Know more →" link** from the home summary to the dedicated page when that page exists. → separate small spec.

**5. Build/dependency order (= spec phases):** **CMS core → pre-defined collections → UI.**

## → TWO SPECS TO WRITE

### Spec 1 — `cms-collections` (full tier, 3 phases)
- **Phase 1 — CMS core:** generalize the existing dormant/products-hardcoded machinery into an engine-agnostic core — un-hardcode `materializeHome*`/`cardFromEntry` from `products`, add a schema-driven card-mapper + `featuredOnHome`-style promotion flags, generic derived-teaser + fan-out + inter-page linking + published rendering.
- **Phase 2 — pre-defined collections:** declare the closed set per template with fixed schemas; **flip the capability gate on for Atelier/work (`works`, image schema)**; wire products (spec) + writer articles (text) as further schemas. F6 (work-groups → dedicated group pages with all photos + home teaser grid) lands here.
- **Phase 3 — UI:** schema-driven item editor (designer **t19**), "add a supported collection" (**screen 12 / t12**, only where a template declares optional collections), keep **work-library-board** as the image specialization. Designer screens in `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Editor Redesign.dc.html` (t11 add-page, **t12 new-collection = "screen 12"**, t19 item-editor, t22 photographer-portfolio example).
- **Tier why:** generation + collections + dual-renderer + contracts + editor UI + publish path.

### Spec 2 — `home-summary-links` (standard tier)
- About/Packages: home summary authored independently from the dedicated page; template auto-adds a "Know more →" link to the dedicated page when present. No derivation, no collection. (F3, F4.) May fold into the Atelier fidelity contract-field work.

## STILL UNDISCUSSED (this session ran out of runway)
- **F1 — language control in Settings** (i18n + the new account-settings page). Needs `/discuss`.
- **F2 — Hero full-bleed bg: upload UX + auto-populate** (media/ingestion; upload exists, auto-populate NOT-built by design). Needs `/discuss`.

## References
- Designer: `.../Lessgo Editor Redesign.dc.html` screens t11/t12(=12)/t19/t22 + its `README.md` (CMS section, lines ~119-161).
- Code: `src/modules/collections/registry.ts`, `src/modules/generation/multiPageAssembly.ts`, `src/hooks/editStore/collectionHelpers.ts`, `src/modules/engines/workSections.ts` (+`workPages.ts`), `src/modules/skeletons/work/`, `docs/guides/collections.md`.
- QA source: `docs/qaTest/bugs19thJuly1.md` (F1–F6).
