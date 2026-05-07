Thanks for the design.md — this is exactly the map I needed. The current system has 5 vibes × 30 palettes × 63 accents producing the "technically correct, aesthetically flat" output you pasted. It's a combinatorial generator where structural decisions (radius, elevation, decorative layer, type voice) are scattered as Tailwind strings across 48 UIBlocks with no unifying art direction.

Meridian as specced directly replaces the Dark Tech vibe with a real baked system:

Replaces:

Dark Tech vibe → Meridian identity
midnight-slate palette + graphite/obsidian/charcoal neutrals → one baked ink ladder (--ink, --ink-1, --ink-2, --bone, --bone-2, --bone-3)
63 accent options → the single --accent knob (user picks hue; chroma/lightness baked)
Card luminance-bucket logic + 5 backdrop-blur variants → one card style: 1px hairline, no shadow
rounded-xl/rounded-2xl sprinkled everywhere → 5 radius tokens with explicit roles
shadow-xl/shadow-2xl/themed-shadow soup → hairline-first; shadow-menu only for floating elements
badge_text/subheadline copy roles → eyebrow (numeric + mono) / lede / quote / meta semantic roles that match how the type actually wants to be set
Handoff notes for your engineers:

The token block at the bottom of Meridian is drop-in for colorTokens.ts + Tailwind theme.extend. The --accent hue is the only thing generateColorTokens() needs to vary per tenant.
buttonShape.ts (currently stub names with no CSS) gets concrete values: --r-md: 8px for all buttons in this system. No shape-name indirection needed — each system bakes one button radius.
LayoutSection.tsx spacing: Meridian wants --sec-pad-y: 120px desktop / 72px mobile across the board. The current compact/spacious/extra/normal enum collapses to one value per system.
Copy prompt roles (copyPromptV3.ts): Meridian's voice wants eyebrow (numeric, mono) and meta added to the schema; badge_text can become eyebrow for this system and tone-profile can emit the numeric-prefix rule.
Textures: Meridian uses exactly one texture (the 96px hairline grid, hero only). The full texture matrix is unused here.