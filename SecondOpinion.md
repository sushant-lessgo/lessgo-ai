Claude’s plan is **mostly correct** — and the “root cause” it found is very plausible: **Google Fonts being imported globally in `src/app/globals.css` will affect every route, including `/p/[slug]`**, and it will definitely produce exactly what you’re seeing in View Source (`<link href="https://fonts.googleapis.com/...">` or `@import` requests in CSS).

That said, there are two important nuances:

## 1) Removing those `@import` lines is the right move

✅ Do it.
Because if `globals.css` is loaded by `src/app/layout.tsx` (typical Next.js), then those `@import url('https://fonts.googleapis.com/...')` calls will happen everywhere. That will keep pulling `fonts.googleapis.com` + `fonts.gstatic.com` in production no matter what you do in `/p/layout.tsx`.

So Step 1 is solid.

## 2) Don’t “move Google Fonts to editor-only CSS” unless you truly need it

Claude suggests an editor-only CSS file, but you likely **don’t need it** because you already said you have a `loadGoogleFonts()` function for editor mode.

Best practice here:

* **Published pages** (`/p/*`): strictly self-hosted + static preloads ✅
* **Editor pages**: use your existing `loadGoogleFonts()` (dynamic) ✅

So I’d skip creating `fonts-editor.css` unless you discover the editor now looks wrong after removing the global imports.

## 3) One more thing Claude didn’t mention: “family=Sora” without weights

In your prod source you have:

```html
<link href="https://fonts.googleapis.com/css2?family=Sora&display=swap" rel="stylesheet">
```

That **doesn’t match** the `globals.css` imports Claude quoted (`Sora:wght@100..800`). So after you remove the global imports, if you *still* see `family=Sora&display=swap`, it means there’s **another injector** (likely your theme injector or a “font loader” that adds a minimal Sora link).

So after Step 1, do a repo search for:

* `family=Sora`
* `fonts.googleapis.com/css2`
* `fonts.gstatic.com`