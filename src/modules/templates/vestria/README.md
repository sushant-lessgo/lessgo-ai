# vestria — GA product template (manufacturing / trade lead-gen)

**Product** audience, GA (open to all users, no admin gate). Pilot: Golden Shadow Trading
(uniform manufacturing). Product has no template picker, so vestria is selected via the
onboarding `?template=vestria` param OR as the default for the `manufacturer` persona. See
`../README.md` for the folder anatomy + dual-renderer rules; only the quirks live here.

## Three orthogonal cosmetic axes

`ThemeInjector` sets all three attributes on one `<style id="vestria-theme">` (base+mood,
palette, variant, in that order):

| axis | attribute | swaps |
|------|-----------|-------|
| PALETTE | `[data-palette]` | accent duo only (`--accent`, `--accent-deep`) |
| VARIANT | `[data-variant]` | typefaces |
| MOOD | `[data-mood]` | neutral palette |

- **Palettes (8, all live):** `cobalt` (default), brass, emerald, safety, claret, teal,
  aubergine, indigo.
- **Variants (3):** `tailored` (default; Bodoni Moda + Hanken Grotesk), `modern` (Space
  Grotesk + Hanken Grotesk), `heritage` (Cormorant Garamond + Source Serif 4).

## The `mood` axis (unique to vestria)

`tokens.ts`: `vestriaMoods = ['bone', 'slate']`, `defaultVestriaMood = 'bone'`. This is the
only template that consumes `TemplateModule.ThemeInjector`/`SSRTokens`'s optional `mood`
prop (persisted in `Project.themeValues.mood`); all other templates ignore it.

- Applied via a **root-level `data-mood` attribute** (`document.documentElement` in edit;
  the SSRTokens wrapper div in published).
- `bone` IS the `:root` baseline (no override emitted). `slate` re-points 11 neutral vars
  (paper, paper2, ink, inkSoft, line, lineSoft, dark, dark2, onDark, onDarkSoft, lineDark)
  via `[data-mood="slate"]{…}`.
- Distinct from the per-section `data-surface` bands (paper/dark) — mood layers *under* them
  by re-pointing the vars those bands consume.

## `.core.tsx` single-source

Blocks use the `<Block>.core.tsx` + edit/published wrapper pattern (see `../README.md` §6),
enforced by `vestria/coreParity.test.ts`.
