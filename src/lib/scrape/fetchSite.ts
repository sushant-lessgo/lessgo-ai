// src/lib/scrape/fetchSite.ts
// SSRF-hardened fetch + bounded crawl + HTML→text for the onboarding website
// import (/api/v2/scrape-website). Server-only.
//
// Security model (see POreview.md):
//  - Only http/https.
//  - Resolve the host to IP(s) and validate EVERY resolved IP against private
//    ranges. The validated IP is PINNED for the connection via an undici Agent
//    with a custom connect.lookup, which closes the DNS-rebinding TOCTOU window
//    (the IP we validate is the IP undici connects to; TLS SNI still uses the
//    hostname so certs validate normally).
//  - Fetched via undici.request (not global fetch — Next.js patches the global
//    and can drop the dispatcher). Redirects followed manually; each hop's host
//    is re-validated and flows through the same pinned-lookup Agent.
//  - content-type must be text/html; response body capped at MAX_BYTES.
//
// Discovery: sitemap.xml first, then same-origin <a> links from the homepage,
// keyword-ranked, capped at MAX_PAGES. We fetch all candidates and let the LLM
// extract over the concatenated text ("don't trust page names" — naayom's real
// testimonials lived on the homepage, not /success-story.html).

import 'server-only';
import dns from 'node:dns/promises';
import net from 'node:net';
import { Agent, request } from 'undici';
import { JSDOM } from 'jsdom';
import { logger } from '@/lib/logger';
import { bareHost, isPrivateIp } from './ssrfGuard';

export { isPrivateIp } from './ssrfGuard';

const MAX_PAGES = 8;
const PER_PAGE_CHARS = 6000;
const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const FETCH_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 4;
const USER_AGENT = 'LessgoBot/1.0 (+https://lessgo.ai)';

const PAGE_KEYWORDS = [
  'testimonial', 'success', 'case', 'story', 'review', 'customer',
  'product', 'feature', 'pricing', 'plan', 'about', 'service', 'solution',
];

export class ScrapeError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message || code);
    this.code = code;
    this.name = 'ScrapeError';
  }
}

export interface ScrapedPage {
  url: string;
  title: string;
  text: string;
}

export interface ScrapedSite {
  homepageUrl: string;
  pages: ScrapedPage[];
  combinedText: string;
}

/** Validate protocol + host, returning a parsed URL or throwing ScrapeError. */
function assertAllowedUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new ScrapeError('invalid_url', 'That does not look like a valid URL.');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new ScrapeError('invalid_url', 'Only http and https URLs are supported.');
  }
  const host = bareHost(u.hostname);
  if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new ScrapeError('blocked_host', 'That host is not allowed.');
  }
  if (net.isIP(host) && isPrivateIp(host)) {
    throw new ScrapeError('blocked_host', 'That address is not allowed.');
  }
  return u;
}

/** Return the same URL with the www. prefix added/removed, or null if N/A. */
function toggleWww(u: URL): URL | null {
  const host = bareHost(u.hostname);
  // Only toggle real registrable hosts, never IP literals.
  if (net.isIP(host)) return null;
  const alt = new URL(u.href);
  alt.hostname = host.startsWith('www.') ? host.slice(4) : `www.${host}`;
  return alt;
}

/**
 * undici Agent that resolves the host itself, rejects any private IP, and pins
 * the connection to a validated IP — closing the rebinding window. Re-used for
 * every fetch (including redirect hops) in one scrape.
 */
function buildSecureAgent(): Agent {
  return new Agent({
    connect: {
      // undici calls this in place of dns.lookup for the actual connection.
      // It passes { all: true } (Happy Eyeballs / autoSelectFamily), so when
      // `all` is set the callback MUST return the address ARRAY, not
      // (address, family) — otherwise undici sees `undefined` as the address.
      lookup: (
        hostname: string,
        opts: { all?: boolean } | undefined,
        cb: (
          err: Error | null,
          address: string | Array<{ address: string; family: number }>,
          family?: number
        ) => void
      ) => {
        dns
          .lookup(hostname, { all: true, verbatim: true })
          .then((addresses) => {
            if (!addresses.length) {
              cb(new ScrapeError('blocked_host', 'No DNS records.'), '', 0);
              return;
            }
            for (const a of addresses) {
              if (isPrivateIp(a.address)) {
                cb(new ScrapeError('blocked_host', `Blocked address ${a.address}.`), '', 0);
                return;
              }
            }
            // IPv4 first — more universally routable than IPv6.
            const sorted = [...addresses].sort((a, b) => a.family - b.family);
            if (opts?.all) cb(null, sorted);
            else cb(null, sorted[0].address, sorted[0].family);
          })
          .catch(() => cb(new ScrapeError('blocked_host', 'DNS lookup failed.'), '', 0));
      },
    },
  });
}

