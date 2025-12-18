Perfect — this clarifies it completely.
Now we can be **100% precise** about what’s wrong and how to fix it **without breaking your global background system**.

---

## The real root cause (now confirmed)

Even in **preview mode**, your hero `<section>` **always has a primary background applied**:

```html
<section
  ...
  data-background-type="primary"
  style="background: radial-gradient(...)"
>
```

Your image is **NOT the section background**.
It’s just an **absolutely positioned child**.

👉 Result:

* Section background (primary gradient) **always exists**
* Image sits *on top* of it
* Any padding / layout / min-height mismatch = visible background
* On large screens, scrollbars, zoom, editor wrappers → background leaks

This is why the issue **cannot be fixed with padding, z-index, or min-h tweaks** anymore.

---

## Key architectural rule (important for Lessgo.ai)

> **If a section uses a full-bleed image hero, the image must become the section background.**

A hero **cannot** coexist with a non-transparent background system underneath it.

---

## ✅ Correct solution (clean, scalable, future-proof)

### Step 1: Tell the background system to “stand down” for image heroes

You already have:

* `data-section-type="Minimalist"`
* `data-layout="minimalist"`

Use that.

### In `LayoutSection` (or background resolver)

Add a condition:

```ts
const shouldDisableBackground =
  sectionType === "Minimalist" ||
  layout === "hero" ||
  backgroundType === "image";
```

Then:

```tsx
style={{
  background: shouldDisableBackground
    ? "transparent"
    : resolvedBackgroundGradient
}}
```

✅ This keeps **primary/secondary system intact**
✅ Only heroes opt out

---

## Step 2: Promote image → section background (this is crucial)

Instead of this:

```tsx
<div className="absolute inset-0" style={{ backgroundImage: `url(...)` }} />
```

Do this:

```tsx
<LayoutSection
  ...
  className="!p-0 min-h-[100svh] overflow-hidden"
  style={{
    backgroundImage: `
      linear-gradient(to bottom,
        rgba(0,0,0,0.6),
        rgba(0,0,0,0.4),
        rgba(0,0,0,0.6)
      ),
      url("${encodeURI(imageSrc)}")
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat"
  }}
>
```

Then **delete the absolute image div entirely**.

---

## Why this instantly fixes everything

* No background underneath → no color bleed
* No dependency on inner container height
* No padding leaks
* No editor wrapper issues
* Works in preview, publish, export, mobile, embeds

This is how **Webflow, Framer, and high-end CMSes do heroes**.

---

## Step 3 (recommended): codify this as a rule

In your system:

> **Rule:**
> Any section that declares `image background ownership` must:
>
> * Disable base background system
> * Own the section background fully

This will save you **dozens of future bugs**.

---

## TL;DR

You’re fighting the system because:

* The hero image is a *child*
* The background system is the *parent*

Flip that relationship.

Once the **section owns the image**, the problem disappears permanently.

If you want, next I can:

* Refactor `LayoutSection` to support `backgroundKind: "color" | "image"`
* Or design a **HeroBase** abstraction so all hero variants behave correctly by default
