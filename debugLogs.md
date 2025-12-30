1. Hero Section Text & Layout

Headline line break

Preview:
GLOBAL. INDIAN. ICON. FIRST TIME IN GERMANY.
appears more tightly stacked.

Published
Same text, but spacing and line wrapping differ slightly, making it feel more open.

Subheading width

Preview:
“Join Us for a Premium Bollywood Night at Stadium Scale in Düsseldorf.”
appears slightly wider / less constrained.

Published:
Same text but narrower, wrapping sooner.

Reason: 1) Headline: preview uses useTypography() mapping, published uses getPublishedTypographyStyles()
Preview (minimalist.tsx)

Your hero headline is rendered via EditableAdaptiveHeadline (or equivalent), which ultimately uses EditableHeadline and pulls typography from useTypography().getTextStyle(level) and bakes that into the format state (and even marks those typography values as “modified”, so they apply as inline styles).

So preview headline size comes from landingTypography / useTypography.

Published (Minimalist.published.tsx)

Published headline uses:

const headlineTypography = getPublishedTypographyStyles('hero', theme);
...
style={{ ...headlineTypography }}


So published headline size comes from getPublishedTypographyStyles('hero', theme). 

Minimalist.published

✅ That is already a different typography source-of-truth unless getPublishedTypographyStyles('hero') is guaranteed to match useTypography()’s hero headline mapping.

2) Subheadline: preview is Tailwind-sized, published is typography-inline sized (and inline wins)
Preview (minimalist.tsx)

Your hero subheadline is sized by Tailwind classes (this is what makes your attached preview look “correct”):

className="... text-2xl md:text-4xl"


So preview subheadline size is coming from Tailwind (text-2xl md:text-4xl).

Published (Minimalist.published.tsx)

Published subheadline has both:

Tailwind sizing (text-2xl md:text-4xl)

AND inline typography from:

const subheadlineTypography = getPublishedTypographyStyles('body-lg', theme);
...
style={{ ...subheadlineTypography }}


Inline style.fontSize (if present) will override Tailwind, which is why published can drift. 

Minimalist.published

---------

2. Event Date & Venue Line

Color treatment

Preview:
10-04-2026. 08:00 PM. TURBINENHALLE, OBERHAUSEN.
– Venue text appears white.

Published:
Same line, text is red TURBINENHALLE, OBERHAUSEN” is red (its red in edit as well)

Reason: This is happening for eyebrow_text in ctaformwithfield..

1️⃣ Your stored content contains inline color

Example (from DB):

<font color="#ba0000">TURBINENHALLE, OBERHAUSEN</font>


So HTML color exists.

2️⃣ Edit mode → HTML wins → red

In edit mode, rendering goes through InlineTextEditorV2, which:

renders raw HTML

does not apply previewStyle

allows inline styles to dominate

So:

HTML color → red ✅


This is expected.

In EditableContent.tsx, preview rendering does this:

const previewStyle = useMemo(() => {
  const modified = formatState.__modified;
  const hasModifications = modified && modified.size > 0;

  if (!hasModifications) {
    return style; // ⛔ inline color ignored
  }

  // only then apply inline styles
}, ...)

Key rule:

Inline styles are only applied in preview if the user explicitly modified them via the toolbar.

4️⃣ Why your red does NOT count as “explicit”

Your red color came from:

pasted HTML / editor-generated HTML

not from the color picker setting formatState.color

therefore __modified does not contain color

So preview logic says:

No explicit color modification → ignore inline color
→ fall back to className

5️⃣ CTA eyebrow has a white base class

In CTAWithFormField.tsx, eyebrow text has:

className="text-[11px] ... text-white/60"


So preview becomes:

white/60 ← base class


That’s why:

Edit = red

Preview = white

Published = red again (published renders sanitized HTML directly)

So as a solution.. On paste in InlineTextEditorV2 we should only allow Paste as plain text

----------

3. Super Early Bird Access – CTA Card (Right Side)

Button color

Preview:
CTA button is strong pink / magenta
(“Unlock my Early Access Benefits Now”).

Published:
CTA button is much lighter pink, looks disabled or less prominent.

Reason.. in the database correct color is getting stored as theme.colors.accentCSS = "bg-pink-600" (Tailwind class).. However, published blocks are passing accentColor "pink" into:

FormIsland submitButtonColor={ctaBg} 

CTAWithFormField.published

CTAButtonPublished backgroundColor={ctaBg}

Button text formatting

Preview:
Clean text, no visible HTML artifacts.

Published:
Shows raw HTML-like text:

<span style="font-style: italic;">By signing up, you agree to receive event-related updates...
</span>



→ This is a rendering bug in the second screenshot.


Card contrast

Preview:
CTA card has stronger contrast against the black background.

Published:
Card looks washed out / lighter, reducing visual priority.


4. CTA Section (Bottom of Page)

Primary CTA button

Preview:
Button is bright pink, high contrast.

Published:
Button is pale pink, visually weaker.

Reason.. in the database correct color is getting stored as theme.colors.accentCSS = "bg-pink-600" (Tailwind class).. However, published blocks are passing accentColor "pink" into:

FormIsland submitButtonColor={ctaBg} 

CTAWithFormField.published

CTAButtonPublished backgroundColor={ctaBg}



CTA text

Preview:
“Unlock my early access benefits now! →”

Published:
“Unlock my early access benefits now!”
(Arrow missing)

Reason: There is default arrow in preview

It doesn’t make sense (at least as a universal rule).

Right now CTAButton is doing this:

If trailingIcon is not provided → it still renders a default arrow SVG. 

ComponentRegistry


So you get an arrow even when the user never chose one, and even when the CTA style (e.g., form submit) shouldn’t imply “go to next page”.

That’s why you see:

Preview: Text + →

Published: Text (because published doesn’t add anything)

So you’re correct: the arrow is creating inconsistent UX + inconsistent output.

What I’d change (clean + consistent)
✅ Remove the default arrow fallback from preview

In ComponentRegistry.tsx inside CTAButton, delete this block:

{!loading && !trailingIcon && (
  <svg ...>...</svg>
)}


5. Logo size is bigger in preview and smaller in published

Reason:

Announcement.published.tsx has correct size <LogoPublished
  size="lg"
  className="w-64 h-auto"
/>

But it is getting overridden in logopublished.tsx

const sizeStyles = {
  sm: { width: '48px', height: '48px' },
  md: { width: '64px', height: '64px' },
  lg: { width: '80px', height: '80px' }
};