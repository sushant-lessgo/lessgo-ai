/**
 * preview.js — publish a standalone HTML file to a *.lessgo.site subdomain
 * with no project / DB / deploy. Reuses the existing KV→blob-proxy pipeline:
 * uploads the HTML to Vercel Blob, then writes route:{host}:/ in KV so the
 * middleware (Branch A) serves it via /api/blob-proxy.
 *
 * Usage:
 *   node scripts/preview.js <subdomain> <file.html>      # publish
 *   node scripts/preview.js --rm <subdomain>             # take down
 *
 * Subdomain is the host label only (no .lessgo.site), e.g. "kp-direction1-lumen".
 */
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { put, del } = require('@vercel/blob');
const { kv } = require('@vercel/kv');

const DOMAIN = 'lessgo.site';
const TTL = 365 * 24 * 60 * 60; // 1 year

function routeKey(host) {
  return `route:${host}:/`;
}

async function publish(label, file) {
  const sub = label.toLowerCase();
  const host = `${sub}.${DOMAIN}`;
  const html = fs.readFileSync(file, 'utf8');

  const blob = await put(`previews/${sub}/index.html`, html, {
    access: 'public',
    contentType: 'text/html; charset=utf-8',
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  const version = `${html.length}`; // simple content-derived ETag; no Date.now needed
  await kv.set(
    routeKey(host),
    { pageId: `preview-${sub}`, version, blobUrl: blob.url, publishedAt: 0 },
    { ex: TTL }
  );

  return `https://${host}`;
}

async function remove(label) {
  const sub = label.toLowerCase();
  const host = `${sub}.${DOMAIN}`;
  const cfg = await kv.get(routeKey(host));
  if (cfg && cfg.blobUrl) {
    try { await del(cfg.blobUrl); } catch (e) { console.warn('blob del skipped:', e.message); }
  }
  await kv.del(routeKey(host));
  console.log(`✓ removed ${host}`);
}

(async () => {
  const args = process.argv.slice(2);
  if (args[0] === '--rm') {
    if (!args[1]) { console.error('usage: node scripts/preview.js --rm <subdomain>'); process.exit(1); }
    await remove(args[1]);
    return;
  }
  const [label, file] = args;
  if (!label || !file) { console.error('usage: node scripts/preview.js <subdomain> <file.html>'); process.exit(1); }
  const url = await publish(label, path.resolve(file));
  console.log(`✓ live: ${url}`);
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
