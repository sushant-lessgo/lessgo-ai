---
tier: full
tier-why: ~20 techpremium block files incl. 4 dual-renderer .tsx/.published.tsx pairs + an asymmetric Footer; editor↔published divergence is the exact failure mode.
---

# techpremium `harbor` palette — spec

## Problem / why

Naayom asked for their brand colours: green `#4db985`, blue `#588bae`, grey `#929393`,
white `#fafafa`. Today `techpremium` ships a single hardcoded `forest` palette (pine bands +
yellow-lime accent) and the designer has delivered a complete token re-skin for it.

Two structural problems block a naive retune:

1. **Only 6 vars are palette-switchable.** `serializePaletteOverrides()` emits `--forest*` +
   `--lime*` only. Three of Naayom's four brand colours (grey/white/blue) map to neutrals and
   `--teal*`, which live in `tokens.ts` as palette-**invariant** base tokens.
2. **75 hardcoded `oklch()` literals** across 20 of 21 block dirs will not follow a token change.
   (`docs/tracks/naayomRequirements.md` says 22 — that count is wrong; verified 75 occurrences /
   30 distinct values.)

So an in-place token retune ships a half-reskinned page.

## Goal

Add a second techpremium palette, `harbor` (navy bands + brand-green signal + cool neutrals),
as a real palette record — and make it genuinely switchable, so reverting to today's look is a
default flip rather than a 20-file diff. `harbor` becomes the template default. `forest` stays
byte-identical and correct.

## Scope OUT (non-goals)

- **No picker/UI work.** The Design menu's variation-choosing capability already exists; techpremium
  does not expose it now. `pilotEnabledPalettes` stays closed.
- **No `paletteId` DB write**, no prisma change, no picker entry — `harbor` ships as the default.
- **No republish.** Separate gate, separate decision (see Constraints).
- **No in-place retune of `forest`** — its values are untouched.
- Items 2–5 of `naayomRequirements.md` (nav/preview, YouTube, tap-to-call, element toggle labels).
- The two deferred platform finds: SSR-fallback behaviour-script injection, and KV backfill for
  pre-cutover published pages.
- Tokenising the 17 non-band literals (hue 150 status-green ×11, 192 teal ×2, 95 paper ×4).

## Constraints

- **Naayom's unpublished draft must not be touched.** Their content is frozen live at 2026-07-01
  with ~3 weeks of edits sitting unpublished in the DB. This work is **code-only** — no writes to
  `Project.content`, no migration, no admin script against their row.
- **Publish coupling (why republish is a separate gate):** the palette only reaches Naayom via
  Publish, and that same button also pushes their entire unreviewed 3-week draft live *and* writes
  the missing `lessgo.site` KV route. Three payloads, one button. Not this spec's call.
- **Dual-renderer parity is mandatory** — every literal changed in a `.tsx` must change identically
  in its `.published.tsx`. `TechPremiumFooter` is asymmetric: `.tsx` has 10 literals, `.published.tsx`
  has 0 (published reads `footerStyles.ts`). Both sides need the change.
- `forest` output must be byte-identical before/after. It is the revert lever.
- Published pages carry no JS framework — CSS-only derivations.
- `color-mix(in oklch, …)` is the safe derivation form; avoid relative-colour `oklch(from …)` syntax
  (weaker browser support on published pages).

## The authoritative values

Source: `<style id="brand-palette">` in
`docs/template-design/designer-workspace/design_handoff_naayom/design/Naayom - Home (Brand Palette).html`
(dropped in 2026-07-22; the brief alone was insufficient). Verified a **pure token re-skin** — diffing
that file against `Naayom - Home.html` minus the style block yields 17 lines, all `<title>`/comment.
Markup is byte-identical.

```
--paper    oklch(0.985 0.0015 240)   --forest   oklch(0.320 0.048 252)
--paper-2  oklch(0.963 0.003 240)    --forest-d oklch(0.258 0.042 253)
--paper-3  oklch(0.938 0.005 240)    --forest-2 oklch(0.455 0.085 156)
--ink      oklch(0.305 0.010 230)    --lime     oklch(0.720 0.130 157)
--ink-2    oklch(0.470 0.008 230)    --lime-d   oklch(0.520 0.105 155)
--ink-3    oklch(0.645 0.004 220)    --lime-dim oklch(0.720 0.130 157 / 0.16)
--line     oklch(0.900 0.004 240)    --teal     oklch(0.620 0.075 244)
--line-2   oklch(0.820 0.006 240)    --teal-dim oklch(0.620 0.075 244 / 0.14)
--line-dk  oklch(0.470 0.045 250)    --ok       oklch(0.660 0.120 152)
                                     --ok-bg    oklch(0.660 0.120 152 / 0.14)
```

Plus one **non-token** rule the palette needs:
`.ph.on-dark` → bg `oklch(0.288 0.048 252)`, stripes `oklch(0.720 0.130 157 / 0.08)`.
In the port this is `.tp-ph.on-dark`, single-source in `blocks/shared/sharedStyles.ts:11-12`
(both renderers consume the class) — one edit site, not two.

