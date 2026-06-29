# Spectral (Lumen display font)

The Lumen template's display serif. `@font-face` rules live in
`src/styles/fonts-self-hosted.css`. Drop the **latin** `woff2` files here with
these exact names (CSP `font-src 'self'` covers same-origin woff2 — no Google Fonts):

- `spectral-latin-300-normal.woff2`
- `spectral-latin-400-normal.woff2`
- `spectral-latin-400-italic.woff2`  ← load-bearing (accent `<em>` + signature)
- `spectral-latin-500-normal.woff2`
- `spectral-latin-600-normal.woff2`

Source: Google Fonts "Spectral" (OFL). Subset to latin. Until these are added,
headings fall back to Georgia (font-display: swap) — visible on `/p/[slug]`.
