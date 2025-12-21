This new log changes the story a lot.

### What your failing log proves

* The **failed request is POST** `/api/forms/submit` (not GET).
* On failures, Vercel **does not invoke your function** (no “Function Invocation” block).
* Instead it returns a **cached 405** very fast (48ms), with a **cache key `/404`**.

That means the “GET handler not exported ⇒ mobile POST becomes GET ⇒ 405” explanation **doesn’t fit the evidence**.

If “GET not exported” were the main issue, you’d see **GET 405**. You’re seeing **POST 405** served from **cache**, with a weird cache key.

---

## What I think is actually happening (most likely)

Some subset of requests are being handled by Vercel’s **edge/static cache path** (or a stale routing decision), where Vercel thinks this route resolves to a generic **/404 cache entry** (key `/404`) and returns **405** because POST isn’t allowed for that cached/static response.

In plain terms:

> Sometimes the request reaches your serverless function (works).
> Sometimes it never reaches it and gets answered by an edge cached “not-found/static-ish” response (405).

That’s exactly consistent with:

* **Success log:** routed to Washington (iad1) → Function Invocation → 200
* **Failure log:** no routing to iad1 → Cache → 405 with key `/404`

---

## So do I agree with your original analysis?

### ✅ Agree

* Adding **no-store** headers is still a good defensive move.
* Adding Vercel-level headers for `/api/forms/*` is also good defense-in-depth.

### ❌ Disagree (based on your logs)

* “Mobile converts POST → GET” — not supported.
* “GET not exported is the critical issue” — your failures are **POST 405**, so exporting GET won’t fix that.

---

## What I’d do next (high-signal steps)

### 1) Force this route to be treated as dynamic + uncached

In `src/app/api/forms/submit/route.ts`, add:

```ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
```

And ensure every response includes:

* `Cache-Control: no-store` (at minimum)

This helps prevent any accidental caching logic around the route.

### 2) Log whether the failing requests ever reach your handler

Inside `POST` handler, log a unique marker + request id (and user-agent).

If you still see failures **with no handler logs**, you’ve confirmed it’s **routing/caching before your function**, not your code.

### 3) Check middleware matcher + behavior for `/api/*`

Since your logs show **Middleware 200** even for failing requests, ensure your middleware isn’t:

* rewriting,
* returning a response for some edge case,
* or doing something different for iOS Safari.

Key check: does your middleware run on `/api/:path*`? If yes, consider excluding API routes from middleware completely unless you truly need it.

### 4) Capture `x-vercel-cache` and response headers on the failing device

On a failing iPhone Safari submission, inspect response headers (or temporarily log them client-side) for:

* `x-vercel-cache` (HIT/MISS/BYPASS)
* `cache-control`
* any redirect / rewrite headers

This will confirm what layer answered the request.

---

## What to change in your fix plan

* **Remove “Fix 1: Export GET handler” as “critical.”** It’s not addressing POST 405.
* Keep **cache-prevention headers** (Fix 2 + vercel.json) ✅
* Client `cache: 'no-store'` is fine but it’s not the main lever for POST.
* Retry-on-405 is still a last-resort UX patch, not root-cause.
