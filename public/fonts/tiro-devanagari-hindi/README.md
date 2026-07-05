# Tiro Devanagari Hindi (Granth display + body)

Devanagari-first literary serif. Single weight (400) — hierarchy via size, never faux-bold.
Hindi is never italicised; the Latin italic exists only for stray Latin `<em>`.

Files (Fontsource `tiro-devanagari-hindi@latest`, jsDelivr CDN):

- `tiro-devanagari-hindi-devanagari-400-normal.woff2` — Devanagari subset (LCP hero name)
- `tiro-devanagari-hindi-latin-400-normal.woff2` — Latin subset
- `tiro-devanagari-hindi-latin-400-italic.woff2` — Latin italic (stray Latin `<em>` only)

Subsets are split across separate files sharing one `font-family`, so
`src/styles/fonts-self-hosted.css` uses `unicode-range` to route glyphs (the rest of
that file uses single Latin-only files and no ranges).

Re-fetch:
```
base=https://cdn.jsdelivr.net/fontsource/fonts/tiro-devanagari-hindi@latest
curl -sSL -o tiro-devanagari-hindi-devanagari-400-normal.woff2 "$base/devanagari-400-normal.woff2"
curl -sSL -o tiro-devanagari-hindi-latin-400-normal.woff2      "$base/latin-400-normal.woff2"
curl -sSL -o tiro-devanagari-hindi-latin-400-italic.woff2      "$base/latin-400-italic.woff2"
```