> Ignore the designer's HTML comment claiming "deep, low-chroma **pine** derived from the brand
> green". Stale; contradicts both the brief and the actual values. The bands are **navy** (hue 252).

## Literal triage (75 occurrences / 30 distinct)

| hue | n | what | action |
|---|---|---|---|
| 158 + 159 | 24 | forest overlays/tints — sit *on* the band | **tokenise** (derive from `--forest`) |
| 140 | 27 | on-dark text, chroma 0.02 — band-derived | **tokenise** |
| 128 | 7 | old yellow-lime — clashes with brand green | **hard-code** to new green (one-offs, not band-derived) |
| 150 | 11 | ok-status / WhatsApp green, already ≈157 | leave |
| 192 | 2 | teal | leave |
| 95 | 4 | paper @ alpha | leave |

The 51 band-family literals are tokenised rather than re-hued because tokenising is the *same edit
at the same site* (`color-mix(…var(--forest)…)` instead of a new hue number) and it is what makes
the palette actually switch. Re-hueing would bake navy in and reproduce the half-switched failure.

## References

- `src/modules/templates/techpremium/palettes.ts` — `TechPremiumPaletteConfig`,
  `paletteBlock()`, `serializePaletteOverrides()`. The config interface must widen to carry
  neutrals + `--teal*` + `--ok*`; `forest` gets today's base-token values verbatim.
- `src/modules/templates/techpremium/tokens.ts` — `techPremiumBaseTokens` + `serializeBaseTokens()`.
  Values moving into the palette record must stop being emitted as palette-invariant `:root`.
- `src/types/product.ts:52-59` — `techPremiumPalettes` union, `defaultTechPremiumPalette`.
- `src/modules/templates/techpremium/blocks/shared/sharedStyles.ts:11-12` — `.tp-ph.on-dark`.
- Meridian/Hearth `palettes.ts` — the multi-palette record shape to imitate.
- `docs/tracks/naayomRequirements.md` § item 1 — track doc (note its literal count is wrong).
- `.../design_handoff_naayom/design/BRAND-PALETTE-BRIEF.md` — rationale + port instruction
  ("a palette record — do **not** fork the page components").

## Open exploration questions

- **Does Naayom's `Project` row store `paletteId: 'forest'` explicitly?** If it does, flipping
  `defaultTechPremiumPalette` will not reach them and the whole no-DB-write approach fails. This
  is the single assumption that can invalidate the design — resolve it first.
- How do `ThemeInjector.tsx` / `SSRTokens` resolve the active palette, and does either path fall
  back to a stored value over the default?
- Which of the 51 band literals are exact `--forest`/on-dark-ink derivations vs genuine one-offs?
- Does anything outside `templates/techpremium/` read `techPremiumPalettes` or assume length 1
  (conformance tests, registration tests, picker code)?
- `conformance.test.ts:409` treats techpremium as retired — does adding a palette trip it?

## Candidate human gates

- **Confirmation that no DB/draft write is required** (depends on the first exploration question).
  If a row write turns out to be necessary, stop — it conflicts with the "his edits must not go"
  constraint and needs a fresh decision.
- Founder taste-pick on the rendered result before merge.
- Republish of Naayom — **explicitly out of this spec**, decided separately, customer-go required.

## Acceptance criteria

- [ ] `harbor` exists as a palette record with all values above; `forest` retained.
- [ ] `defaultTechPremiumPalette === 'harbor'`; `pilotEnabledPalettes` unchanged in spirit (no picker).
- [ ] `serializePaletteOverrides()` emits neutrals, `--teal*`, `--ok*` in addition to `--forest*`/`--lime*`.
- [ ] `forest` serialized output is byte-identical to pre-change (regression test or golden string).
- [ ] All 51 band-family literals derive from tokens; the 7 lime-128 literals carry the new green.
- [ ] `.tp-ph.on-dark` follows the palette.
- [ ] **Editor↔published parity**: every touched `.tsx`/`.published.tsx` pair renders identical colour;
      `TechPremiumFooter` verified specifically (asymmetric literal placement).
- [ ] Switching the default back to `forest` restores today's look with **no other code change** —
      verified, not assumed.
- [ ] No change to `prisma/schema.prisma`, no migration, no write to any `Project` row.
- [ ] `tsc` + `npm run test:run` green; `npm run build` green.
- [ ] Founder eyeball on `npm run dev`: `/edit/[token]` and its published render.

## Pilot / smallest slice

**Slice 1 (decision gate):** widen `TechPremiumPaletteConfig`, add the `harbor` record, flip the
default — tokens only, zero block-literal work. The page renders navy-banded but with ~51 stale
green literals. Founder looks at it and confirms the direction and the switch mechanism works
(flip to `forest`, old look returns).

**Slice 2:** tokenise the 51 band literals + re-hue the 7 limes, per-block, dual-renderer-paired.

Gate between them: if slice 1 shows the palette record can't carry the neutrals cleanly, or the
default flip doesn't reach the project, stop and re-decide before touching 20 block files.
