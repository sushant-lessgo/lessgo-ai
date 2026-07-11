/**
 * scanBase64Content.ts — READ-ONLY diagnostic (perf-03 phase 1).
 *
 * Iterates Project rows and searches their `content` + `themeValues` JSON for
 * embedded `data:image` and ephemeral `blob:` URLs. Reports per-project hits
 * (id, token, matched prefix, approximate matched byte size, count) and a
 * summary (projects scanned / affected / total embedded bytes).
 *
 * ZERO WRITES: uses only prisma.project.findMany (reads). Safe to run against
 * any DB — DATABASE_URL selects the target. Delete-after-use per docs policy.
 *
 * Run:  npx tsx scripts/scanBase64Content.ts
 */
import { config } from 'dotenv';
import { prisma } from '../src/lib/prisma';

config({ path: '.env.local' });

// Match a data:image URI or a blob: URL. Capture enough to report the prefix.
// data:image/<type>;base64,<payload>  — payload greedily to a URL/JSON delimiter.
// blob:<origin>/<uuid>                 — up to a URL/JSON delimiter.
const DATA_IMAGE_RE = /data:image\/[a-zA-Z0-9.+-]+;[^"'\\\s)]*/g;
const BLOB_RE = /blob:[^"'\\\s)]+/g;

interface Hit {
  kind: 'data:image' | 'blob:';
  prefix: string;
  size: number;
}

function scanString(json: string): Hit[] {
  const hits: Hit[] = [];
  for (const m of json.matchAll(DATA_IMAGE_RE)) {
    hits.push({
      kind: 'data:image',
      prefix: m[0].slice(0, 48),
      size: m[0].length,
    });
  }
  for (const m of json.matchAll(BLOB_RE)) {
    hits.push({
      kind: 'blob:',
      prefix: m[0].slice(0, 48),
      size: m[0].length,
    });
  }
  return hits;
}

async function scanBase64Content() {
  const dbTarget = (process.env.DATABASE_URL || '').replace(/:\/\/[^@]*@/, '://***@');
  console.log('🔍 Scanning Project.content + themeValues for data:image / blob: URLs');
  console.log('   DATABASE_URL:', dbTarget || '(unset)');
  console.log('');

  const projects = await prisma.project.findMany({
    select: {
      id: true,
      tokenId: true,
      title: true,
      content: true,
      themeValues: true,
    },
  });

  let affected = 0;
  let totalBytes = 0;
  let totalHits = 0;

  for (const p of projects) {
    const hits: Hit[] = [];
    if (p.content != null) hits.push(...scanString(JSON.stringify(p.content)));
    if (p.themeValues != null) hits.push(...scanString(JSON.stringify(p.themeValues)));

    if (hits.length === 0) continue;

    affected += 1;
    const projBytes = hits.reduce((s, h) => s + h.size, 0);
    totalBytes += projBytes;
    totalHits += hits.length;

    console.log(`⚠️  Project ${p.id}`);
    console.log(`     token: ${p.tokenId}`);
    console.log(`     title: ${p.title}`);
    console.log(`     hits:  ${hits.length}  (~${(projBytes / 1024).toFixed(1)} KB embedded)`);
    hits.forEach((h, i) => {
      console.log(`       ${i + 1}. [${h.kind}] ${(h.size / 1024).toFixed(1)} KB — ${h.prefix}…`);
    });
    console.log('');
  }

  console.log('──────────────────────────────────────────────');
  console.log('📊 Summary');
  console.log(`   Projects scanned:  ${projects.length}`);
  console.log(`   Projects affected: ${affected}`);
  console.log(`   Total hits:        ${totalHits}`);
  console.log(`   Total embedded:    ~${(totalBytes / 1024).toFixed(1)} KB (${totalBytes} bytes)`);
  console.log('──────────────────────────────────────────────');

  await prisma.$disconnect();
}

scanBase64Content().catch(async (e) => {
  console.error('❌ Scan failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
