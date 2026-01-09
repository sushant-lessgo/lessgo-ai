/**
 * Build Assets Script - Phase 4
 *
 * Minifies formHandler.js and analyticsGenerator.js
 * Outputs to public/assets/ for static serving
 *
 * Usage: node scripts/buildAssets.js
 * Install terser: npm install --save-dev terser
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
const outDir = path.join(__dirname, '../public/assets');

const files = [
  { src: 'formHandler.js', out: 'form.v1.js' },
  { src: 'analyticsGenerator.js', out: 'a.v1.js' },
];

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function build() {
  console.log('🔨 Building static assets...\n');

  for (const file of files) {
    const srcPath = path.join(srcDir, file.src);
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
