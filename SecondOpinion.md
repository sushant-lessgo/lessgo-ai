I agree with **parts** of it (especially the “GET isn’t exported ⇒ GET returns 405” and “defense-in-depth cache headers”), but a few key claims in the root-cause story are **very likely wrong / unproven**.

## What I agree with

### ✅ 1) “GET handler not exported” can absolutely cause 405 for GET

In Next.js App Router route handlers, if you define a `GET()` but don’t export it, Next won’t register it. Any GET request to that route will be **405 Method Not Allowed**.

So **Fix 1 (export GET)** is valid *if you truly expect GET traffic to that route*.

### ✅ 2) Adding “no-store” on API responses is good hardening

If your endpoint ever receives GET/HEAD (or if you have any config GET endpoint), adding:

* `Cache-Control: no-store` (+ friends)
* and/or doing it at `vercel.json`

is good “belt & suspenders”. This also helps prevent accidental caching of **error responses**.

---

## What I *don’t* agree with (or would not treat as root cause)

### ❌ “Mobile browsers convert POST → GET due to flakiness / availability checks”

Browsers generally **do not** mutate a POST into a GET as a “retry.” That would violate HTTP semantics and break lots of real apps.

If you’re seeing cached 405s and the log says “cache,” the more likely reality is:

* the failing request was **actually a GET/HEAD** (or **OPTIONS**), or
* you have an **intermediate layer** (Service Worker, proxy, prefetcher, link preview, speculative loading) issuing GET/HEAD, or
* the submission is happening across **origins** in some cases, triggering **OPTIONS preflight**.

### ⚠️ The “Vercel Edge caches 405 for 30–60 seconds” claim is plausible but needs proof

CDNs can cache unexpected things if headers allow it, but for an **API POST** this is unusual. If Vercel logs show “cache,” that strongly suggests the request method on failures is **GET/HEAD**, not POST.

**Actionable check:** in the failing log entries, confirm the **HTTP method**. If you don’t currently log it, add it.

---

## The #1 thing I think you’re missing

### ✅ OPTIONS (preflight) handling — especially if any cross-origin scenario exists

If *any* of these are true:

* the form runs on one subdomain and posts to another,
* you embed the form somewhere else,
* you do anything that makes the request cross-origin,

then the browser can send an **OPTIONS preflight** first. If your route doesn’t handle `OPTIONS`, you can get **405** on mobile (and desktop too, depending on conditions).

Even if you believe it’s “same origin,” it’s worth verifying from the failing devices.

**Recommendation:** at minimum, ensure OPTIONS is handled cleanly if there’s any chance of CORS/preflight.

---

## Improvements to your fix plan (practical tweaks)

### 1) Don’t add GET to `/submit` just to “make Safari happy”

If `/api/forms/submit` is truly a submit endpoint, I’d rather:

* keep it POST-only,
* make sure **GET/HEAD** return a **non-cacheable** 405 with clear body,
* and investigate why GET/HEAD is hitting it in the first place.

If you actually need a “form configuration endpoint,” give it a clean separate route like:

* `/api/forms/config?formId=...` (GET)
* `/api/forms/submit` (POST)

### 2) Add method + UA logging (this will settle the debate instantly)

Inside the handler, log:

* `request.method`
* `request.headers.get('user-agent')`
* `request.headers.get('referer')`
* maybe a request-id

Then you’ll know whether failures are GET/HEAD/OPTIONS.

### 3) `cache: 'no-store'` on fetch is mostly irrelevant for POST

In browsers, `cache: 'no-store'` mainly affects caching behavior for GET. Your submit is POST, so this isn’t doing much. Not harmful, just not a real lever.

### 4) `credentials: 'include'` is only needed cross-site

For same-origin fetch, cookies are already sent by default (`same-origin`). If you’re cross-origin and need cookies, you must also set server CORS headers correctly (`Access-Control-Allow-Credentials`, specific origin, etc.). Otherwise this won’t fix auth issues.

### 5) Retry-on-405 is a band-aid

It can improve UX, but it can also hide the true issue (e.g., OPTIONS failing, wrong URL, SW caching). I’d treat it as last resort.

---

## My verdict

* **Yes**: Missing exported GET can explain 405s **if** GET is actually arriving.
* **Yes**: Add `Cache-Control: no-store` as defense-in-depth.
* **No / not proven**: “mobile converts POST to GET” as the root cause.
* **Very likely missing**: verify **what method** is failing, and check for **OPTIONS/CORS** and other sources of unexpected GET/HEAD.
