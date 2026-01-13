I agree with the **first half** (root cause), but **not with the “Solution” as stated**.

## ✅ Root cause (yes)

Yes: what you’re doing right now (`metadata.other = { links: JSON.stringify([...]) }`) only produces:

```html
<meta name="links" content="[...]">
```

That **does not create real `<link>` tags**, so the browser won’t preload anything. So the conclusion “no `<link rel="preload">` tags appearing” is correct, and the cause is essentially “wrong mechanism”.

Also: it’s fair to say **metadata.other won’t generate `<link>` tags** (it becomes `<meta name="...">`). So yes.

## ❌ “Solution” (I wouldn’t do it that way)

> “Client Component with document.head.appendChild() during useEffect… This creates DOM elements that persist in the HTML.”

This is the part I disagree with:

* `useEffect` runs **after hydration**, so it’s **too late for LCP improvements**. The whole point is to make fonts start loading *before* rendering.
* It **does not persist in the HTML source** (View Source is server HTML). It only mutates the DOM after JS runs.
* On slow mobile devices, this is exactly when you *don’t* want to wait for JS to add critical hints.

## What to do instead (correct fix)

You want the `<link>` tags **in the server-rendered `<head>`**.

Use one of these:

### Option A) Put `<link>` tags directly in `app/p/layout.tsx`

```tsx
export default function PublishedLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="font" href="/fonts/sora/sora-v17-latin-700.woff2" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" as="font" href="/fonts/inter/inter-v20-latin-regular.woff2" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Option B) Use `generateMetadata()` and return `other`? (not for `<link>`)

Metadata API supports `icons`, `alternates`, etc. But for arbitrary `<link>` preload, the clean approach is still **render `<link>` in the layout head**.

---

## One more important thing

Even if preload works, it won’t apply the font unless you also have `@font-face` rules somewhere (CSS). Preload alone doesn’t “activate” a font.

So: **real `<link>` + `@font-face`** = correct.

