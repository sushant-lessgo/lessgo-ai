# Phase 11a — Architecture-Gap Log

The real deliverable of 11a (per the plan): every Hearth-specific assumption that
leaked into shared code and forced a Lex workaround, plus any divergence Lex
forced on a copied primitive. This feeds 11b (picker) and the eventual shared
template-kit extraction.

Legend: **FIXED** (resolved this phase) · **LOGGED** (deferred, with rationale).

---

## 1. Block dispatch keyed by Hearth layout names — FIXED (A1)
- **Leak:** `componentRegistry.getComponent` dispatched service blocks via the
  stored *layout name* (`resolveBlock(layoutName)`), and `PILOT_LAYOUT_NAMES` in
  audience-level `elementSchema.ts` hardcodes Hearth names (`PetalFramedHero`…) —
  a template name living in audience code (firewall violation).
- **Fix:** dispatch by **section type** (`resolveBlock(sectionType)`) in both
  `componentRegistry.ts` and `componentRegistry.published.ts`; re-keyed Hearth +
  Lex resolvers by section type. Stored layout name is kept in content (A1
  guardrail) but unused for service dispatch.
- **Constraint (documented in `types/template.ts` + both resolvers):** valid only
  while 1 block per section per template. Phase 9/10 multi-block ⇒ revert to
  name-keyed dispatch (the retained layout-name field makes that migration-free).

## 2. `data-hearth-surface` attribute name — FIXED
- **Leak:** the shared renderer wrapped every service section in
  `<div data-hearth-surface>`, and Hearth `tokens.ts` emitted
  `[data-hearth-surface="…"]` selectors — a template name in shared markup.
- **Fix:** renamed to template-agnostic `data-surface` in
  `LandingPagePublishedRenderer.tsx`, `LandingPageRenderer.tsx`, and Hearth
  `tokens.ts`. Lex `tokens.ts` emits `[data-surface="paper…"]`. Grep-verified zero
  `data-hearth-surface` remain in code.

## 3. Hardcoded `terracotta` / `HearthPalette` default in shared renderer — FIXED
- **Leak:** `LandingPagePublishedRenderer` cast `paletteId as HearthPalette` and
  fell back to the literal `'terracotta'` — Hearth-specific in shared code.
- **Fix:** `effectivePalette` is now `string`, falling back to
  `tmpl.defaultPaletteId` (Hearth → terracotta, Lex → counsel). The
  `TemplateModule` contract already types `paletteId` as `any`.

