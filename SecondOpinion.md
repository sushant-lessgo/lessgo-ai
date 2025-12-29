
---

## TL;DR (what’s *actually* happening)

You **did the right thing** with `suppressHydrationWarning`, but the new error is **not the same problem**.

### The new error is **NOT** about HTML string mismatch

It is about **invalid DOM structure caused by double `<p>` nesting**.

> **“Did not expect server HTML to contain a `<p>` in `<div>`”**
> is React’s way of saying:
> “You rendered a `<p>` tag *inside another `<p>`* (or inside something that becomes `<p>`).”

React **cannot hydrate invalid HTML**, even with `suppressHydrationWarning`.

---

## Root Cause (very important)

### This line is the real culprit 👇

From **`Announcement.published.tsx`**:

```tsx
<TextPublished
  value={supporting_copy}
  element="p"          // ⛔️ problem
  className="text-lg"
  style={{ color: textColors.muted, fontSize: '1.125rem' }}
/>
```

But `supporting_copy` **already contains HTML** like:

```html
<p class="cvGsUA direction-ltr ...">
  We’ve curated a carefully selected lineup...
</p>
```

So the final HTML becomes:

```html
<p>                ← TextPublished wrapper
  <p>...</p>       ← content from editor
</p>
```

❌ **Invalid HTML**
❌ **Hydration is impossible**
❌ `suppressHydrationWarning` cannot save this

---

## Why this error appears only now

Before:

* HTML was dumped via `dangerouslySetInnerHTML` at page root
* Browser “fixed” invalid nesting silently

Now:

* React Server Components + hydration
* React enforces DOM correctness strictly

This is expected behavior.
This is **not a Next.js bug**.

---

## The Correct Fix (do this, nothing else)

### Rule (lock this into your architecture)

> **If content may contain block-level HTML (`<p>`, `<div>`, `<ul>`):
> NEVER wrap it in a `<p>` or heading element.**

---

## Concrete Code Fix ✅

### Fix `TextPublished` usage for rich text

#### ❌ Current (wrong)

```tsx
<TextPublished
  value={supporting_copy}
  element="p"
  className="text-lg"
/>
```

#### ✅ Correct

```tsx
<TextPublished
  value={supporting_copy}
  element="div"        // ✅ wrapper is div
  className="text-lg"
/>
```

This produces valid HTML:

```html
<div>
  <p>...</p>
</div>
```

Perfectly hydratable.

---

## Optional but Recommended: make this impossible to misuse

Inside **`TextPublished.tsx`**, harden it:

```tsx
const containsHTML = typeof value === 'string' && /<[^>]+>/.test(value);

const Tag = containsHTML ? 'div' : element;
```

So even if someone passes `element="p"`, it auto-corrects.

---

## Why `suppressHydrationWarning` was still correct

You **should keep it**, because:

* Rich text HTML can differ in insignificant ways
* ISR + editor content = unavoidable mismatch risk
* This is the documented React pattern

But:

> `suppressHydrationWarning` **does NOT fix invalid DOM structure**

---

## Final Architecture Verdict (important for your confidence)

You are **100% on the right architectural path**:

✅ Server Components for published pages
✅ JSON → React rendering (not static HTML blobs)
✅ Client islands only where needed (forms)
✅ Theme computed server-side
✅ No client-side theme injection on `/p/*`

What you hit is a **classic rich-text + React hydration trap**, not a design flaw.

Every serious page builder (Webflow, Framer, Notion) has **exactly this rule**:

> “Rich text must be rendered inside neutral containers.”

---

## Checklist to close this issue

1. Change **all rich-text usages** to `element="div"`

   * `supporting_copy`
   * editor-generated paragraphs
2. Keep `suppressHydrationWarning`
3. Hard refresh
4. Hydration errors disappear permanently

---