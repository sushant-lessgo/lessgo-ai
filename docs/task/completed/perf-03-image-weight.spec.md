# perf-03 — image weight & hygiene (P2) — spec

## Problem / why
All 45 template block files render raw `<img>` — no `loading="lazy"`, no `width`/`height` (layout shift + full decode of everything at mount), full-resolution originals (e.g. `meridian/blocks/Hero/EditorialPhotoHero.tsx:161`). Base64 `data:image` URLs are accepted as valid content values (`src/hooks/editStore/aiActions.ts:84-88`) → can live inside store `content` JSON, inflating every stringify, autosave payload, undo entry, and snapshot. Naayom's images turned out small (11–64 KB webp — uploads are already webp'd), so this is NOT his bottleneck — but hotlinked externals (283 KB png from naayom.com) and future image-heavy customers (photographers: lumen) make it a real scaling risk.

## Goal
Images never dominate editor memory/network: below-fold images lazy, dimensions reserved, base64 kept out of content JSON. Applies to BOTH renderers identically.

## Scope OUT (non-goals)
- No next/image migration (published pages are static-exported HTML — next/image runtime doesn't apply; keep plain `<img>` with attrs).
- No upload-pipeline resize/CDN work beyond what exists (uploads already produce small webp).
- No design change: identical visual output.

## Constraints
- **Dual-renderer trap**: every block edit must hit BOTH `.tsx` and `.published.tsx` and stay identical; published output re-verified (rebuild required for published assets).
- Hero/LCP images must NOT be lazy (keep eager + preload behavior; `CriticalFontPreload`-style LCP care).
- Base64: block at write time (reject or auto-upload to Blob then store URL) — existing projects with base64 must still render.
- 45 files × 2 renderers = mechanical sweep; good /feature phase candidate with per-template phases.

## References
- `src/modules/templates/*/blocks/**` `<img>` usage; `src/hooks/editStore/aiActions.ts:84-93`; upload path `/api/upload-image`.
- Lumen (photography, image-heaviest template) = stress-test template.

## Open exploration questions
- Do any stored contents in prod already contain base64 blobs (scan needed)?
- Where do image dimensions come from — stored at upload, or unknown (need probe/fallback)?

## Candidate human gates
- Prod content scan/migration if base64 blobs found in existing projects.

## Acceptance criteria
- [ ] All non-hero block images: `loading="lazy"` + `decoding="async"` + dimensions (or aspect-ratio reservation) in BOTH renderers.
- [ ] Hero/LCP images eager; published Lighthouse LCP not regressed on a naayom-scale page.
- [ ] New base64 image values cannot enter content JSON (rejected or auto-uploaded).
- [ ] Editor↔published parity pass (manual-test) on lumen + techpremium.
- [ ] tsc, test:run, build green.

## Pilot / smallest slice
Pilot: one template (techpremium — naayom's) both renderers + parity check; gate; then mechanical sweep of remaining templates.
