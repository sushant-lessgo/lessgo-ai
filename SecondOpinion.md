Findings from actual HTML + computed CSS
1) You currently have 3 different render paths (Edit / Preview / Publish)

They do not output the same DOM or apply typography the same way.

Preview

Renders semantic heading tags (h1, h2)

Applies typography via inline styles from landingTypography:

e.g. font-size: clamp(2rem, 5vw, 3rem) for h1

plus font-family, letter-spacing, line-height etc

✅ Preview is the “most correct” representation of the design system.

Edit

Renders semantic tags (h1, h2, p) but includes editor overlay classes/attrs

Does NOT apply default typography inline (only alignment/color/cursor)

Therefore typography often falls back to browser defaults or whatever classes happen to exist

Headline in edit: missing clamp font-size + font-family

Subheadline in edit: looks fine because Tailwind text-2xl md:text-4xl is present

⚠️ Edit is inconsistent because it doesn’t consistently apply typography defaults unless they’re coming from className.

Published

Intentionally static + LCP optimized (good)

DOM output varies by element type:

Some headlines become <div><span>…</span></div> (loses semantic heading tags)

Some subheadlines remain <p class="text-2xl md:text-4xl">…</p>

Even when published markup looks “underspecified”, actual size can still be correct because typography is coming from compiled CSS.

✅ Confirmed by DevTools:

Computed font-size = 32px

Source: /_next/static/css/app/p/layout.css

Rule: font-size: clamp(1.5rem, 3.5vw, 2rem) (max 32px)

So: Published can be visually correct even without inline styles because layout.css applies typography via selectors/inheritance.

Key comparisons that exposed the system behavior
Hero headline (problem case)

Preview: <h1 style="font-size: clamp(...); font-family: ...">

Edit: <h1 style="text-align/color only"> (no font-size)

Publish: <div class="text-center leading-[1.1]">... (no explicit size)

➡️ This explains why hero headline looked like ~16px at times in published HTML dumps: it’s a <div> with no explicit sizing unless CSS rules happen to apply.

Minimalist subheadline (healthy case)

All three modes use:

<p class="text-2xl md:text-4xl">

➡️ Because it’s Tailwind class-driven, it stays consistent in edit/preview/publish.

Announcement headline (mixed signals but confirmed)

Published markup shown as <div><span class="a_GcMg">…</span></div>

Yet the published page visually looks correct

DevTools confirmed clamp sizing comes from layout.css

➡️ Means published typography is being applied by compiled CSS even if markup isn’t semantic.

Root cause (most likely)
You have two typography delivery mechanisms coexisting:

Inline style typography (Preview path)

Stylesheet-based typography (Published path via compiled layout.css)

Edit mode is a third inconsistent case: it often doesn’t apply typography defaults at all unless Tailwind classes are present.

This causes mismatches because:

headline elements often depend on typography system, not Tailwind size classes

published renderer sometimes changes semantic tags (h1/h2) into generic wrappers (div/span), which can break selector matching or inheritance

edit renderer drops default typography unless “modified” or unless CSS classes provide it

Gut feel / design diagnosis

Your typography system is conceptually right (global → section → block → page → user override), but implementation is fractured because each mode uses a different renderer and a different method of applying typography.

You can still keep Publish static/LCP friendly, but you need a single “typography resolution contract” shared by all 3 modes, with two emitters:

Preview/Edit emitter: inline style object (or className)

Publish emitter: deterministic className/selector that compiles into CSS

Right now it’s “accidentally consistent” in some cases (announcement), and “broken” in others (hero headline) depending on markup differences and whether rules attach.