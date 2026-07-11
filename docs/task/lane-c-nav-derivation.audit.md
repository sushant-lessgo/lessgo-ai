# Lane-C audit — F7 + F24 (nav derives from what the page/site has)

Branch: `fix/lane-c` (verified before any edit).

## Files changed
- `src/modules/audience/product/parseCopy.ts` — `autoMapLinkHrefs` extended (F7 + F24).
- `src/modules/templates/meridian/blocks/Header/MeridianNavHeader.published.tsx` — Sign-in CTA-role bonus (F7).
- `src/modules/audience/product/autoMapLinkHrefs.test.ts` — NEW test file for the derivation.

## What changed, per file

### `src/modules/audience/product/parseCopy.ts` (`autoMapLinkHrefs`)
This is the existing single generation-time derivation point for nav/footer link
targets (runs for BOTH single-page and multipage product, on the home-page call
where chrome lives). Extended it rather than inventing a new mechanism:

- **F7 — dead anchor kill.** Added `deadAnchorType()` + `SECTION_ANCHOR_RE`
  (`/^#([a-z]+)(-\d+)?$/i`). `mapLink` now treats an AI-authored bare section
  anchor (`#pricing`, `#about`, `#support`…) whose section type is NOT on the
  page as a dead link: it re-derives from the label, and if nothing resolves the
  link is **dropped** (returns `false` → caller filters it out). `nav_items` is
  now `filter`-reassigned. Real live targets (page paths, external URLs, valid
  on-page anchors, `#form-section`) and still-unset `#` links are untouched
  (backward compatible — `#` never promised to scroll anywhere, so it is kept).
- **F24 — footer site-nav sync.** New `appendMissingPages()` + `mapColumns()`.
  After mapping a footer column's links, if the column functions as site
  navigation (holds ≥1 link whose href equals a sitemap page path), every
  non-home sitemap page not already present is appended (`{id:'', label:title,
  href:pathSlug}`), idempotent by href. This keeps the footer quick-links column
  in sync with the sitemap the same way the header nav already is — a page added
  at the 7b gate (which the AI never authored a footer link for, e.g.
  `/industries`) now appears. Columns with no page-path links (Product, Company,
  Legal, decorative `#`-only columns) are left untouched. Both `footer_columns`
  (Meridian) and `link_columns` (Vestria) go through `mapColumns`.

### `src/modules/templates/meridian/blocks/Header/MeridianNavHeader.published.tsx`
Removed `data-lessgo-cta="" data-lessgo-cta-role="secondary"` from the Sign-in
link — it is existing-user wayfinding (login), not a conversion CTA, so it must
not enter the CTA/secondary click breakdown (D15 beacon fires on secondary CTA
clicks). Contained: only two data-attributes removed, no layout/CSS change.

## Deviations from plan
- **Chose the "filter dead anchors" option over "fully re-derive single-page nav
  from the section list."** The finding offered both. Filtering is the
  conservative choice: it preserves the AI's sensible labels (e.g. "Features")
  and only removes anchors that scroll nowhere, rather than replacing the whole
  nav with one machine link per section (which would also degrade label quality
  and add nav links for non-nav sections like hero/cta). Result satisfies the
  finding's floor: "ship a nav with only the anchors the page has."
- **Locus = `autoMapLinkHrefs` (generation), not the editor seed effect
  (`deriveNavLinks`).** F7/F24 are about GENERATED content. The editor seed only
  fills an EMPTY multipage nav on mount and never touches AI-authored content, so
  it cannot fix either finding. `autoMapLinkHrefs` is the existing derivation
  point for nav/footer hrefs — extending it is "the same mechanism," and it is a
  pure function (easily tested). `pageLinks.ts`/`deriveNavLinks` were left
  unchanged.
- **Header additions left as-is for F24.** Per the report the HEADER nav is
  already correct (AI labels map to pages via the existing path). I did NOT add
  the sitemap-append to `nav_items`, only the dead-anchor kill — to avoid
  changing the header's item count/behavior the report confirms works. The
  append is scoped to the footer site-nav column, exactly the reported gap.

## Bonus (Sign-in role) — done
Contained change; applied. See file note above. Edit renderer
(`MeridianNavHeader.tsx`) never emitted `data-lessgo-cta` on Sign-in, so
edit/published parity is preserved (beacon attrs are published-only analytics
markers, not layout).

## Test results
- `autoMapLinkHrefs.test.ts` (NEW): 5 pass — single-page dead-anchor drop, live
  targets untouched / unset-by-label mapping, footer gate-added-page append,
  idempotency, no-invent-column.
- `src/modules/audience/product` + `legacyHrefShim.test.tsx`: 64 pass.
- `src/modules/generation` + `src/modules/goals`: 193 pass.
- `npx tsc --noEmit`: clean.

## Open risks / residual (out of scope)
- **Editor `addPage` (post-generation) does not sync the footer.** F24 is about
  gate-added (pre-generation) pages, which the generation-time fix covers. A page
  added later in the editor updates the header nav (via `addNavLink` in
  `pageActions.ts`) but still not the footer. Fixing that would require touching
  `pageActions.ts` (not in this change).
- **Service audience** (`src/modules/audience/service/parseCopy.ts`, templates
  surge/hearth/lex/lumen) has its own `autoMapLinkHrefs`-equivalent and was NOT
  changed — the findings cite only product templates (meridian, vestria).
- **`nav_items` min constraint.** Dropping dead anchors can take a single-page
  nav below the schema `min:2`. This is intentional (a nav with one real link
  beats five with four dead) and happens after schema backfill, so nothing
  re-inflates it. No render invariant depends on the min.
