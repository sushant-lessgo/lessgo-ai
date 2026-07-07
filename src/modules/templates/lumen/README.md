# lumen — bespoke §13 bilingual photography template

Bespoke, single-client template (Kundius Photography, "Kristina Kundius"). **Service**
audience. Registered + renderable but intentionally absent from the onboarding picker; a
project gets `templateId: 'lumen'` by white-glove seeding (`hooks/editStore/lumenSeed.ts`,
dev route `/dev/seed-lumen`). See the folder anatomy + dual-renderer rules in
`../README.md`. Only the quirks live here.

## Bilingual EN/NL — contained twin-fields, NO translation pipeline

- **Storage:** each translatable field is two independent sibling keys on the block content —
  the base key (EN) and a `_nl` twin (`headline`/`headline_nl`, `cta_text`/`cta_text_nl`,
  nav `label`/`label_nl`). The founder authors both by hand; nothing auto-translates.
  `langKey(base, lang)` in `i18nKeys.ts` returns `base` for EN, `${base}_nl` for NL.
  `i18nKeys.ts` is deliberately server-safe (no `'use client'`) so both renderers import it.
- **Edit toggle:** `editLang.tsx` gives a Lumen-scoped React context
  (`LumenEditLangProvider`, default `'en'`). `LumenEditable` routes reads/writes to the
  active twin key — you edit one language at a time inline, no shared-store schema change.
- **Header switcher:** `LumenNav.tsx` (edit) renders an EN·NL button group calling
  `setEditLang`. `LumenNav.published.tsx` renders the same buttons with
  `data-lang`/`aria-pressed`, wired at runtime by `lumen.v1.js`.
- **Published live-swap:** published blocks emit no context — each text node carries a
  `data-en`/`data-nl` attribute pair via `bilingualAttrs(en, nl)` (NL falls back to EN when
  empty, `nl || en`, so nothing renders blank). `lumen.v1.js` swaps visible `innerHTML` to
  the matching `data-{lang}` on toggle/geo. Visible default is EN.

## Palette: brass-only

`palettes.ts` ships a single `brass` palette (`lumenPalettes = ['brass']`,
`defaultLumenPalette = 'brass'`) — the only user-facing color knob. Emitted as
`[data-palette="brass"]` accent vars.
