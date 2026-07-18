---
tier: full
tier-why: touches the generation/skeleton render path (the pilot-critical STEP-06 reveal must show real grouped photos) + likely a MediaAsset schema touch for group persistence. Auto-escalate-worthy surface; concentrate review. Could drop to standard only if scout finds the group→gallery binding already exists and groups persist in existing content JSON.
---

# work-onboarding-ingestion — spec

E2 of the work vertical · STEP 02 of onboarding · Work engine (pilot: Kundius).

## Problem / why
E1 shipped the engine-agnostic onboarding shell + rail, but left STEP 02 ("show us your work") as a **plain upload stub** wired to generation defaults. For a *work* site that stub is the heart of the product — "a work site without their work is a costume." Until STEP 02 actually ingests the user's photos, groups them the way a buyer shops, and shows them on the generated site, the work pilot can't deliver its "how did it do that" moment. media-library-picker (merged) built the reusable pipeline + `MediaAsset` registry specifically to de-risk this slice; E2 is where that plumbing gets a real onboarding UI.

## Goal
A work-engine user at STEP 02 uploads their photos (a folder or loose files), the flow **proposes groups** for them without asking (folders → groups; loose files → same-day EXIF clusters), lets them correct the proposal in taps, runs every image through the speed pipeline, and **binds the grouped photos into the generated site** so the STEP-06 reveal shows *their* work, grouped, on the Atelier skeleton. No AI, no scraping, no auto-curation — just the reliable upload path proving the heart of the product.

## Scope OUT (non-goals)
- **Website-scrape for images** — deferred entirely (not even best-effort in E2). Upload is the only source.
- **Instagram / Google Drive** — E5+.
- **AI ranking / auto-curation** (AI-look-at-the-image to rank or group) — E5+.
- **Technical filter** (kill blurry/tiny/screenshot/near-duplicate frames) — E5+.
- **Google reviews / testimonial pull** — not in v1.
- **Story-seller case-study treatment** (client + problem + result fields, full case studies) — v1 centers **category sellers** (photographer: groups = galleries). Carry only what the existing work contract already carries; no new case-study UI.
- **All editor-side editing** — E2 builds the *onboarding* correction screen only. Post-generation group/image editing rides the editor's existing image/collection tooling + the future D2 CMS boards; E2 builds no new editor UI.
- **t8 storage manager** (folders/usage/replace-everywhere) — deferred (media-library scope note).
- **Other 4 engines' STEP 02** (thing/trust/place/quick-yes) — E2 is the Work engine's depth only; they snap into the same seam later.

