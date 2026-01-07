
## 🔥 Root Cause (confirmed)

Your app is **breaking at build/compile time**, not at runtime.

The **single root cause** is:

> **`src/lib/staticExport/htmlGenerator.ts` statically imports `react-dom/server`, and that module is pulled into the App Router graph via `/api/publish`.
> Next.js explicitly forbids this.**

Everything else (preview 500, edit 500, publish 500) is a **cascade failure**.

---

## Why this happens (with your exact files)

### 1️⃣ The forbidden import

In `htmlGenerator.ts` you have:

```ts
import ReactDOMServer from "react-dom/server";
```

Next.js App Router **does not allow** `react-dom/server` to be statically imported inside modules that are part of the app bundle (even server routes).

This is why Next throws:

```
You're importing a component that imports react-dom/server.
To fix it, render or return the content directly as a Server Component instead
```

This error is emitted **during compilation**, not execution.

---

### 2️⃣ Why `/api/publish` fails

Your route handler imports `htmlGenerator.ts`:

```
./src/app/api/publish/route.ts
 → ./src/lib/staticExport/htmlGenerator.ts
```

As soon as Next tries to compile `/api/publish`, it hits the forbidden import and **the entire route fails to build**.

That’s why you see:

```
POST /api/publish 500
```

before anything even runs.

---

### 3️⃣ Why `/preview/[token]` also returns 500 (even though it’s client-side)

Your `PreviewPage` **does NOT import `htmlGenerator.ts`** (this is good 👍) 

However:

* `/preview/[token]` bootstraps the app
* The app build graph includes `/api/publish`
* `/api/publish` fails compilation
* **Next dev server marks the whole build as broken**
* Any request that touches the server → **500**

So this is **not** a bug in `page.tsx`. The preview page is innocent.

---

## ❌ What is NOT the problem (important)

* ❌ Not hydration
* ❌ Not client/server mismatch
* ❌ Not `use client`
* ❌ Not DOM access (`document.getElementById`)
* ❌ Not your Preview page logic
* ❌ Not the publish flow JS

You diagnosed correctly by suspecting **Phase 1 export changes**.

---

## ✅ The correct fix (minimal, safe, production-grade)

### ✅ Step 1: Force Node runtime for the route

In **`src/app/api/publish/route.ts`**:

```ts
export const runtime = "nodejs";
```

This ensures the route is never treated as Edge.

---

### ✅ Step 2: Make `htmlGenerator.ts` server-only

At the **very top** of `htmlGenerator.ts`:

```ts
import "server-only";
```

This prevents accidental client imports (future-proofing).

---

### ✅ Step 3: REMOVE the static import of `react-dom/server`

❌ **Remove this**:

```ts
import ReactDOMServer from "react-dom/server";
```

✅ **Replace it with a dynamic import inside the function**:

```ts
export async function generateStaticHTML(...) {
  const ReactDOMServer = await import("react-dom/server");

  const html = ReactDOMServer.renderToStaticMarkup(
    <LandingPagePublishedRenderer ... />
  );

  return html;
}
```

🔑 This is the key fix.
Next.js **only blocks static imports**. Dynamic imports inside Node-only code are allowed.

---

## Why this works

* `react-dom/server` is no longer visible to Next’s static analyzer
* The file remains server-only
* `/api/publish` compiles
* App build succeeds
* Preview + Edit pages stop returning 500
* Publish flow works again

---

## 🔬 Extra validation you can run

After applying the fix:

```bash
rm -rf .next
npm run dev
```

Then hit:

* `/preview/[token]` → should load
* Click Publish → `/api/publish` should respond
* No webpack / SWC errors

---

## 🧠 Architectural note (important for Phase 2+)

Your **Phase 1 approach is conceptually correct**, but App Router imposes this rule:

> **“If you want HTML, either return a Server Component OR dynamically import renderers.”**

For Phase 2 / export pipelines, I recommend:

* keeping **all HTML generation behind API routes**
* keeping `react-dom/server` usage **isolated + dynamic**
* never importing export logic into UI modules

You’re already 90% aligned with this — just hit the App Router guardrail.

---

## TL;DR

**Root cause:**
`react-dom/server` is statically imported in `htmlGenerator.ts`, which breaks Next App Router compilation.

**Fix:**
Dynamic import + `server-only` + Node runtime.

Nothing else in your code is fundamentally broken.