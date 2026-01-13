# Font Download Instructions

All code files have been created. Now you need to download 15 font files (latin subset, woff2 format).

## Quick Download via Google Fonts Helper

Visit: **https://gwfh.mranftl.com/fonts**

### 1. Inter (4 files)
1. Go to https://gwfh.mranftl.com/fonts/inter
2. Select **latin** subset only
3. Select weights: **Regular (400), Medium (500), SemiBold (600), Bold (700)**
4. Format: **woff2**
5. Download and rename:
   - `Inter-Regular.woff2` → `inter-400-latin.woff2`
   - `Inter-Medium.woff2` → `inter-500-latin.woff2`
   - `Inter-SemiBold.woff2` → `inter-600-latin.woff2`
   - `Inter-Bold.woff2` → `inter-700-latin.woff2`
6. Place in: `public/fonts/inter/`

### 2. Sora (4 files)
1. Go to https://gwfh.mranftl.com/fonts/sora
2. Select **latin** subset only
3. Select weights: **Regular (400), Medium (500), SemiBold (600), Bold (700)**
4. Format: **woff2**
5. Download and rename:
   - `Sora-Regular.woff2` → `sora-400-latin.woff2`
   - `Sora-Medium.woff2` → `sora-500-latin.woff2`
   - `Sora-SemiBold.woff2` → `sora-600-latin.woff2`
   - `Sora-Bold.woff2` → `sora-700-latin.woff2`
6. Place in: `public/fonts/sora/`

### 3. DM Sans (4 files)
1. Go to https://gwfh.mranftl.com/fonts/dm-sans
2. Select **latin** subset only
3. Select weights: **Regular (400), Medium (500), SemiBold (600), Bold (700)**
4. Format: **woff2**
5. Download and rename:
   - `DMSans-Regular.woff2` → `dm-sans-400-latin.woff2`
   - `DMSans-Medium.woff2` → `dm-sans-500-latin.woff2`
   - `DMSans-SemiBold.woff2` → `dm-sans-600-latin.woff2`
   - `DMSans-Bold.woff2` → `dm-sans-700-latin.woff2`
6. Place in: `public/fonts/dm-sans/`

### 4. Playfair Display (3 files - NO 400 weight)
1. Go to https://gwfh.mranftl.com/fonts/playfair-display
2. Select **latin** subset only
3. Select weights: **Medium (500), SemiBold (600), Bold (700)** (skip Regular 400)
4. Format: **woff2**
5. Download and rename:
   - `PlayfairDisplay-Medium.woff2` → `playfair-display-500-latin.woff2`
   - `PlayfairDisplay-SemiBold.woff2` → `playfair-display-600-latin.woff2`
   - `PlayfairDisplay-Bold.woff2` → `playfair-display-700-latin.woff2`
6. Place in: `public/fonts/playfair-display/`

## Alternative: Direct Google Fonts Download

If gwfh.mranftl.com doesn't work:

1. Go to https://fonts.google.com/
2. Search for the font
3. Click "Download family"
4. Extract the zip
5. Find the `/static/` folder with individual weight files
6. Convert TTF to WOFF2 using https://cloudconvert.com/ttf-to-woff2 (or use fonttools locally)
7. Rename following the convention above
8. Place in appropriate `public/fonts/` subdirectory

## Verification

After downloading, verify:

```bash
ls -la public/fonts/inter/
ls -la public/fonts/sora/
ls -la public/fonts/dm-sans/
ls -la public/fonts/playfair-display/
```

Expected structure:
```
public/fonts/
├── inter/
│   ├── inter-400-latin.woff2
│   ├── inter-500-latin.woff2
│   ├── inter-600-latin.woff2
│   └── inter-700-latin.woff2
├── sora/
│   ├── sora-400-latin.woff2
│   ├── sora-500-latin.woff2
│   ├── sora-600-latin.woff2
│   └── sora-700-latin.woff2
├── dm-sans/
│   ├── dm-sans-400-latin.woff2
│   ├── dm-sans-500-latin.woff2
│   ├── dm-sans-600-latin.woff2
│   └── dm-sans-700-latin.woff2
└── playfair-display/
    ├── playfair-display-500-latin.woff2
    ├── playfair-display-600-latin.woff2
    └── playfair-display-700-latin.woff2
```

Total: 15 files (~30-40KB each, ~500KB total)

## Next Steps After Download

Once fonts are downloaded:

1. Run `npm run dev`
2. Navigate to `/p/page3` (your existing published page)
3. Check DevTools Network tab:
   - Filter by "font"
   - Verify fonts load from `/fonts/sora/sora-700-latin.woff2` etc.
   - Check preload tags in page source
4. Run `npm run build` to verify build works
5. Deploy and test on PageSpeed Insights

## Troubleshooting

If fonts don't appear:
- Check file naming matches exactly (lowercase, hyphens, -latin suffix)
- Verify files are in correct subdirectories
- Check browser console for 404 errors
- Try hard refresh (Ctrl+Shift+R) to clear cache