## 4. `PILOT_LAYOUT_NAMES` still Hearth-named in audience code — LOGGED
- **Residual:** generation still writes Hearth-flavored layout strings into
  `content[sectionId].layout` for ALL service projects (incl. Lex). Now inert for
  dispatch (#1), but the audience-level constant still embeds template names.
- **Why deferred:** removing it touches generation (`selectUIBlocks`,
  `GeneratingStep`) — out of 11a scope (zero copy-logic change). Harmless while
  dispatch ignores it.
- **When to fix:** when generation becomes template-aware, or alongside the
  Phase 9 multi-block work that re-activates name-keyed dispatch.

## 5. Voice prompt hardcodes "HEARTH" / "Fraunces" — LOGGED
- **Residual:** `audience/service/voice.ts` `formatServiceVoiceForPrompt()` emits
  `## VOICE — HEARTH` and "accent-deep italic **Fraunces**" / "visual signature of
  **Hearth**". Template-specific strings inside type-level (shared) copy.
- **Impact:** none functional — the rule still emits `<em>`, which Lex CSS styles
  as its own accent (Source Serif italic + `--accent-deep`). Lex reuses the voice
  unchanged (11a goal: zero `audience/service/*` copy change).
- **When to fix:** if Lex needs a tonal shift, add a `tone` param to the service
  voice (do NOT fork `voiceLex.ts` — firewall). Until then, reword the two
  template-named strings to be template-neutral as a cheap cleanup.

## 6. Editor primitives copied, not shared — LOGGED (A2, intentional)
- **Decision (PO):** copied `HearthEditable`→`LexEditable`,
  `HearthAddImageOverlay`→`LexAddImageOverlay`, `useServiceBlock`→`useLexBlock`
  into `templates/lex/` rather than extracting to a shared kit (keeps the
  freshly-defect-fixed Hearth primitives frozen through 11a).
- **Genericity-test result:** all three copies are **logic-identical** — no
  Lex-specific behavioral edits were needed. The only template-coupled bits are
  CSS-var references (`var(--ink-2)`, `var(--font-body)`) which Lex also defines.
  ⇒ the primitives are provably generic; extraction later is safe + mechanical.
- **Follow-up (post-Phase-11 cleanup):** extract a shared `templates/_shared`
  (or `audience/service/blockKit`) kit; re-point Hearth + Lex. No divergence found
  that would move the abstraction seam.

## 7. Lex per-template divergences from the shared service schema — LOGGED
These are faithful-rendering choices under A3 (bind only existing keys; derive,
don't invent), not bugs — recorded so the picker/QA know what differs:
- **Hero `hero_image` not surfaced:** Lex's cover is text/ledger-led; the hero
  binds no image. (Image-toolbar affordance is exercised via the testimonial
  `author_photo` instead.)
- **Hero ledger is non-numeric:** the reference's 4-stat ledger has no schema
  field, so the single optional `meta` renders in ledger styling — no fabricated
  figures (Phase 6 credibility discipline).
- **Services `icon` not surfaced:** Lex practice cards use a derived `§`-index
  ornament, not Lucide icons.
- **Testimonials is a single letter:** schema is flat (one quote/author); the
  monogram `.auth` is derived from `author_name` initials.
- **CTA contact aside dropped:** addresses/phones are footer data with no CTA
  schema field — not rendered in the CTA (no invented contact details).
- **Footer giant wordmark dropped:** needs a brand-name field the footer schema
  lacks; rendered without it (no fabricated wordmark).

## 9. `DraftSaveSchema.paletteId` enum locked to Hearth palettes — FIXED
- **Leak:** `lib/validation.ts` validated the save payload's `paletteId` with
  `z.enum(hearthPalettes)`, so saving a Lex project (`paletteId='counsel'`) would
  be **rejected** — a hard blocker for the Lex edit/save round-trip.
- **Fix:** `paletteId` is now a bounded slug (`z.string().max(50).regex(/^[a-z0-9-]+$/)`),
  template-agnostic (palettes are template-scoped and grow per template). Mirrors
  how `variantId` is already validated. Removed the now-unused `hearthPalettes`
  import.

## 10. Hearth-locked palette validation/UI on the GENERATION path — LOGGED (11b)
- **Residual (not a 11a blocker):** `/api/audience/service/strategy` route still
  `z.enum(hearthPalettes)`-validates `paletteId`, and onboarding `StyleStep.tsx`
  renders only `hearthPalettes` in the picker. 11a exercises Lex via the dev
  `?templateId` override on an existing project (no onboarding, no strategy call),
  so neither blocks 11a.
- **When to fix:** Phase 11b builds the real template+palette picker — at which
  point palette validation + the picker gallery must be scoped by the selected
  `templateId` (Hearth → hearthPalettes, Lex → lexPalettes, …).

## 8. `data-variant` wired but variant CSS deferred — FIXED (11b)
- Lex `ThemeInjector`/`SSRTokens` set `data-variant="statesman"` and load only the
  statesman font set. Clinical/Civic variant CSS + Lora/EB Garamond fonts ship in
  11b with the variant picker. Note: the HTML reference targets variants via
  `html[data-variant]`; for the editor wrapper (SSR wraps a `div`), 11b variant CSS
  must target `[data-variant]` (not `html[...]`) to work at depth.
- **11b fix:** `serializeVariantOverrides()` (both templates) emits `[data-variant="x"]`
  blocks appended after palette overrides; injectors/SSRTokens take `variantId` and
  set `data-variant`; Lex font href is variant-aware (`lex/fonts.ts` lazy-adds
  Lora/EB Garamond). `TemplateModule` gained `variants` + `defaultVariantId`.

## 11. Variant CSS = CSS-VARIABLE overrides only, NOT per-class layout — LOGGED (11b)
- **Divergence:** the designer HTML variant blocks retune layout via *class
  selectors* (`.hero h1`, `.feature`, `.practice .item`, `.frame`, civic
  watermark…). Those class names do NOT exist in our React block DOM, so only the
  **CSS-variable** overrides at `[data-variant]` level port (spacing/radii/paper
  tint/`--font-display`). This matches the plan's "pure token rescale" scope and
  the firewall (variants must never touch copy), but means our variants read
  **subtler** than the HTML demo (e.g. Hearth `editorial`'s drop-caps + italic
  display headings + rule lines are absent; only radii + section padding shift).
- **Impact:** functional + zero-risk; variants are visually distinct via font
  (Lex clinical→Lora, civic→EB Garamond), paper tint, padding, radii — but not the
  per-block typographic theatrics.
- **When to fix:** if QA judges a variant too weak, the blocks must expose the
  relevant knobs as CSS vars (e.g. a `--hero-display-style` the block reads) so a
  variant can drive them — block-level work, post-launch. Do NOT re-introduce the
  HTML class selectors (our DOM won't match them).

## 10b. Palette validation scoped by template — FIXED (11b)
- `/api/audience/service/strategy` `paletteId` relaxed `z.enum(hearthPalettes)` →
  bounded slug (route never sees `templateId` — firewall — so it can't enum per
  template). Template↔palette validity is now enforced at the picker
  (`palettesForTemplate(templateId)` scopes the gallery) + saveDraft. Onboarding
  `StyleStep` + editor `ServiceThemePopover` both scope palettes by the selected
  template.
