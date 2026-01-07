This plan is **directionally right** (KV lookup in middleware → serve blob fast, SSR fallback on miss), but there are a few **critical corrections** you should make before implementing. Some are correctness/security, some are performance.

## What’s good

* KV-first routing with SSR fallback ✅
* Non-blocking KV update during publish ✅ (fallback keeps the site working)
* Key scheme `route:{host}:{path}` ✅ (good for multi-domain later)
* Edge proxy route ✅ (makes global serving possible)

## Critical issues to fix

### 1) **`@vercel/blob head()` in Edge runtime may not be what you want**

In `__blob_proxy`, the plan does:

* `head(blobKey)` to get a URL
* `fetch(blob.url)` to stream content

You don’t actually need `head()` if you already have a stable blob URL or can derive it. But with Vercel Blob, you typically **don’t** have a deterministic public URL purely from `blobKey` without calling the API.

**Problem:** `head()` is an API call per request → adds latency and is a dependency on Blob API availability. That undermines “<50ms”.

✅ Better: store **blobUrl** in KV alongside blobKey.

So KV RouteConfig should include:

```ts
blobUrl: string
```

Then `__blob_proxy` just does:

```ts
fetch(blobUrl)
```

No Blob API call per request.

---

### 2) **Cache headers are wrong for a stable route**

The proxy sets:

`Cache-Control: public, s-maxage=31536000, immutable`

That is great for **versioned URLs**, but your proxy route is a **stable path** (`/__blob_proxy?key=...`) and could be cached aggressively by CDNs *if you’re not careful*, especially if the `key` changes.

It *might* be okay because the query param changes per version, but you’re going to route stable slugs to it. You need to be explicit about caching strategy.

✅ Recommendation:

* For the proxy response, set caching based on **blobUrl/version**, not “immutable for everything”.

If your `key` is versioned and never reused, then immutable is fine. But be careful: if you later change proxy shape to `/__blob_proxy/{slug}`, immutable would be catastrophic.

**Safer now:**

```http
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
```

…and then in Phase 3.5 switch to immutable once you’re 100% sure the response is strictly versioned.

(If you keep `key=...version...`, immutable is acceptable, but document the invariant: **key must be content-addressed or version-addressed**.)

---

### 3) Middleware logging will hurt you

`console.log` in middleware for every request is expensive/noisy at scale.

✅ Do:

* log only on debug env, or sample (1%)
* or remove logs once verified

---

### 4) Middleware rewrite logic is slightly off

In the KV hit branch, plan does:

```ts
url.pathname = '/__blob_proxy';
url.searchParams.set('key', route.blobKey);
console.log('[Middleware] KV hit:', { host, path: url.pathname, ... })
return NextResponse.rewrite(url);
```

That log prints `path: '/__blob_proxy'`, not the original path, so debugging is misleading.

Also `path: url.pathname || '/'` earlier—`url.pathname` is never empty.

✅ Better:

* preserve originalPath in a variable
* write it to header `X-Route-From` if needed

---

### 5) Security: validating `blobKey` is not enough

The proxy only checks that key starts with `pages/` and ends with `/index.html`. If an attacker guesses or scrapes keys, they can fetch any page.

You may be okay with published pages being public. But you should still prevent arbitrary traversal.

✅ Add a stricter regex:

* `pages/{pageId}/{version}/index.html` where `pageId` matches your ID format
* `version` matches your timestamp+nanoid format

And (stronger):
✅ Only accept keys that exist in KV route config for the requesting host.
That means: **don’t pass blobKey directly from middleware to proxy** as a query param unless you’re sure it can’t be forged.

Best pattern:

* middleware rewrites to `/__blob_proxy?host=...&path=...`
* proxy itself does KV lookup (host/path) and fetches the blobUrl
* now users can’t spoof `key=...`

This is more secure and actually simpler long-term.

---

### 6) Atomicity: `kv.pipeline()` + `await kv.get()` is not truly atomic

The plan does `await kv.get(existingMeta)` outside pipeline then writes inside pipeline. That’s not atomic, but for this use case it’s fine.

However, you don’t really need `site:{pageId}:versions` in KV at all if DB is source-of-truth for versions. KV should be for routing.

✅ Simplify Phase 3 KV to only:

* `route:{host}:{path} -> { pageId, version, blobUrl }`

Everything else can stay in DB.

---

## My recommended “Phase 3 MVP” (simpler + faster + safer)

### KV value should include `blobUrl`

Store this:

```ts
{ pageId, version, blobUrl, publishedAt }
```

### Middleware does KV hit → rewrite to proxy with **route key**, not blob key

Rewrite to:
`/__blob_proxy?rk=route:{host}:{path}`

### Proxy does:

* `kv.get(rk)`
* `fetch(blobUrl)` and stream

No `head()` call, no user-supplied blobKey, secure by design.

---