/** undici headers are string | string[] | undefined — take the first value. */
function headerValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Fetch one URL as HTML via undici.request (NOT global fetch — Next.js patches
 * the global and can drop the `dispatcher` option, defeating our SSRF agent).
 * Redirects are followed manually so each hop's host is re-validated; the agent
 * additionally validates the resolved IP of every physical connection.
 */
async function fetchHtml(startUrl: URL, agent: Agent): Promise<string | null> {
  let current = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    assertAllowedUrl(current.href); // re-validate host on every hop

    try {
      const { statusCode, headers, body } = await request(current.href, {
        method: 'GET',
        dispatcher: agent,
        maxRedirections: 0,
        headersTimeout: FETCH_TIMEOUT_MS,
        bodyTimeout: FETCH_TIMEOUT_MS,
        headers: { 'user-agent': USER_AGENT, accept: 'text/html,*/*' },
      });

      if (statusCode >= 300 && statusCode < 400) {
        const loc = headerValue(headers['location']);
        await body.dump();
        if (!loc) return null;
        current = new URL(loc, current);
        continue;
      }
      if (statusCode < 200 || statusCode >= 300) {
        await body.dump();
        return null;
      }

      const ct = (headerValue(headers['content-type']) || '').toLowerCase();
      if (!ct.includes('text/html')) {
        await body.dump();
        return null;
      }
      const declared = parseInt(headerValue(headers['content-length']) || '0', 10);
      if (declared > MAX_BYTES) {
        await body.dump();
        return null;
      }

      const buf = Buffer.from(await body.arrayBuffer());
      if (buf.byteLength > MAX_BYTES) return null;
      return buf.toString('utf-8');
    } catch (err) {
      logger.warn(
        `[scrape] fetch failed for ${current.href}: ${(err as Error)?.message || String(err)}`
      );
      return null;
    }
  }
  return null;
}

interface ParsedDoc {
  title: string;
  text: string;
  links: string[];
}

/** Strip noise, collapse whitespace, collect same-doc links + title. */
function parseDoc(html: string, baseUrl: URL): ParsedDoc {
  // runScripts is disabled by default — page JS never executes.
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const title = doc.querySelector('title')?.textContent?.trim() || '';

  const links: string[] = [];
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href) links.push(href);
  });

  doc.querySelectorAll('script, style, noscript, svg, iframe, head').forEach((el) => el.remove());
  const text = (doc.body?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PER_PAGE_CHARS);

  // Resolve links to absolute, same-origin hrefs.
  const resolved: string[] = [];
  for (const href of links) {
    try {
      const u = new URL(href, baseUrl);
      if (u.origin === baseUrl.origin) resolved.push(u.href);
    } catch {
      /* skip junk hrefs */
    }
  }

  dom.window.close();
  return { title, text, links: resolved };
}

const ASSET_RE = /\.(png|jpe?g|gif|svg|webp|ico|css|js|json|xml|pdf|zip|mp4|mp3|woff2?|ttf)(\?|$)/i;

function cleanCandidate(href: string): string | null {
  try {
    const u = new URL(href);
    u.hash = '';
    if (ASSET_RE.test(u.pathname)) return null;
    return u.href;
  } catch {
    return null;
  }
}

function scoreUrl(href: string): number {
  const lower = href.toLowerCase();
  let score = 0;
  for (const kw of PAGE_KEYWORDS) if (lower.includes(kw)) score += 2;
  // Shallower paths are usually more important.
  const depth = new URL(href).pathname.split('/').filter(Boolean).length;
  score -= depth;
  return score;
}