## Constraints
- **Build on the E1 per-engine step seam** — STEP 02 is the Work engine's implementation behind E1's pluggable interface; do not fork the shell. Token-scoped like existing onboarding.
- **Reuse, don't rebuild.** Uploads go through `bulkUploadImages` + the media-library image pipeline (resize / modern-format / **blur placeholder**) into `MediaAsset`. Do not write a second uploader or pipeline. "Fast-on-phone is non-negotiable" — the blur placeholder path must be exercised.
- **Grouping is non-AI in E2.** Proposal signals, in trust order: (1) upload **folder names** (subfolder = group), (2) **EXIF capture-date clustering** (same-day = one shoot = one group) for loose files. AI-look-at-the-image is explicitly deferred.
- **Groups propose themselves, never homework.** Correction is always a proposal the user can correct, never a silent verdict. The correction screen is **always shown** but **skippable** (skip = accept the proposal).
- **Correction verbs (five, all taps):** rename, merge, drag-between-groups, hide, pick cover.
- **Binding to the site is load-bearing.** Ingested groups + images must reach the work-skeleton gallery/section slots so the STEP-06 reveal renders the user's real photos, grouped — not defaults. Images come from the user's upload, NOT the AI (firewall: no image invention in the copy prompt).
- **Firewall intact** — no `templateId`/`skeletonId` in any prompt; E2 adds no generation-prompt surface at all (it's upload + heuristics + wiring).
- **Zero new AI calls / zero new credit cost.** Ingestion, grouping, and pipeline are all code. E2 must not introduce a new metered operation or touch the work fan-out rate-limit surface.
- **Rail is the running understanding** — ingestion updates the "What we understood" rail (groups found, counts) progressively and correctably, per the E1 rail contract.
- No CI gate — `tsc` + `test:run` + build + lint green locally before done; plus the real-photo pilot eyeball.

## References
- `docs/task/work-onboarding-shell.spec.md` — the E1 seam: per-engine step interface, rail contract, STEP 02 stub this replaces.
- `docs/task/media-library-picker.spec.md` — the pipeline + `MediaAsset` model + `bulkUploadImages` extension E2 consumes; its Scope OUT explicitly hands the "website-scrape ingestion UI" to E2.
- `docs/tracks/workEndtoEnd.md` §step-2 ("Show us your work") — the acceptance-criteria source: grouping = what a buyer shops for, trust-ordered signals, five correction verbs, cap intent, category vs story sellers.
- `EditableImageCollection` / `bulkUploadImages` (editStore) — existing multi-image upload used by naayom's `imageCollection` grids; the reuse target.
- Work skeleton (`src/modules/skeletons/work/`) + work-contract group/gallery contract — the render target the groups bind into.

## Open exploration questions
- **#1 (swing factor on size):** does a **group → skeleton gallery-slot binding already exist** (do the work copy engine / work-contract already populate gallery groups the skeleton renders), or must E2 build the renderer wiring? Determines whether E2 is "populate existing structure" (standard-ish) or "build the binding" (full).
- Does browser **folder upload preserve subfolder paths** (`webkitdirectory` / relative paths), or does `bulkUploadImages` flatten to a file list? If flattened, "folders become groups" needs the path signal threaded through.
- **Where do groups persist?** On the project's existing content/facts JSON, or does `MediaAsset` need a group/label field (= schema change → confirms full tier)?
- Does a **Project/token exist at STEP 02** such that `MediaAsset` (per-project) can be written pre-generation, or is there a bootstrap step?
- Is **EXIF capture-date** reliably available from browser-uploaded files (client-read vs server-read), and where does clustering run?
- How does the rail currently receive progressive updates (the E1 contract) so ingestion can push group/count understanding into it?

## Candidate human gates
- **Kundius real-photo pilot eyeball** — upload her real folders → grouped → reveal shows her work grouped on Atelier. Founder taste/quality sign-off.
- **Any `MediaAsset` (or schema) migration** — review before apply; one schema branch at a time (coordinate; `secrets-forms-security` also has a schema-comment touch in flight).
- **The group→site binding change** if it touches the skeleton's dual-renderer (`.core.tsx` / published) path — parity-sensitive.

## Acceptance criteria
- [ ] STEP 02 replaces the E1 stub with a real upload UI (folder + multi-file), behind the E1 per-engine seam (shell unforked).
- [ ] Uploads run through `bulkUploadImages` + the media-library pipeline into `MediaAsset` (resized/modern-format + blur placeholder present); no second uploader/pipeline introduced.
- [ ] **Folder upload** → each subfolder becomes a proposed group.
- [ ] **Loose-file upload** → same-day EXIF clusters become proposed groups (fallback to a single "Gallery"-type group only when no date signal exists).
- [ ] Correction screen is shown, is skippable, and supports all five verbs: rename, merge, drag-between, hide, pick cover.
- [ ] STEP-06 reveal renders the user's **actual uploaded photos, grouped**, in the work-skeleton gallery slots (not defaults) — verified against real fixtures.
- [ ] Rail reflects ingested understanding (groups + counts) progressively and correctably.
- [ ] Journey completes 01→06 end-to-end on the Work vertical (Atelier).
- [ ] No new AI call / no new metered credit operation added by E2.
- [ ] `tsc` + `test:run` + build + lint green.

## Pilot / smallest slice
The whole spec IS the pilot slice: **upload-only, Work engine, Kundius fixture.** Decision gate = the founder eyeball at STEP-06 reveal with Kundius's real photo folders — if her work shows up grouped and fast-on-phone, E2 is proven and E3 (questions) / E5 (auto-curation, scrape, IG/Drive, AI ranking, technical filter) inherit a working ingestion spine. If the group→gallery binding turns out not to exist, that wiring is the riskiest sub-slice and should be the first phase (fail fast on the reveal promise).
