# Mukta (Granth captions / labels / buttons)

Clean Devanagari sans for letterspaced captions, facts labels, and buttons. Also the
display face for the `adhunik` (sans-led) variant. Weights 300/400/500/600.

**Devanagari subset is mandatory** (not Latin-only): Mukta carries Hindi in Granth — the
hero role line, facts labels (जन्म / पुस्तकें), the CTA button (पुस्तकें देखें), and section
captions (परिचय / जुड़िए). Latin-only would silently fall back to the system Devanagari
font (the "cheap Hindi" failure this vertical exists to avoid).

Files (Fontsource `mukta@latest`, jsDelivr CDN) — per weight, split subsets:

- `mukta-devanagari-{300,400,500,600}-normal.woff2`
- `mukta-latin-{300,400,500,600}-normal.woff2`

`unicode-range` in `src/styles/fonts-self-hosted.css` routes glyphs between the two.

Re-fetch:
```
base=https://cdn.jsdelivr.net/fontsource/fonts/mukta@latest
for w in 300 400 500 600; do for s in devanagari latin; do
  curl -sSL -o "mukta-$s-$w-normal.woff2" "$base/$s-$w-normal.woff2"
done; done
```