/** Pull <loc> URLs from a sitemap.xml (best-effort, same-origin only). */
async function fetchSitemapUrls(origin: string, agent: Agent): Promise<string[]> {
  let xml: string | null = null;
  try {
    const u = new URL('/sitemap.xml', origin);
    // The secure agent validates each hop's IP, so undici's built-in redirect
    // following is SSRF-safe here.
    const { statusCode, headers, body } = await request(u.href, {
      method: 'GET',
      dispatcher: agent,
      maxRedirections: 2,
      headersTimeout: FETCH_TIMEOUT_MS,
      bodyTimeout: FETCH_TIMEOUT_MS,
      headers: { 'user-agent': USER_AGENT },
    });
    const ct = (headerValue(headers['content-type']) || '').toLowerCase();
    if (statusCode >= 200 && statusCode < 300 && ct.includes('xml')) {
      const buf = Buffer.from(await body.arrayBuffer());
      if (buf.byteLength <= MAX_BYTES) xml = buf.toString('utf-8');
    } else {
      await body.dump();
    }
  } catch (err) {
    logger.dev(`[scrape] sitemap fetch failed: ${(err as Error)?.message || String(err)}`);
    return [];
  }
  if (!xml) return [];

  const urls: string[] = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    try {
      const u = new URL(m[1]);
      if (u.origin === origin) urls.push(u.href);
    } catch {
      /* skip */
    }
  }
  return urls;
}

/**
 * Scrape a site: fetch homepage, discover up to MAX_PAGES same-origin pages
 * (sitemap + nav), fetch+strip each, and return concatenated text for the LLM.
 * Throws ScrapeError('fetch_failed') if the homepage itself can't be read.
 */
export async function scrapeSite(rawUrl: string): Promise<ScrapedSite> {
  let homepage = assertAllowedUrl(rawUrl);
  const agent = buildSecureAgent();

  try {
    let homeHtml = await fetchHtml(homepage, agent);

    // Many sites only serve on one of apex / www (e.g. naayom.com doesn't
    // resolve but www.naayom.com does). Toggle the www. prefix and retry once.
    if (!homeHtml) {
      const alt = toggleWww(homepage);
      if (alt) {
        logger.dev(`[scrape] ${homepage.href} failed; retrying ${alt.href}`);
        const altHtml = await fetchHtml(alt, agent);
        if (altHtml) {
          homepage = alt;
          homeHtml = altHtml;
        }
      }
    }

    if (!homeHtml) {
      throw new ScrapeError('fetch_failed', 'Could not read that website.');
    }
    const homeDoc = parseDoc(homeHtml, homepage);

    // Candidate discovery: sitemap + homepage links, deduped, same-origin.
    const sitemapUrls = await fetchSitemapUrls(homepage.origin, agent);
    const candidates = new Set<string>();
    for (const href of [...sitemapUrls, ...homeDoc.links]) {
      const clean = cleanCandidate(href);
      if (clean && clean !== homepage.href) candidates.add(clean);
    }

    const ranked = [...candidates]
      .sort((a, b) => scoreUrl(b) - scoreUrl(a))
      .slice(0, MAX_PAGES - 1); // reserve a slot for the homepage

    const pages: ScrapedPage[] = [
      { url: homepage.href, title: homeDoc.title, text: homeDoc.text },
    ];

    const fetched = await Promise.all(
      ranked.map(async (href) => {
        try {
          const html = await fetchHtml(new URL(href), agent);
          if (!html) return null;
          const doc = parseDoc(html, new URL(href));
          if (!doc.text) return null;
          return { url: href, title: doc.title, text: doc.text } as ScrapedPage;
        } catch {
          return null;
        }
      })
    );
    for (const p of fetched) if (p) pages.push(p);

    const combinedText = pages
      .map((p) => `## PAGE: ${p.url}\n${p.title ? `TITLE: ${p.title}\n` : ''}${p.text}`)
      .join('\n\n---\n\n');

    logger.dev(`[scrape] ${homepage.href}: ${pages.length} page(s), ${combinedText.length} chars`);

    return { homepageUrl: homepage.href, pages, combinedText };
  } finally {
    await agent.close().catch(() => {});
  }
}
