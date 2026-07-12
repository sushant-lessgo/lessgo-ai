/**
 * Build Assets Script - Phase 4
 *
 * Minifies formHandler.js and analyticsGenerator.js
 * Outputs to public/assets/ for static serving
 *
 * Usage: node scripts/buildAssets.js
 * Install terser: npm install --save-dev terser
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * VERSIONING CONTRACT — a shipped asset filename NEVER changes semantics.
 *
 * Published blobs are immutable HTML that hardcode an asset URL
 * (e.g. `<script src="https://lessgo.ai/assets/a.v1.js">`). Those blobs are never
 * rewritten. So if you change what `a.v1.js` *does* and redeploy, every historical
 * blob silently switches to the new behaviour with no handshake — the F9 drift.
 *
 * RULE: any semantic change to a beacon/form/behaviour script → emit it under a
 * NEW filename (a.v2.js, form.v2.js, …) and repoint htmlGenerator.ts + the SSR
 * published renderer at the new name for NEW publishes only. The old filename keeps
 * shipping its ORIGINAL bytes for old blobs — build it from a frozen legacy source
 * under scripts/legacy/ so a source-file edit can't leak into it. Never overwrite.
 *
 * Current mapping:
 *   a.v1.js  ← scripts/legacy/a.v1.src.js            (FROZEN pre-scale-04 beacon)
 *   a.v2.js  ← src/lib/staticExport/analyticsGenerator.js  (live: role+placement, v:2)
 *   form.v1.js ← src/lib/staticExport/formHandler.js  (unchanged since 2026-01, still v1)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');

// Check if Terser is available
let minify;
try {
  minify = require('terser').minify;
} catch (err) {
  console.warn('⚠️  Terser not found. Installing terser is recommended for minification.');
  console.warn('   Run: npm install --save-dev terser');
  console.warn('   For now, copying files without minification...\n');
}

// Paths
const srcDir = path.join(__dirname, '../src/lib/staticExport');
const legacyDir = path.join(__dirname, 'legacy');
const outDir = path.join(__dirname, '../public/assets');

// `dir` defaults to srcDir; frozen legacy artifacts pin their own source dir so an
// edit to the live source can never leak into a shipped-versioned filename.
const files = [
  { src: 'formHandler.js', out: 'form.v1.js' },
  { src: 'a.v1.src.js', out: 'a.v1.js', dir: legacyDir }, // FROZEN pre-scale-04 beacon (see contract above)
  { src: 'analyticsGenerator.js', out: 'a.v2.js' },       // live beacon: role+placement, v:2
  { src: 'naayomBehaviors.js', out: 'naayom.v1.js' }, // Phase 4: TechPremium behaviors
  { src: 'lumenBehaviors.js', out: 'lumen.v1.js' },   // Lumen: lightbox + reveal + EN/NL toggle/geo
  { src: 'atelierSliderBehaviors.js', out: 'slider.v1.js' }, // Atelier: hero cover slider (autoplay crossfade + arrows + injected dots). Immutable v1 — behavior change ⇒ slider.v2.js
  { src: 'switcherBehaviors.js', out: 'switcher.v1.js' }, // i18n: shared template-agnostic locale switcher pill + geo redirect
];

// Static CSS copied verbatim (no minify) into public/assets for published pages.
// Published HTML loads https://lessgo.ai/assets/fonts-self-hosted.css — keep this
// in lockstep with the source of truth so the two never drift.
const cssCopies = [
  { src: '../../styles/fonts-self-hosted.css', out: 'fonts-self-hosted.css' },
];

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function build() {
  console.log('🔨 Building static assets...\n');

  for (const file of files) {
    const srcPath = path.join(file.dir || srcDir, file.src);
    const outPath = path.join(outDir, file.out);

    // Read source
    const code = fs.readFileSync(srcPath, 'utf8');
    const originalSize = Buffer.byteLength(code, 'utf8');

    let output;
    let minified = false;

    if (minify) {
      // Minify with Terser
      try {
        const result = await minify(code, {
          compress: {
            dead_code: true,
            drop_console: false, // Keep console logs for debugging
            drop_debugger: true,
            pure_funcs: [],
          },
          mangle: {
            toplevel: true,
          },
          format: {
            comments: false,
          },
        });

        if (result.error) {
          console.error(`❌ Minification error in ${file.src}:`, result.error);
          output = code;
        } else {
          output = result.code;
          minified = true;
        }
      } catch (err) {
        console.error(`❌ Minification failed for ${file.src}:`, err.message);
        output = code;
      }
    } else {
      // No minification
      output = code;
    }

    // Write output
    fs.writeFileSync(outPath, output, 'utf8');

    // Calculate sizes
    const outputSize = Buffer.byteLength(output, 'utf8');
    const reduction = ((originalSize - outputSize) / originalSize * 100).toFixed(1);

    console.log(`✅ ${file.out}`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   Output:   ${(outputSize / 1024).toFixed(2)} KB${minified ? ` (-${reduction}%)` : ' (not minified)'}`);
    console.log(`   Path:     ${outPath}\n`);
  }

  // Copy static CSS verbatim
  for (const css of cssCopies) {
    const srcPath = path.join(srcDir, css.src);
    const outPath = path.join(outDir, css.out);
    const code = fs.readFileSync(srcPath, 'utf8');
    fs.writeFileSync(outPath, code, 'utf8');
    console.log(`✅ ${css.out} (copied verbatim)`);
    console.log(`   Path:     ${outPath}\n`);
  }

  console.log('✨ Build complete!\n');

  // Summary
  const totalSize = files.reduce((sum, file) => {
    const outPath = path.join(outDir, file.out);
    return sum + fs.statSync(outPath).size;
  }, 0);

  console.log('📦 Total bundle size: ' + (totalSize / 1024).toFixed(2) + ' KB');
  console.log('🎯 Target: <5KB combined (<3KB form + <2KB analytics)\n');

  if (totalSize > 5120) {
    console.warn('⚠️  Warning: Bundle size exceeds 5KB target');
  }
}

build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
