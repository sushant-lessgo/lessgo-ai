#!/usr/bin/env node
/**
 * renderPage.mjs — headless-render fallback for the coverage-100 scraper.
 *
 * WebFetch/curl is the fast path. This exists for the pages that defeat it:
 * client-rendered shells that serve a "Loading..." skeleton to a static fetch
 * and only paint the real content (booking wizards, pricing, forms) after
 * hydration. Those are exactly the pages the experiment most needs.
 *
 *   node scripts/renderPage.mjs <url> [--json] [--timeout=30000]
 *
 * Prints JSON: { url, final_url, ok, chars, text, headings, form_controls,
 *                links, embeds, oddities }
 *
 * Notes learned the hard way:
 *  - `networkidle` never settles on sites with persistent analytics sockets;
 *    it just burns the full timeout. Use `domcontentloaded` + a content wait.
 *  - Content wait is two-pronged: body text crosses a threshold OR a real
 *    landmark element appears. A pure char-count wait misses image-only pages.
 */
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const url = args.find(a => !a.startsWith('--'));
const timeout = Number((args.find(a => a.startsWith('--timeout=')) || '').split('=')[1]) || 30000;

if (!url) {
  console.error('usage: node scripts/renderPage.mjs <url> [--timeout=30000]');
  process.exit(2);
}

/** Markers that mean "this is a hydration shell, not the page". */
const SHELL_MARKERS = /^(laden|loading|lädt|chargement|cargando|caricamento|読み込み|加载)[.…\s]*$/i;
const MIN_REAL_TEXT = 200;

const out = { url, final_url: null, ok: false, chars: 0, text: '', headings: [], form_controls: [], links: [], embeds: [], oddities: [] };

let browser;
try {
  browser = await chromium.launch();
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

  // Wait for hydration: real text OR a real landmark. Never fatal — a page that
  // stays a shell is itself a finding, recorded as an oddity below.
  await page
    .waitForFunction(
      ({ min, shellSrc }) => {
        const t = (document.body?.innerText || '').trim();
        if (new RegExp(shellSrc, 'i').test(t)) return false;
        if (t.length >= min) return true;
        return !!document.querySelector('main h1, main h2, form, [role="main"] h1, article');
      },
      { min: MIN_REAL_TEXT, shellSrc: SHELL_MARKERS.source },
      { timeout: Math.min(timeout, 20000) }
    )
    .catch(() => out.oddities.push('hydration wait timed out; captured whatever was painted'));

  await page.waitForTimeout(1200); // let late widgets (maps, calendars) settle

  const data = await page.evaluate(() => {
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();
    return {
      text: clean(document.body?.innerText),
      headings: [...document.querySelectorAll('h1,h2,h3')]
        .map(h => ({ tag: h.tagName, text: clean(h.innerText) }))
        .filter(h => h.text)
        .slice(0, 60),
      form_controls: [...document.querySelectorAll('input,select,textarea,button')]
        .map(e => ({
          tag: e.tagName,
          type: e.getAttribute('type') || '',
          name: e.getAttribute('name') || '',
          label: clean(e.placeholder || e.innerText).slice(0, 60),
        }))
        .slice(0, 40),
      links: [...document.querySelectorAll('a[href]')]
        .map(a => ({ text: clean(a.innerText).slice(0, 60), href: a.href }))
        .filter(l => l.text)
        .slice(0, 80),
      embeds: [...document.querySelectorAll('iframe[src]')].map(f => f.src).slice(0, 15),
    };
  });

  out.final_url = page.url();
  Object.assign(out, data);
  out.chars = out.text.length;
  out.ok = out.chars >= MIN_REAL_TEXT || out.headings.length > 0;
  if (SHELL_MARKERS.test(out.text)) out.oddities.push(`page never hydrated past shell: "${out.text.slice(0, 40)}"`);
} catch (err) {
  out.oddities.push(`render failed: ${err.name}: ${err.message.split('\n')[0]}`);
} finally {
  await browser?.close();
}

console.log(JSON.stringify(out, null, 1));
process.exit(out.ok ? 0 : 1);
