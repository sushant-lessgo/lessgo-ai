## In Option B, will theme be computed on every request?

It **doesn’t have to**.

You have 3 server-first variants:

### **B1) Compute on request + inject `<style>`**

* On each request, server reads `themeValues`, computes vars, injects `<style>`
* Cost is small, but still repeated work
* With ISR, this may only happen when the page revalidates (not every hit)

✅ good for simplicity
⚠️ still “runtime work” (though light)

---

### **B2) Store computed CSS vars in DB and inject without computing**

Store something like:

* `cssVarsText` (string) OR `cssVarsJson` (object)

At request:

* Just print `<style>:root { ... }</style>` from DB

✅ no compute at request
✅ still server-first
✅ easy to implement

---

### **B3) Best: embed the `<style>` directly inside `htmlContent` at publish**

Yes — you can store the CSS vars **inside the saved HTML**.

Example saved HTML (top):

```html
<style>
:root{
  --landing-primary:#14B8A6;
  --landing-primary-hover:#0f8f81;
  --landing-muted-bg:#0b0b0b;
  --landing-text-primary:#ffffff;
  ...
}
</style>
<div class="flex flex-col ...">...</div>
```

Then your runtime page becomes ultra-simple:

```tsx
return <main dangerouslySetInnerHTML={{ __html: page.htmlContent }} />
```

✅ zero compute at request
✅ no extra injection step
✅ easiest runtime path
✅ best for speed + simplicity
⚠️ you must regenerate `htmlContent` whenever theme changes (which is correct anyway)

---

## What I recommend for Lessgo.ai

Go with **B3** (store final HTML including the `<style>` at publish).

Also optionally store:

* `contentJson` (for editor)
* `themeValues` (for rebuilds)
* `htmlContent` (final publish artifact)

This is exactly how a “publish pipeline” should work: **precompute everything at publish time**.