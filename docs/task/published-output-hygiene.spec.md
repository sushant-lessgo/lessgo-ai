# published-output-hygiene — spec

> Source: `docs/reports/app-ui-ux-assessment.md` §1.4/§1.5, §3 P0.4/P0.5, §2 themes 3+4. Contains beta blockers. **Terminal-mock is NOT in scope** (template-content work → productBacklog).

## Problem / why
The product's whole pitch is "publish-ready page", yet published output ships placeholder + broken content that directly contradicts it:
- **SEO meta leaks raw HTML**: "Stop chasing invoices. Start `<em>designing</em>`." appears in the Google preview + social card — markup ships in the meta description/title.
- **Footer: "© 2024 InvoiceKit"** — hardcoded wrong year (it's 2026).
- **Empty footer columns published**: PRODUCT / COMPANY / RESOURCES headers render with zero links under COMPANY and RESOURCES.
- **Dead "Learn more" ghost links** (×6) that go nowhere.
- **Brand/date drift** cross-cutting: "© 2024" (published), "© 2025" (app), "Lessgo.AI"/"Lessgo.ai" vs brand "Lessgo AI".

## Goal
A published page contains no placeholder filler, no dead links by default, no leaked markup in meta, and consistent correct brand + year — so the output matches the "publish-ready" promise.

## Scope IN
- Strip HTML tags from generated SEO title + meta description (`<em>` leak).
- Footer: use current year (not hardcoded 2024).
- Drop empty footer columns (render a column only if it has links).
- No dead "Learn more" / nav links by default (hide when target is absent).
- Brand/date consistency pass across published output: "Lessgo AI", current year.

## Scope OUT (non-goals)
- **Terminal-mock hero filler** — explicitly OUT; logged to `productBacklog.md` as template-content work.
- Editor-chrome / app-shell brand+year (app footer "© 2025") — owned by `editor-chrome` / `app-entry` on their surfaces; this spec covers *published page output*.
- Publish preflight UI (detection/warnings) — owned by `publish-ux`; this spec is the actual fixes.
- Dead header/footer CTAs that are unlinked pending setup (expected until user completes setup — warning is publish-ux's job).

## Constraints
- **Dual-renderer**: fixes must land in BOTH the block `.tsx` (editor) and `.published.tsx` (published), kept identical — this is the #1 trap.
- Published output is static-exported via the published renderer + `htmlGenerator.ts`; changes to published styling/markup require a rebuild to take effect.
- Meta strip must not double-escape or drop legitimate characters.

## References
- `src/lib/staticExport/htmlGenerator.ts` — SEO meta assembly.
- Footer block pair (`.tsx` + `.published.tsx`) + its component registries.
- `docs/architecture/publishArch.md`; dual-renderer note in `docs/architecture/phase11aArchitectureGaps.md`.
- Report §1.4, §1.5.

## Open exploration questions
- Where are SEO title/description generated and where is the HTML tag allowed through?
- Where is the footer © year hardcoded, and where do footer column links come from (why empty columns render)?
- Where do "Learn more" links get their href, and how to hide when absent?
- Full inventory of "Lessgo.AI/Lessgo.ai" strings + hardcoded years in published output.

## Candidate human gates
- None hard (no schema/auth/prod-data). Rebuild + republish needed to verify on a live page — note the build step.

## Acceptance criteria
- [ ] Generated SEO title + meta description contain no HTML tags.
- [ ] Footer year = current year (dynamic).
- [ ] Footer columns with no links do not render.
- [ ] No dead "Learn more"/nav links render by default.
- [ ] Published output brand = "Lessgo AI"; no stray "© 2024/2025" or "Lessgo.AI".
- [ ] Editor and published render identically for all above (dual-renderer parity).

## Pilot / smallest slice
Slice 1 (blockers): meta HTML-strip + footer year + empty-column drop + dead-link hide — the "looks fake" fixes. Slice 2: brand/date consistency sweep. Gate: publish a test page and confirm no placeholder/dead/wrong-year content in the live output (and parity holds).
